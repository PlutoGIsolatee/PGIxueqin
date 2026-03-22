import fs from 'fs';
import http from 'http';
import { charFreqLayers } from './charFreqCats.js';

// ========== 1. 构建字符 -> 异常分数映射 ==========
const charScore = new Map();

// 中文常用字分层 (zhChar)
const zhChar = charFreqLayers.zhChar;
for (let i = 0; i < zhChar.length; i++) {
    const layerStr = zhChar[i];
    for (const ch of layerStr) {
        charScore.set(ch, i + 1);
    }
}

// 中文标点 (zhPunc) 统一给分 3
const zhPunc = charFreqLayers.zhPunc;
for (const p of zhPunc) {
    charScore.set(p, 3);
}

// 英文字母分层 (enChar)
const enChar = charFreqLayers.enChar;
for (let i = 0; i < enChar.length; i++) {
    const layerStr = enChar[i];
    for (const ch of layerStr) {
        charScore.set(ch, i + 1);
    }
}

// 英文标点 (enPunc) 统一给分 3
const enPunc = charFreqLayers.enPunc;
for (const p of enPunc) {
    charScore.set(p, 3);
}

// 未分类字符默认分数 4 (较高，视为异常)
const DEFAULT_SCORE = 4;

function getScore(ch) {
    return charScore.get(ch) ?? DEFAULT_SCORE;
}

// ========== 2. 读取文本 ==========
const text = fs.readFileSync('./sample.txt', 'utf-8');
const len = text.length;

// ========== 3. 滑动窗口检测可疑片段 ==========
const WINDOW_SIZE = 100;      // 粗筛窗口大小
const STEP = 10;              // 粗筛步长
const SMALL_WINDOW = 20;      // 精细窗口大小
const STD_MULTIPLIER = 1.5;   // 阈值倍数

// 计算每个粗筛窗口的平均分数
const windowScores = [];
for (let start = 0; start < len - WINDOW_SIZE + 1; start += STEP) {
    let sum = 0;
    for (let i = start; i < start + WINDOW_SIZE; i++) {
        sum += getScore(text[i]);
    }
    const avg = sum / WINDOW_SIZE;
    windowScores.push({ start, end: start + WINDOW_SIZE - 1, avg });
}

// 计算阈值 (平均值 + 倍数 * 标准差)
const avgs = windowScores.map(w => w.avg);
const mean = avgs.reduce((a, b) => a + b, 0) / avgs.length;
const variance = avgs.reduce((sum, x) => sum + (x - mean) ** 2, 0) / avgs.length;
const stddev = Math.sqrt(variance);
const threshold = mean + STD_MULTIPLIER * stddev;

// 找出超过阈值的窗口，合并成连续可疑片段
const suspiciousWindows = windowScores.filter(w => w.avg > threshold);
if (suspiciousWindows.length === 0) {
    console.log('未检测到可疑片段');
    process.exit(0);
}

// 合并相邻窗口 (间隔 ≤ STEP 视为连续)
suspiciousWindows.sort((a, b) => a.start - b.start);
const merged = [];
let current = { ...suspiciousWindows[0] };
for (let i = 1; i < suspiciousWindows.length; i++) {
    const w = suspiciousWindows[i];
    if (w.start <= current.end + STEP) {
        current.end = Math.max(current.end, w.end);
        current.avg = Math.max(current.avg, w.avg);
    } else {
        merged.push(current);
        current = { ...w };
    }
}
merged.push(current);

// 可疑片段列表 (起始索引，结束索引，平均分数)
const suspiciousSegments = merged.map(seg => ({
    start: seg.start,
    end: seg.end,
    avg: seg.avg
}));

// ========== 4. 精细定位最异常小片段 ==========
let bestSegment = null;
let bestScore = -Infinity;

for (const seg of suspiciousSegments) {
    const startIdx = seg.start;
    const endIdx = seg.end;
    const length = endIdx - startIdx + 1;
    if (length < SMALL_WINDOW) {
        const totalScore = Array.from({ length }, (_, i) => getScore(text[startIdx + i])).reduce((a, b) => a + b, 0);
        const avg = totalScore / length;
        if (avg > bestScore) {
            bestScore = avg;
            bestSegment = { start: startIdx, end: endIdx, avg };
        }
        continue;
    }
    for (let s = startIdx; s <= endIdx - SMALL_WINDOW + 1; s++) {
        let sum = 0;
        for (let i = s; i < s + SMALL_WINDOW; i++) {
            sum += getScore(text[i]);
        }
        const avg = sum / SMALL_WINDOW;
        if (avg > bestScore) {
            bestScore = avg;
            bestSegment = { start: s, end: s + SMALL_WINDOW - 1, avg };
        }
    }
}

// ========== 5. 生成 HTML 可视化（修复高亮覆盖问题） ==========
function escapeHtml(str) {
    return str.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    }).replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g, function(c) {
        return c;
    });
}

// 按优先级标记文本：best > suspicious > 普通
const parts = [];
let pos = 0;

while (pos < len) {
    // 检查当前位置是否在 best 区间内
    const bestRange = bestSegment && pos >= bestSegment.start && pos <= bestSegment.end;
    // 检查当前位置是否在任意可疑区间内
    const inSuspicious = suspiciousSegments.some(seg => pos >= seg.start && pos <= seg.end);

    if (bestRange) {
        // 整个 best 区间作为一个整体，确保不拆分
        const end = bestSegment.end;
        const fragment = text.slice(pos, end + 1);
        parts.push({ text: fragment, class: 'highlight-best' });
        pos = end + 1;
    } else if (inSuspicious) {
        // 找到当前所在可疑区间的结束
        const seg = suspiciousSegments.find(seg => pos >= seg.start && pos <= seg.end);
        const end = seg.end;
        const fragment = text.slice(pos, end + 1);
        parts.push({ text: fragment, class: 'highlight-suspicious' });
        pos = end + 1;
    } else {
        // 普通文本，一直读取到下一个标记点
        let nextPos = len;
        for (const seg of suspiciousSegments) {
            if (seg.start > pos) nextPos = Math.min(nextPos, seg.start);
        }
        if (bestSegment && bestSegment.start > pos) nextPos = Math.min(nextPos, bestSegment.start);
        const fragment = text.slice(pos, nextPos);
        parts.push({ text: fragment, class: '' });
        pos = nextPos;
    }
}

const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>异常文本检测结果</title>
    <style>
        body { font-family: monospace; white-space: pre-wrap; padding: 20px; background: #fafafa; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 20px; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
        .highlight-suspicious { background-color: #fff3cd; }
        .highlight-best { 
            background-color: #ffcccc; 
            border: 1px solid #ff0000; 
            font-weight: bold; 
            color: #b30000;
            padding: 0 2px;
            border-radius: 3px;
        }
        .info { margin-bottom: 20px; padding: 10px; background: #e9ecef; border-radius: 5px; }
        .info p { margin: 5px 0; }
    </style>
</head>
<body>
<div class="container">
    <div class="info">
        <h2>异常片段检测结果</h2>
        <p>检测参数: 粗筛窗口 ${WINDOW_SIZE}, 步长 ${STEP}, 精细窗口 ${SMALL_WINDOW}, 阈值倍数 ${STD_MULTIPLIER}</p>
        <p>可疑片段数量: ${suspiciousSegments.length}</p>
        <p>最异常小片段位置: 字符索引 [${bestSegment.start}, ${bestSegment.end}], 平均异常分数: ${bestSegment.avg.toFixed(2)}</p>
        <p>说明: <span style="background:#fff3cd">浅黄色背景</span> 为可疑片段, <span style="background:#ffcccc; border:1px solid red; font-weight:bold">红色背景加粗</span> 为最异常片段。</p>
    </div>
    <div>
        ${parts.map(part => {
            if (part.class) {
                return `<span class="${part.class}">${escapeHtml(part.text)}</span>`;
            } else {
                return escapeHtml(part.text);
            }
        }).join('')}
    </div>
</div>
</body>
</html>
`;

// ========== 6. 启动 HTTP 服务器 ==========
const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(html);
});

const PORT = 3000;
server.listen(PORT, () => {
    console.log(`服务器已启动，访问 http://localhost:${PORT} 查看结果`);
});
