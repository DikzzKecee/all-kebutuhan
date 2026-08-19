import http from "http";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;


/* =========================================================
   DATABASE
========================================================= */

const DATA_DIR = path.join(__dirname, "data");
const USERS_FILE = path.join(DATA_DIR, "users.json");

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, {
    recursive: true
  });
}

if (!fs.existsSync(USERS_FILE)) {
  fs.writeFileSync(
    USERS_FILE,
    "[]",
    "utf8"
  );
}


/* =========================================================
   DATABASE FUNCTIONS
========================================================= */

function readUsers() {

  try {

    const raw = fs.readFileSync(
      USERS_FILE,
      "utf8"
    );

    const users = JSON.parse(raw);

    if (!Array.isArray(users)) {
      return [];
    }

    return users;

  } catch (error) {

    console.error(
      "Gagal membaca database:",
      error.message
    );

    return [];
  }
}


function saveUsers(users) {

  try {

    fs.writeFileSync(
      USERS_FILE,
      JSON.stringify(
        users,
        null,
        2
      ),
      "utf8"
    );

    return true;

  } catch (error) {

    console.error(
      "Gagal menyimpan database:",
      error.message
    );

    return false;
  }
}


/* =========================================================
   WIB
========================================================= */

function todayWIB() {

  return new Intl.DateTimeFormat(
    "en-CA",
    {
      timeZone: "Asia/Jakarta",
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    }
  ).format(new Date());

}


/* =========================================================
   RESET DAILY
========================================================= */

function resetUserIfNeeded(user) {

  const today = todayWIB();

  if (user.lastReset !== today) {

    user.dailyUsage = 0;

    user.dailyLimit =
      Number(
        user.dailyLimit || 50
      );

    user.remaining =
      user.dailyLimit;

    user.lastReset =
      today;

    return true;
  }

  return false;
}


/* =========================================================
   COOKIE
========================================================= */

function parseCookies(req) {

  const cookies = {};

  const header =
    req.headers.cookie;

  if (!header) {
    return cookies;
  }

  header
    .split(";")
    .forEach(part => {

      const index =
        part.indexOf("=");

      if (index === -1) {
        return;
      }

      const key =
        part
          .slice(0, index)
          .trim();

      const value =
        part
          .slice(index + 1)
          .trim();

      try {

        cookies[key] =
          decodeURIComponent(
            value
          );

      } catch {

        cookies[key] =
          value;
      }

    });

  return cookies;
}


function setLoginCookie(
  res,
  email
) {

  res.setHeader(
    "Set-Cookie",
    `dk_email=${encodeURIComponent(
      email
    )}; Path=/; SameSite=Lax`
  );

}


function clearLoginCookie(res) {

  res.setHeader(
    "Set-Cookie",
    "dk_email=; Path=/; Max-Age=0; SameSite=Lax"
  );

}


/* =========================================================
   JSON RESPONSE
========================================================= */

function sendJSON(
  res,
  status,
  data,
  extraHeaders = {}
) {

  const body =
    JSON.stringify(data);

  res.writeHead(
    status,
    {
      "Content-Type":
        "application/json; charset=utf-8",

      "Cache-Control":
        "no-store",

      ...extraHeaders
    }
  );

  res.end(body);
}


/* =========================================================
   REQUEST BODY
========================================================= */

function getRequestBody(req) {

  return new Promise(
    (resolve, reject) => {

      let body = "";

      req.on(
        "data",
        chunk => {

          body += chunk;

          if (
            body.length >
            1024 * 1024
          ) {

            reject(
              new Error(
                "Request terlalu besar."
              )
            );

            req.destroy();
          }

        }
      );

      req.on(
        "end",
        () => {

          if (!body) {

            resolve({});

            return;
          }

          try {

            resolve(
              JSON.parse(body)
            );

          } catch {

            reject(
              new Error(
                "JSON tidak valid."
              )
            );

          }

        }
      );

      req.on(
        "error",
        reject
      );

    }
  );
}


/* =========================================================
   STATIC FILE
========================================================= */

function getContentType(
  filePath
) {

  const ext =
    path.extname(
      filePath
    ).toLowerCase();

  const types = {

    ".html":
      "text/html; charset=utf-8",

    ".css":
      "text/css; charset=utf-8",

    ".js":
      "application/javascript; charset=utf-8",

    ".json":
      "application/json; charset=utf-8",

    ".png":
      "image/png",

    ".jpg":
      "image/jpeg",

    ".jpeg":
      "image/jpeg",

    ".webp":
      "image/webp",

    ".gif":
      "image/gif",

    ".svg":
      "image/svg+xml",

    ".ico":
      "image/x-icon"

  };

  return (
    types[ext] ||
    "application/octet-stream"
  );
}


function sendFile(
  res,
  filePath
) {

  if (
    !fs.existsSync(filePath)
  ) {

    sendJSON(
      res,
      404,
      {
        success: false,
        message:
          "File tidak ditemukan."
      }
    );

    return;
  }

  try {

    const data =
      fs.readFileSync(
        filePath
      );

    res.writeHead(
      200,
      {
        "Content-Type":
          getContentType(
            filePath
          )
      }
    );

    res.end(data);

  } catch (error) {

    sendJSON(
      res,
      500,
      {
        success: false,
        message:
          "Gagal membaca file."
      }
    );

  }
}


/* =========================================================
   SERVER
========================================================= */

const server =
  http.createServer(
    async (req, res) => {

      const url =
        new URL(
          req.url,
          `http://${req.headers.host}`
        );


      /* =====================================================
         LOGIN
      ===================================================== */

      if (
        req.method === "POST" &&
        url.pathname === "/api/login"
      ) {

        try {

          const body =
            await getRequestBody(req);

          const email =
            String(
              body.email || ""
            )
              .trim()
              .toLowerCase();


          if (!email) {

            return sendJSON(
              res,
              400,
              {
                success: false,
                message:
                  "Email wajib diisi."
              }
            );

          }


          if (
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/
              .test(email)
          ) {

            return sendJSON(
              res,
              400,
              {
                success: false,
                message:
                  "Format email tidak valid."
              }
            );

          }


          const users =
            readUsers();


          let user =
            users.find(
              item =>
                String(
                  item.email || ""
                ).toLowerCase() ===
                email
            );


          /* ===============================================
             USER BARU
          =============================================== */

          if (!user) {

            user = {

              id:
                `user_${Date.now()}_${crypto
                  .randomBytes(4)
                  .toString("hex")}`,

              email:

                email,

              plan:

                "FREE",

              planName:

                "FREE USER",

              dailyLimit:

                50,

              dailyUsage:

                0,

              remaining:

                50,

              lastReset:

                todayWIB(),

              createdAt:

                new Date()
                  .toISOString(),

              lastLogin:

                new Date()
                  .toISOString()

            };


            users.push(
              user
            );

          }


          /* ===============================================
             USER LAMA
          =============================================== */

          else {

            resetUserIfNeeded(
              user
            );

            user.lastLogin =
              new Date()
                .toISOString();

          }


          /* ===============================================
             SAVE
          =============================================== */

          const saved =
            saveUsers(
              users
            );


          if (!saved) {

            return sendJSON(
              res,
              500,
              {
                success: false,
                message:
                  "Database gagal disimpan."
              }
            );

          }


          /* ===============================================
             COOKIE + JSON
          =============================================== */

          setLoginCookie(
            res,
            user.email
          );


          return sendJSON(
            res,
            200,
            {
              success: true,
              message:
                "Login berhasil.",
              user
            },
            {
              "Set-Cookie":
                `dk_email=${encodeURIComponent(
                  user.email
                )}; Path=/; SameSite=Lax`
            }
          );

        } catch (error) {

          console.error(
            "LOGIN ERROR:",
            error
          );

          return sendJSON(
            res,
            500,
            {
              success: false,
              message:
                "Terjadi kesalahan pada server."
            }
          );

        }
      }


      /* =====================================================
         CURRENT USER
      ===================================================== */

      if (
        req.method === "GET" &&
        url.pathname === "/api/current-user"
      ) {

        const cookies =
          parseCookies(req);

        const email =
          cookies.dk_email;


        if (!email) {

          return sendJSON(
            res,
            401,
            {
              success: false,
              message:
                "Belum login."
            }
          );

        }


        const users =
          readUsers();


        const user =
          users.find(
            item =>
              String(
                item.email || ""
              ).toLowerCase() ===
              String(
                email
              ).toLowerCase()
          );


        if (!user) {

          clearLoginCookie(
            res
          );

          return sendJSON(
            res,
            401,
            {
              success: false,
              message:
                "User tidak ditemukan."
            }
          );

        }


        if (
          resetUserIfNeeded(
            user
          )
        ) {

          saveUsers(
            users
          );

        }


        return sendJSON(
          res,
          200,
          {
            success: true,
            user
          }
        );

      }


      /* =====================================================
         USE TOOL
      ===================================================== */

      if (
        req.method === "POST" &&
        url.pathname === "/api/use-tool"
      ) {

        const cookies =
          parseCookies(req);

        const email =
          cookies.dk_email;


        if (!email) {

          return sendJSON(
            res,
            401,
            {
              success: false,
              message:
                "Silakan login terlebih dahulu."
            }
          );

        }


        const users =
          readUsers();


        const user =
          users.find(
            item =>
              String(
                item.email || ""
              ).toLowerCase() ===
              String(
                email
              ).toLowerCase()
          );


        if (!user) {

          return sendJSON(
            res,
            401,
            {
              success: false,
              message:
                "User tidak ditemukan."
            }
          );

        }


        resetUserIfNeeded(
          user
        );


        const limit =
          Number(
            user.dailyLimit || 50
          );


        const usage =
          Number(
            user.dailyUsage || 0
          );


        if (
          usage >= limit
        ) {

          saveUsers(
            users
          );

          return sendJSON(
            res,
            429,
            {
              success: false,
              message:
                "Limit penggunaan hari ini sudah habis.",
              user
            }
          );

        }


        user.dailyUsage =
          usage + 1;


        user.remaining =
          Math.max(
            0,
            limit -
            user.dailyUsage
          );


        saveUsers(
          users
        );


        return sendJSON(
          res,
          200,
          {
            success: true,
            user
          }
        );

      }


      /* =====================================================
         LOGOUT
      ===================================================== */

      if (
        req.method === "GET" &&
        url.pathname === "/api/logout"
      ) {

        return sendJSON(
          res,
          200,
          {
            success: true,
            message:
              "Logout berhasil."
          },
          {
            "Set-Cookie":
              "dk_email=; Path=/; Max-Age=0; SameSite=Lax"
          }
        );

      }


      /* =====================================================
         STATUS
      ===================================================== */

      if (
        req.method === "GET" &&
        url.pathname === "/api/status"
      ) {

        return sendJSON(
          res,
          200,
          {
            success: true,
            status:
              "Dikzz Tools Online",
            database:
              "Connected"
          }
        );

      }


      /* =====================================================
         STATIC FILES
      ===================================================== */

      let requestedPath =
        decodeURIComponent(
          url.pathname
        );


      if (
        requestedPath === "/"
      ) {

        requestedPath =
          "/index.html";

      }


      requestedPath =
        requestedPath
          .replace(
            /^\/+/,
            ""
          );


      const filePath =
        path.join(
          __dirname,
          requestedPath
        );


      const normalized =
        path.normalize(
          filePath
        );


      if (
        !normalized.startsWith(
          __dirname
        )
      ) {

        return sendJSON(
          res,
          403,
          {
            success: false,
            message:
              "Forbidden."
          }
        );

      }


      return sendFile(
        res,
        normalized
      );

    }
  );


/* =========================================================
   START SERVER
========================================================= */

server.listen(
  PORT,
  "0.0.0.0",
  () => {

    console.log("");
    console.log(
      "===================================="
    );

    console.log(
      "       DIKZZ TOOLS ONLINE"
    );

    console.log(
      "===================================="
    );

    console.log(
      `http://127.0.0.1:${PORT}/`
    );

    console.log(
      `http://localhost:${PORT}/`
    );

    console.log(
      "Database : data/users.json"
    );

    console.log(
      "Login    : index.html"
    );

    console.log(
      "Express  : OFF"
    );

    console.log(
      "===================================="
    );

    console.log("");

  }
);