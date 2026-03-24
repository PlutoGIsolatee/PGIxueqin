/**
 * 生成带配置面板的多步骤高亮 HTML
 * @param {string} text - 原始文本
 * @param {Array} finalFragments - 最终片段（用于默认显示）
 * @param {Array} stepResults - 每步的结果 [{ stepName, intervals }]
 * @param {Array} usedSteps - 实际执行的步骤列表
 * @param {Array} availableSteps - 所有可用步骤列表
 * @returns {string}
 */
export function generateHtml(text, finalFragments, stepResults, usedSteps, availableSteps) {
    const stepColors = [
        '#ffcccc', '#ffe0cc', '#fff0cc', '#e0ffe0', '#cce0ff', '#e0ccff', '#ffccff'
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
    
    // 生成步骤配置面板（拖拽排序）
    const stepsList = availableSteps.map((step, idx) => `
        <li data-step-name="${step.name}" class="step-item" draggable="true">
            <span class="step-handle">☰</span>
            <input type="checkbox" class="step-checkbox" value="${step.name}" ${usedSteps.some(s => s.name === step.name) ? 'checked' : ''}>
            <span class="step-name">${escapeHtml(step.displayName)}</span>
        </li>
    `).join('');
    
    // 选项卡按钮
    const tabButtons = stepResults.map((result, idx) => `
        <button class="tab-button" data-step="${idx}">${escapeHtml(result.stepName)} (${result.intervals.length})</button>
    `).join('');
    
    return `
        <!DOCTYPE html>
        <html lang="zh-CN">
        <head>
            <meta charset="UTF-8">
            <title>噪声片段检测 - 可配置流水线</title>
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
                .config-panel {
                    background: #f0f0f0;
                    border-radius: 8px;
                    padding: 15px;
                    margin-bottom: 20px;
                }
                .config-panel h3 {
                    margin-bottom: 10px;
                }
                .step-list {
                    list-style: none;
                    padding: 0;
                    margin: 10px 0;
                    display: flex;
                    flex-wrap: wrap;
                    gap: 10px;
                }
                .step-item {
                    background: white;
                    border: 1px solid #ddd;
                    border-radius: 4px;
                    padding: 5px 10px;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    cursor: move;
                }
                .step-handle {
                    cursor: grab;
                    color: #888;
                }
                .step-checkbox {
                    cursor: pointer;
                }
                .step-name {
                    font-size: 14px;
                }
                .config-actions {
                    margin-top: 10px;
                    display: flex;
                    gap: 10px;
                }
                button {
                    padding: 6px 12px;
                    cursor: pointer;
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
                }
                .tab-button.active {
                    background: #007bff;
                    color: white;
                    border-color: #007bff;
                }
                .step-content {
                    animation: fadeIn 0.3s ease;
                }
                .step-info {
                    background: #e9ecef;
                    padding: 10px;
                    border-radius: 5px;
                    margin-bottom: 15px;
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
                    max-height: 60vh;
                    overflow-y: auto;
                }
                mark { border-radius: 3px; padding: 0 2px; }
                .legend {
                    margin-top: 20px;
                    padding: 10px;
                    background: #f8f9fa;
                    border-radius: 5px;
                    font-size: 12px;
                }
                .legend-item { display: inline-block; margin-right: 15px; }
                .legend-color { display: inline-block; width: 20px; height: 20px; border-radius: 3px; margin-right: 5px; vertical-align: middle; }
            </style>
        </head>
        <body>
        <div class="container">
            <h2>噪声片段检测 - 可配置流水线</h2>
            <div class="config-panel">
                <h3>步骤配置</h3>
                <p>拖拽调整顺序，勾选启用步骤，点击“重新计算”应用配置。</p>
                <ul id="step-list" class="step-list">
                    ${stepsList}
                </ul>
                <div class="config-actions">
                    <button id="apply-config">重新计算</button>
                    <button id="reset-config">重置默认</button>
                </div>
            </div>
            <div class="tabs" id="tabs">
                ${tabButtons}
            </div>
            <div id="step-contents">
                ${stepHtmls}
            </div>
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
            // 存储滚动容器
            const scrollContainers = [];
            let syncing = false;
            
            // 获取所有滚动容器并绑定同步滚动
            for (let i = 0; i < ${stepResults.length}; i++) {
                const el = document.getElementById('step-scroll-' + i);
                if (el) {
                    scrollContainers.push(el);
                    el.addEventListener('scroll', function(e) {
                        if (syncing) return;
                        syncing = true;
                        const targetScrollTop = this.scrollTop;
                        for (let j = 0; j < scrollContainers.length; j++) {
                            if (scrollContainers[j] !== this) {
                                scrollContainers[j].scrollTop = targetScrollTop;
                            }
                        }
                        syncing = false;
                    });
                }
            }
            
            // 选项卡切换
            document.querySelectorAll('.tab-button').forEach(btn => {
                btn.addEventListener('click', () => {
                    const currentVisible = document.querySelector('.step-content[style*="display: block"]');
                    let currentScrollTop = 0;
                    if (currentVisible) {
                        const visiblePre = currentVisible.querySelector('.highlighted-text');
                        if (visiblePre) currentScrollTop = visiblePre.scrollTop;
                    }
                    document.querySelectorAll('.tab-button').forEach(b => b.classList.remove('active'));
                    document.querySelectorAll('.step-content').forEach(c => c.style.display = 'none');
                    btn.classList.add('active');
                    const stepId = parseInt(btn.getAttribute('data-step'));
                    const targetContent = document.getElementById('step-' + stepId);
                    if (targetContent) {
                        targetContent.style.display = 'block';
                        const targetPre = targetContent.querySelector('.highlighted-text');
                        if (targetPre && currentScrollTop !== undefined) {
                            targetPre.scrollTop = currentScrollTop;
                        }
                    }
                });
            });
            if (document.querySelector('.tab-button')) {
                document.querySelector('.tab-button').classList.add('active');
            }
            
            // 拖拽排序
            let dragSrc = null;
            const stepList = document.getElementById('step-list');
            const items = stepList.querySelectorAll('.step-item');
            items.forEach(item => {
                item.setAttribute('draggable', 'true');
                item.addEventListener('dragstart', (e) => {
                    dragSrc = item;
                    e.dataTransfer.effectAllowed = 'move';
                });
                item.addEventListener('dragover', (e) => {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = 'move';
                });
                item.addEventListener('drop', (e) => {
                    e.preventDefault();
                    if (dragSrc !== item) {
                        stepList.insertBefore(dragSrc, item.nextSibling);
                    }
                });
            });
            
            // 获取当前步骤顺序和启用的步骤
            function getCurrentStepConfig() {
                const order = [];
                const items = stepList.querySelectorAll('.step-item');
                items.forEach(item => {
                    const name = item.getAttribute('data-step-name');
                    const enabled = item.querySelector('.step-checkbox').checked;
                    if (enabled) {
                        order.push(name);
                    }
                });
                return { steps: order };
            }
            
            // 应用配置
            document.getElementById('apply-config').addEventListener('click', async () => {
                const config = getCurrentStepConfig();
                const response = await fetch('/api/run', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(config)
                });
                if (response.ok) {
                    const html = await response.text();
                    document.open();
                    document.write(html);
                    document.close();
                } else {
                    const error = await response.text();
                    alert('重新计算失败: ' + error);
                }
            });
            
            // 重置默认
            const defaultOrder = ${JSON.stringify(usedSteps.map(s => s.name))};
            document.getElementById('reset-config').addEventListener('click', async () => {
                const items = stepList.querySelectorAll('.step-item');
                const defaultList = [];
                defaultOrder.forEach(name => {
                    const item = Array.from(items).find(i => i.getAttribute('data-step-name') === name);
                    if (item) defaultList.push(item);
                });
                stepList.innerHTML = '';
                defaultList.forEach(item => stepList.appendChild(item));
                items.forEach(item => {
                    const cb = item.querySelector('.step-checkbox');
                    cb.checked = true;
                });
                document.getElementById('apply-config').click();
            });
        </script>
        </body>
        </html>
    `;
}

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