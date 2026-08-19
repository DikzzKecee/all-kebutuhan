/* =========================================================
   GLOBAL
========================================================= */

let currentUser = null;
let currentTool = null;

let calcValue = "";

let stickerImage = null;


/* =========================================================
   API
========================================================= */

async function apiRequest(
  endpoint,
  options = {}
) {

  try {

    const response = await fetch(
      endpoint,
      {
        credentials: "same-origin",
        ...options
      }
    );

    const data =
      await response.json();

    return {
      ok: response.ok,
      data
    };

  } catch (error) {

    console.error(error);

    return {
      ok: false,
      data: {
        success: false,
        message:
          "Server tidak dapat dihubungi."
      }
    };
  }
}


/* =========================================================
   CHECK LOGIN
========================================================= */

async function checkLogin() {

  const result =
    await apiRequest("/api/me");

  const path =
    window.location.pathname;

  const isLoginPage =
    path.endsWith("login.html");

  if (!result.ok) {

    if (!isLoginPage) {
      window.location.href =
        "/login.html";
    }

    return false;
  }

  currentUser =
    result.data.user;

  updateUserUI();

  return true;
}


/* =========================================================
   UPDATE USER UI
========================================================= */

function updateUserUI() {

  if (!currentUser) return;

  const plan =
    currentUser.planName ||
    "FREE USER";

  const limit =
    currentUser.dailyLimit || 50;

  const usage =
    currentUser.dailyUsage || 0;

  const remaining =
    currentUser.remaining ??
    Math.max(
      0,
      limit - usage
    );


  setText(
    "planBadge",
    plan
  );

  setText(
    "limitBadge",
    `${formatNumber(limit)}x / hari`
  );


  setText(
    "statPlan",
    currentUser.plan || "FREE"
  );

  setText(
    "statUsage",
    formatNumber(usage)
  );

  setText(
    "statRemaining",
    formatNumber(remaining)
  );

  setText(
    "statLimit",
    formatNumber(limit)
  );


  setText(
    "accountEmail",
    currentUser.email
  );

  setText(
    "accountPlan",
    plan
  );

  setText(
    "accountLimit",
    `${formatNumber(limit)}x`
  );


  setText(
    "miniAccount",
    `${currentUser.email} • ${plan}`
  );

  setText(
    "miniUsage",
    `${formatNumber(usage)} / ${formatNumber(limit)}`
  );


  setText(
    "currentPlan",
    plan
  );

  setText(
    "currentLimit",
    `${formatNumber(limit)}x / hari`
  );
}


/* =========================================================
   TEXT HELPER
========================================================= */

function setText(id, value) {

  const element =
    document.getElementById(id);

  if (element) {
    element.textContent = value;
  }
}

function formatNumber(number) {

  return Number(number || 0)
    .toLocaleString("id-ID");
}


/* =========================================================
   LOGIN
========================================================= */

async function loginUser(event) {

  event.preventDefault();

  const input =
    document.getElementById("loginEmail");

  const error =
    document.getElementById("loginError");

  const button =
    document.getElementById("loginButton");

  if (!input) return;

  const email =
    input.value.trim();

  error.style.display = "none";

  if (!email) {

    error.textContent =
      "Masukkan email terlebih dahulu.";

    error.style.display = "block";

    return;
  }


  button.disabled = true;

  button.textContent =
    "Memproses...";


  const result =
    await apiRequest(
      "/api/login",
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json"
        },

        body: JSON.stringify({
          email
        })
      }
    );


  if (!result.ok) {

    error.textContent =
      result.data.message ||
      "Login gagal.";

    error.style.display = "block";

    button.disabled = false;

    button.textContent =
      "Masuk ke Website";

    return;
  }


  currentUser =
    result.data.user;

  window.location.href =
    "/index.html";
}


/* =========================================================
   LOGOUT
========================================================= */

async function logout() {

  await apiRequest(
    "/api/logout",
    {
      method: "POST"
    }
  );

  window.location.href =
    "/login.html";
}


/* =========================================================
   NAV
========================================================= */

function toggleNav() {

  const nav =
    document.getElementById(
      "navbarNav"
    );

  if (nav) {
    nav.classList.toggle("show");
  }
}


/* =========================================================
   FILTER
========================================================= */

let activeCategory = "all";

function filterTools() {

  const input =
    document.getElementById("search");

  const query =
    input
      ? input.value
          .toLowerCase()
          .trim()
      : "";

  const cards =
    document.querySelectorAll(
      ".tool-card"
    );

  let visible = 0;

  cards.forEach(card => {

    const name =
      card.dataset.name ||
      "";

    const category =
      card.dataset.cat ||
      "";

    const matchSearch =
      !query ||
      name.includes(query);

    const matchCategory =
      activeCategory === "all" ||
      category === activeCategory;

    if (
      matchSearch &&
      matchCategory
    ) {

      card.style.display = "flex";

      visible++;

    } else {

      card.style.display = "none";

    }

  });


  const noResult =
    document.getElementById(
      "noResult"
    );

  if (noResult) {

    noResult.style.display =
      visible === 0
        ? "block"
        : "none";

  }
}


function filterCat(category, button) {

  activeCategory =
    category;

  document
    .querySelectorAll(".cat")
    .forEach(item => {
      item.classList.remove(
        "active-cat"
      );
    });

  if (button) {
    button.classList.add(
      "active-cat"
    );
  }

  filterTools();
}


/* =========================================================
   USAGE
========================================================= */

async function useTool() {

  const result =
    await apiRequest(
      "/api/use-tool",
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json"
        },

        body: JSON.stringify({
          tool: currentTool
        })
      }
    );


  if (!result.ok) {

    if (
      result.data.message ===
      "Silakan login terlebih dahulu."
    ) {

      window.location.href =
        "/login.html";

    } else {

      alert(
        result.data.message ||
        "Tool tidak dapat digunakan."
      );

    }

    return false;
  }


  currentUser =
    result.data.user;

  updateUserUI();

  return true;
}


/* =========================================================
   MODAL
========================================================= */

async function openTool(tool) {

  const allowed =
    await useTool();

  if (!allowed) return;

  currentTool =
    tool;

  const modal =
    document.getElementById(
      "toolModal"
    );

  if (!modal) return;


  document
    .querySelectorAll(".tool-panel")
    .forEach(panel => {
      panel.style.display =
        "none";
    });


  const target =
    document.getElementById(
      `${tool}Tool`
    );

  if (target) {
    target.style.display =
      "block";
  }


  modal.classList.add("show");

  document.body.style.overflow =
    "hidden";


  if (tool === "calculator") {
    calcClear();
  }

  if (tool === "brat") {
    generateBrat();
  }

  if (tool === "iqc") {
    generateIQC();
  }
}


function closeTool() {

  const modal =
    document.getElementById(
      "toolModal"
    );

  if (!modal) return;

  modal.classList.remove(
    "show"
  );

  document.body.style.overflow =
    "";

  currentTool = null;
}


/* =========================================================
   DOWNLOADER
========================================================= */

async function openDownloader(name) {

  const allowed =
    await useTool();

  if (!allowed) return;

  currentTool =
    name;

  const modal =
    document.getElementById(
      "toolModal"
    );

  const title =
    document.getElementById(
      "downloaderTitle"
    );

  const result =
    document.getElementById(
      "downloadResult"
    );

  const input =
    document.getElementById(
      "downloadUrl"
    );


  if (!modal) return;

  document
    .querySelectorAll(".tool-panel")
    .forEach(panel => {
      panel.style.display =
        "none";
    });


  document.getElementById(
    "downloaderTool"
  ).style.display =
    "block";


  title.textContent =
    name;

  result.innerHTML =
    "";

  input.value =
    "";

  modal.classList.add(
    "show"
  );

  document.body.style.overflow =
    "hidden";
}


async function processDownloader() {

  const input =
    document.getElementById(
      "downloadUrl"
    );

  const result =
    document.getElementById(
      "downloadResult"
    );

  const value =
    input.value.trim();


  if (!value) {

    result.textContent =
      "Masukkan link terlebih dahulu.";

    return;
  }


  if (!/^https?:\/\//i.test(value)) {

    result.textContent =
      "Link harus diawali http:// atau https://.";

    return;
  }


  result.innerHTML =
    `
      <div class="notice">
        Link sudah diterima.
        Downloader API belum dikonfigurasi
        pada server ini.
      </div>
    `;
}


/* =========================================================
   CALCULATOR
========================================================= */

function calcInput(value) {

  if (
    calcValue.length >= 30
  ) return;

  calcValue += value;

  updateCalcScreen();
}


function calcClear() {

  calcValue = "";

  updateCalcScreen();
}


function updateCalcScreen() {

  const screen =
    document.getElementById(
      "calcScreen"
    );

  if (!screen) return;

  screen.textContent =
    calcValue || "0";
}


function calcResult() {

  if (!calcValue) return;

  if (
    !/^[0-9+\-*/.() ]+$/
      .test(calcValue)
  ) {

    calcValue = "";

    updateCalcScreen();

    return;
  }


  try {

    const result =
      Function(
        `"use strict"; return (${calcValue})`
      )();

    if (
      typeof result !== "number" ||
      !Number.isFinite(result)
    ) {
      throw new Error();
    }

    calcValue =
      String(result);

    updateCalcScreen();

  } catch {

    calcValue = "";

    const screen =
      document.getElementById(
        "calcScreen"
      );

    if (screen) {
      screen.textContent =
        "Error";
    }

  }
}


/* =========================================================
   STICKER
========================================================= */

function loadSticker(event) {

  const file =
    event.target.files?.[0];

  if (!file) return;


  const reader =
    new FileReader();


  reader.onload =
    function () {

      const image =
        new Image();

      image.onload =
        function () {

          stickerImage =
            image;

          drawSticker();

        };

      image.src =
        reader.result;
    };


  reader.readAsDataURL(file);
}


function drawSticker() {

  const canvas =
    document.getElementById(
      "stickerCanvas"
    );

  if (!canvas) return;

  const ctx =
    canvas.getContext("2d");


  ctx.clearRect(
    0,
    0,
    canvas.width,
    canvas.height
  );


  if (!stickerImage) {

    ctx.fillStyle =
      "#160a24";

    ctx.fillRect(
      0,
      0,
      canvas.width,
      canvas.height
    );

    ctx.fillStyle =
      "#a99bb6";

    ctx.font =
      "20px Inter, Arial";

    ctx.textAlign =
      "center";

    ctx.fillText(
      "Upload gambar terlebih dahulu",
      256,
      256
    );

    return;
  }


  const size =
    Math.min(
      stickerImage.width,
      stickerImage.height
    );

  const sx =
    (stickerImage.width - size) / 2;

  const sy =
    (stickerImage.height - size) / 2;


  ctx.drawImage(
    stickerImage,
    sx,
    sy,
    size,
    size,
    0,
    0,
    512,
    512
  );


  const text =
    document.getElementById(
      "stickerText"
    )?.value.trim();


  if (text) {

    ctx.font =
      "bold 42px Inter, Arial";

    ctx.textAlign =
      "center";

    ctx.textBaseline =
      "middle";

    ctx.lineWidth =
      12;

    ctx.strokeStyle =
      "#000";

    ctx.strokeText(
      text,
      256,
      450
    );

    ctx.fillStyle =
      "#fff";

    ctx.fillText(
      text,
      256,
      450
    );
  }
}


function downloadSticker() {

  const canvas =
    document.getElementById(
      "stickerCanvas"
    );

  if (!canvas) return;

  canvas.toBlob(
    blob => {

      if (!blob) return;

      const url =
        URL.createObjectURL(blob);

      const a =
        document.createElement("a");

      a.href =
        url;

      a.download =
        "sticker-dikzz.webp";

      a.click();

      URL.revokeObjectURL(url);

    },
    "image/webp",
    .9
  );
}


/* =========================================================
   QR
========================================================= */

function generateQR() {

  const text =
    document.getElementById(
      "qrText"
    )?.value.trim();

  const result =
    document.getElementById(
      "qrResult"
    );


  if (!text) {

    result.innerHTML =
      "<span>Masukkan teks atau URL.</span>";

    return;
  }


  const encoded =
    encodeURIComponent(text);


  const image =
    document.createElement("img");

  image.alt =
    "QR Code";

  image.src =
    `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encoded}`;


  result.innerHTML = "";

  result.appendChild(image);
}


/* =========================================================
   BRAT
========================================================= */

function generateBrat() {

  const canvas =
    document.getElementById(
      "bratCanvas"
    );

  if (!canvas) return;

  const ctx =
    canvas.getContext("2d");

  const text =
    document.getElementById(
      "bratText"
    )?.value.trim() ||
    "BRAT";


  ctx.fillStyle =
    "#8aff00";

  ctx.fillRect(
    0,
    0,
    canvas.width,
    canvas.height
  );


  ctx.fillStyle =
    "#111";

  ctx.font =
    "bold 72px Arial";

  ctx.textAlign =
    "center";

  ctx.textBaseline =
    "middle";


  wrapText(
    ctx,
    text,
    canvas.width / 2,
    canvas.height / 2,
    600,
    80
  );
}


/* =========================================================
   IQC
========================================================= */

function generateIQC() {

  const canvas =
    document.getElementById(
      "iqcCanvas"
    );

  if (!canvas) return;

  const ctx =
    canvas.getContext("2d");


  const name =
    document.getElementById(
      "iqcName"
    )?.value.trim() ||
    "Dikzz";


  const message =
    document.getElementById(
      "iqcMessage"
    )?.value.trim() ||
    "Hello!";


  ctx.fillStyle =
    "#e9e9ee";

  ctx.fillRect(
    0,
    0,
    canvas.width,
    canvas.height
  );


  ctx.fillStyle =
    "#ffffff";

  roundRect(
    ctx,
    40,
    35,
    620,
    430,
    25
  );

  ctx.fill();


  ctx.fillStyle =
    "#111";

  ctx.font =
    "bold 26px Inter, Arial";

  ctx.textAlign =
    "left";

  ctx.fillText(
    name,
    75,
    85
  );


  ctx.fillStyle =
    "#6e24d8";

  roundRect(
    ctx,
    75,
    135,
    450,
    100,
    20
  );

  ctx.fill();


  ctx.fillStyle =
    "#fff";

  ctx.font =
    "20px Inter, Arial";


  wrapText(
    ctx,
    message,
    100,
    175,
    400,
    28
  );
}


/* =========================================================
   BASE64
========================================================= */

function encodeBase64() {

  const input =
    document.getElementById(
      "base64Input"
    );

  const output =
    document.getElementById(
      "base64Output"
    );


  try {

    output.value =
      btoa(
        unescape(
          encodeURIComponent(
            input.value
          )
        )
      );

  } catch {

    output.value =
      "Tidak dapat encode.";
  }
}


function decodeBase64() {

  const input =
    document.getElementById(
      "base64Input"
    );

  const output =
    document.getElementById(
      "base64Output"
    );


  try {

    output.value =
      decodeURIComponent(
        escape(
          atob(input.value)
        )
      );

  } catch {

    output.value =
      "Base64 tidak valid.";
  }
}


/* =========================================================
   IMAGE COMPRESSOR
========================================================= */

async function compressImage() {

  const file =
    document.getElementById(
      "compressFile"
    )?.files?.[0];

  const result =
    document.getElementById(
      "compressResult"
    );


  if (!file) {

    result.textContent =
      "Pilih gambar terlebih dahulu.";

    return;
  }


  const quality =
    Number(
      document.getElementById(
        "compressQuality"
      )?.value || 75
    ) / 100;


  const image =
    new Image();

  const reader =
    new FileReader();


  reader.onload =
    function () {

      image.onload =
        function () {

          const maxWidth =
            1600;

          const scale =
            Math.min(
              1,
              maxWidth /
              image.width
            );

          const canvas =
            document.createElement(
              "canvas"
            );

          canvas.width =
            image.width * scale;

          canvas.height =
            image.height * scale;


          const ctx =
            canvas.getContext("2d");

          ctx.drawImage(
            image,
            0,
            0,
            canvas.width,
            canvas.height
          );


          canvas.toBlob(
            blob => {

              if (!blob) {

                result.textContent =
                  "Gagal melakukan kompresi.";

                return;
              }


              const url =
                URL.createObjectURL(
                  blob
                );

              result.innerHTML =
                `
                  Berhasil dikompres.
                  <br>
                  Ukuran awal:
                  ${(file.size / 1024).toFixed(1)} KB
                  <br>
                  Ukuran baru:
                  ${(blob.size / 1024).toFixed(1)} KB
                  <br><br>
                  <a href="${url}" download="compressed-image.jpg">
                    Download gambar
                  </a>
                `;

            },
            "image/jpeg",
            quality
          );

        };

      image.src =
        reader.result;
    };


  reader.readAsDataURL(file);
}


/* =========================================================
   URL SHORTENER
========================================================= */

async function shortenUrl() {

  const input =
    document.getElementById(
      "shortUrlInput"
    );

  const result =
    document.getElementById(
      "shortUrlResult"
    );


  const value =
    input.value.trim();


  if (!value) {

    result.textContent =
      "Masukkan URL.";

    return;
  }


  if (!/^https?:\/\//i.test(value)) {

    result.textContent =
      "URL harus diawali http:// atau https://.";

    return;
  }


  result.textContent =
    "Memproses...";


  try {

    const response =
      await fetch(
        `https://is.gd/create.php?format=json&url=${encodeURIComponent(value)}`
      );


    const data =
      await response.json();


    if (!data.shorturl) {
      throw new Error();
    }


    result.innerHTML =
      `
        Short URL:
        <br>
        <a
          href="${data.shorturl}"
          target="_blank"
          rel="noopener"
        >
          ${data.shorturl}
        </a>
      `;

  } catch {

    result.textContent =
      "Gagal membuat short URL.";
  }
}


/* =========================================================
   CANVAS HELPERS
========================================================= */

function downloadCanvas(
  id,
  filename
) {

  const canvas =
    document.getElementById(id);

  if (!canvas) return;


  const link =
    document.createElement("a");

  link.download =
    filename;

  link.href =
    canvas.toDataURL(
      "image/png"
    );

  link.click();
}


function roundRect(
  ctx,
  x,
  y,
  width,
  height,
  radius
) {

  ctx.beginPath();

  ctx.roundRect(
    x,
    y,
    width,
    height,
    radius
  );

  ctx.closePath();
}


function wrapText(
  ctx,
  text,
  x,
  y,
  maxWidth,
  lineHeight
) {

  const words =
    text.split(" ");

  let line = "";

  const lines = [];


  for (
    let i = 0;
    i < words.length;
    i++
  ) {

    const test =
      line +
      words[i] +
      " ";

    const width =
      ctx.measureText(
        test
      ).width;


    if (
      width > maxWidth &&
      i > 0
    ) {

      lines.push(line);

      line =
        words[i] + " ";

    } else {

      line =
        test;

    }
  }


  lines.push(line);


  const startY =
    y -
    ((lines.length - 1) *
      lineHeight) / 2;


  lines.forEach(
    (item, index) => {

      ctx.fillText(
        item.trim(),
        x,
        startY +
        index * lineHeight
      );

    }
  );
}


/* =========================================================
   PAYMENT
========================================================= */

function selectPlan(plan) {

  const names = {
    VVIP1: "VVIP 1 — 500x / hari",
    VVIP2: "VVIP 2 — 5.000x / hari",
    VVIP3: "VVIP 3 — 10.000x / hari"
  };


  const element =
    document.getElementById(
      "selectedPlan"
    );


  if (!element) return;


  element.innerHTML =
    `
      Paket dipilih:
      <strong>
        ${names[plan] || plan}
      </strong>
      <br>
      Hubungi admin untuk menyelesaikan pembayaran
      dan aktivasi VVIP.
    `;
}


/* =========================================================
   LOGIN PAGE
========================================================= */

async function initLoginPage() {

  const path =
    window.location.pathname;

  if (
    !path.endsWith("login.html")
  ) {
    return;
  }


  const result =
    await apiRequest(
      "/api/me"
    );


  if (result.ok) {

    window.location.href =
      "/index.html";

    return;
  }


  const form =
    document.getElementById(
      "loginForm"
    );


  if (form) {

    form.addEventListener(
      "submit",
      loginUser
    );

  }
}


/* =========================================================
   INIT
========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  async () => {

    const path =
      window.location.pathname;


    if (
      path.endsWith("login.html")
    ) {

      await initLoginPage();

      return;
    }


    await checkLogin();


    filterTools();

  }
);