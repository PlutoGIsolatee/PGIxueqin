/**
 * 生成 HTML 页面，将文本中的片段用 <mark> 标签高亮
 * @param {string} text - 原始文本
 * @param {Array<{start: number, end: number}>} fragments - 异常片段
 * @returns {string} HTML 字符串
 */
export function generateHtml(text, fragments) {
    // 按顺序遍历，将文本分段
    let lastEnd = 0;
    const parts = [];
    for (const frag of fragments) {
        // 正常部分
        if (frag.start > lastEnd) {
            parts.push(escapeHtml(text.slice(lastEnd, frag.start)));
        }
        // 异常部分（高亮）
        parts.push(`<mark class="noise">${escapeHtml(text.slice(frag.start, frag.end))}</mark>`);
        lastEnd = frag.end;
    }
    // 尾部正常部分
    if (lastEnd < text.length) {
        parts.push(escapeHtml(text.slice(lastEnd)));
    }

    const htmlContent = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <title>噪声片段检测结果</title>
    <style>
        body {
            font-family: 'Segoe UI', '微软雅黑', monospace;
            line-height: 1.6;
            padding: 20px;
            background-color: #f8f9fa;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            padding: 20px;
        }
        .noise {
            background-color: #ffcccc;
            color: #a00;
            border-radius: 3px;
            padding: 0 2px;
            font-weight: bold;
        }
        .info {
            background: #e9ecef;
            padding: 10px;
            border-radius: 5px;
            margin-bottom: 20px;
        }
        pre {
            white-space: pre-wrap;
            word-wrap: break-word;
            font-size: 14px;
            background: #fff;
            border: 1px solid #ddd;
            padding: 15px;
            border-radius: 5px;
            overflow-x: auto;
        }
    </style>
</head>
<body>
<div class="container">
    <div class="info">
        <strong>检测结果</strong>：共发现 ${fragments.length} 个噪声片段。
    </div>
    <pre>${parts.join('')}</pre>
</div>
</body>
</html>
    `;
    return htmlContent;
}

// 简单的 HTML 转义函数
function escapeHtml(str) {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}
