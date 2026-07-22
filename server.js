const http = require('http');
const fs = require('fs');
const path = require('path');
const WebSocket = require('ws');

const PORT = 8080;
const PUBLIC_DIR = path.join(__dirname);

// HTTP 静态资源服务（完全本地，不需要互联网）
const server = http.createServer((req, res) => {
    // 过滤掉查询参数，如 ?v=10
    let urlPath = req.url.split('?')[0];
    let filePath = path.join(PUBLIC_DIR, urlPath === '/' ? 'index.html' : urlPath);
    
    // 简单的 MIME 类型映射
    const ext = path.extname(filePath);
    let contentType = 'text/html';
    if (ext === '.js') contentType = 'text/javascript';
    else if (ext === '.css') contentType = 'text/css';
    else if (ext === '.png') contentType = 'image/png';
    else if (ext === '.jpg') contentType = 'image/jpeg';
    else if (ext === '.ico') contentType = 'image/x-icon';

    fs.readFile(filePath, (err, content) => {
        if (err) {
            res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
            res.end('页面未找到');
        } else {
            res.writeHead(200, { 
                'Content-Type': contentType,
                'Access-Control-Allow-Origin': '*'
            });
            res.end(content, 'utf-8');
        }
    });
});

// WebSocket 局域网/本地联机同步服务
const wss = new WebSocket.Server({ server });
const rooms = {}; // 房间数据结构: { roomId: [ws1, ws2, ...] }

wss.on('connection', (ws) => {
    let currentRoom = null;
    
    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message.toString());
            
            // 设备申请创建/加入房间
            if (data.type === 'JOIN_ROOM') {
                // 如果已在其他房间，先退出
                if (currentRoom && rooms[currentRoom]) {
                    rooms[currentRoom] = rooms[currentRoom].filter(client => client !== ws);
                }
                
                currentRoom = data.roomId;
                if (!rooms[currentRoom]) {
                    rooms[currentRoom] = [];
                }
                rooms[currentRoom].push(ws);
                console.log(`[房间消息] 设备加入房间: ${currentRoom}, 房间人数: ${rooms[currentRoom].length}`);
                
                // 确认加入房间成功
                ws.send(JSON.stringify({
                    type: 'JOINED',
                    roomId: currentRoom
                }));
                return;
            }
            
            // 房间内广播消息（转发给同房间的其他所有客户端）
            if (currentRoom && rooms[currentRoom]) {
                rooms[currentRoom].forEach(client => {
                    if (client !== ws && client.readyState === WebSocket.OPEN) {
                        client.send(JSON.stringify(data));
                    }
                });
            }
        } catch(e) {
            console.error('[WS服务] 处理消息出错', e);
        }
    });
    
    ws.on('close', () => {
        if (currentRoom && rooms[currentRoom]) {
            rooms[currentRoom] = rooms[currentRoom].filter(client => client !== ws);
            console.log(`[房间消息] 设备退出房间: ${currentRoom}, 房间剩余人数: ${rooms[currentRoom].length}`);
        }
    });
});

server.listen(PORT, '0.0.0.0', () => {
    console.log('==================================================');
    console.log(`🔥 烧烤联机服务已成功在局域网启动！`);
    console.log(`👉 电脑浏览器访问: http://localhost:${PORT}`);
    console.log(`👉 同Wi-Fi下手机访问地址, 请查阅终端顶部显示的局域网 IP`);
    console.log('==================================================');
});
