// HTTPS server for the store screenshots: sends the mock X page (x.html) for
// every path. The browser maps x.com to this server (see screenshots.md), so the
// extension's content script runs on it like on the real site.
//
//   bun store/tools/serve.ts   (port 8443; makes a self-signed cert in .cert/)

const dir = import.meta.dir;
const cert = `${dir}/.cert/cert.pem`;
const key = `${dir}/.cert/key.pem`;

if (!(await Bun.file(cert).exists())) {
  await Bun.$`mkdir -p ${dir}/.cert`;
  await Bun.$`openssl req -x509 -newkey rsa:2048 -nodes -days 30 -subj /CN=x.com -keyout ${key} -out ${cert}`.quiet();
}

Bun.serve({
  port: 8443,
  tls: { cert: Bun.file(cert), key: Bun.file(key) },
  fetch(req) {
    if (new URL(req.url).pathname === "/favicon.ico") return new Response(null, { status: 204 });
    return new Response(Bun.file(`${dir}/x.html`), { headers: { "content-type": "text/html; charset=utf-8" } });
  },
});

console.log("Mock x.com on https://127.0.0.1:8443");
