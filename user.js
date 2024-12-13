const express = require("express");
const bodyParser = require("body-parser");
const mysql = require("mysql2");

const app = express();
app.use(bodyParser.json());

// MySQL
const db = mysql.createConnection({
  host: "localhost",
  user: "root", 
  password: "",
  database: "userdb",
});

// koneksi
db.connect((err) => {
  if (err) {
    console.error("Koneksi ke database gagal:", err);
    process.exit(1);
  }
  console.log("Koneksi ke database berhasil!");
});

// Endpoint REGIST
app.post("/regist", (req, res) => {
  const { username, email, password, confirmPassword } = req.body;

  // Validasi
  const validationMessages = [];
  if (!username || username.length < 5 || username.length > 10) {
    validationMessages.push({ message: "Username harus antara 5-10 karakter" });
  }
  if (!email || !email.endsWith("@gmail.com")) {
    validationMessages.push({ message: "Gmail tidak valid" });
  }
  if (
    !password ||
    password.length < 5 ||
    password.length > 10 ||
    !/[A-Z]/.test(password) ||
    !/[!@#$%^&*]/.test(password)
  ) {
    validationMessages.push({
      message: "Password harus 5-10 karakter, mengandung simbol, dan huruf besar",
    });
  }
  if (password !== confirmPassword) {
    validationMessages.push({
      message: "Password tidak match dengan konfirmasi password",
    });
  }

  // validasi gagal
  if (validationMessages.length > 0) {
    return res.status(400).json({ validationMessages });
  }

  // Periksa username 
  db.query("SELECT * FROM users WHERE username = ?", [username], (err, results) => {
    if (err) throw err;
    if (results.length > 0) {
      return res.status(400).json({
        validationMessages: [{ message: "Username sudah digunakan" }],
      });
    }

    // Simpan ke database
    db.query(
      "INSERT INTO users (username, email, password) VALUES (?, ?, ?)",
      [username, email, password],
      (err) => {
        if (err) throw err;
        res.status(200).json({ message: "Berhasil Regist" });
      }
    );
  });
});

// Endpoint LOGIN
app.post("/login", (req, res) => {
  const { email, password } = req.body;

  // Validasi
  if (!email || !email.endsWith("@gmail.com")) {
    return res.status(400).json({
      validationMessages: [{ message: "Gmail tidak valid" }],
    });
  }

  // Periksa di database
  db.query("SELECT * FROM users WHERE email = ?", [email], (err, results) => {
    if (err) throw err;

    if (results.length === 0) {
      return res.status(400).json({
        validationMessages: [{ message: "Email tidak ditemukan" }],
      });
    }

    const user = results[0];
    if (user.password !== password) {
      return res.status(400).json({
        validationMessages: [{ message: "Password salah" }],
      });
    }

    res.status(200).json({ message: "Berhasil Login" });
  });
});

// server
app.listen(3000, () => {
  console.log("Server berjalan di http://localhost:3000");
});
