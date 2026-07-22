// 全局错误捕获，方便手机端调试
window.onerror = function(message, source, lineno, colno, error) {
    alert("出错了: " + message + "\n在: " + source + "\n行号: " + lineno);
    return false;
};

// 烧烤联机助手 Core JS

// --- 默认配置数据 ---
const DEFAULT_DISHES = [
    // 手工类
    { name: '手工牛肉', price: 6.0 },
    { name: '手工羊肉', price: 6.0 },
    { name: '手工青提牛肉', price: 7.0 },
    { name: '手工彩椒牛肉', price: 7.0 },
    { name: '东北大油边', price: 16.0 },
    { name: '手工大鸡爪', price: 12.0 },
    { name: '手工大鸡腿', price: 12.0 },
    { name: '手工五花肉', price: 5.0 },
    { name: '大羊排', price: 28.0 },
    { name: '手工鸡翅', price: 12.0 },

    // 海鲜类
    { name: '蒜蓉大生蚝', price: 10.0 },
    { name: '蒜蓉扇贝', price: 7.0 },
    { name: '秋刀鱼', price: 10.0 },
    { name: '大鱿鱼', price: 12.0 },
    { name: '鱿鱼须', price: 8.0 },
    { name: '三文鱼头', price: 15.0 },
    { name: '鳗鱼', price: 9.0 },

    // 素菜类
    { name: '口蘑虾滑', price: 6.0 },
    { name: '蒜蓉香菇', price: 4.0 },
    { name: '西葫芦', price: 4.0 },
    { name: '娃娃菜', price: 3.0 },
    { name: '金针菇', price: 3.0 },
    { name: '青椒虾滑', price: 5.0 },
    { name: '蒜苔', price: 3.0 },
    { name: '黄瓜', price: 3.0 },
    { name: '黄朴', price: 3.0 },
    { name: '光饼', price: 3.0 },
    { name: '年糕', price: 3.0 },
    { name: '面筋', price: 3.0 },
    { name: '秋葵', price: 4.0 },
    { name: '韭菜', price: 3.0 },
    { name: '花菜', price: 3.0 },

    // 肉类
    { name: '奥尔良鸡翅中', price: 9.0 },
    { name: '骨肉相连', price: 4.0 },
    { name: '猪蹄', price: 22.0 },
    { name: '羊腰', price: 12.0 },
    { name: '热狗', price: 4.0 },
    { name: '花枝丸', price: 5.0 },

    // 小把串类
    { name: '30小串牛肉风味把串', price: 15.0 },
    { name: '20小串羊肉风味把串', price: 15.0 },
    { name: '5小串多春鱼把串', price: 12.0 },
    { name: '10小串鸭胗把串', price: 15.0 },
    { name: '30小串鸭肠把串', price: 15.0 },
    { name: '10小串玉米把串', price: 10.0 },
    { name: '10小串鱿鱼须把串', price: 12.0 }
];
const DEFAULT_TAGS = [
    '男', '女',
    '青年', '中年', '老年', '小孩',
    '戴眼镜', '戴帽子',
    '红衣', '黑衣', '蓝衣', '白衣', '绿衣', '黄衣', '灰衣',
    '红裤', '黑裤', '蓝裤', '白裤', '绿裤', '黄裤', '灰裤'
];

// --- 应用状态声明 ---
let state = {
    roomId: '', // 默认未加入房间
    orders: [], // 正在烤 the orders
    history: [], // 今日已完成订单
    dishes: [...DEFAULT_DISHES],
    tags: [...DEFAULT_TAGS],
    audioEnabled: true,
    ttsDetailEnabled: true,
    lastOrderNum: 0 // 当天最后一个订单的序号
};

// MQTT 公网/跨网客户端变量
let mqttClient = null;
const myClientId = 'bbq_client_' + Math.random().toString(16).substring(2, 10);

// --- 汉字拼音首字母字典与超强模糊搜索引擎 ---
const PINYIN_MAP = {
    '手': { p: 'shou', i: 's' }, '工': { p: 'gong', i: 'g' }, '羊': { p: 'yang', i: 'y' }, '肉': { p: 'rou', i: 'r' },
    '把': { p: 'ba', i: 'b' }, '串': { p: 'chuan', i: 'c' }, '牛': { p: 'niu', i: 'n' }, '猪': { p: 'zhu', i: 'z' },
    '鸡': { p: 'ji', i: 'j' }, '翅': { p: 'chi', i: 'c' }, '爪': { p: 'zhua', i: 'z' }, '掌': { p: 'zhang', i: 'z' },
    '中': { p: 'zhong', i: 'z' }, '宝': { p: 'bao', i: 'b' }, '心': { p: 'xin', i: 'x' }, '管': { p: 'guan', i: 'g' },
    '胗': { p: 'zhen', i: 'z' }, '皮': { p: 'pi', i: 'p' }, '腰': { p: 'yao', i: 'y' }, '骨': { p: 'gu', i: 'g' },
    '排': { p: 'pai', i: 'p' }, '五': { p: 'wu', i: 'w' }, '花': { p: 'hua', i: 'h' }, '鸭': { p: 'ya', i: 'y' },
    '肠': { p: 'chang', i: 'c' }, '舌': { p: 'she', i: 's' }, '脆': { p: 'cui', i: 'c' }, '海': { p: 'hai', i: 'h' },
    '鲜': { p: 'xian', i: 'x' }, '生': { p: 'sheng', i: 's' }, '蚝': { p: 'hao', i: 'h' }, '扇': { p: 'shan', i: 's' },
    '贝': { p: 'bei', i: 'b' }, '鱿': { p: 'you', i: 'y' }, '鱼': { p: 'yu', i: 'y' }, '虾': { p: 'xia', i: 'x' },
    '蟹': { p: 'xie', i: 'x' }, '棒': { p: 'bang', i: 'b' }, '甲': { p: 'jia', i: 'j' }, '菜': { p: 'cai', i: 'c' },
    '茄': { p: 'qie', i: 'q' }, '子': { p: 'zi', i: 'z' }, '韭': { p: 'jiu', i: 'j' }, '土': { p: 'tu', i: 't' },
    '豆': { p: 'dou', i: 'd' }, '金': { p: 'jin', i: 'j' }, '针': { p: 'zhen', i: 'z' }, '菇': { p: 'gu', i: 'g' },
    '香': { p: 'xiang', i: 'x' }, '角': { p: 'jiao', i: 'j' }, '黄': { p: 'huang', i: 'h' }, '瓜': { p: 'gua', i: 'g' },
    '毛': { p: 'mao', i: 'm' }, '生': { p: 'sheng', i: 's' }, '馒': { p: 'man', i: 'm' }, '头': { p: 'tou', i: 't' },
    '吐': { p: 'tu', i: 't' }, '司': { p: 'si', i: 's' }, '年': { p: 'nian', i: 'n' }, '糕': { p: 'gao', i: 'g' },
    '面': { p: 'mian', i: 'm' }, '筋': { p: 'jin', i: 'j' }, '腐': { p: 'fu', i: 'f' }, '干': { p: 'gan', i: 'g' },
    '竹': { p: 'zhu', i: 'z' }, '签': { p: 'qian', i: 'q' }, '小': { p: 'xiao', i: 'x' }, '大': { p: 'da', i: 'd' },
    '特': { p: 'te', i: 't' }, '辣': { p: 'la', i: 'l' }, '麻': { p: 'ma', i: 'm' }, '酱': { p: 'jiang', i: 'j' },
    '烤': { p: 'kao', i: 'k' }, '爆': { p: 'bao', i: 'b' }, '炒': { p: 'chao', i: 'c' }, '炸': { p: 'zha', i: 'z' },
    '蒸': { p: 'zheng', i: 'z' }, '煮': { p: 'zhu', i: 'z' }, '红': { p: 'hong', i: 'h' }, '绿': { p: 'lv', i: 'l' },
    '青': { p: 'qing', i: 'q' }, '白': { p: 'bai', i: 'b' }, '黑': { p: 'hei', i: 'h' }, '米': { p: 'mi', i: 'm' },
    '饭': { p: 'fan', i: 'f' }, '粉': { p: 'fen', i: 'f' }, '汤': { p: 'tang', i: 't' }, '水': { p: 'shui', i: 's' },
    '可': { p: 'ke', i: 'k' }, '乐': { p: 'le', i: 'l' }, '雪': { p: 'xue', i: 'x' }, '碧': { p: 'bi', i: 'b' },
    '酒': { p: 'jiu', i: 'j' }, '啤': { p: 'pi', i: 'p' }, '王': { p: 'wang', i: 'w' }, '老': { p: 'lao', i: 'l' },
    '新': { p: 'xin', i: 'x' }, '全': { p: 'quan', i: 'q' }, '腿': { p: 'tui', i: 't' }, '蛋': { p: 'dan', i: 'd' },
    '鹌': { p: 'an', i: 'a' }, '鹑': { p: 'chun', i: 'c' }, '须': { p: 'xu', i: 'x' }, '螺': { p: 'luo', i: 'l' },
    '蛳': { p: 'si', i: 's' }, '藕': { p: 'ou', i: 'o' }, '片': { p: 'pian', i: 'p' }, '提': { p: 'ti', i: 't' },
    '朴': { p: 'pu', i: 'p' }, '滑': { p: 'hua', i: 'h' }, '枝': { p: 'zhi', i: 'z' }, '春': { p: 'chun', i: 'c' },
    '光': { p: 'guang', i: 'g' }, '北': { p: 'bei', i: 'b' }, '东': { p: 'dong', i: 'd' }, '彩': { p: 'cai', i: 'c' },
    '椒': { p: 'jiao', i: 'j' }, '油': { p: 'you', i: 'y' }, '边': { p: 'bian', i: 'b' }, '蒜': { p: 'suan', i: 's' },
    '蓉': { p: 'rong', i: 'r' }, '秋': { p: 'qiu', i: 'q' }, '刀': { p: 'dao', i: 'd' }, '三': { p: 'san', i: 's' },
    '文': { p: 'wen', i: 'w' }, '鳗': { p: 'man', i: 'm' }, '口': { p: 'kou', i: 'k' }, '蘑': { p: 'mo', i: 'm' },
    '西': { p: 'xi', i: 'x' }, '葫': { p: 'hu', i: 'h' }, '芦': { p: 'lu', i: 'l' }, '娃': { p: 'wa', i: 'w' },
    '苔': { p: 'tai', i: 't' }, '饼': { p: 'bing', i: 'b' }, '葵': { p: 'kui', i: 'k' }, '奥': { p: 'ao', i: 'a' },
    '尔': { p: 'er', i: 'e' }, '良': { p: 'liang', i: 'l' }, '连': { p: 'lian', i: 'l' }, '蹄': { p: 'ti', i: 't' },
    '热': { p: 're', i: 'r' }, '狗': { p: 'gou', i: 'g' }, '丸': { p: 'wan', i: 'w' }, '风': { p: 'feng', i: 'f' },
    '味': { p: 'wei', i: 'w' }, '多': { p: 'duo', i: 'd' }, '玉': { p: 'yu', i: 'y' }, '相': { p: 'xiang', i: 'x' }
};

const BOUNDARIES = [
    ['啊', 'a'], ['芭', 'b'], ['擦', 'c'], ['搭', 'd'], ['蛾', 'e'], ['发', 'f'],
    ['噶', 'g'], ['哈', 'h'], ['击', 'j'], ['喀', 'k'], ['垃', 'l'], ['妈', 'm'],
    ['拿', 'n'], ['噢', 'o'], ['趴', 'p'], ['期', 'q'], ['然', 'r'], ['撒', 's'],
    ['塌', 't'], ['挖', 'w'], ['昔', 'x'], ['压', 'y'], ['匝', 'z']
];

function getChineseInitialByBoundary(ch) {
    if (!ch) return '';
    if (/^[a-zA-Z0-9]$/.test(ch)) return ch.toLowerCase();
    for (let i = BOUNDARIES.length - 1; i >= 0; i--) {
        if (ch.localeCompare(BOUNDARIES[i][0], 'zh-Hans-CN') >= 0) {
            return BOUNDARIES[i][1];
        }
    }
    return '';
}

function getCharPinyinInfo(ch) {
    if (PINYIN_MAP[ch]) return PINYIN_MAP[ch];
    if (/^[a-zA-Z0-9]$/.test(ch)) return { p: ch.toLowerCase(), i: ch.toLowerCase() };
    
    // 全量通用汉字拼音首字母自动计算算法（覆盖未来任意添加的新菜品）
    const initial = getChineseInitialByBoundary(ch);
    if (initial) {
        return { p: initial, i: initial };
    }
    return { p: '', i: '' };
}

function matchDishSearch(dishName, query) {
    if (!query) return true;
    const q = query.trim().toLowerCase();
    if (!q) return true;
    
    // 1. 汉字直接包含匹配 (例 "牛肉" 匹配 "牛肉把串")
    if (dishName.toLowerCase().includes(q)) return true;
    
    const chars = dishName.split('');
    const pinyins = [];
    const initials = [];
    
    for (const ch of chars) {
        const info = getCharPinyinInfo(ch);
        if (info.p) {
            pinyins.push(info.p);
            initials.push(info.i);
        }
    }
    
    const initialsStr = initials.join('');
    const fullPinyinStr = pinyins.join('');
    
    // 2. 首字母字串包含匹配 (例 "rbc" 在 "yrbc" 里)
    if (initialsStr.includes(q)) return true;
    
    // 3. 全拼字串包含匹配 (例 "rouba" 在 "yangroubachuan" 里)
    if (fullPinyinStr.includes(q)) return true;
    
    // 4. 首字母按顺序子序列匹配 (例 "yrc" 依次匹配 "yrbc" 里的 y, r, c)
    let initialIdx = 0;
    let matchedInitials = true;
    for (let i = 0; i < q.length; i++) {
        const char = q[i];
        const foundPos = initialsStr.indexOf(char, initialIdx);
        if (foundPos !== -1) {
            initialIdx = foundPos + 1;
        } else {
            matchedInitials = false;
            break;
        }
    }
    if (matchedInitials) return true;
    
    // 5. 拼音前缀连续匹配 (例 "yanrou" -> "yang" 的前缀 "yan" + "rou" 的前缀 "rou")
    let qRest = q;
    let matchPinyinPrefix = true;
    let pIdx = 0;
    while (qRest.length > 0 && pIdx < pinyins.length) {
        let matchedOne = false;
        for (let i = pIdx; i < pinyins.length; i++) {
            const py = pinyins[i];
            for (let len = Math.min(qRest.length, py.length); len >= 1; len--) {
                const sub = qRest.substring(0, len);
                if (py.startsWith(sub)) {
                    qRest = qRest.substring(len);
                    pIdx = i + 1;
                    matchedOne = true;
                    break;
                }
            }
            if (matchedOne) break;
        }
        if (!matchedOne) {
            matchPinyinPrefix = false;
            break;
        }
    }
    if (matchPinyinPrefix && qRest.length === 0) return true;
    
    return false;
}

// --- 声音合成 (Web Audio API) ---
// 现场合成清脆的“叮咚”声，无需加载外部音频文件
// 1. 新订单来了：播放高品质 macOS 经典双音门铃提示音 (已打包在本地 /sounds 目录下)
function playNewOrderSound() {
    if (!state.audioEnabled) return;
    try {
        const audio = new Audio('sounds/new_order.mp3');
        audio.volume = 0.6;
        audio.play().catch(err => {
            console.warn('播放本地新订单音效失败:', err);
        });
    } catch (e) {
        console.error('播放新订单音效出错', e);
    }
}

// 2. 已拿走/已完成：播放真实经典收银机 Ka-Ching 金币碰撞到账音效 (已打包在本地 /sounds 目录下)
function playCompleteSound() {
    if (!state.audioEnabled) return;
    try {
        const audio = new Audio('sounds/complete.mp3');
        audio.volume = 0.65;
        audio.play().catch(err => {
            console.warn('播放本地收银音效失败:', err);
        });
    } catch (e) {
        console.error('播放收银音效出错', e);
    }
}

// 3. 取消订单：“轻柔下行音” (G5 -> Eb5 -> C5 下降小和弦，代表撤销)
function playCancelSound() {
    if (!state.audioEnabled) return;
    try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return;
        const ctx = new AudioContext();
        const now = ctx.currentTime;
        
        const notes = [783.99, 622.25, 523.25]; // G5, Eb5, C5
        notes.forEach((freq, idx) => {
            const time = now + idx * 0.08;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, time);
            
            gain.gain.setValueAtTime(0, time);
            gain.gain.linearRampToValueAtTime(0.1, time + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.001, time + 0.3);
            
            osc.connect(gain);
            gain.connect(ctx.destination);
            
            osc.start(time);
            osc.stop(time + 0.35);
        });
    } catch (e) {
        console.error('播放取消音效失败', e);
    }
}

// 语音合成播报 (Web Speech API)
function speakText(text) {
    if (!state.audioEnabled) return;
    try {
        // 先取消当前播报，防止叠音
        window.speechSynthesis.cancel();
        
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'zh-CN';
        utterance.rate = 0.95; // 稍微慢一点更清晰
        utterance.pitch = 1.0;
        window.speechSynthesis.speak(utterance);
    } catch(e) {
        console.warn('语音合成失败:', e);
    }
}

// 组合播报语句：叮咚音效 + “X号新订单：1号桌，xxx几份 xxx几份”
function announceOrder(order) {
    if (!state.audioEnabled) return;
    
    // 播放新订单提示音
    playNewOrderSound();
    
    // 延迟 450 毫秒开始朗读，防声音叠加模糊
    setTimeout(() => {
        const tableStr = order.tableNum || (order.tags && order.tags[0]) || '1号桌';
        let text = `${order.num}号新订单：${tableStr}，`;
        const dishesList = [];
        for (const [dishName, qty] of Object.entries(order.items)) {
            const cleanName = dishName.split('-')[0];
            dishesList.push(`${cleanName}${qty}份`);
        }
        if (dishesList.length > 0) {
            text += dishesList.join('，') + `。`;
        }
        speakText(text);
    }, 450);
}

// 订单完成播报语句：金币音效 + “X号订单已完成，到账X元”
function announceComplete(order) {
    if (!state.audioEnabled) return;
    
    // 播放金币落袋音效
    playCompleteSound();
    
    // 计算订单总额
    let orderTotal = 0;
    for (const [name, qty] of Object.entries(order.items)) {
        orderTotal += getDishPrice(name) * qty;
    }
    
    // 延迟 400 毫秒开始朗读
    setTimeout(() => {
        const amtStr = orderTotal.toFixed(0);
        speakText(`${order.num}号订单已完成，到账${amtStr}元`);
    }, 400);
}

// --- 数据持久化 (LocalStorage & 云数据库 KVdb) ---
const KVDB_BUCKET = '6AmmXpbfzNK5u9QhwM4sCi';

function saveToLocalStorage() {
    localStorage.setItem('bbq_helper_state', JSON.stringify(state));
    saveToCloud(); // 自动备份至云端数据库
}

function saveToCloud() {
    if (!state.roomId) return;
    const url = `https://kvdb.io/${KVDB_BUCKET}/bbq_room_${state.roomId}`;
    const payload = {
        orders: state.orders,
        history: state.history,
        dishes: state.dishes,
        tags: state.tags,
        lastOrderNum: state.lastOrderNum
    };
    
    fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    })
    .then(res => {
        if (!res.ok) throw new Error('Network response not ok');
        console.log('云数据库备份成功！');
    })
    .catch(err => console.warn('同步至云端数据库失败:', err));
}

function loadFromCloud() {
    if (!state.roomId) return Promise.resolve(false);
    const url = `https://kvdb.io/${KVDB_BUCKET}/bbq_room_${state.roomId}`;
    
    return fetch(url)
        .then(res => {
            if (!res.ok) {
                if (res.status === 404) return null;
                throw new Error('Load error');
            }
            return res.json();
        })
        .then(data => {
            if (data) {
                state.orders = data.orders || [];
                state.history = data.history || [];
                state.dishes = data.dishes || [...DEFAULT_DISHES];
                state.tags = data.tags || [...DEFAULT_TAGS];
                state.lastOrderNum = data.lastOrderNum || 0;
                
                // 保存并刷新
                localStorage.setItem('bbq_helper_state', JSON.stringify(state));
                renderGrillingList();
                renderHistoryList();
                renderSettingsEditor();
                console.log('成功从云端数据库拉取并更新数据！');
                return true;
            }
            return false;
        })
        .catch(err => {
            console.warn('读取云数据库失败，使用本地缓存:', err);
            return false;
        });
}

function toggleRoomOverlay() {
    const overlay = document.getElementById('room-welcome-overlay');
    const quickOrderBtn = document.getElementById('btn-quick-order-trigger');
    
    if (!state.roomId) {
        // 未加入房间状态
        if (overlay) overlay.style.display = 'flex';
        if (quickOrderBtn) {
            quickOrderBtn.classList.add('disabled');
            quickOrderBtn.style.opacity = '0.5';
            quickOrderBtn.title = '请先加入或创建房间！';
        }
        const roomDisplay = document.getElementById('header-room-display');
        if (roomDisplay) roomDisplay.textContent = '未加入房间';
        const statusBadge = document.getElementById('connection-status');
        if (statusBadge) {
            statusBadge.className = 'status-badge disconnected';
            statusBadge.textContent = '未联机';
        }
    } else {
        // 已加入房间状态
        if (overlay) overlay.style.display = 'none';
        if (quickOrderBtn) {
            quickOrderBtn.classList.remove('disabled');
            quickOrderBtn.style.opacity = '1';
            quickOrderBtn.title = '';
        }
    }
}

function loadFromLocalStorage() {
    const data = localStorage.getItem('bbq_helper_state');
    if (data) {
        try {
            const parsed = JSON.parse(data);
            state = { ...state, ...parsed };
            // 如果检测到旧版的字符串菜单格式，或者包含旧默认菜单里的“五花肉”，自动重置为新菜单和特征标签
            if (state.dishes && (state.dishes.includes('五花肉') || (state.dishes.length > 0 && typeof state.dishes[0] === 'string'))) {
                state.dishes = [...DEFAULT_DISHES];
                state.tags = [...DEFAULT_TAGS];
            }
            // 确保安全
            if (!state.dishes || state.dishes.length === 0) state.dishes = [...DEFAULT_DISHES];
            if (!state.tags || state.tags.length === 0) state.tags = [...DEFAULT_TAGS];
        } catch (e) {
            console.error('加载本地存储失败，使用默认配置', e);
        }
    }
    // 检查并展现首屏遮罩
    setTimeout(toggleRoomOverlay, 10);
    // 从云端数据库拉取最新数据覆盖本地，确保跨设备彻底一致
    if (state.roomId) {
        setTimeout(loadFromCloud, 20);
    }
}

// --- 公网/跨网 MQTT 联机连接与同步 ---
let reconnectTimer = null;

function connectMQTT() {
    if (!state.roomId) {
        console.log('未设定房间号，不建立连接。');
        toggleRoomOverlay();
        return;
    }

    const statusBadge = document.getElementById('connection-status');
    if (statusBadge) {
        statusBadge.className = 'status-badge disconnected';
        statusBadge.textContent = '连接中...';
    }
    
    // 如果有旧连接，先强制断开
    if (mqttClient) {
        try { mqttClient.end(true); } catch(e) {}
    }
    
    if (typeof mqtt === 'undefined') {
        console.warn('MQTT 库未加载，进入单机模式');
        if (statusBadge) {
            statusBadge.className = 'status-badge disconnected';
            statusBadge.textContent = '单机模式';
        }
        const roomDisplay = document.getElementById('header-room-display');
        if (roomDisplay) roomDisplay.textContent = '未联机 (无网络)';
        return;
    }

    // 统一采用国内连接最稳定、延迟最低的 EMQX 公网高速服务器
    const brokerUrl = 'wss://broker.emqx.io:8084/mqtt';
    console.log('正在连接 EMQX 公网服务器:', brokerUrl, '房间:', state.roomId);
    
    const options = {
        keepalive: 60,
        clientId: myClientId,
        protocolVersion: 4,
        clean: true,
        reconnectPeriod: 0, // 禁用自带重连，由我们逻辑控制
        connectTimeout: 8 * 1000,
    };
    
    try {
        mqttClient = mqtt.connect(brokerUrl, options);
    } catch(err) {
        console.error('MQTT 初始化失败', err);
        if (statusBadge) {
            statusBadge.className = 'status-badge disconnected';
            statusBadge.textContent = '单机模式';
        }
        return;
    }
    
    const topic = `bbq/helper/rooms/${state.roomId}`;
    
    mqttClient.on('connect', () => {
        console.log('公网连接成功，当前服务器:', brokerUrl);
        if (reconnectTimer) {
            clearTimeout(reconnectTimer);
            reconnectTimer = null;
        }
        if (statusBadge) {
            statusBadge.className = 'status-badge connected';
            statusBadge.textContent = '已联机 ✓';
        }
        const roomDisplay = document.getElementById('header-room-display');
        if (roomDisplay) roomDisplay.textContent = '房间: ' + state.roomId;
        
        // 订阅房间频道
        mqttClient.subscribe(topic, { qos: 1 }, (err) => {
            if (!err) {
                console.log('已订阅公网房间频道:', topic);
                broadcastMsg({ type: 'REQ_SYNC' });
            } else {
                console.error('订阅频道失败', err);
            }
        });
    });
    
    mqttClient.on('message', (receivedTopic, message) => {
        if (receivedTopic !== topic) return;
        
        try {
            const data = JSON.parse(message.toString());
            handleSyncMessage(data);
        } catch(e) {
            console.error('解析消息失败', e);
        }
    });
    
    mqttClient.on('error', (err) => {
        console.error('MQTT 连接出错:', brokerUrl, err);
        if (statusBadge) {
            statusBadge.className = 'status-badge disconnected';
            statusBadge.textContent = '连接错误';
        }
    });
    
    mqttClient.on('close', () => {
        console.log('MQTT 连接已断开，正在尝试重连:', brokerUrl);
        if (statusBadge) {
            statusBadge.className = 'status-badge disconnected';
            statusBadge.textContent = '已断开';
        }
        const roomDisplay = document.getElementById('header-room-display');
        if (roomDisplay) roomDisplay.textContent = '未联机 (重连中)';
        
        if (!reconnectTimer) {
            reconnectTimer = setTimeout(() => {
                reconnectTimer = null;
                console.log('重连同一个公网服务器:', brokerUrl);
                connectMQTT();
            }, 3000); // 3秒后使用相同服务器重连
        }
    });
}

function broadcastMsg(msg, retain = false) {
    if (!mqttClient || !mqttClient.connected) {
        console.log('未联机，消息仅限本地处理');
        return false;
    }
    msg.senderId = myClientId; // 附带发送者ID，防止自己接收并重复处理
    const topic = `bbq/helper/rooms/${state.roomId}`;
    mqttClient.publish(topic, JSON.stringify(msg), { qos: 1, retain: retain });
    return true;
}

// 接收广播消息的处理
function handleSyncMessage(msg) {
    // 过滤自己发送的消息，避免自己覆盖自己或陷入无限循环
    if (msg && msg.senderId === myClientId) {
        return;
    }
    console.log('收到同步消息:', msg);
    
    switch(msg.type) {
        case 'REQ_SYNC':
            // 收到其他设备的同步请求，全量广播当前最新状态
            broadcastMsg({
                type: 'SYNC_STATE',
                orders: state.orders,
                lastOrderNum: state.lastOrderNum,
                dishes: state.dishes,
                tags: state.tags
            }, true);
            break;
            
        case 'SYNC_STATE':
            // 收到其他设备的最新状态
            if (msg.dishes && msg.dishes.length > 0) state.dishes = msg.dishes;
            if (msg.tags && msg.tags.length > 0) state.tags = msg.tags;
            if (msg.orders && msg.orders.length > 0) state.orders = msg.orders;
            if (msg.lastOrderNum !== undefined) state.lastOrderNum = msg.lastOrderNum;
            saveToLocalStorage();
            renderGrillingList();
            renderSettingsEditor();
            renderQuickDishesGrid();
            break;
            
        case 'UPDATE_STATE':
            if (msg.state) {
                if (msg.state.dishes) state.dishes = msg.state.dishes;
                if (msg.state.tags) state.tags = msg.state.tags;
                saveToLocalStorage();
                renderSettingsEditor();
                renderQuickDishesGrid();
            }
            break;
            
        case 'ADD_ORDER':
            // 收到新订单广播
            // 防止重复添加
            if (!state.orders.some(o => o.id === msg.order.id)) {
                state.orders.push(msg.order);
                state.lastOrderNum = Math.max(state.lastOrderNum, msg.order.num);
                saveToLocalStorage();
                renderGrillingList();
                // 播放声音提示
                announceOrder(msg.order);
            }
            break;
            
        case 'COMPLETE_ORDER':
            // 收到完成订单广播，将其移至本地历史
            const compIdx = state.orders.findIndex(o => o.id === msg.orderId);
            if (compIdx !== -1) {
                const order = state.orders.splice(compIdx, 1)[0];
                order.status = 'completed';
                // 播放完成订单音效与语音到账播报
                announceComplete(order);
                // 添加到历史（去重）
                if (!state.history.some(o => o.id === order.id)) {
                    state.history.unshift(order); // 最新的排在最前面
                    if (state.history.length > 100) state.history.pop();
                }
                saveToLocalStorage();
                renderGrillingList();
                renderHistoryList();
            }
            break;

        case 'DELETE_ORDER':
            // 收到删除订单广播
            const delIdx = state.orders.findIndex(o => o.id === msg.orderId);
            if (delIdx !== -1) {
                const order = state.orders.splice(delIdx, 1)[0];
                order.status = 'deleted';
                playCancelSound();
                if (!state.history.some(o => o.id === order.id)) {
                    state.history.unshift(order);
                    if (state.history.length > 100) state.history.pop();
                }
                saveToLocalStorage();
                renderGrillingList();
                renderHistoryList();
            }
            break;
    }
}

// --- DOM 渲染函数 ---

// 渲染“正在烤”列表
function renderGrillingList() {
    const listContainer = document.getElementById('grilling-list');
    const countBadge = document.getElementById('grilling-count');
    
    // 过滤当前营业日内的订单 (16:00 到次日 04:00 算同一天)
    const todayBizDay = getBBQBusinessDay(Date.now());
    const activeOrders = state.orders.filter(order => getBBQBusinessDay(order.timestamp) === todayBizDay);
    
    countBadge.textContent = activeOrders.length;
    
    if (activeOrders.length === 0) {
        listContainer.innerHTML = `
            <div class="empty-state">
                <p>🍢 目前没有正在烤的订单</p>
                <p class="sub-text">点击右上角“+ 快速下单”开始记录吧</p>
            </div>`;
        return;
    }
    
    listContainer.innerHTML = '';
    activeOrders.forEach(order => {
        const isPaid = !!order.isPaid;
        const card = document.createElement('div');
        card.className = `order-card grilling ${isPaid ? 'order-paid' : ''}`;
        card.setAttribute('ondblclick', `window.openModifyOrderModal('${order.id}')`);
        card.title = "双击可加酒水或修改菜品";
        
        // 格式化时间
        const timeStr = new Date(order.timestamp).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
        
        // 计算订单总价
        let orderTotal = 0;
        for (const [name, qty] of Object.entries(order.items)) {
            orderTotal += getDishPrice(name) * qty;
        }
        
        const tableStr = order.tableNum || (order.tags && order.tags[0]) || '1号桌';
        
        let remarkHtml = '';
        if (order.customTag) {
            remarkHtml = `
                <div class="order-remark-banner">
                    📌 备注: ${order.customTag}
                </div>
            `;
        }
        
        // 菜品明细
        let dishesHtml = '';
        for (const [name, qty] of Object.entries(order.items)) {
            dishesHtml += `
                <div class="dish-item">
                    <span class="dish-name">${name}</span>
                    <span class="dish-qty">${qty}</span>
                </div>`;
        }
        
        // 口味要求
        let reqsHtml = '';
        if (order.spicy) {
            reqsHtml += `<span class="spicy-badge spicy-${order.spicy}">${order.spicy}</span>`;
        }
        order.reqs.forEach(r => {
            reqsHtml += `<span class="req-badge">${r}</span>`;
        });
        
        const priceBadgeHtml = isPaid 
            ? `<span class="order-price-badge" style="background-color: #00e676; color: #000; font-weight: 900;">💰 已付款 ￥${orderTotal.toFixed(2)}</span>`
            : `<span class="order-price-badge">￥${orderTotal.toFixed(2)}</span>`;
            
        const footerHtml = isPaid
            ? `<div style="display: flex; justify-content: space-between; align-items: center; background: rgba(0, 230, 118, 0.12); padding: 8px 12px; border-radius: 8px; border: 1px solid rgba(0, 230, 118, 0.3);">
                <span style="color: #00e676; font-weight: bold; font-size: 0.9rem;">✅ 已付款 (双击卡片加酒水)</span>
                <button type="button" class="btn btn-secondary" onclick="event.stopPropagation(); window.openModifyOrderModal('${order.id}')" style="padding: 4px 10px; font-size: 0.8rem;">✏️ 改单加酒</button>
               </div>`
            : `<div class="slide-confirm-container" style="display: flex; align-items: center; justify-content: space-between; gap: 8px;">
                <button type="button" class="btn btn-secondary" onclick="event.stopPropagation(); window.openModifyOrderModal('${order.id}')" style="padding: 6px 10px; font-size: 0.8rem; flex-shrink: 0;" title="修改订单">✏️ 改单加酒</button>
                <div style="flex: 1; position: relative;">
                    <span class="slide-confirm-text">👉 右滑确认付款</span>
                    <input type="range" class="slide-confirm-range" min="0" max="100" value="0" onmousedown="handleSliderStart(event)" ontouchstart="handleSliderStart(event)" oninput="handleSlideConfirm(this, '${order.id}')" onchange="resetSlideConfirm(this)">
                </div>
               </div>`;
        
        card.innerHTML = `
            <!-- 右上角迷你取消订单按钮 -->
            <button class="mini-delete-btn" data-step="1" onclick="event.stopPropagation(); deleteOrderStep(this, '${order.id}')" title="取消订单">🗑️</button>
            
            <div class="order-card-header">
                <span class="order-num">#${order.num}</span>
                <span class="order-table-badge">${tableStr}</span>
                <span class="order-price-badge">￥${orderTotal.toFixed(2)}</span>
                <span class="order-time">
                    ${timeStr}
                    <strong class="elapsed-time-tag" data-timestamp="${order.timestamp}" style="font-size: 0.8rem; font-weight: bold; margin-left: 4px; color: var(--text-muted);">(等0秒)</strong>
                </span>
            </div>
            ${remarkHtml}
            <div class="order-card-body">
                <div class="order-card-info" style="width: 100%;">
                    <div class="order-dishes">
                        ${dishesHtml}
                    </div>
                    <div class="order-requirements">
                        ${reqsHtml}
                    </div>
                </div>
            </div>
            <div class="order-card-footer" style="padding-top: 4px;">
                <!-- 滑动确认条，防止误触 -->
                <div class="slide-confirm-container">
                    <span class="slide-confirm-text">👉 右滑确认拿走</span>
                    <input type="range" class="slide-confirm-range" min="0" max="100" value="0" onmousedown="handleSliderStart(event)" ontouchstart="handleSliderStart(event)" oninput="handleSlideConfirm(this, '${order.id}')" onchange="resetSlideConfirm(this)">
                </div>
            </div>
        `;
        
        listContainer.appendChild(card);
    });
    
    // 渲染完成后立刻更新一次等待时间
    setTimeout(updateAllElapsedTimes, 10);
}

// 获取烧烤营业日标示 (下午 16:00 到次日 04:00 算同一天)
function getBBQBusinessDay(timestamp) {
    const d = new Date(timestamp);
    const h = d.getHours();
    
    // 如果是 0:00 - 03:59 之间，归为前一天的营业日
    if (h < 4) {
        const prev = new Date(timestamp - 12 * 60 * 60 * 1000); // 减去12小时退回到前一天下午/晚上
        return prev.toLocaleDateString('zh-CN');
    } else {
        return d.toLocaleDateString('zh-CN');
    }
}

// 渲染“历史订单”列表
function renderHistoryList() {
    const listContainer = document.getElementById('history-list');
    const countBadge = document.getElementById('history-count');
    
    // 获取当前营业日的所有已完成订单
    const todayBizDay = getBBQBusinessDay(Date.now());
    const todayHistory = state.history.filter(order => getBBQBusinessDay(order.timestamp) === todayBizDay);
    
    countBadge.textContent = todayHistory.length;
    
    // 计算今日总营业额 (仅统计已完成，排除取消/删除)
    let totalRevenue = 0;
    todayHistory.forEach(order => {
        if (order.status !== 'deleted') {
            for (const [name, qty] of Object.entries(order.items)) {
                totalRevenue += getDishPrice(name) * qty;
            }
        }
    });
    
    // 更新今日营业额卡片金额
    const revDisplay = document.getElementById('today-revenue-display');
    if (revDisplay) {
        revDisplay.textContent = `￥${totalRevenue.toFixed(2)}`;
    }
    
    if (todayHistory.length === 0) {
        listContainer.innerHTML = `
            <div class="empty-state">
                <p>📦 今日暂无已完成的订单记录</p>
            </div>`;
        return;
    }
    
    listContainer.innerHTML = '';
    todayHistory.forEach(order => {
        const isDeleted = order.status === 'deleted';
        const card = document.createElement('div');
        card.className = 'order-card history-card' + (isDeleted ? ' deleted-card' : '');
        
        const timeStr = new Date(order.timestamp).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
        
        // 计算订单总价
        let orderTotal = 0;
        for (const [name, qty] of Object.entries(order.items)) {
            orderTotal += getDishPrice(name) * qty;
        }
        
        const tableStr = order.tableNum || (order.tags && order.tags[0]) || '1号桌';
        
        let remarkHtml = '';
        if (order.customTag) {
            remarkHtml = `
                <div class="order-remark-banner" style="${isDeleted ? 'opacity: 0.6;' : ''}">
                    📌 备注: ${order.customTag}
                </div>
            `;
        }
        
        let dishesHtml = '';
        for (const [name, qty] of Object.entries(order.items)) {
            dishesHtml += `
                <div class="dish-item">
                    <span class="dish-name">${name}</span>
                    <span class="dish-qty">${qty}</span>
                </div>`;
        }
        
        let reqsHtml = '';
        if (order.spicy) {
            reqsHtml += `<span class="spicy-badge spicy-${order.spicy}">${order.spicy}</span>`;
        }
        order.reqs.forEach(r => {
            reqsHtml += `<span class="req-badge">${r}</span>`;
        });
        
        card.innerHTML = `
            <div class="order-card-header">
                <span class="order-num" style="color: ${isDeleted ? '#ff1744' : 'var(--text-muted)'}">${isDeleted ? `🗑️ #${order.num} (已取消/删除)` : `#${order.num} (已完成)`}</span>
                <span class="order-table-badge">${tableStr}</span>
                <span class="order-price-badge" style="opacity: 0.7; ${isDeleted ? 'text-decoration: line-through;' : ''}">￥${orderTotal.toFixed(2)}</span>
                <span class="order-time">${timeStr}</span>
            </div>
            ${remarkHtml}
            <div class="order-card-body">
                <div class="order-card-info" style="width: 100%;">
                    <div class="order-dishes">
                        ${dishesHtml}
                    </div>
                    <div class="order-requirements">
                        ${reqsHtml}
                    </div>
                </div>
            </div>
        `;
        listContainer.appendChild(card);
    });
}

// 渲染设置面板中的菜品列表和标签列表
function renderSettingsEditor() {
    // 1. 菜品内联管理 (无需弹窗，在页面上直接点击文本框即可修改名字与价格)
    const dishContainer = document.getElementById('dish-list-edit');
    if (dishContainer) {
        dishContainer.innerHTML = '';
        state.dishes.forEach((dish, idx) => {
            const item = document.createElement('div');
            item.className = 'inline-dish-row';
            item.style.cssText = 'display: flex; align-items: center; gap: 8px; margin-bottom: 8px; background: rgba(255,255,255,0.04); padding: 8px 10px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.08);';
            
            const priceVal = typeof dish.price === 'number' ? dish.price : 0;
            item.innerHTML = `
                <span style="font-size: 0.85rem; color: var(--text-muted); width: 22px; text-align: right;">${idx + 1}.</span>
                <input type="text" value="${dish.name}" onchange="window.updateDishNameInline(${idx}, this.value)" class="search-input" style="flex: 2.2; padding: 8px 10px; font-size: 0.95rem; border-radius: 6px; border: 1.5px solid #444;" placeholder="菜品名称">
                <div style="display: flex; align-items: center; gap: 3px; flex: 1.3; min-width: 85px;">
                    <span style="color: #ffd600; font-weight: bold; font-size: 0.9rem;">￥</span>
                    <input type="number" step="0.5" value="${priceVal}" onchange="window.updateDishPriceInline(${idx}, this.value)" class="search-input" style="padding: 8px 6px; font-size: 0.95rem; border-radius: 6px; border: 1.5px solid #444; width: 100%;" placeholder="单价">
                </div>
                <button type="button" class="btn btn-danger" onclick="removeDish(${idx})" style="padding: 8px 10px; font-size: 0.8rem; border-radius: 6px; white-space: nowrap;" title="删除菜品">✕ 删除</button>
            `;
            dishContainer.appendChild(item);
        });
    }
    
    // 2. 特征标签管理
    const tagContainer = document.getElementById('tag-list-edit');
    if (tagContainer) {
        tagContainer.innerHTML = '';
        state.tags.forEach((tag, idx) => {
            const item = document.createElement('div');
            item.className = 'tag-edit-item';
            item.innerHTML = `
                <span>${tag}</span>
                <button class="btn-remove" onclick="removeTag(${idx})">&times;</button>
            `;
            tagContainer.appendChild(item);
        });
    }
}

// --- 下单弹窗中的动态界面生成与交互 ---
let selectedOrderTags = [];
let selectedOrderDishes = {}; // 格式: { '羊肉串': 10 }
let selectedSpicy = '不辣';
let selectedReqs = [];
let selectedDeliveryType = '送过去';
let selectedTableSide = '左侧';
let selectedTableNum = '1号桌';

const COLOR_STOPS = [
    { name: '红', rgb: [255, 23, 68] },
    { name: '黑', rgb: [30, 30, 30] },
    { name: '蓝', rgb: [41, 121, 255] },
    { name: '白', rgb: [255, 255, 255] },
    { name: '绿', rgb: [0, 230, 118] },
    { name: '黄', rgb: [255, 214, 0] },
    { name: '灰', rgb: [158, 158, 158] },
    { name: '紫', rgb: [213, 0, 249] },
    { name: '粉', rgb: [255, 64, 129] }
];

function getContinuousColor(value) {
    // 将 0-100 映射到 COLOR_STOPS 的索引区间 [0, length - 1]
    const val = (value / 100) * (COLOR_STOPS.length - 1);
    const idx = Math.floor(val);
    const idx2 = Math.ceil(val);
    const t = val - idx;
    
    // 线性混合 RGB
    const c1 = COLOR_STOPS[idx];
    const c2 = COLOR_STOPS[idx2];
    
    const r = Math.round(c1.rgb[0] * (1 - t) + c2.rgb[0] * t);
    const g = Math.round(c1.rgb[1] * (1 - t) + c2.rgb[1] * t);
    const b = Math.round(c1.rgb[2] * (1 - t) + c2.rgb[2] * t);
    
    // 获取最近的主色 stops 索引作为颜色名字
    const nearestIdx = Math.round(val);
    const name = COLOR_STOPS[nearestIdx].name;
    
    return {
        rgbStr: `rgb(${r}, ${g}, ${b})`,
        name: name
    };
}

function updateAvatarPreview() {
    // 1. 发型矢量渲染 (根据性别和年龄动态切换样式类)
    const hairEl = document.getElementById('char-hair');
    if (hairEl) {
        // 重置发型样式
        hairEl.className = 'avatar-hair-vector';
        
        const isFemale = selectedOrderTags.includes('女');
        const isKid = selectedOrderTags.includes('小孩');
        const isOld = selectedOrderTags.includes('老年');
        
        if (isKid) {
            hairEl.classList.add('hair-kid');
        } else if (isOld) {
            hairEl.classList.add('hair-old');
        } else if (isFemale) {
            hairEl.classList.add('hair-female');
        } else {
            hairEl.classList.add('hair-male');
        }
    }
    
    // 2. 头部配饰：眼镜和帽子
    const glassesEl = document.getElementById('char-glasses');
    if (glassesEl) {
        glassesEl.style.display = selectedOrderTags.includes('戴眼镜') ? 'flex' : 'none';
    }
    const hatEl = document.getElementById('char-hat');
    if (hatEl) {
        hatEl.style.display = selectedOrderTags.includes('戴帽子') ? 'flex' : 'none';
    }
    
    // 3. 衣服颜色滑块无极映射
    const shirtSlider = document.getElementById('slider-shirt');
    const bodyEl = document.getElementById('char-body');
    const valShirt = document.getElementById('val-shirt');
    if (shirtSlider && bodyEl) {
        const colorResult = getContinuousColor(parseInt(shirtSlider.value));
        bodyEl.style.backgroundColor = colorResult.rgbStr;
        if (valShirt) valShirt.textContent = colorResult.name + '衣';
    }
    
    // 4. 裤子颜色滑块无极映射
    const pantsSlider = document.getElementById('slider-pants');
    const legsEl = document.getElementById('char-legs');
    const valPants = document.getElementById('val-pants');
    if (pantsSlider && legsEl) {
        const colorResult = getContinuousColor(parseInt(pantsSlider.value));
        legsEl.style.backgroundColor = colorResult.rgbStr;
        if (valPants) valPants.textContent = colorResult.name + '裤';
    }
}

function renderMiniAvatar(tags) {
    if (!tags) return '';
    // 解析特征
    const isFemale = tags.includes('女');
    const isKid = tags.includes('小孩');
    const isOld = tags.includes('老年');
    const hasGlasses = tags.includes('戴眼镜');
    const hasHat = tags.includes('戴帽子');
    
    // 默认红衣蓝裤
    let shirtColor = '#ff1744';
    let pantsColor = '#2979ff';
    
    // 匹配衣色
    const shirtTag = tags.find(t => t.endsWith('衣'));
    if (shirtTag) {
        const name = shirtTag.replace('衣', '');
        const stop = COLOR_STOPS.find(s => s.name === name);
        if (stop) shirtColor = `rgb(${stop.rgb.join(',')})`;
    }
    
    // 匹配裤色
    const pantsTag = tags.find(t => t.endsWith('裤'));
    if (pantsTag) {
        const name = pantsTag.replace('裤', '');
        const stop = COLOR_STOPS.find(s => s.name === name);
        if (stop) pantsColor = `rgb(${stop.rgb.join(',')})`;
    }
    
    // 确定头发样式类
    let hairClass = 'hair-male';
    if (isKid) hairClass = 'hair-kid';
    else if (isOld) hairClass = 'hair-old';
    else if (isFemale) hairClass = 'hair-female';
    
    return `
        <div class="avatar-character mini-avatar">
            <div class="avatar-head-vector">
                ${hasHat ? `
                <div class="avatar-hat-vector">
                    <div class="hat-dome"></div>
                    <div class="hat-brim"></div>
                </div>` : ''}
                <div class="avatar-hair-vector ${hairClass}"></div>
                <div class="avatar-face-vector">
                    <div class="avatar-eye eye-left"></div>
                    <div class="avatar-eye eye-right"></div>
                    <div class="avatar-mouth-vector"></div>
                </div>
                ${hasGlasses ? `
                <div class="avatar-glasses-vector">
                    <div class="glass-rim rim-left"></div>
                    <div class="glass-bridge"></div>
                    <div class="glass-rim rim-right"></div>
                </div>` : ''}
            </div>
            <div class="avatar-body-vector" style="background-color: ${shirtColor}">
                <div class="collar"></div>
            </div>
            <div class="avatar-legs-vector" style="background-color: ${pantsColor}">
                <div class="belt"></div>
                <div class="leg-gap" style="background-color: var(--bg-card)"></div>
            </div>
        </div>
    `;
}

function initOrderModal() {
    selectedDeliveryType = '送过去';
    selectedTableNum = '1号桌';
    selectedOrderDishes = {};
    selectedSpicy = '不辣';
    selectedReqs = [];
    
    // 重置送餐/自提模式 (默认送过去排第1位)
    const deliveryDetailsPanel = document.getElementById('delivery-details-panel');
    if (deliveryDetailsPanel) deliveryDetailsPanel.style.display = 'block';
    
    document.querySelectorAll('.delivery-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.type === '送过去') btn.classList.add('active');
        
        btn.onclick = () => {
            document.querySelectorAll('.delivery-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            selectedDeliveryType = btn.dataset.type;
            if (selectedDeliveryType === '送过去') {
                if (deliveryDetailsPanel) deliveryDetailsPanel.style.display = 'block';
            } else {
                if (deliveryDetailsPanel) deliveryDetailsPanel.style.display = 'none';
            }
        };
    });
    
    // 重置桌号按钮 (1号桌 ~ 12号桌 + 店外)
    document.querySelectorAll('.table-num-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.num === '1号桌') btn.classList.add('active');
        
        btn.onclick = () => {
            document.querySelectorAll('.table-num-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            selectedTableNum = btn.dataset.num;
        };
    });
    
    // 重置输入框
    const searchInput = document.getElementById('input-dish-search');
    const customFeatureInput = document.getElementById('input-custom-feature');
    if (searchInput) searchInput.value = '';
    if (customFeatureInput) customFeatureInput.value = '';
    
    // 绑定拼音搜索框输入监听
    if (searchInput) {
        searchInput.oninput = (e) => {
            renderQuickDishesGrid(e.target.value);
        };
    }
    
    // 绑定一键清空搜索按钮
    const clearBtn = document.getElementById('btn-clear-search');
    if (clearBtn) {
        clearBtn.onclick = () => {
            if (searchInput) {
                searchInput.value = '';
                renderQuickDishesGrid('');
                searchInput.focus();
            }
        };
    }
    
    // 重置口味和附加要求的按钮激活状态
    document.querySelectorAll('.spicy-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.spicy === '不辣') btn.classList.add('active');
    });
    document.querySelectorAll('.req-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // 初始渲染菜品列表
    renderQuickDishesGrid('');
    
    // 初始化总价显示
    updateOrderTotalPrice();
}

// 根据搜索关键词（支持汉字全名/拼音首字母/拼音模糊字串）动态渲染菜品面板
function renderQuickDishesGrid(filterQuery = '') {
    const dishesContainer = document.getElementById('quick-dishes-container');
    if (!dishesContainer) return;
    dishesContainer.innerHTML = '';
    
    const filtered = state.dishes.filter(d => matchDishSearch(d.name, filterQuery));
    
    if (filtered.length === 0) {
        dishesContainer.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; color: var(--text-muted); padding: 25px 10px; font-size: 1rem;">
                🔍 没找到与 "${filterQuery}" 匹配的菜品
            </div>
        `;
        return;
    }
    
    filtered.forEach(dish => {
        const qty = selectedOrderDishes[dish.name] || 0;
        const card = document.createElement('div');
        card.className = 'dish-counter-card' + (qty > 0 ? ' active' : '');
        card.id = `dish-card-${dish.name}`;
        card.innerHTML = `
            <span class="dish-counter-name">${dish.name}</span>
            <span class="dish-counter-price">￥${dish.price.toFixed(1)}元</span>
            <div class="dish-counter-controls">
                <button type="button" class="btn-qty btn-qty-minus ${qty === 0 ? 'disabled' : ''}" onclick="changeDishQty('${dish.name}', -1)">-</button>
                <span class="dish-qty-val" id="qty-val-${dish.name}">${qty}</span>
                <button type="button" class="btn-qty btn-qty-plus" onclick="changeDishQty('${dish.name}', 1)">+</button>
            </div>
        `;
        dishesContainer.appendChild(card);
    });
}

// 确认付款完成
window.completeOrder = function(orderId) {
    const order = state.orders.find(o => o.id === orderId);
    if (order) {
        order.isPaid = true;
        order.status = 'completed';
        
        // 播放金币音效与到账播报
        announceComplete(order);
        
        // 写入历史记录 (去重)
        if (!state.history.some(o => o.id === order.id)) {
            state.history.unshift(order);
            if (state.history.length > 100) state.history.pop();
        }
        
        saveToLocalStorage();
        renderGrillingList();
        renderHistoryList();
        
        // 全端持久化广播
        broadcastMsg({
            type: 'SYNC_STATE',
            orders: state.orders,
            history: state.history,
            lastOrderNum: state.lastOrderNum,
            dishes: state.dishes,
            tags: state.tags
        }, true);
    }
};

// --- 双击修改订单与加菜酒水弹窗逻辑 (与点单拼音搜索/网格完全一致) ---
let editingOrderId = null;
let editingOrderItems = {};

window.openModifyOrderModal = function(orderId) {
    const order = state.orders.find(o => o.id === orderId);
    if (!order) return;
    editingOrderId = orderId;
    editingOrderItems = JSON.parse(JSON.stringify(order.items || {}));
    
    const titleEl = document.getElementById('modify-order-title');
    if (titleEl) titleEl.textContent = `✏️ 修改 #${order.num}号订单 (${order.tableNum || '1号桌'})`;
    
    const searchInput = document.getElementById('input-modify-dish-search');
    if (searchInput) {
        searchInput.value = '';
        searchInput.oninput = (e) => {
            renderModifyDishesGrid(e.target.value);
            const clearBtn = document.getElementById('btn-clear-modify-search');
            if (clearBtn) clearBtn.style.display = e.target.value ? 'block' : 'none';
        };
    }
    
    const remarkInput = document.getElementById('input-modify-order-remark');
    if (remarkInput) remarkInput.value = order.customTag || '';
    
    renderModifyDishesGrid('');
    
    const modal = document.getElementById('modify-order-modal');
    if (modal) {
        modal.style.display = 'flex';
        modal.style.zIndex = '999999';
    }
};

window.clearModifySearch = function() {
    const searchInput = document.getElementById('input-modify-dish-search');
    if (searchInput) {
        searchInput.value = '';
        renderModifyDishesGrid('');
        const clearBtn = document.getElementById('btn-clear-modify-search');
        if (clearBtn) clearBtn.style.display = 'none';
        searchInput.focus();
    }
};

window.closeModifyOrderModal = function() {
    const modal = document.getElementById('modify-order-modal');
    if (modal) modal.style.display = 'none';
    editingOrderId = null;
    editingOrderItems = {};
};

function renderModifyOrderItems() {
    const container = document.getElementById('modify-order-items-container');
    if (!container) return;
    container.innerHTML = '';
    
    let total = 0;
    const entries = Object.entries(editingOrderItems);
    if (entries.length === 0) {
        container.innerHTML = '<p style="color: var(--text-muted); font-size: 0.85rem;">暂无菜品或酒水</p>';
    } else {
        entries.forEach(([name, qty]) => {
            const unitPrice = getDishPrice(name);
            const itemTotal = unitPrice * qty;
            total += itemTotal;
            
            const row = document.createElement('div');
            row.style.cssText = 'display: flex; align-items: center; justify-content: space-between; background: rgba(255,255,255,0.05); padding: 8px 10px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.08);';
            row.innerHTML = `
                <div style="flex: 1;">
                    <span style="font-weight: bold; font-size: 0.95rem;">${name}</span>
                    <span style="font-size: 0.8rem; color: var(--text-muted); margin-left: 6px;">(￥${unitPrice}/份)</span>
                </div>
                <div style="display: flex; align-items: center; gap: 8px;">
                    <button type="button" class="btn btn-secondary" onclick="updateModifyItemQty('${name}', -1)" style="padding: 4px 10px; font-weight: bold;">-</button>
                    <span style="font-weight: bold; min-width: 20px; text-align: center; color: #ffd600;">${qty}</span>
                    <button type="button" class="btn btn-secondary" onclick="updateModifyItemQty('${name}', 1)" style="padding: 4px 10px; font-weight: bold;">+</button>
                </div>
            `;
            container.appendChild(row);
        });
    }
    
    const badge = document.getElementById('modify-order-total-badge');
    if (badge) badge.textContent = `合计: ￥${total.toFixed(2)}`;
}

window.updateModifyItemQty = function(name, change) {
    if (!editingOrderItems[name]) return;
    editingOrderItems[name] += change;
    if (editingOrderItems[name] <= 0) {
        delete editingOrderItems[name];
    }
    renderModifyOrderItems();
};

window.addExtraDrinkToModify = function(drinkName, price) {
    if (!state.dishes.some(d => d.name === drinkName)) {
        state.dishes.push({ name: drinkName, price: price });
    }
    editingOrderItems[drinkName] = (editingOrderItems[drinkName] || 0) + 1;
    renderModifyOrderItems();
};

window.addCustomExtraItemToModify = function() {
    const nameInput = document.getElementById('input-extra-item-name');
    const priceInput = document.getElementById('input-extra-item-price');
    const name = nameInput ? nameInput.value.trim() : '';
    const priceStr = priceInput ? priceInput.value.trim() : '';
    const price = parseFloat(priceStr) || 0;
    
    if (!name) {
        alert('请输入加菜/饮料名称！');
        return;
    }
    if (!state.dishes.some(d => d.name === name)) {
        state.dishes.push({ name: name, price: price });
    }
    editingOrderItems[name] = (editingOrderItems[name] || 0) + 1;
    if (nameInput) nameInput.value = '';
    if (priceInput) priceInput.value = '';
    renderModifyOrderItems();
};

window.saveModifiedOrder = function() {
    if (!editingOrderId) return;
    const order = state.orders.find(o => o.id === editingOrderId);
    if (!order) return;
    
    const remarkInput = document.getElementById('input-modify-order-remark');
    order.items = JSON.parse(JSON.stringify(editingOrderItems));
    order.customTag = remarkInput ? remarkInput.value.trim() : '';
    
    // 如果已经在历史记录里，也同步更新
    const histOrder = state.history.find(h => h.id === editingOrderId);
    if (histOrder) {
        histOrder.items = JSON.parse(JSON.stringify(editingOrderItems));
        histOrder.customTag = order.customTag;
    }
    
    saveToLocalStorage();
    broadcastMsg({
        type: 'SYNC_STATE',
        orders: state.orders,
        history: state.history,
        lastOrderNum: state.lastOrderNum,
        dishes: state.dishes,
        tags: state.tags
    }, true);
    
    renderGrillingList();
    renderHistoryList();
    closeModifyOrderModal();
    alert('订单已成功更新！实时消费金额已同步重新计算。');
};

// 价格计算助手函数
function getDishPrice(dishName) {
    if (state.dishes && state.dishes.length > 0) {
        const found = state.dishes.find(d => d && d.name === dishName);
        if (found) return typeof found.price === 'number' ? found.price : 0;
    }
    const match = String(dishName).match(/-([0-9.]+)$/);
    return match ? parseFloat(match[1]) : 0;
}

function updateOrderTotalPrice() {
    let total = 0;
    for (const [dishName, qty] of Object.entries(selectedOrderDishes)) {
        total += getDishPrice(dishName) * qty;
    }
    const el = document.getElementById('order-total-price');
    if (el) el.textContent = `合计: ￥${total.toFixed(2)}`;
}

// 增减快捷下单菜品份数
window.changeDishQty = function(dish, delta) {
    const currentQty = selectedOrderDishes[dish] || 0;
    let newQty = currentQty + delta;
    if (newQty < 0) newQty = 0;
    
    if (newQty === 0) {
        delete selectedOrderDishes[dish];
    } else {
        selectedOrderDishes[dish] = newQty;
    }
    
    // 重新渲染或局部更新卡片
    const card = document.getElementById(`dish-card-${dish}`);
    if (card) {
        const qtyValSpan = document.getElementById(`qty-val-${dish}`);
        const minusBtn = card.querySelector('.btn-qty-minus');
        if (newQty === 0) {
            card.classList.remove('active');
            if (minusBtn) minusBtn.classList.add('disabled');
        } else {
            card.classList.add('active');
            if (minusBtn) minusBtn.classList.remove('disabled');
        }
        if (qtyValSpan) qtyValSpan.textContent = newQty;
    }
    
    // 更新实时总价显示
    updateOrderTotalPrice();
};

// --- 下单与完成逻辑 ---

// 新增并广播订单
function submitOrder() {
    const customFeature = document.getElementById('input-custom-feature').value.trim();
    
    // 基础检查：是否点了菜
    if (Object.keys(selectedOrderDishes).length === 0) {
        alert('请至少点一个菜品！');
        return;
    }
    
    let tableNumTag = '';
    if (selectedDeliveryType === '送过去') {
        tableNumTag = selectedTableNum || '1号桌';
    } else {
        tableNumTag = '过来拿';
    }
    
    const nextNum = state.lastOrderNum + 1;
    state.lastOrderNum = nextNum;
    
    const newOrder = {
        id: 'ord_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
        num: nextNum,
        timestamp: Date.now(),
        tableNum: tableNumTag,
        tags: [tableNumTag],
        customTag: customFeature,
        items: { ...selectedOrderDishes },
        spicy: selectedSpicy,
        reqs: [...selectedReqs],
        status: 'grilling'
    };
    
    state.orders.push(newOrder);
    saveToLocalStorage();
    renderGrillingList();
    
    // 播报语音
    announceOrder(newOrder);
    
    // 广播 MQTT 消息给其他终端
    broadcastMsg({
        type: 'ADD_ORDER',
        order: newOrder
    });
    
    // 关闭 Modal
    const modal = document.getElementById('order-modal');
    if (modal) modal.style.display = 'none';
}

// 记录滑动起始坐标，用于拦截轨道直接点击误触
window.handleSliderStart = function(e) {
    const rect = e.target.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    e.target.dataset.startX = clientX - rect.left;
};

// 颜色滑块防点击轨道跳转拦截逻辑
window.handleColorSliderStart = function(e) {
    const el = e.target;
    const rect = el.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clickX = clientX - rect.left;
    
    const val = parseFloat(el.value) || 0;
    const max = parseFloat(el.max) || 100;
    const min = parseFloat(el.min) || 0;
    
    // 计算当前滑块的像素中心位置
    const ratio = (val - min) / (max - min);
    const thumbWidth = 24; 
    const thumbX = ratio * (rect.width - thumbWidth) + (thumbWidth / 2);
    
    // 如果点击起始点距离当前滑块位置超过 22 像素，判定为“点击轨道跳转”，标记拦截
    if (Math.abs(clickX - thumbX) > 22) {
        el.dataset.invalidClick = "true";
        el.dataset.restoreValue = val;
    } else {
        el.dataset.invalidClick = "false";
    }
};

window.resetColorSliderStart = function(el) {
    el.dataset.invalidClick = "false";
};

// 滑动拿走确认
window.handleSlideConfirm = function(el, orderId) {
    const startX = parseFloat(el.dataset.startX) || 0;
    // 如果点击起始位置不在左侧滑块处（例如直接点了轨道中部或右侧），强制复位并拦截
    if (startX > 55) {
        el.value = 0;
        return;
    }
    
    if (el.value >= 95) {
        el.value = 100;
        window.completeOrder(orderId);
    }
};

window.resetSlideConfirm = function(el) {
    el.dataset.startX = "0";
    if (el.value < 95) {
        el.value = 0;
    }
};

// 点击已完成/已拿走
window.completeOrder = function(orderId) {
    const orderIdx = state.orders.findIndex(o => o.id === orderId);
    if (orderIdx !== -1) {
        const order = state.orders.splice(orderIdx, 1)[0];
        order.status = 'completed';
        
        // 播放金币音效并语音播报到账信息
        announceComplete(order);
        
        // 保存到本地历史记录
        state.history.unshift(order);
        if (state.history.length > 100) state.history.pop();
        
        saveToLocalStorage();
        renderGrillingList();
        renderHistoryList();
        
        // 广播完成信息给其他终端，使它们的屏幕上也同步消除
        broadcastMsg({
            type: 'COMPLETE_ORDER',
            orderId: orderId
        });
    }
};

// 3次确认取消/删除订单逻辑 (仅变色，不改字，无中途音效，仅最后一下播放声音，且3秒不操作自动复原)
window.deleteOrderStep = function(btn, orderId) {
    let step = parseInt(btn.dataset.step);
    
    // 清除上一次的自动复原定时器
    if (btn.dataset.timeoutId) {
        clearTimeout(parseInt(btn.dataset.timeoutId));
    }
    
    if (step === 1) {
        btn.dataset.step = "2";
        btn.style.backgroundColor = "#ff9100"; // 橙色
        btn.style.color = "#fff";
    } else if (step === 2) {
        btn.dataset.step = "3";
        btn.style.backgroundColor = "#ff1744"; // 红色
        btn.style.color = "#fff";
        btn.style.boxShadow = "0 0 10px rgba(255,23,68,0.6)";
    } else if (step === 3) {
        window.cancelOrder(orderId);
        return; // 直接取消，不需要再设恢复定时器
    }
    
    // 设置 3 秒不点自动恢复灰色初始状态的定时器
    const timeoutId = setTimeout(() => {
        btn.dataset.step = "1";
        btn.style.backgroundColor = "rgba(255, 255, 255, 0.05)";
        btn.style.boxShadow = "none";
        btn.style.color = "var(--text-muted)";
    }, 3000);
    btn.dataset.timeoutId = timeoutId;
};

window.cancelOrder = function(orderId) {
    const orderIdx = state.orders.findIndex(o => o.id === orderId);
    if (orderIdx === -1) return;
    
    const order = state.orders.splice(orderIdx, 1)[0];
    order.status = 'deleted'; // 标记为已删除
    
    // 播放取消音效
    playCancelSound();
    
    // 保存到本地历史记录
    state.history.unshift(order);
    if (state.history.length > 100) state.history.pop();
    
    saveToLocalStorage();
    renderGrillingList();
    renderHistoryList();
    
    // 广播删除订单信息
    broadcastMsg({
        type: 'DELETE_ORDER',
        orderId: orderId
    });
};

// --- 设置页面的具体逻辑操作 ---

// 移除菜品
window.removeDish = function(index) {
    state.dishes.splice(index, 1);
    saveToLocalStorage();
    broadcastMsg({ type: 'UPDATE_STATE', state: { dishes: state.dishes } });
    renderSettingsEditor();
    renderQuickDishesGrid();
};

// 移除外貌标签
window.removeTag = function(index) {
    state.tags.splice(index, 1);
    saveToLocalStorage();
    broadcastMsg({ type: 'UPDATE_STATE', state: { tags: state.tags } });
    renderSettingsEditor();
};

// --- 初始化与事件绑定 ---
document.addEventListener('DOMContentLoaded', () => {
    // 1. 从缓存中恢复数据
    loadFromLocalStorage();
    
    // 2. 渲染正在烤列表和已完成历史
    renderGrillingList();
    renderHistoryList();
    renderSettingsEditor();
    
    // 3. 初始化并连接局域网 WebSocket 联机房间
    const inputRoom = document.getElementById('input-room-id');
    if (inputRoom) inputRoom.value = state.roomId;
    const switchAudio = document.getElementById('switch-audio');
    if (switchAudio) switchAudio.checked = state.audioEnabled;
    const switchTts = document.getElementById('switch-tts-detail');
    if (switchTts) switchTts.checked = state.ttsDetailEnabled;
    connectMQTT();
    
    // 4. 底部导航 Tab 切换逻辑
    document.querySelectorAll('.nav-item').forEach(btn => {
        btn.addEventListener('click', () => {
            const targetTab = btn.dataset.tab;
            
            // 切换导航高亮
            document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            // 切换面板展示
            document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
            const targetPane = document.getElementById(targetTab);
            if (targetPane) targetPane.classList.add('active');
        });
    });
    
    // 5. 快速下单弹窗触发和隐藏
    const orderModal = document.getElementById('order-modal');
    const orderTrigger = document.getElementById('btn-quick-order-trigger');
    if (orderTrigger && orderModal) {
        orderTrigger.addEventListener('click', (e) => {
            if (!state.roomId) {
                e.preventDefault();
                e.stopPropagation();
                alert('请先创建或加入一个房间！');
                toggleRoomOverlay();
                return;
            }
            initOrderModal();
            orderModal.style.display = 'block';
        });
    }
    
    const closeModal = () => {
        if (orderModal) orderModal.style.display = 'none';
    };
    
    const closeBtn = document.getElementById('btn-close-modal');
    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    const cancelBtn = document.getElementById('btn-cancel-order');
    if (cancelBtn) cancelBtn.addEventListener('click', closeModal);
    
    // 6. 弹窗内口味和附加选项的多选/单选逻辑
    // 衣色滑块拖动
    const sliderShirt = document.getElementById('slider-shirt');
    const valShirt = document.getElementById('val-shirt');
    if (sliderShirt && valShirt) {
        sliderShirt.addEventListener('input', () => {
            if (sliderShirt.dataset.invalidClick === "true") {
                sliderShirt.value = sliderShirt.dataset.restoreValue;
                return;
            }
            updateAvatarPreview();
        });
    }
    
    // 裤色滑块拖动
    const sliderPants = document.getElementById('slider-pants');
    const valPants = document.getElementById('val-pants');
    if (sliderPants && valPants) {
        sliderPants.addEventListener('input', () => {
            if (sliderPants.dataset.invalidClick === "true") {
                sliderPants.value = sliderPants.dataset.restoreValue;
                return;
            }
            updateAvatarPreview();
        });
    }
    
    // 更多特征收起展开逻辑
    const moreFeaturesToggle = document.getElementById('more-features-toggle');
    const moreFeaturesSection = document.getElementById('more-features-section');
    if (moreFeaturesToggle && moreFeaturesSection) {
        moreFeaturesToggle.addEventListener('click', () => {
            if (moreFeaturesSection.style.display === 'none') {
                moreFeaturesSection.style.display = 'block';
                moreFeaturesToggle.textContent = '⚙️ 收起更多特征 ▴';
            } else {
                moreFeaturesSection.style.display = 'none';
                moreFeaturesToggle.textContent = '⚙️ 展开更多特征 (配饰、衣服颜色等) ▾';
            }
        });
    }
    
    // 过来拿/送过去 切换
    const deliveryDetailsPanel = document.getElementById('delivery-details-panel');
    document.querySelectorAll('.delivery-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.delivery-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            selectedDeliveryType = btn.dataset.type;
            
            if (deliveryDetailsPanel) {
                if (selectedDeliveryType === '送过去') {
                    deliveryDetailsPanel.style.display = 'block';
                } else {
                    deliveryDetailsPanel.style.display = 'none';
                }
            }
        });
    });
    
    // 送餐方向选择
    document.querySelectorAll('.side-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.side-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            selectedTableSide = btn.dataset.side;
        });
    });
    
    // 桌号选择
    document.querySelectorAll('.table-num-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.table-num-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            selectedTableNum = btn.dataset.num;
        });
    });

    // 口味单选
    document.querySelectorAll('.spicy-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.spicy-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            selectedSpicy = btn.dataset.spicy;
        });
    });
    
    // 附加要求多选 (打包等)
    document.querySelectorAll('.req-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            btn.classList.toggle('active');
            const reqText = btn.dataset.req;
            if (btn.classList.contains('active')) {
                selectedReqs.push(reqText);
            } else {
                selectedReqs = selectedReqs.filter(r => r !== reqText);
            }
        });
    });
    
    // 7. 下单提交按钮
    document.getElementById('btn-submit-order').addEventListener('click', submitOrder);
    
    // 8. 设置面板相关的事件绑定
    // 连接新房间
    document.getElementById('btn-connect-room').addEventListener('click', () => {
        const newRoom = document.getElementById('input-room-id').value.trim();
        if (!newRoom) {
            alert('请输入房间号！');
            return;
        }
        state.roomId = newRoom;
        // 仅本地暂存房间号，不直接覆盖云端
        localStorage.setItem('bbq_helper_state', JSON.stringify(state));
        
        loadFromCloud().then((loaded) => {
            if (!loaded) {
                // 新房间初始化云端
                saveToCloud();
            }
            connectMQTT();
        });
        alert('已成功切换房间，正在从云数据库拉取数据并联机，状态请看顶部标识');
    });


    
    // 退出当前房间
    const btnLeaveRoom = document.getElementById('btn-leave-room');
    if (btnLeaveRoom) {
        btnLeaveRoom.addEventListener('click', () => {
            if (confirm('确认退出当前联机房间吗？退出后将断开消息同步。')) {
                state.roomId = '';
                saveToLocalStorage();
                if (mqttClient) {
                    try { mqttClient.end(); } catch(e) {}
                }
                toggleRoomOverlay();
                alert('已成功退出房间。');
            }
        });
    }

    // 欢迎首屏房间加入与创建 (设为全局 window 函数，确保 100% 触发)
    const btnWelcomeCreate = document.getElementById('btn-welcome-create');
    const btnWelcomeJoin = document.getElementById('btn-welcome-join');
    
    window.handleWelcomeRoomAction = (actionName) => {
        const welcomeRoomInput = document.getElementById('welcome-room-id');
        const val = welcomeRoomInput ? welcomeRoomInput.value.trim() : '';
        if (!val) {
            alert('请输入要创建或加入的房间号！');
            return;
        }
        if (!/^[a-zA-Z0-9_-]+$/.test(val)) {
            alert('房间号格式不正确（只能包含字母、数字、减号或下划线）！');
            return;
        }
        
        state.roomId = val;
        // 仅将房间号保存到本地缓存，绝对不在此时将本地空数据上传云端
        localStorage.setItem('bbq_helper_state', JSON.stringify(state));
        
        // 同步修改设置页面中的房间号输入框内容
        const inputRoom = document.getElementById('input-room-id');
        if (inputRoom) inputRoom.value = val;
        
        // 隐藏遮罩
        toggleRoomOverlay();
        
        // 先从云端拉取已有数据，拉取完毕（或新房间）后再联机
        loadFromCloud().then((loaded) => {
            if (!loaded) {
                // 如果是新创建的房间，初始化一下云端数据库
                saveToCloud();
            }
            connectMQTT();
        });
        
        alert(`已成功${actionName}房间: ${val}`);
    };
    
    if (btnWelcomeCreate) btnWelcomeCreate.onclick = () => window.handleWelcomeRoomAction('创建并进入');
    if (btnWelcomeJoin) btnWelcomeJoin.onclick = () => window.handleWelcomeRoomAction('加入并进入');
    
    // 语音播报开关
    document.getElementById('switch-audio').addEventListener('change', (e) => {
        state.audioEnabled = e.target.checked;
        saveToLocalStorage();
    });
    
    const switchTtsEl = document.getElementById('switch-tts-detail');
    if (switchTtsEl) {
        switchTtsEl.addEventListener('change', (e) => {
            state.ttsDetailEnabled = e.target.checked;
            saveToLocalStorage();
        });
    }
    
    // 测试提示音效
    document.getElementById('btn-test-audio').addEventListener('click', () => {
        playNewOrderSound();
        setTimeout(playCompleteSound, 600);
        setTimeout(playCancelSound, 1200);
    });
    
    // 增加新菜品
    document.getElementById('btn-add-dish').addEventListener('click', () => {
        const newDishInput = document.getElementById('input-new-dish');
        const newDishPriceInput = document.getElementById('input-new-dish-price');
        
        const dishName = newDishInput.value.trim();
        if (!dishName) {
            alert('请输入菜品名称！');
            return;
        }
        
        const dishPrice = parseFloat(newDishPriceInput.value) || 0;
        
        if (state.dishes.some(d => d.name === dishName)) {
            alert('菜品已存在！');
            return;
        }
        
        state.dishes.push({ name: dishName, price: dishPrice });
        newDishInput.value = '';
        newDishPriceInput.value = '';
        saveToLocalStorage();
        broadcastMsg({ type: 'UPDATE_STATE', state: { dishes: state.dishes } }, true);
        renderSettingsEditor();
        renderQuickDishesGrid();
    });
    
    // 增加特征标签
    document.getElementById('btn-add-tag').addEventListener('click', () => {
        const newTagInput = document.getElementById('input-new-tag');
        const tagName = newTagInput.value.trim();
        if (!tagName) return;
        if (state.tags.includes(tagName)) {
            alert('特征标签已存在！');
            return;
        }
        state.tags.push(tagName);
        newTagInput.value = '';
        saveToLocalStorage();
        broadcastMsg({ type: 'UPDATE_STATE', state: { tags: state.tags } }, true);
        renderSettingsEditor();
    });
    
    // 清空今日历史记录
    document.getElementById('btn-clear-history').addEventListener('click', () => {
        if (confirm('确认清空今天所有的已完成历史订单吗？（此操作不影响正在烤的订单）')) {
            state.history = [];
            // 重置排队序号为 0，进入新的一天
            state.lastOrderNum = 0;
            saveToLocalStorage();
            renderHistoryList();
            alert('已清空历史，排队序号已重置。');
        }
    });
    
    // 打开历史账单弹窗
    const btnShowAllHistory = document.getElementById('btn-show-all-history');
    if (btnShowAllHistory) {
        btnShowAllHistory.addEventListener('click', () => {
            renderAllHistoryRecords();
            const modal = document.getElementById('all-history-modal');
            if (modal) modal.style.display = 'flex';
        });
    }
    
    // 关闭历史账单弹窗
    const btnCloseAllHistory = document.getElementById('btn-close-all-history');
    if (btnCloseAllHistory) {
        btnCloseAllHistory.addEventListener('click', () => {
            const modal = document.getElementById('all-history-modal');
            if (modal) modal.style.display = 'none';
        });
    }
    
    // 点击遮罩外部关闭历史账单弹窗
    const allHistoryModal = document.getElementById('all-history-modal');
    if (allHistoryModal) {
        allHistoryModal.addEventListener('click', (e) => {
            if (e.target === allHistoryModal) {
                allHistoryModal.style.display = 'none';
            }
        });
    }
    
    // 初始化时立刻更新一次时间
    setTimeout(updateAllElapsedTimes, 100);
    // 每 2 秒钟更新一次页面上所有正在烤订单的已等待时长
    setInterval(updateAllElapsedTimes, 2000);
});

// 定时更新正在烤订单的等待时间
function updateAllElapsedTimes() {
    document.querySelectorAll('.elapsed-time-tag').forEach(el => {
        const timestamp = parseInt(el.dataset.timestamp);
        if (!timestamp) return;
        
        const diffMs = Date.now() - timestamp;
        const diffMins = Math.floor(diffMs / 60000);
        const diffSecs = Math.floor((diffMs % 60000) / 1000);
        
        if (diffMins > 0) {
            el.textContent = `(等${diffMins}分${diffSecs}秒)`;
            if (diffMins >= 10) {
                el.style.color = '#ff1744'; // 超过10分钟显示红色高亮
            } else if (diffMins >= 5) {
                el.style.color = '#ff9100'; // 超过5分钟显示橙色警告
            } else {
                el.style.color = '#ffd600'; // 一般等待显示黄色
            }
        } else {
            el.textContent = `(等${diffSecs}秒)`;
            el.style.color = '#888';
        }
    });
}

// 渲染所有的历史营业额与订单（按营业日分组）
function renderAllHistoryRecords() {
    const container = document.getElementById('all-history-records-container');
    if (!container) return;
    
    if (state.history.length === 0) {
        container.innerHTML = `<div class="empty-state"><p>📦 暂无任何历史订单记录</p></div>`;
        return;
    }
    
    // 按照营业日分组
    const groups = {};
    state.history.forEach(order => {
        const bizDay = getBBQBusinessDay(order.timestamp);
        if (!groups[bizDay]) {
            groups[bizDay] = {
                orders: [],
                revenue: 0
            };
        }
        groups[bizDay].orders.push(order);
        
        // 计算价格 (仅统计已完成订单，排除删除/取消订单)
        if (order.status !== 'deleted') {
            let orderTotal = 0;
            for (const [name, qty] of Object.entries(order.items)) {
                orderTotal += getDishPrice(name) * qty;
            }
            groups[bizDay].revenue += orderTotal;
        }
    });
    
    // 按日期倒序排列
    const sortedDays = Object.keys(groups).sort((a, b) => new Date(b.replace(/\//g, '-')) - new Date(a.replace(/\//g, '-')));
    
    container.innerHTML = '';
    sortedDays.forEach(day => {
        const group = groups[day];
        
        const groupEl = document.createElement('div');
        groupEl.className = 'history-day-group';
        groupEl.style.marginBottom = '20px';
        groupEl.style.background = 'rgba(255, 255, 255, 0.02)';
        groupEl.style.border = '1px solid var(--border-color)';
        groupEl.style.borderRadius = '10px';
        groupEl.style.padding = '12px';
        
        let ordersHtml = '';
        group.orders.forEach(order => {
            const isDel = order.status === 'deleted';
            let dishesText = [];
            for (const [name, qty] of Object.entries(order.items)) {
                dishesText.push(`${name}x${qty}`);
            }
            
            let orderTotal = 0;
            for (const [name, qty] of Object.entries(order.items)) {
                orderTotal += getDishPrice(name) * qty;
            }
            
            const timeStr = new Date(order.timestamp).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
            
            ordersHtml += `
                <div style="padding: 8px 0; border-bottom: 1px dashed rgba(255,255,255,0.05); font-size: 0.9rem; display: flex; justify-content: space-between; align-items: center; opacity: ${isDel ? '0.5' : '1'};">
                    <div>
                        <strong style="color: ${isDel ? '#ff1744' : 'var(--primary)'};">${isDel ? '🗑️ ' : ''}#${order.num}</strong> 
                        <span style="color: var(--text-muted); font-size: 0.8rem;">(${timeStr}) ${isDel ? '<span style="color:#ff1744;">(已取消)</span>' : ''}</span>
                        <div style="margin-top: 4px; color: var(--text-color);">${dishesText.join(', ')}</div>
                    </div>
                    <span style="font-weight: bold; color: var(--secondary); ${isDel ? 'text-decoration: line-through;' : ''}">￥${orderTotal.toFixed(2)}</span>
                </div>
            `;
        });
        
        groupEl.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 8px; margin-bottom: 10px;">
                <span style="font-weight: bold; font-size: 1.05rem; color: var(--text-color);">📅 营业日: ${day}</span>
                <span style="font-weight: 800; font-size: 1.1rem; color: var(--primary);">营业额: ￥${group.revenue.toFixed(2)}</span>
            </div>
            <div class="group-orders-list">
                ${ordersHtml}
            </div>
        `;
        container.appendChild(groupEl);
    });
}

// --- 菜品编辑与重置功能 ---
let editingDishIndex = -1;

function openEditDishModal(idx) {
    if (idx < 0 || idx >= state.dishes.length) return;
    editingDishIndex = idx;
    const dish = state.dishes[idx];
    
    const nameInput = document.getElementById('edit-dish-name-input');
    const priceInput = document.getElementById('edit-dish-price-input');
    if (nameInput) nameInput.value = dish.name;
    if (priceInput) priceInput.value = dish.price;
    
    const modal = document.getElementById('edit-dish-modal');
    if (modal) {
        modal.style.display = 'flex';
        modal.style.zIndex = '999999';
    }
}
window.openEditDishModal = openEditDishModal;

function closeEditDishModal() {
    const modal = document.getElementById('edit-dish-modal');
    if (modal) modal.style.display = 'none';
    editingDishIndex = -1;
}
window.closeEditDishModal = closeEditDishModal;

function saveEditedDish() {
    if (editingDishIndex < 0 || editingDishIndex >= state.dishes.length) return;
    
    const nameInput = document.getElementById('edit-dish-name-input');
    const priceInput = document.getElementById('edit-dish-price-input');
    
    const newName = nameInput ? nameInput.value.trim() : '';
    const newPriceStr = priceInput ? priceInput.value.trim() : '';
    const newPrice = parseFloat(newPriceStr);
    
    if (!newName) {
        alert('请输入菜品名称！');
        return;
    }
    if (isNaN(newPrice) || newPrice < 0) {
        alert('请输入有效的价格！');
        return;
    }
    
    // 如果修改了名称，检查是否重名
    const exists = state.dishes.some((d, i) => i !== editingDishIndex && d.name === newName);
    if (exists) {
        alert(`菜品 "${newName}" 已经存在！`);
        return;
    }
    
    // 更新菜品信息
    state.dishes[editingDishIndex] = {
        name: newName,
        price: newPrice
    };
    
    // 保存至本地与云端
    saveToLocalStorage();
    
    // 广播同步给其他终端
    broadcastMsg({
        type: 'UPDATE_STATE',
        state: { dishes: state.dishes }
    });
    
    // 刷新全界面
    renderSettingsEditor();
    renderQuickDishesGrid();
    renderGrillingList();
    renderHistoryList();
    
    closeEditDishModal();
}
window.saveEditedDish = saveEditedDish;

window.resetToPaperMenuDishes = function() {
    if (confirm('确定要清空现有菜品，重新载入全套最新手写纸质菜单吗？')) {
        state.dishes = JSON.parse(JSON.stringify(DEFAULT_DISHES));
        saveToLocalStorage();
        broadcastMsg({
            type: 'UPDATE_STATE',
            state: { dishes: state.dishes }
        });
        renderSettingsEditor();
        renderQuickDishesGrid();
        renderGrillingList();
        renderHistoryList();
        alert('已成功将菜单清空并替换为全套最新纸质菜单！');
    }
};

window.forcePurgeCache = function() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then(registrations => {
            for (let registration of registrations) {
                registration.unregister();
            }
            caches.keys().then(names => {
                Promise.all(names.map(name => caches.delete(name))).then(() => {
                    window.location.href = window.location.origin + window.location.pathname + '?t=' + Date.now();
                });
            });
        });
    } else {
        window.location.href = window.location.origin + window.location.pathname + '?t=' + Date.now();
    }
};

window.updateDishNameInline = function(idx, newName) {
    if (idx < 0 || idx >= state.dishes.length) return;
    const name = newName.trim();
    if (!name) return;
    state.dishes[idx].name = name;
    saveToLocalStorage();
    broadcastMsg({ type: 'UPDATE_STATE', state: { dishes: state.dishes } }, true);
    renderQuickDishesGrid();
};

window.updateDishPriceInline = function(idx, newPriceStr) {
    if (idx < 0 || idx >= state.dishes.length) return;
    const price = parseFloat(newPriceStr);
    if (isNaN(price) || price < 0) return;
    state.dishes[idx].price = price;
    saveToLocalStorage();
    broadcastMsg({ type: 'UPDATE_STATE', state: { dishes: state.dishes } }, true);
    renderQuickDishesGrid();
};


