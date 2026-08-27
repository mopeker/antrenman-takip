const CACHE_NAME='antrenman-cache-7.2.1';
const APP_SHELL=['./index.html','./styles.css','./enhancements.css','./ux-v63.css','./v7.css','./v7-video.css','./navy-theme.css','./v7-clean-mobile.css','./app.js','./program-patch.js','./enhancements.js','./ux-v63.js','./program-v64.js','./v7.js','./v7-guard.js','./v7-video.js','./v7-b-triceps.js','./v7-program-v72.js','./manifest.json','./icon-192.png','./icon-512.png','./apple-touch-icon.png'];

self.addEventListener('install',event=>{
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache=>
      Promise.all(APP_SHELL.map(url=>cache.add(url).catch(()=>null)))
    )
  );
});

self.addEventListener('activate',event=>event.waitUntil(
  caches.keys()
    .then(keys=>Promise.all(keys.filter(key=>key!==CACHE_NAME).map(key=>caches.delete(key))))
    .then(()=>self.clients.claim())
));

self.addEventListener('message',event=>{
  if(event.data?.type==='SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET') return;

  if(event.request.mode==='navigate'){
    event.respondWith(
      fetch(event.request,{cache:'no-store'})
        .then(response=>{
          const copy=response.clone();
          caches.open(CACHE_NAME).then(cache=>cache.put('./index.html',copy));
          return response;
        })
        .catch(()=>caches.match('./index.html'))
    );
    return;
  }

  event.respondWith(
    fetch(event.request,{cache:'no-store'})
      .then(response=>{
        const copy=response.clone();
        caches.open(CACHE_NAME).then(cache=>cache.put(event.request,copy));
        return response;
      })
      .catch(()=>caches.match(event.request))
  );
});
