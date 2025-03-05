const express = require("express");
const { createProxyMiddleware } = require("http-proxy-middleware");
const https = require("https");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 8443;
const BACKEND_URL = process.env.BACKEND_URL || "http://127.0.0.1:5000";

// SSL 인증서 로드
const CERT_PATH = path.join(__dirname, "cert.pem");
const KEY_PATH = path.join(__dirname, "key.pem");

if (!fs.existsSync(CERT_PATH) || !fs.existsSync(KEY_PATH)) {
  console.error("🚨 SSL 인증서 파일이 없습니다. 서버를 실행할 수 없습니다.");
  process.exit(1);
}

// CORS 설정
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  next();
});

// API 요청 프록시 전달
app.use(
  "/api",
  createProxyMiddleware({
    target: BACKEND_URL,
    changeOrigin: true,
    logLevel: "warn",
    pathRewrite: { "^/api": "/api" },
    onError: (err, req, res) => {
      console.error(`❌ Proxy Error: ${err.message}`);
      res.status(500).json({ error: "서버 연결 실패" });
    }
  })
);

// 정적 파일 제공 (index.html 실행)
app.use(express.static(__dirname));

// 루트 요청 처리
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// HTTPS 서버 실행
https.createServer(
  {
    key: fs.readFileSync(KEY_PATH),
    cert: fs.readFileSync(CERT_PATH)
  },
  app
).listen(PORT, () => {
  console.log(`✅ 서버 실행: https://localhost:${PORT}`);
});
