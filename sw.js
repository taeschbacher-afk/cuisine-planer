// Cuisine Planner : usage sans réseau. Change VERSION à chaque mise à jour pour vider l'ancien cache.
var VERSION = "cp-v1";
var CORE = ["./", "index.html", "manifest.webmanifest", "recettes-bibliotheque.json",
  "icons/apple-touch-icon.png", "icons/icon-192.png", "icons/icon-512.png"];
self.addEventListener("install", function(e){
  e.waitUntil(caches.open(VERSION).then(function(c){ return c.addAll(CORE); }).then(function(){ return self.skipWaiting(); }));
});
self.addEventListener("activate", function(e){
  e.waitUntil(caches.keys().then(function(keys){
    return Promise.all(keys.filter(function(k){ return k!==VERSION; }).map(function(k){ return caches.delete(k); }));
  }).then(function(){ return self.clients.claim(); }));
});
self.addEventListener("fetch", function(e){
  var req = e.request;
  if(req.method!=="GET") return;
  var url = new URL(req.url);
  if(/openfoodfacts\.org$/.test(url.hostname)) return; // recherche de produit : toujours en direct
  if(url.origin===location.origin){
    // Fichiers de l'appli : le réseau d'abord (mises à jour), le cache sinon (hors ligne).
    e.respondWith(fetch(req).then(function(res){
      if(res && res.ok){ var copy = res.clone(); caches.open(VERSION).then(function(c){ c.put(req, copy); }); }
      return res;
    }).catch(function(){
      return caches.match(req).then(function(hit){ return hit || caches.match("index.html"); });
    }));
    return;
  }
  if(/(^|\.)cdnjs\.cloudflare\.com$|(^|\.)fonts\.googleapis\.com$|(^|\.)fonts\.gstatic\.com$/.test(url.hostname)){
    // Modules et polices : le cache d'abord, gardés après le premier chargement.
    e.respondWith(caches.match(req).then(function(hit){
      return hit || fetch(req).then(function(res){
        if(res && (res.ok || res.type==="opaque")){ var copy = res.clone(); caches.open(VERSION).then(function(c){ c.put(req, copy); }); }
        return res;
      }).catch(function(){ return Response.error(); });
    }));
  }
});
