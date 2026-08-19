/* =========================================================
   GLOBAL
========================================================= */

let currentUser = null;

let currentCategory = "all";

let calculatorValue = "";

let stickerImage = null;

const PAYMENT_NUMBERS = {
  DANA: "08XXXXXXXXXX",
  GOPAY: "08XXXXXXXXXX",
  OVO: "08XXXXXXXXXX"
};

const PLANS = {
  VVIP1: {
    name: "VVIP 1",
    limit: 500,
    price: "Rp 10.000"
  },

  VVIP2: {
    name: "VVIP 2",
    limit: 5000,
    price: "Rp 25.000"
  },

  VVIP3: {
    name: "VVIP 3",
    limit: 10000,
    price: "Rp 50.000"
  }
};

/* =========================================================
   HELPERS
========================================================= */

function el(id) {
  return document.getElementById(id);
}

function setText(id, value) {
  const element = el(id);

  if (element) {
    element.textContent = value;
  }
}

function formatNumber(number) {
  return Number(number || 0).toLocaleString("id-ID");
}

/* =========================================================
   NAVBAR
========================================================= */

function toggleNav() {
  const nav = el("navbarNav");

  if (nav) {
    nav.classList.toggle("show");
  }
}

/* =========================================================
   API JSON
========================================================= */

async function requestJSON(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    }
  });

  const text = await response.text();

  let data;

  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(
      "Server mengembalikan HTML, bukan JSON. Pastikan website dibuka melalui http://localhost:3000/"
    );
  }

  if (!response.ok) {
    const error = new Error(
      data.message || "Request gagal."
    );

    error.data = data;
    error.status = response.status;

    throw error;
  }

  return data;
}

/* =========================================================
   LOGIN
========================================================= */

async function login(event) {
  event.preventDefault();

  const input = el("loginEmail");
  const message = el("loginMessage");

  if (!input) return;

  const email = input.value.trim();

  if (!email) {
    showLoginMessage(
      "Email wajib diisi."
    );

    return;
  }

  const button =
    document.querySelector(
      ".login-button"
    );

  if (button) {
    button.disabled = true;
    button.textContent = "Menyimpan...";
  }

  try {

    const data = await requestJSON(
      "/login",
      {
        method: "POST",
        body: JSON.stringify({
          email
        })
      }
    );

    if (!data.success) {
      throw new Error(
        data.message ||
        "Login gagal."
      );
    }

    currentUser = data.user;

    updateUserUI();

    if (message) {
      message.classList.remove("show");
      message.textContent = "";
    }

    const loginBox =
      el("loginFormBox");

    if (loginBox) {
      loginBox.style.display = "none";
    }

    const loggedBox =
      el("loggedBox");

    if (loggedBox) {
      loggedBox.style.display = "block";
    }

  } catch (error) {

    showLoginMessage(
      error.message
    );

  } finally {

    if (button) {
      button.disabled = false;
      button.textContent = "Login →";
    }

  }
}

function showLoginMessage(text) {
  const message = el("loginMessage");

  if (!message) return;

  message.textContent = text;
  message.classList.add("show");
}

/* =========================================================
   CURRENT USER
========================================================= */

async function loadCurrentUser() {

  try {

    const data =
      await requestJSON(
        "/current-user"
      );

    if (!data.success) {
      return false;
    }

    currentUser = data.user;

    updateUserUI();

    return true;

  } catch {

    return false;

  }
}

/* =========================================================
   USER UI
========================================================= */

function updateUserUI() {

  if (!currentUser) {
    return;
  }

  const email =
    currentUser.email ||
    "Belum login";

  const usage =
    Number(
      currentUser.dailyUsage || 0
    );

  const limit =
    Number(
      currentUser.dailyLimit || 50
    );

  const remaining =
    Number(
      currentUser.remaining ??
      Math.max(0, limit - usage)
    );

  setText(
    "accountEmail",
    email
  );

  setText(
    "accountPlan",
    currentUser.planName ||
    "FREE USER"
  );

  setText(
    "accountLimit",
    `${formatNumber(remaining)} / ${formatNumber(limit)}`
  );

  setText(
    "usageText",
    `${formatNumber(usage)} / ${formatNumber(limit)}`
  );

  setText(
    "miniAccount",
    email
  );

  setText(
    "miniUsage",
    `${formatNumber(remaining)} / ${formatNumber(limit)}`
  );

  setText(
    "currentPlan",
    currentUser.planName ||
    "FREE USER"
  );

  setText(
    "currentLimit",
    `${formatNumber(limit)}x / hari`
  );

  const progress =
    el("usageProgress");

  if (progress) {

    const percent =
      limit > 0
        ? Math.min(
            100,
            (usage / limit) * 100
          )
        : 0;

    progress.style.width =
      `${percent}%`;
  }
}

/* =========================================================
   AUTO LOAD
========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  async () => {

    const logged =
      await loadCurrentUser();

    const loginBox =
      el("loginFormBox");

    const loggedBox =
      el("loggedBox");

    if (logged) {

      if (loginBox) {
        loginBox.style.display =
          "none";
      }

      if (loggedBox) {
        loggedBox.style.display =
          "block";
      }

    } else {

      if (loginBox) {
        loginBox.style.display =
          "block";
      }

      if (loggedBox) {
        loggedBox.style.display =
          "none";
      }

      /* tools page */

      if (el("miniAccount")) {
        setText(
          "miniAccount",
          "Belum login"
        );

        setText(
          "miniUsage",
          "Login terlebih dahulu"
        );
      }

    }

    /* payment page */
    loadPaymentUser();

  }
);

/* =========================================================
   LOGOUT
========================================================= */

async function logout() {

  try {

    await requestJSON(
      "/logout"
    );

  } catch {}

  currentUser = null;

  location.href =
    "index.html";
}

/* =========================================================
   TOOL LIMIT
========================================================= */

async function useTool() {

  try {

    const data =
      await requestJSON(
        "/use-tool",
        {
          method: "POST",
          body: JSON.stringify({})
        }
      );

    if (data.user) {
      currentUser =
        data.user;

      updateUserUI();
    }

    return true;

  } catch (error) {

    if (
      error.status === 401
    ) {

      alert(
        "Silakan login terlebih dahulu."
      );

      location.href =
        "index.html";

      return false;
    }

    if (
      error.status === 429
    ) {

      alert(
        error.message ||
        "Limit hari ini sudah habis."
      );

      if (error.data?.user) {
        currentUser =
          error.data.user;

        updateUserUI();
      }

      return false;
    }

    alert(error.message);

    return false;
  }
}

/* =========================================================
   TOOL MODAL
========================================================= */

function openTool(name) {

  const modal =
    el("toolModal");

  if (!modal) return;

  const panels =
    document.querySelectorAll(
      ".tool-panel"
    );

  panels.forEach(
    panel => {
      panel.style.display =
        "none";
    }
  );

  const panel =
    el(`${name}Tool`);

  if (!panel) return;

  panel.style.display =
    "block";

  modal.classList.add(
    "show"
  );
}

function closeTool() {

  const modal =
    el("toolModal");

  if (modal) {
    modal.classList.remove(
      "show"
    );
  }
}

window.addEventListener(
  "click",
  event => {

    const modal =
      el("toolModal");

    if (
      modal &&
      event.target === modal
    ) {
      closeTool();
    }

  }
);

/* =========================================================
   DOWNLOADER
========================================================= */

function openDownloader(title) {

  openTool(
    "downloader"
  );

  setText(
    "downloaderTitle",
    title
  );

  const input =
    el("downloadUrl");

  if (input) {
    input.value = "";
  }

  setText(
    "downloadResult",
    ""
  );
}

async function processDownloader() {

  const input =
    el("downloadUrl");

  const result =
    el("downloadResult");

  if (!input || !result) {
    return;
  }

  const url =
    input.value.trim();

  if (!url) {
    result.textContent =
      "Masukkan URL terlebih dahulu.";

    return;
  }

  const allowed =
    await useTool();

  if (!allowed) {
    return;
  }

  result.innerHTML = `
    <div class="notice">
      URL diterima.<br>
      Downloader API belum dipasang.
      Tool sudah tercatat sebagai penggunaan.
    </div>
  `;
}

/* =========================================================
   SEARCH
========================================================= */

function filterTools() {

  const input =
    el("search");

  if (!input) return;

  const query =
    input.value
      .toLowerCase()
      .trim();

  const cards =
    document.querySelectorAll(
      ".tool-card"
    );

  let count = 0;

  cards.forEach(card => {

    const name =
      (
        card.dataset.name ||
        ""
      ).toLowerCase();

    const category =
      card.dataset.cat;

    const matchSearch =
      name.includes(query);

    const matchCategory =
      currentCategory === "all" ||
      category === currentCategory;

    const visible =
      matchSearch &&
      matchCategory;

    card.style.display =
      visible
        ? "flex"
        : "none";

    if (visible) {
      count++;
    }

  });

  const noResult =
    el("noResult");

  if (noResult) {
    noResult.style.display =
      count === 0
        ? "block"
        : "none";
  }
}

function filterCat(category, button) {

  currentCategory =
    category;

  document
    .querySelectorAll(".cat")
    .forEach(
      item =>
        item.classList.remove(
          "active-cat"
        )
    );

  if (button) {
    button.classList.add(
      "active-cat"
    );
  }

  filterTools();
}

/* =========================================================
   CALCULATOR
========================================================= */

function calcInput(value) {

  if (
    calculatorValue === "Error"
  ) {
    calculatorValue = "";
  }

  calculatorValue += value;

  updateCalculator();
}

function calcClear() {

  calculatorValue = "";

  updateCalculator();
}

function calcResult() {

  if (!calculatorValue) {
    return;
  }

  try {

    if (
      !/^[0-9+\-*/().\s]+$/
        .test(calculatorValue)
    ) {
      throw new Error();
    }

    const result =
      Function(
        `"use strict"; return (${calculatorValue})`
      )();

    if (
      !Number.isFinite(result)
    ) {
      throw new Error();
    }

    calculatorValue =
      String(result);

  } catch {

    calculatorValue =
      "Error";

  }

  updateCalculator();
}

function updateCalculator() {

  setText(
    "calcScreen",
    calculatorValue || "0"
  );
}

/* =========================================================
   STICKER
========================================================= */

function loadSticker(event) {

  const file =
    event.target.files?.[0];

  if (!file) return;

  const image =
    new Image();

  image.onload = () => {

    stickerImage =
      image;

    drawSticker();

  };

  image.src =
    URL.createObjectURL(file);
}

function drawSticker() {

  const canvas =
    el("stickerCanvas");

  if (!canvas) return;

  const ctx =
    canvas.getContext("2d");

  ctx.clearRect(
    0,
    0,
    canvas.width,
    canvas.height
  );

  if (stickerImage) {

    const scale =
      Math.min(
        canvas.width /
          stickerImage.width,
        canvas.height /
          stickerImage.height
      );

    const width =
      stickerImage.width *
      scale;

    const height =
      stickerImage.height *
      scale;

    const x =
      (canvas.width - width) / 2;

    const y =
      (canvas.height - height) / 2;

    ctx.drawImage(
      stickerImage,
      x,
      y,
      width,
      height
    );
  }

  const text =
    el("stickerText")?.value ||
    "";

  if (text) {

    ctx.font =
      "bold 38px Arial";

    ctx.textAlign =
      "center";

    ctx.textBaseline =
      "bottom";

    ctx.lineWidth =
      10;

    ctx.strokeStyle =
      "#000";

    ctx.fillStyle =
      "#fff";

    ctx.strokeText(
      text,
      canvas.width / 2,
      canvas.height - 25
    );

    ctx.fillText(
      text,
      canvas.width / 2,
      canvas.height - 25
    );
  }
}

function downloadSticker() {

  const canvas =
    el("stickerCanvas");

  if (!canvas) return;

  downloadCanvas(
    "stickerCanvas",
    "sticker-dikzz.png"
  );
}

/* =========================================================
   QR
========================================================= */

async function generateQR() {

  const text =
    el("qrText")?.value.trim();

  const result =
    el("qrResult");

  if (!text || !result) {
    return;
  }

  const allowed =
    await useTool();

  if (!allowed) {
    return;
  }

  result.innerHTML = `
    <img
      src="https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(text)}"
      alt="QR Code"
    >
  `;
}

/* =========================================================
   BRAT
========================================================= */

function generateBrat() {

  const canvas =
    el("bratCanvas");

  if (!canvas) return;

  const ctx =
    canvas.getContext("2d");

  const text =
    el("bratText")?.value ||
    "brat";

  ctx.fillStyle =
    "#b8ff00";

  ctx.fillRect(
    0,
    0,
    canvas.width,
    canvas.height
  );

  ctx.fillStyle =
    "#111";

  ctx.font =
    "bold 90px Arial";

  ctx.textAlign =
    "center";

  ctx.textBaseline =
    "middle";

  ctx.fillText(
    text,
    canvas.width / 2,
    canvas.height / 2
  );
}

/* =========================================================
   IQC
========================================================= */

function generateIQC() {

  const canvas =
    el("iqcCanvas");

  if (!canvas) return;

  const ctx =
    canvas.getContext("2d");

  const name =
    el("iqcName")?.value ||
    "Dikzz";

  const message =
    el("iqcMessage")?.value ||
    "Hello!";

  ctx.fillStyle =
    "#111";

  ctx.fillRect(
    0,
    0,
    canvas.width,
    canvas.height
  );

  ctx.fillStyle =
    "#222";

  ctx.fillRect(
    50,
    50,
    600,
    400
  );

  ctx.fillStyle =
    "#fff";

  ctx.font =
    "bold 25px Arial";

  ctx.fillText(
    name,
    80,
    100
  );

  ctx.font =
    "20px Arial";

  const words =
    message.split(" ");

  let line = "";
  let y = 155;

  for (const word of words) {

    const test =
      line + word + " ";

    if (
      ctx.measureText(test).width >
      520
    ) {

      ctx.fillText(
        line,
        80,
        y
      );

      line =
        word + " ";

      y += 32;

    } else {

      line = test;

    }

  }

  ctx.fillText(
    line,
    80,
    y
  );
}

/* =========================================================
   CANVAS DOWNLOAD
========================================================= */

function downloadCanvas(
  id,
  filename
) {

  const canvas =
    el(id);

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

/* =========================================================
   BASE64
========================================================= */

function encodeBase64() {

  const input =
    el("base64Input");

  const output =
    el("base64Output");

  if (!input || !output) return;

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
      "Gagal encode.";

  }
}

function decodeBase64() {

  const input =
    el("base64Input");

  const output =
    el("base64Output");

  if (!input || !output) return;

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
   COMPRESS
========================================================= */

async function compressImage() {

  const file =
    el("compressFile")?.files?.[0];

  const result =
    el("compressResult");

  if (!file || !result) {
    return;
  }

  const allowed =
    await useTool();

  if (!allowed) {
    return;
  }

  const quality =
    Number(
      el("compressQuality")?.value ||
      75
    ) / 100;

  const image =
    new Image();

  image.onload = () => {

    const canvas =
      document.createElement(
        "canvas"
      );

    const max =
      1600;

    const scale =
      Math.min(
        1,
        max / image.width
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
            "Kompresi gagal.";

          return;
        }

        const url =
          URL.createObjectURL(blob);

        result.innerHTML = `
          <div class="notice">
            Ukuran asli:
            ${formatNumber(file.size)}
            bytes<br>

            Ukuran hasil:
            ${formatNumber(blob.size)}
            bytes<br><br>

            <a
              href="${url}"
              download="compressed-dikzz.jpg"
              style="color:#c58aff"
            >
              Download hasil →
            </a>
          </div>
        `;

      },
      "image/jpeg",
      quality
    );

  };

  image.src =
    URL.createObjectURL(file);
}

/* =========================================================
   URL SHORTENER
========================================================= */

async function shortenUrl() {

  const input =
    el("shortUrlInput");

  const result =
    el("shortUrlResult");

  if (!input || !result) {
    return;
  }

  const url =
    input.value.trim();

  if (!url) {
    result.textContent =
      "Masukkan URL.";

    return;
  }

  const allowed =
    await useTool();

  if (!allowed) {
    return;
  }

  try {

    const response =
      await fetch(
        `https://tinyurl.com/api-create.php?url=${encodeURIComponent(url)}`
      );

    const short =
      await response.text();

    result.innerHTML = `
      <div class="notice">
        Hasil:<br>
        <a
          href="${short}"
          target="_blank"
          style="color:#c58aff"
        >
          ${short}
        </a>
      </div>
    `;

  } catch {

    result.textContent =
      "Gagal membuat URL pendek.";

  }
}

/* =========================================================
   PAYMENT USER
========================================================= */

function loadPaymentUser() {

  if (
    !el("currentPlan")
  ) {
    return;
  }

  if (currentUser) {
    updateUserUI();
  }
}

/* =========================================================
   PLAN
========================================================= */

function selectPlan(planId) {

  const plan =
    PLANS[planId];

  if (!plan) return;

  const payment =
    el("paymentSection");

  const selected =
    el("selectedPlan");

  if (selected) {

    selected.innerHTML = `
      <small>PAKET DIPILIH</small>

      <strong>
        ${plan.name}
      </strong>

      <span>
        Limit ${formatNumber(plan.limit)}x / hari
      </span>

      <strong>
        ${plan.price}
      </strong>
    `;

  }

  if (payment) {

    payment.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });

  }
}

/* =========================================================
   PAYMENT COPY
========================================================= */

async function copyPayment(method) {

  const number =
    PAYMENT_NUMBERS[method];

  if (!number) {
    return;
  }

  try {

    await navigator.clipboard.writeText(
      number
    );

  } catch {

    const textarea =
      document.createElement("textarea");

    textarea.value =
      number;

    document.body.appendChild(
      textarea
    );

    textarea.select();

    document.execCommand(
      "copy"
    );

    textarea.remove();
  }

  const message =
    el("copyMessage");

  if (message) {

    message.textContent =
      `${method} berhasil disalin: ${number}`;

    message.classList.add(
      "show"
    );

    setTimeout(() => {

      message.classList.remove(
        "show"
      );

    }, 3500);

  }
}

/* =========================================================
   QRIS
========================================================= */

function showQRIS() {

  const box =
    el("qrisBox");

  if (box) {
    box.classList.add(
      "show"
    );

    box.scrollIntoView({
      behavior: "smooth",
      block: "center"
    });
  }
}

function hideQRIS() {

  const box =
    el("qrisBox");

  if (box) {
    box.classList.remove(
      "show"
    );
  }
}