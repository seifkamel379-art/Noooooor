#!/usr/bin/env node
// Lightweight reverse proxy: port 19382 → port 5000
import http from "http";

const TARGET_PORT = 5000;
const PROXY_PORT = 19382;

const server = http.createServer((req, res) => {
  const options = {
    hostname: "127.0.0.1",
    port: TARGET_PORT,
    path: req.url,
    method: req.method,
    headers: { ...req.headers, host: `localhost:${TARGET_PORT}` },
  };

  const proxy = http.request(options, (proxyRes) => {
    res.writeHead(proxyRes.statusCode, proxyRes.headers);
    proxyRes.pipe(res, { end: true });
  });

  proxy.on("error", (err) => {
    console.error("Proxy error:", err.message);
    res.writeHead(502);
    res.end("Bad Gateway");
  });

  req.pipe(proxy, { end: true });
});

server.listen(PROXY_PORT, "0.0.0.0", () => {
  console.log(`Proxy running: port ${PROXY_PORT} → port ${TARGET_PORT}`);
});
