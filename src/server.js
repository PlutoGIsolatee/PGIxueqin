import http from 'http';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { detectNoiseFragments, getAvailableSteps } from './core/detector.js';
import { generateHtml } from './htmlGenerator.js';
import { config } from './config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;
const SAMPLE_FILE = './sample.txt';

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
    console.log('初始化完成，文本长度:', currentText.length);
}

const server = http.createServer(async (req, res) => {
    const url = new URL(req.url, `http://${req.headers.host}`);
    
    if (url.pathname === '/' || url.pathname === '/index.html') {
        try {
            const stepsParam = url.searchParams.get('steps');
            const paramsParam = url.searchParams.get('params');
            
            let stepConfig = null;
            let paramConfig = null;
            
            if (stepsParam) {
                try {
                    stepConfig = { steps: JSON.parse(stepsParam) };
                } catch (e) {
                    console.warn('解析 steps 参数失败:', e);
                }
            }
            
            if (paramsParam) {
                try {
                    paramConfig = { params: JSON.parse(paramsParam) };
                } catch (e) {
                    console.warn('解析 params 参数失败:', e);
                }
            }
            
            const { fragments, stepResults, usedSteps } = detectNoiseFragments(currentText, stepConfig, paramConfig);
            const serverConfig = { ...config };
            if (serverConfig.consecutiveDigitsPattern && typeof serverConfig.consecutiveDigitsPattern === 'object') {
                serverConfig.consecutiveDigitsPattern = serverConfig.consecutiveDigitsPattern.source;
            }
            
            const html = await generateHtml(
                currentText,
                fragments,
                stepResults,
                usedSteps,
                cachedSteps,
                serverConfig,
                stepConfig,
                paramConfig
            );
            
            res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
            res.end(html);
        } catch (err) {
            console.error('生成页面失败:', err);
            res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
            res.end('服务器错误: ' + err.message);
        }
    } 
    else if (url.pathname === '/api/steps') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(cachedSteps));
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