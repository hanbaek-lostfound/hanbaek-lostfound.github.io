// 한백 분실물 서비스워커 — 앱 화면은 캐시해서 빨리 열고, 글·사진 데이터는 항상 서버에서
// 앱 파일을 고치면 아래 버전 숫자를 올리세요 (lf-v2 → lf-v3 ...)
const CACHE = "lf-v2";
const SHELL = ["./", "./index.html", "./manifest.webmanifest", "./icon-192.png", "./icon-512.png", "./apple-touch-icon.png", "./favicon-32.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)));
});
// 앱에서 '새 버전 적용' 신호가 오면 바로 교체
self.addEventListener("message", e => { if (e.data && e.data.type === "SKIP_WAITING") self.skipWaiting(); });
self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith("lf-") && k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});
self.addEventListener("fetch", e => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET" || url.origin !== self.location.origin) return; // Firebase·Worker·폰트는 건드리지 않음
  // 우리 파일: 항상 서버에서 최신인지 확인하고, 인터넷이 없으면 저장본으로
  e.respondWith(
    fetch(new Request(e.request, { cache: "no-cache" }))
      .then(res => { if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); } return res; })
      .catch(() => caches.match(e.request, { ignoreSearch: true }).then(r => r || caches.match("./index.html")))
  );
});
