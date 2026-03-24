import http from 'http';
import fs from 'fs/promises';
import { detectNoiseFragments, getAvailableSteps } from './core/detector.js';
import { generateHtml } from './htmlGenerator.js';
import { config } from './config.js';

const PORT = 3000;
const SAMPLE_FILE = './sample.txt';

let cachedHtml = null;
let cachedSteps = null;
let currentText = null;

async function loadText() {
    try {
        currentText = await fs.readFile(SAMPLE_FILE, 'utf-8');
        return currentText;
    } catch (err) {
        console.error('读取文件失败:', err);
        throw err;
    }
}

async function initialize() {
    await loadText();
    cachedSteps = getAvailableSteps();
    // 初始计算默认结果
    const { fragments, stepResults, usedSteps } = detectNoiseFragments(currentText);
    cachedHtml = generateHtml(currentText, fragments, stepResults, usedSteps, cachedSteps);
    console.log('预处理完成，已缓存结果。');
}

const server = http.createServer(async (req, res) => {
    const url = new URL(req.url, `http://${req.headers.host}`);
    
    if (url.pathname === '/' || url.pathname === '/index.html') {
        if (cachedHtml) {
            res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
            res.end(cachedHtml);
        } else {
            res.writeHead(503);
            res.end('服务尚未就绪');
        }
    } 
    else if (url.pathname === '/api/steps') {
        // 返回可用步骤列表
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(cachedSteps));
    }
    else if (url.pathname === '/api/run' && req.method === 'POST') {
        // 接收步骤配置并计算
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', async () => {
            try {
                const stepConfig = JSON.parse(body);
                const { fragments, stepResults, usedSteps } = detectNoiseFragments(currentText, stepConfig);
                const html = generateHtml(currentText, fragments, stepResults, usedSteps, cachedSteps);
                res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
                res.end(html);
            } catch (err) {
                console.error('计算失败:', err);
                res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
                res.end('计算失败: ' + err.message);
            }
        });
    }
    else {
        res.writeHead(404);
        res.end('Not Found');
    }
});

initialize().then(() => {
    server.listen(PORT, () => {
        console.log(`Server running at http://localhost:${PORT}`);
    });
}).catch(err => {
    console.error('启动失败:', err);
    process.exit(1);
});