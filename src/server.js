import http from 'http';
import fs from 'fs/promises';
import { detectNoiseFragments } from './core/detector.js';
import { generateHtml } from './htmlGenerator.js';

const PORT = 3000;
const SAMPLE_FILE = './sample.txt';

let cachedHtml = null;
let loadError = null;

async function loadAndProcess() {
    try {
        const text = await fs.readFile(SAMPLE_FILE, 'utf-8');
        const { fragments, stepResults } = detectNoiseFragments(text);
        cachedHtml = generateHtml(text, fragments, stepResults);
        console.log('预处理完成，已缓存结果。');
    } catch (err) {
        console.error('预处理失败:', err);
        loadError = err;
    }
}

const server = http.createServer(async (req, res) => {
    if (req.url === '/' || req.url === '/index.html') {
        if (loadError) {
            res.writeHead(500, { 'Content-Type': 'text/html; charset=utf-8' });
            res.end(`
                <!DOCTYPE html>
                <html>
                <head><title>错误</title></head>
                <body>
                    <h1>读取或处理 sample.txt 失败</h1>
                    <p>请检查文件是否存在且格式正确。</p>
                    <p>错误详情: ${loadError.message}</p>
                </body>
                </html>
            `);
            return;
        }
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

loadAndProcess().then(() => {
    server.listen(PORT, () => {
        console.log(`Server running at http://localhost:${PORT}`);
    });
}).catch(err => {
    console.error('启动失败:', err);
    process.exit(1);
});