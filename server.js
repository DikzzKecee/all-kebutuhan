import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

const usersFile = path.join(
  __dirname,
  "assets",
  "data",
  "users.json"
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Pastikan folder data tersedia
const dataDir = path.dirname(usersFile);

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Pastikan users.json tersedia
if (!fs.existsSync(usersFile)) {
  fs.writeFileSync(usersFile, "[]", "utf8");
}

// Static website
app.use(express.static(__dirname));

// Login
app.post("/api/login", (req, res) => {
  try {
    const email = String(req.body.email || "")
      .trim()
      .toLowerCase();

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email wajib diisi."
      });
    }

    if (!email.includes("@")) {
      return res.status(400).json({
        success: false,
        message: "Format email tidak valid."
      });
    }

    let users = [];

    try {
      users = JSON.parse(
        fs.readFileSync(usersFile, "utf8")
      );
    } catch {
      users = [];
    }

    let user = users.find(
      item => item.email === email
    );

    if (!user) {
      user = {
        id: Date.now().toString(),
        email,
        plan: "free",
        dailyLimit: 50,
        usedToday: 0,
        lastLogin: new Date().toISOString(),
        createdAt: new Date().toISOString()
      };

      users.push(user);
    } else {
      user.lastLogin = new Date().toISOString();
    }

    fs.writeFileSync(
      usersFile,
      JSON.stringify(users, null, 2),
      "utf8"
    );

    res.json({
      success: true,
      user
    });

  } catch (error) {
    console.error("LOGIN ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Terjadi kesalahan server."
    });
  }
});

// Ambil data user
app.get("/api/user", (req, res) => {
  try {
    const email = String(req.query.email || "")
      .trim()
      .toLowerCase();

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email tidak ditemukan."
      });
    }

    const users = JSON.parse(
      fs.readFileSync(usersFile, "utf8")
    );

    const user = users.find(
      item => item.email === email
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User tidak ditemukan."
      });
    }

    res.json({
      success: true,
      user
    });

  } catch (error) {
    console.error("USER ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Server error."
    });
  }
});

// Health check
app.get("/api/status", (req, res) => {
  res.json({
    success: true,
    message: "Server aktif.",
    time: new Date().toISOString()
  });
});

// Jalankan server
app.listen(PORT, "0.0.0.0", () => {
  console.log("");
  console.log("=================================");
  console.log("       WEB KEBUTUHAN SERVER");
  console.log("=================================");
  console.log(`Server aktif di:`);
  console.log(`http://localhost:${PORT}`);
  console.log("");
});