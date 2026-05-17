const CACHE_NAME = "tokodefana-v1";

const urlsToCache = [
  "/",
  "/index.html",
  "/manifest.json"
];

// INSTALL
self.addEventListener("install", event => {

  event.waitUntil(

    caches.open(CACHE_NAME)
    .then(cache => {
      return cache.addAll(urlsToCache);
    })

  );

});

// FETCH
self.addEventListener("fetch", event => {

  event.respondWith(

    caches.match(event.request)
    .then(response => {

      return response || fetch(event.request);

    })

  );

});
