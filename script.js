/* =========================================================
   NEOXR - DIKZZ
   MAIN JAVASCRIPT
========================================================= */


/* =========================================================
   NAVBAR
========================================================= */

function toggleNav() {

  const nav =
    document.getElementById("navbarNav");

  if (!nav) return;

  nav.classList.toggle("show");
}


document.addEventListener("click", function (event) {

  const nav =
    document.getElementById("navbarNav");

  const button =
    document.querySelector(".menu-btn");

  if (!nav || !button) return;

  if (
    nav.classList.contains("show") &&
    !nav.contains(event.target) &&
    !button.contains(event.target)
  ) {

    nav.classList.remove("show");

  }

});


/* =========================================================
   TOOLS SEARCH
========================================================= */

let currentCategory = "all";


function filterTools() {

  const input =
    document.getElementById("search");

  const cards =
    document.querySelectorAll(".tool-card");

  const noResult =
    document.getElementById("noResult");

  if (!cards.length) return;


  const keyword =
    input
      ? input.value.toLowerCase().trim()
      : "";


  let visible = 0;


  cards.forEach(function (card) {

    const name =
      (
        card.dataset.name ||
        ""
      ).toLowerCase();


    const category =
      card.dataset.cat || "";


    const searchMatch =
      name.includes(keyword);


    const categoryMatch =
      currentCategory === "all" ||
      category === currentCategory;


    if (
      searchMatch &&
      categoryMatch
    ) {

      card.style.display = "flex";

      visible++;

    } else {

      card.style.display = "none";

    }

  });


  if (noResult) {

    noResult.style.display =
      visible === 0
        ? "block"
        : "none";

  }

}


/* =========================================================
   CATEGORY
========================================================= */

function filterCat(category, button) {

  currentCategory = category;


  document
    .querySelectorAll(".cat")
    .forEach(function (item) {

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
   MODAL
========================================================= */

function openTool(toolName) {

  const modal =
    document.getElementById("toolModal");

  if (!modal) return;


  document
    .querySelectorAll(".tool-panel")
    .forEach(function (panel) {

      panel.style.display = "none";

    });


  if (toolName === "calculator") {

    const panel =
      document.getElementById(
        "calculatorTool"
      );

    if (panel) {

      panel.style.display = "block";

      calcClear();

    }

  }


  if (toolName === "sticker") {

    const panel =
      document.getElementById(
        "stickerTool"
      );

    if (panel) {

      panel.style.display = "block";

    }

  }


  modal.classList.add("show");

  document.body.style.overflow =
    "hidden";
}


function closeTool() {

  const modal =
    document.getElementById("toolModal");

  if (!modal) return;

  modal.classList.remove("show");

  document.body.style.overflow =
    "";
}


document.addEventListener(
  "keydown",
  function (event) {

    if (event.key === "Escape") {

      closeTool();

    }

  }
);


/* =========================================================
   COMING SOON
========================================================= */

function showComingSoon(name) {

  const modal =
    document.getElementById("toolModal");

  if (!modal) return;


  const title =
    document.getElementById(
      "comingSoonTitle"
    );


  document
    .querySelectorAll(".tool-panel")
    .forEach(function (panel) {

      panel.style.display = "none";

    });


  if (title) {

    title.textContent = name;

  }


  const panel =
    document.getElementById(
      "comingSoonTool"
    );


  if (panel) {

    panel.style.display = "block";

  }


  modal.classList.add("show");

  document.body.style.overflow =
    "hidden";
}


/* =========================================================
   DOWNLOADER UI
========================================================= */

function openDownloader(name) {

  const modal =
    document.getElementById("toolModal");

  if (!modal) return;


  document
    .querySelectorAll(".tool-panel")
    .forEach(function (panel) {

      panel.style.display = "none";

    });


  const panel =
    document.getElementById(
      "downloaderTool"
    );


  const title =
    document.getElementById(
      "downloaderTitle"
    );


  const result =
    document.getElementById(
      "downloadResult"
    );


  if (title) {

    title.textContent = name;

  }


  if (result) {

    result.innerHTML = "";

  }


  if (panel) {

    panel.style.display = "block";

  }


  modal.classList.add("show");

  document.body.style.overflow =
    "hidden";
}


function processDownloader() {

  const input =
    document.getElementById(
      "downloadUrl"
    );


  const result =
    document.getElementById(
      "downloadResult"
    );


  if (!input || !result) return;


  const url =
    input.value.trim();


  if (!url) {

    result.innerHTML =
      "⚠️ Masukkan link terlebih dahulu.";

    return;
  }


  /*
    TEMPAT API DOWNLOADER.

    Jangan mengarang endpoint API.
    Setelah API yang kamu pakai sudah ada,
    bagian ini tinggal disambungkan.

    Contoh alurnya:

    fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        url: url
      })
    })
  */


  result.innerHTML =
    "🔗 Link diterima. API downloader belum disambungkan.";
}


/* =========================================================
   CALCULATOR
========================================================= */

let calcValue = "0";


function updateCalcScreen() {

  const screen =
    document.getElementById(
      "calcScreen"
    );

  if (!screen) return;

  screen.textContent =
    calcValue;
}


function calcClear() {

  calcValue = "0";

  updateCalcScreen();
}


function calcInput(value) {

  if (
    !/^[0-9.+\-*/]$/.test(value)
  ) {
    return;
  }


  if (calcValue === "Error") {

    calcValue = "0";

  }


  if (calcValue === "0") {

    if (
      value >= "0" &&
      value <= "9"
    ) {

      calcValue = value;

    } else if (value === ".") {

      calcValue = "0.";

    } else {

      calcValue += value;

    }


    updateCalcScreen();

    return;
  }


  const last =
    calcValue.charAt(
      calcValue.length - 1
    );


  const operators =
    ["+", "-", "*", "/"];


  if (
    operators.includes(value) &&
    operators.includes(last)
  ) {

    calcValue =
      calcValue.slice(0, -1) +
      value;

    updateCalcScreen();

    return;
  }


  if (value === ".") {

    const parts =
      calcValue.split(
        /[+\-*/]/
      );


    const currentNumber =
      parts[parts.length - 1];


    if (
      currentNumber.includes(".")
    ) {

      return;

    }

  }


  calcValue += value;

  updateCalcScreen();
}


function calcResult() {

  try {

    let expression =
      calcValue;


    const last =
      expression.slice(-1);


    if (
      ["+", "-", "*", "/"]
        .includes(last)
    ) {

      expression =
        expression.slice(0, -1);

    }


    if (
      !/^[0-9+\-*/.()\s]+$/
        .test(expression)
    ) {

      throw new Error();

    }


    const result =
      Function(
        '"use strict"; return (' +
        expression +
        ')'
      )();


    if (
      typeof result !== "number" ||
      !Number.isFinite(result)
    ) {

      throw new Error();

    }


    calcValue =
      String(
        Math.round(
          result * 100000000
        ) / 100000000
      );


    updateCalcScreen();

  } catch {

    calcValue = "Error";

    updateCalcScreen();


    setTimeout(
      calcClear,
      900
    );

  }

}


/* =========================================================
   CALCULATOR KEYBOARD
========================================================= */

document.addEventListener(
  "keydown",
  function (event) {

    const modal =
      document.getElementById(
        "toolModal"
      );


    if (
      !modal ||
      !modal.classList.contains(
        "show"
      )
    ) {

      return;

    }


    const calculator =
      document.getElementById(
        "calculatorTool"
      );


    if (
      !calculator ||
      calculator.style.display === "none"
    ) {

      return;

    }


    const key =
      event.key;


    if (
      /^[0-9]$/.test(key) ||
      ["+", "-", "*", "/", "."]
        .includes(key)
    ) {

      calcInput(key);

      event.preventDefault();

    }


    if (key === "Enter") {

      calcResult();

      event.preventDefault();

    }


    if (key === "Backspace") {

      if (
        calcValue.length > 1
      ) {

        calcValue =
          calcValue.slice(0, -1);

      } else {

        calcValue = "0";

      }


      updateCalcScreen();

      event.preventDefault();

    }

  }
);


/* =========================================================
   STICKER MAKER
========================================================= */

let stickerImage = null;


function loadSticker(event) {

  const file =
    event.target.files?.[0];


  if (!file) return;


  if (
    !file.type.startsWith(
      "image/"
    )
  ) {

    alert(
      "File harus berupa gambar."
    );

    return;

  }


  const reader =
    new FileReader();


  reader.onload =
    function (e) {

      const image =
        new Image();


      image.onload =
        function () {

          stickerImage =
            image;

          drawSticker();

        };


      image.src =
        e.target.result;

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


  const width =
    canvas.width;


  const height =
    canvas.height;


  ctx.clearRect(
    0,
    0,
    width,
    height
  );


  if (!stickerImage) {

    ctx.fillStyle =
      "#16101c";


    ctx.fillRect(
      0,
      0,
      width,
      height
    );


    ctx.fillStyle =
      "#9d8ca7";


    ctx.font =
      "500 18px Inter, Arial";


    ctx.textAlign =
      "center";


    ctx.textBaseline =
      "middle";


    ctx.fillText(
      "Upload gambar terlebih dahulu",
      width / 2,
      height / 2
    );


    return;

  }


  const image =
    stickerImage;


  const scale =
    Math.min(
      width / image.width,
      height / image.height
    );


  const drawWidth =
    image.width * scale;


  const drawHeight =
    image.height * scale;


  const x =
    (width - drawWidth) / 2;


  const y =
    (height - drawHeight) / 2;


  ctx.drawImage(
    image,
    x,
    y,
    drawWidth,
    drawHeight
  );


  const textInput =
    document.getElementById(
      "stickerText"
    );


  const text =
    textInput
      ? textInput.value.trim()
      : "";


  if (!text) return;


  const fontSize =
    38;


  ctx.font =
    `800 ${fontSize}px Inter, Arial`;


  ctx.textAlign =
    "center";


  ctx.textBaseline =
    "bottom";


  const textX =
    width / 2;


  const textY =
    height - 22;


  /* TEXT OUTLINE */

  ctx.lineWidth = 10;

  ctx.strokeStyle =
    "#ffffff";


  ctx.strokeText(
    text,
    textX,
    textY
  );


  /* TEXT */

  ctx.fillStyle =
    "#111";


  ctx.fillText(
    text,
    textX,
    textY
  );

}


/* LIVE STICKER PREVIEW */

document.addEventListener(
  "input",
  function (event) {

    if (
      event.target?.id ===
      "stickerText"
    ) {

      if (stickerImage) {

        drawSticker();

      }

    }

  }
);


/* =========================================================
   DOWNLOAD STICKER
========================================================= */

function downloadSticker() {

  const canvas =
    document.getElementById(
      "stickerCanvas"
    );


  if (!canvas) return;


  if (!stickerImage) {

    alert(
      "Upload gambar terlebih dahulu."
    );

    return;

  }


  canvas.toBlob(
    function (blob) {

      if (!blob) {

        alert(
          "Browser tidak mendukung WebP."
        );

        return;

      }


      const url =
        URL.createObjectURL(
          blob
        );


      const link =
        document.createElement(
          "a"
        );


      link.href =
        url;


      link.download =
        "neoxr-dikzz-sticker.webp";


      document.body.appendChild(
        link
      );


      link.click();

      link.remove();


      setTimeout(
        function () {

          URL.revokeObjectURL(
            url
          );

        },
        1000
      );

    },
    "image/webp",
    .92
  );

}


/* =========================================================
   VVIP
========================================================= */

function selectPlan(planName) {

  const selected =
    document.getElementById(
      "selectedPlan"
    );


  if (!selected) return;


  selected.innerHTML =
    "Paket dipilih: <strong>" +
    escapeHTML(planName) +
    "</strong>";


  selected.scrollIntoView({
    behavior: "smooth",
    block: "center"
  });

}


function escapeHTML(text) {

  const element =
    document.createElement(
      "div"
    );


  element.textContent =
    text;


  return element.innerHTML;
}


/* =========================================================
   INITIALIZE
========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  function () {

    updateCalcScreen();

    filterTools();


    const modal =
      document.getElementById(
        "toolModal"
      );


    if (modal) {

      modal.classList.remove(
        "show"
      );

    }

  }
);