/**
 * 生成带选项卡的多步骤高亮 HTML（所有步骤共享滚动位置）
 * @param {string} text - 原始文本
 * @param {Array} finalFragments - 最终片段（用于默认显示）
 * @param {Array} stepResults - 每步的结果 [{ stepName, intervals }]
 * @returns {string}
 */
export function generateHtml(text, finalFragments, stepResults) {
    // 预定义不同步骤的高亮颜色
    const stepColors = [
        '#ffcccc',  // 浅红
        '#ffe0cc',  // 浅橙
        '#fff0cc',  // 浅黄
        '#e0ffe0',  // 浅绿
        '#cce0ff',  // 浅蓝
        '#e0ccff',  // 浅紫
        '#ffccff'   // 粉红
    ];
    
    // 为每个步骤生成高亮文本
    const stepHtmls = stepResults.map((result, idx) => {
        const color = stepColors[idx % stepColors.length];
        const highlighted = applyHighlights(text, result.intervals, color);
        return `
            <div id="step-${idx}" class="step-content" style="display: ${idx === 0 ? 'block' : 'none'}">
                <div class="step-info">
                    <strong>${escapeHtml(result.stepName)}</strong>
                    <span>检测到 ${result.intervals.length} 个片段</span>
                    ${result.error ? `<span style="color:red">错误: ${escapeHtml(result.error)}</span>` : ''}
                </div>
                <pre id="step-scroll-${idx}" class="highlighted-text">${highlighted}</pre>
            </div>
        `;
    }).join('');
    
    // 生成选项卡按钮
    const tabButtons = stepResults.map((result, idx) => `
        <button class="tab-button" data-step="${idx}">${escapeHtml(result.stepName)} (${result.intervals.length})</button>
    `).join('');
    
    return `
        <!DOCTYPE html>
        <html lang="zh-CN">
        <head>
            <meta charset="UTF-8">
            <title>噪声片段检测 - 多步骤可视化</title>
            <style>
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body {
                    font-family: 'Segoe UI', '微软雅黑', monospace;
                    line-height: 1.6;
                    padding: 20px;
                    background-color: #f8f9fa;
                }
                .container {
                    max-width: 1400px;
                    margin: 0 auto;
                    background: white;
                    border-radius: 8px;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                    padding: 20px;
                }
                .tabs {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 5px;
                    margin-bottom: 20px;
                    border-bottom: 2px solid #ddd;
                    padding-bottom: 10px;
                }
                .tab-button {
                    padding: 8px 16px;
                    background: #f0f0f0;
                    border: 1px solid #ccc;
                    border-radius: 4px 4px 0 0;
                    cursor: pointer;
                    font-size: 14px;
                    transition: all 0.2s;
                }
                .tab-button:hover {
                    background: #e0e0e0;
                }
                .tab-button.active {
                    background: #007bff;
                    color: white;
                    border-color: #007bff;
                }
                .step-content {
                    animation: fadeIn 0.3s ease;
                }
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                .step-info {
                    background: #e9ecef;
                    padding: 10px;
                    border-radius: 5px;
                    margin-bottom: 15px;
                    font-size: 14px;
                }
                .highlighted-text {
                    white-space: pre-wrap;
                    word-wrap: break-word;
                    font-size: 14px;
                    background: #fff;
                    border: 1px solid #ddd;
                    padding: 15px;
                    border-radius: 5px;
                    overflow-x: auto;
                    max-height: 80vh;
                    overflow-y: auto;
                }
                mark {
                    border-radius: 3px;
                    padding: 0 2px;
                    color: #000;
                }
                .legend {
                    margin-top: 20px;
                    padding: 10px;
                    background: #f8f9fa;
                    border-radius: 5px;
                    font-size: 12px;
                }
                .legend-item {
                    display: inline-block;
                    margin-right: 15px;
                }
                .legend-color {
                    display: inline-block;
                    width: 20px;
                    height: 20px;
                    border-radius: 3px;
                    margin-right: 5px;
                    vertical-align: middle;
                }
            </style>
        </head>
        <body>
        <div class="container">
            <h2>噪声片段检测 - 分步可视化</h2>
            <div class="tabs">
                ${tabButtons}
            </div>
            ${stepHtmls}
            <div class="legend">
                <strong>图例：</strong>
                ${stepResults.map((result, idx) => `
                    <div class="legend-item">
                        <span class="legend-color" style="background: ${stepColors[idx % stepColors.length]}"></span>
                        <span>${escapeHtml(result.stepName)}</span>
                    </div>
                `).join('')}
            </div>
        </div>
        <script>
            // 所有步骤的滚动容器
            const scrollContainers = [];
            // 当前激活的选项卡索引
            let activeStep = 0;
            // 正在同步标志，避免循环触发
            let syncing = false;
            
            // 获取所有滚动容器
            for (let i = 0; i < ${stepResults.length}; i++) {
                const el = document.getElementById('step-scroll-' + i);
                if (el) {
                    scrollContainers.push(el);
                    // 为每个容器绑定滚动事件
                    el.addEventListener('scroll', function(e) {
                        if (syncing) return;
                        syncing = true;
                        const targetScrollTop = this.scrollTop;
                        // 同步到所有其他容器
                        for (let j = 0; j < scrollContainers.length; j++) {
                            if (scrollContainers[j] !== this) {
                                scrollContainers[j].scrollTop = targetScrollTop;
                            }
                        }
                        syncing = false;
                    });
                }
            }
            
            // 选项卡切换逻辑
            document.querySelectorAll('.tab-button').forEach(btn => {
                btn.addEventListener('click', () => {
                    // 获取当前激活的滚动位置（从当前显示的步骤）
                    const currentVisible = document.querySelector('.step-content[style*="display: block"]');
                    let currentScrollTop = 0;
                    if (currentVisible) {
                        const visiblePre = currentVisible.querySelector('.highlighted-text');
                        if (visiblePre) currentScrollTop = visiblePre.scrollTop;
                    }
                    
                    // 移除所有活动状态
                    document.querySelectorAll('.tab-button').forEach(b => b.classList.remove('active'));
                    document.querySelectorAll('.step-content').forEach(c => c.style.display = 'none');
                    
                    // 激活当前选项卡
                    btn.classList.add('active');
                    const stepId = parseInt(btn.getAttribute('data-step'));
                    activeStep = stepId;
                    const targetContent = document.getElementById('step-' + stepId);
                    if (targetContent) {
                        targetContent.style.display = 'block';
                        // 恢复滚动位置（使用之前保存的全局位置，但这里我们直接使用 currentScrollTop 来同步）
                        const targetPre = targetContent.querySelector('.highlighted-text');
                        if (targetPre && currentScrollTop !== undefined) {
                            // 为了避免触发滚动事件循环，暂时移除监听？但我们已经设置了 syncing 标志，所以安全
                            targetPre.scrollTop = currentScrollTop;
                        }
                    }
                });
            });
            
            // 默认激活第一个选项卡
            if (document.querySelector('.tab-button')) {
                document.querySelector('.tab-button').classList.add('active');
            }
        </script>
        </body>
        </html>
    `;
}

/**
 * 应用高亮标记（与之前相同）
 */
function applyHighlights(text, intervals, color) {
    if (!intervals || intervals.length === 0) {
        return escapeHtml(text);
    }
    
    const sorted = [...intervals].sort((a, b) => a.start - b.start);
    const merged = [];
    let current = sorted[0];
    for (let i = 1; i < sorted.length; i++) {
        const next = sorted[i];
        if (next.start <= current.end) {
            current.end = Math.max(current.end, next.end);
        } else {
            merged.push(current);
            current = next;
        }
    }
    merged.push(current);
    
    let result = '';
    let lastEnd = 0;
    for (const interval of merged) {
        if (interval.start > lastEnd) {
            result += escapeHtml(text.slice(lastEnd, interval.start));
        }
        result += `<mark style="background: ${color};">${escapeHtml(text.slice(interval.start, interval.end))}</mark>`;
        lastEnd = interval.end;
    }
    if (lastEnd < text.length) {
        result += escapeHtml(text.slice(lastEnd));
    }
    return result;
}

function escapeHtml(str) {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}