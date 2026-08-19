/* =========================================================
   DIKZZ TOOLS SCRIPT
========================================================= */


/* =========================================================
   GLOBAL USER
========================================================= */

let currentUser = null;


/* =========================================================
   HELPER
========================================================= */

function setText(id, value) {

  const element =
    document.getElementById(id);

  if (element) {

    element.textContent =
      value;

  }

}


function formatNumber(number) {

  return Number(
    number || 0
  ).toLocaleString("id-ID");

}


/* =========================================================
   LOAD CURRENT USER

   SERVER OTOMATIS MEMBUAT USER
========================================================= */

async function loadCurrentUser() {

  try {

    const response =
      await fetch(
        "/current-user",
        {
          method: "GET",
          credentials: "same-origin",
          headers: {
            "Accept": "application/json"
          }
        }
      );


    const contentType =
      response.headers
        .get("content-type") || "";


    if (
      !contentType
        .toLowerCase()
        .includes("application/json")
    ) {

      throw new Error(
        "Server mengembalikan HTML, bukan JSON."
      );

    }


    const data =
      await response.json();


    if (
      !response.ok ||
      !data.success
    ) {

      throw new Error(
        data.message ||
        "Gagal mengambil user."
      );

    }


    currentUser =
      data.user;


    updateUserUI(
      currentUser
    );


  } catch (error) {

    console.error(
      "Load user error:",
      error
    );

  }

}


/* =========================================================
   UPDATE USER UI
========================================================= */

function updateUserUI(user) {

  if (!user) {
    return;
  }


  const plan =
    user.planName ||
    "FREE USER";


  const limit =
    Number(
      user.dailyLimit || 50
    );


  const usage =
    Number(
      user.dailyUsage || 0
    );


  const remaining =
    Math.max(
      0,
      Number(
        user.remaining ??
        limit - usage
      )
    );


  /* =====================================================
     PROFILE
  ===================================================== */

  setText(
    "planBadge",
    plan
  );


  setText(
    "limitBadge",
    `${formatNumber(limit)}x / hari`
  );


  /* =====================================================
     STATS
  ===================================================== */

  setText(
    "statPlan",
    user.plan || "FREE"
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


  /* =====================================================
     ACCOUNT
  ===================================================== */

  setText(
    "accountId",
    user.id || "-"
  );


  setText(
    "accountPlan",
    plan
  );


  setText(
    "accountLimit",
    `${formatNumber(limit)}x`
  );


  /* =====================================================
     USAGE
  ===================================================== */

  setText(
    "miniUsage",
    `${formatNumber(usage)} / ${formatNumber(limit)}`
  );


  const progress =
    document.getElementById(
      "usageProgress"
    );


  if (progress) {

    const percentage =
      limit > 0
        ? Math.min(
            100,
            (usage / limit) * 100
          )
        : 0;


    progress.style.width =
      `${percentage}%`;

  }

}


/* =========================================================
   USE TOOL

   Panggil ini setiap tool benar-benar digunakan.
========================================================= */

async function useTool() {

  try {

    const response =
      await fetch(
        "/use-tool",
        {
          method: "POST",
          credentials: "same-origin",
          headers: {
            "Content-Type":
              "application/json",

            "Accept":
              "application/json"
          },

          body: JSON.stringify({})
        }
      );


    const contentType =
      response.headers
        .get("content-type") || "";


    if (
      !contentType
        .toLowerCase()
        .includes("application/json")
    ) {

      throw new Error(
        "Server mengembalikan HTML, bukan JSON."
      );

    }


    const data =
      await response.json();


    if (
      !response.ok ||
      !data.success
    ) {

      if (data.user) {

        currentUser =
          data.user;

        updateUserUI(
          currentUser
        );

      }

      throw new Error(
        data.message ||
        "Limit tidak cukup."
      );

    }


    currentUser =
      data.user;


    updateUserUI(
      currentUser
    );


    return true;


  } catch (error) {

    console.error(
      "Use tool error:",
      error
    );


    alert(
      error.message
    );


    return false;

  }

}


/* =========================================================
   LOGOUT / RESET SESSION
========================================================= */

async function logout() {

  try {

    const response =
      await fetch(
        "/logout",
        {
          method: "GET",
          credentials: "same-origin",
          headers: {
            "Accept":
              "application/json"
          }
        }
      );


    const data =
      await response.json();


    if (data.success) {

      window.location.href =
        "/";

    }

  } catch (error) {

    console.error(
      "Logout error:",
      error
    );

  }

}


/* =========================================================
   NAVBAR
========================================================= */

function toggleNav() {

  const nav =
    document.getElementById(
      "navbarNav"
    );


  if (!nav) {
    return;
  }


  nav.classList.toggle(
    "show"
  );

}


/* =========================================================
   CLOSE NAV WHEN CLICK LINK
========================================================= */

document.addEventListener(
  "click",
  event => {

    const nav =
      document.getElementById(
        "navbarNav"
      );


    if (!nav) {
      return;
    }


    const link =
      event.target.closest(
        "#navbarNav a"
      );


    if (link) {

      nav.classList.remove(
        "show"
      );

    }

  }
);


/* =========================================================
   PAGE LOAD
========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  () => {

    loadCurrentUser();

  }
);