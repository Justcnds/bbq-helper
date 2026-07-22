// 烧烤联机助手 Service Worker - 清理旧缓存并支持网络实时更新
self.addEventListener('install', (event) => {
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(cacheNames.map(name => caches.delete(name)));
        })
    );
    self.clients.claim();
});

// 直接实时请求网络，不拦截本地资源缓存
self.addEventListener('fetch', (event) => {
    return;
});
