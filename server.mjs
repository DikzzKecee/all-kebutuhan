import http from "http";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import crypto from "crypto";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;

const DATA_DIR = path.join(__dirname, "data");
const USERS_FILE = path.join(DATA_DIR, "users.json");

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

if (!fs.existsSync(USERS_FILE)) {
  fs.writeFileSync(USERS_FILE, "[]", "utf8");
}

/* =========================================================
   DATABASE
========================================================= */

function readUsers() {
  try {
    const data = fs.readFileSync(USERS_FILE, "utf8");
    const users = JSON.parse(data);

    return Array.isArray(users) ? users : [];
  } catch (error) {
    console.error("Gagal membaca database:", error.message);
    return [];
  }
}

function saveUsers(users) {
  try {
    fs.writeFileSync(
      USERS_FILE,
      JSON.stringify(users, null, 2),
      "utf8"
    );

    return true;
  } catch (error) {
    console.error("Gagal menyimpan database:", error.message);
    return false;
  }
}

/* =========================================================
   DATE WIB
========================================================= */

function todayWIB() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(new Date());
}

/* =========================================================
   COOKIE
========================================================= */

function parseCookies(req) {
  const cookies = {};
  const header = req.headers.cookie;

  if (!header) {
    return cookies;
  }

  for (const item of header.split(";")) {
    const index = item.indexOf("=");

    if (index === -1) continue;

    const key = item.slice(0, index).trim();
    const value = item.slice(index + 1).trim();

    try {
      cookies[key] = decodeURIComponent(value);
    } catch {
      cookies[key] = value;
    }
  }

  return cookies;
}

function setCookie(res, name, value) {
  res.setHeader(
    "Set-Cookie",
    `${name}=${encodeURIComponent(value)}; Path=/; SameSite=Lax`
  );
}

function clearCookie(res, name) {
  res.setHeader(
    "Set-Cookie",
    `${name}=; Path=/; Max-Age=0; SameSite=Lax`
  );
}

/* =========================================================
   JSON RESPONSE
========================================================= */

function sendJSON(res, status, data) {
  const body = JSON.stringify(data);

  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store"
  });

  res.end(body);
}

/* =========================================================
   BODY
========================================================= */

function getBody(req) {
  return new Promise((resolve) => {
    let body = "";

    req.on("data", chunk => {
      body += chunk;
    });

    req.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        resolve({});
      }
    });
  });
}

/* =========================================================
   USER
========================================================= */

function resetDaily(user) {
  const today = todayWIB();

  if (user.lastReset !== today) {
    user.dailyUsage = 0;
    user.remaining = user.dailyLimit;
    user.lastReset = today;

    return true;
  }

  return false;
}

function getCurrentUser(req) {
  const cookies = parseCookies(req);
  const email = cookies.dk_email;

  if (!email) {
    return null;
  }

  const users = readUsers();

  const user = users.find(
    item =>
      String(item.email || "").toLowerCase() ===
      String(email).toLowerCase()
  );

  if (!user) {
    return null;
  }

  if (resetDaily(user)) {
    saveUsers(users);
  }

  return user;
}

/* =========================================================
   MIME
========================================================= */

function getMime(filePath) {
  const ext = path.extname(filePath).toLowerCase();

  const types = {
    ".html": "text/html; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".js": "application/javascript; charset=utf-8",
    ".mjs": "application/javascript; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".webp": "image/webp",
    ".gif": "image/gif",
    ".svg": "image/svg+xml",
    ".ico": "image/x-icon"
  };

  return types[ext] || "application/octet-stream";
}

/* =========================================================
   STATIC FILE
========================================================= */

function serveFile(req, res, pathname) {
  let filePath;

  if (pathname === "/") {
    filePath = path.join(__dirname, "index.html");
  } else {
    filePath = path.join(__dirname, pathname);
  }

  const safeRoot = path.resolve(__dirname);
  const safeFile = path.resolve(filePath);

  if (
    !safeFile.startsWith(safeRoot + path.sep) &&
    safeFile !== safeRoot
  ) {
    sendJSON(res, 403, {
      success: false,
      message: "Forbidden"
    });

    return;
  }

  fs.readFile(safeFile, (error, data) => {
    if (error) {
      res.writeHead(404, {
        "Content-Type": "text/html; charset=utf-8"
      });

      res.end(`
        <!DOCTYPE html>
        <html lang="id">
        <head>
          <meta charset="UTF-8">
          <title>404 — Dikzz Tools</title>
        </head>
        <body style="
          background:#08050d;
          color:white;
          font-family:Arial;
          text-align:center;
          padding:80px 20px;
        ">
          <h1>404</h1>
          <p>File tidak ditemukan.</p>
          <a href="/" style="color:#b86cff">
            Kembali
          </a>
        </body>
        </html>
      `);

      return;
    }

    res.writeHead(200, {
      "Content-Type": getMime(safeFile),
      "Cache-Control": "no-cache"
    });

    res.end(data);
  });
}

/* =========================================================
   SERVER
========================================================= */

const server = http.createServer(async (req, res) => {
  const url = new URL(
    req.url,
    `http://${req.headers.host || "localhost"}`
  );

  const pathname = decodeURIComponent(url.pathname);

  /* =======================================================
     LOGIN
  ======================================================= */

  if (
    req.method === "POST" &&
    pathname === "/login"
  ) {
    const body = await getBody(req);

    const email = String(body.email || "")
      .trim()
      .toLowerCase();

    if (!email) {
      return sendJSON(res, 400, {
        success: false,
        message: "Email wajib diisi."
      });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return sendJSON(res, 400, {
        success: false,
        message: "Format email tidak valid."
      });
    }

    const users = readUsers();

    let user = users.find(
      item =>
        String(item.email || "").toLowerCase() === email
    );

    const now = new Date().toISOString();

    if (!user) {
      user = {
        id: crypto.randomUUID(),
        email,
        country: "Indonesia",
        flag: "🇮🇩",

        plan: "FREE",
        planName: "FREE USER",

        dailyLimit: 50,
        dailyUsage: 0,
        remaining: 50,

        lastReset: todayWIB(),

        createdAt: now,
        lastLogin: now,

        vipActivatedAt: null
      };

      users.push(user);
    } else {
      resetDaily(user);

      user.lastLogin = now;
      user.country = "Indonesia";
      user.flag = "🇮🇩";
    }

    const saved = saveUsers(users);

    if (!saved) {
      return sendJSON(res, 500, {
        success: false,
        message: "Database gagal disimpan."
      });
    }

    setCookie(res, "dk_email", user.email);

    return sendJSON(res, 200, {
      success: true,
      message: "Login berhasil.",
      user
    });
  }

  /* =======================================================
     CURRENT USER
  ======================================================= */

  if (
    req.method === "GET" &&
    pathname === "/current-user"
  ) {
    const user = getCurrentUser(req);

    if (!user) {
      return sendJSON(res, 401, {
        success: false,
        message: "Belum login."
      });
    }

    return sendJSON(res, 200, {
      success: true,
      user
    });
  }

  /* =======================================================
     USE TOOL
  ======================================================= */

  if (
    req.method === "POST" &&
    pathname === "/use-tool"
  ) {
    const user = getCurrentUser(req);

    if (!user) {
      return sendJSON(res, 401, {
        success: false,
        message: "Silakan login terlebih dahulu."
      });
    }

    const users = readUsers();

    const index = users.findIndex(
      item => item.id === user.id
    );

    if (index === -1) {
      return sendJSON(res, 401, {
        success: false,
        message: "User tidak ditemukan."
      });
    }

    const current = users[index];

    resetDaily(current);

    if (
      Number(current.dailyUsage) >=
      Number(current.dailyLimit)
    ) {
      saveUsers(users);

      return sendJSON(res, 429, {
        success: false,
        message: "Limit penggunaan hari ini sudah habis.",
        user: current
      });
    }

    current.dailyUsage =
      Number(current.dailyUsage || 0) + 1;

    current.remaining = Math.max(
      0,
      Number(current.dailyLimit) -
      Number(current.dailyUsage)
    );

    saveUsers(users);

    return sendJSON(res, 200, {
      success: true,
      user: current
    });
  }

  /* =======================================================
     LOGOUT
  ======================================================= */

  if (
    req.method === "GET" &&
    pathname === "/logout"
  ) {
    clearCookie(res, "dk_email");

    return sendJSON(res, 200, {
      success: true,
      message: "Logout berhasil."
    });
  }

  /* =======================================================
     STATUS
  ======================================================= */

  if (
    req.method === "GET" &&
    pathname === "/status"
  ) {
    return sendJSON(res, 200, {
      success: true,
      status: "Dikzz Tools Online",
      database: "Connected"
    });
  }

  /* =======================================================
     STATIC
  ======================================================= */

  if (req.method === "GET") {
    return serveFile(req, res, pathname);
  }

  return sendJSON(res, 404, {
    success: false,
    message: "Endpoint tidak ditemukan."
  });
});

server.listen(PORT, "0.0.0.0", () => {
  console.log("");
  console.log("====================================");
  console.log("       DIKZZ TOOLS ONLINE");
  console.log("====================================");
  console.log(`http://127.0.0.1:${PORT}/`);
  console.log(`http://localhost:${PORT}/`);
  console.log("Database : data/users.json");
  console.log("====================================");
  console.log("");
});