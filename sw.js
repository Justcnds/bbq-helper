// 烧烤联机助手 Service Worker - 离线缓存支持
const CACHE_NAME = 'bbq-helper-v8';
const ASSETS_TO_CACHE = [
    '/',
    '/index.html',
    '/app.js',
    '/style.css',
    '/icon-512.png',
    '/manifest.json',
    '/sounds/new_order.mp3',
    '/sounds/complete.mp3'
];

// 安装时缓存核心资源
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('[SW] 缓存核心资源...');
            return cache.addAll(ASSETS_TO_CACHE);
        })
    );
    self.skipWaiting();
});

// 激活时清除旧缓存
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.filter(name => name !== CACHE_NAME)
                          .map(name => caches.delete(name))
            );
        })
    );
    self.clients.claim();
});

// 网络优先策略：优先尝试网络请求，失败则使用缓存
self.addEventListener('fetch', (event) => {
    // 跳过非 GET 请求和外部 CDN 请求
    if (event.request.method !== 'GET') return;
    
    const url = new URL(event.request.url);
    
    // 外部资源（如 MQTT CDN）不走缓存，直接网络请求
    if (url.origin !== self.location.origin) return;
    
    event.respondWith(
        fetch(event.request)
            .then((response) => {
                // 网络请求成功，更新缓存
                const clone = response.clone();
                caches.open(CACHE_NAME).then(cache => {
                    cache.put(event.request, clone);
                });
                return response;
            })
            .catch(() => {
                // 网络不可用，尝试从缓存返回
                return caches.match(event.request);
            })
    );
});
