import http from 'http';
import fs from 'fs/promises';
import { detectNoiseFragments } from './core/detector.js';
import { generateHtml } from './htmlGenerator.js';

const PORT = 3000;
const SAMPLE_FILE = './sample.txt';

let cachedHtml = null;

async function loadAndProcess() {
    try {
        const text = await fs.readFile(SAMPLE_FILE, 'utf-8');
        const fragments = detectNoiseFragments(text);
        cachedHtml = generateHtml(text, fragments);
        console.log('预处理完成，已缓存结果。');
    } catch (err) {
        console.error('预处理失败:', err);
        // 抛出错误，阻止服务器启动
        throw err;
    }
}

const server = http.createServer(async (req, res) => {
    if (req.url === '/' || req.url === '/index.html') {
        if (cachedHtml) {
            res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
            res.end(cachedHtml);
        } else {
            res.writeHead(503, { 'Content-Type': 'text/plain; charset=utf-8' });
            res.end('服务尚未就绪，请稍后再试。');
        }
    } else {
        res.writeHead(404);
        res.end('Not Found');
    }
});

// 先加载处理，成功后再启动服务器；若失败则退出
loadAndProcess()
    .then(() => {
        server.listen(PORT, () => {
            console.log(`Server running at http://localhost:${PORT}`);
        });
    })
    .catch(err => {
        console.error('启动失败，退出进程');
        process.exit(1);
    });