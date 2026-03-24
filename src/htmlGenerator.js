/**
 * 生成带配置面板的多步骤高亮 HTML（通过 URL 参数传递配置）
 */
export function generateHtml(text, finalFragments, stepResults, usedSteps, availableSteps, serverConfig, currentStepConfig, currentParamConfig) {
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
    
    // 生成步骤配置面板（标记当前启用的步骤）
    const stepsList = availableSteps.map((step, idx) => {
        const isEnabled = usedSteps.some(s => s.name === step.name);
        return `
            <li data-step-name="${step.name}" class="step-item" draggable="true">
                <span class="step-handle">☰</span>
                <input type="checkbox" class="step-checkbox" value="${step.name}" ${isEnabled ? 'checked' : ''}>
                <span class="step-name">${escapeHtml(step.displayName)}</span>
            </li>
        `;
    }).join('');
    
    // 生成参数配置表单（基于 serverConfig）
    const configForm = generateConfigForm(serverConfig, currentParamConfig);
    
    // 选项卡按钮
    const tabButtons = stepResults.map((result, idx) => `
        <button class="tab-button" data-step="${idx}">${escapeHtml(result.stepName)} (${result.intervals.length})</button>
    `).join('');
    
    // 将当前配置编码为 URL 参数
    const currentSteps = usedSteps.map(s => s.name);
    const currentParams = {};
    if (currentParamConfig && currentParamConfig.params) {
        Object.assign(currentParams, currentParamConfig.params);
    }
    
    const stepsParam = encodeURIComponent(JSON.stringify(currentSteps));
    const paramsParam = encodeURIComponent(JSON.stringify(currentParams));
    const currentUrl = `/?steps=${stepsParam}&params=${paramsParam}`;
    
    return `
        <!DOCTYPE html>
        <html lang="zh-CN">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
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
                @media (max-width: 768px) {
                    body { padding: 10px; }
                    .container { padding: 15px; }
                    .config-panel { padding: 10px; }
                    .step-item { font-size: 12px; padding: 3px 6px; }
                    button { padding: 4px 8px; font-size: 12px; }
                    .tab-button { padding: 4px 8px; font-size: 12px; }
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
                .config-sections {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 20px;
                    margin-bottom: 15px;
                }
                .config-section {
                    flex: 1;
                    min-width: 200px;
                    background: white;
                    padding: 10px;
                    border-radius: 6px;
                }
                .config-section h4 {
                    margin-bottom: 8px;
                    font-size: 14px;
                    color: #333;
                }
                .config-field {
                    margin-bottom: 8px;
                    display: flex;
                    align-items: center;
                    flex-wrap: wrap;
                    gap: 8px;
                }
                .config-field label {
                    font-size: 12px;
                    width: 100px;
                    font-weight: 500;
                }
                .config-field input {
                    flex: 1;
                    min-width: 80px;
                    padding: 4px 6px;
                    border: 1px solid #ccc;
                    border-radius: 4px;
                    font-size: 12px;
                }
                .config-field input:focus {
                    outline: none;
                    border-color: #007bff;
                }
                .config-field .hint {
                    font-size: 10px;
                    color: #666;
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
                    flex-wrap: wrap;
                    gap: 10px;
                }
                button {
                    padding: 6px 12px;
                    cursor: pointer;
                    background: #007bff;
                    color: white;
                    border: none;
                    border-radius: 4px;
                    font-size: 14px;
                }
                button:hover {
                    background: #0056b3;
                }
                button.secondary {
                    background: #6c757d;
                }
                button.secondary:hover {
                    background: #545b62;
                }
                .tabs {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 5px;
                    margin-bottom: 20px;
                    border-bottom: 2px solid #ddd;
                    padding-bottom: 10px;
                    overflow-x: auto;
                }
                .tab-button {
                    padding: 8px 16px;
                    background: #f0f0f0;
                    border: 1px solid #ccc;
                    border-radius: 4px 4px 0 0;
                    cursor: pointer;
                    color: #333;
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
                    display: flex;
                    flex-wrap: wrap;
                    justify-content: space-between;
                    align-items: center;
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
                    display: flex;
                    flex-wrap: wrap;
                    gap: 10px;
                }
                .legend-item { display: inline-flex; align-items: center; margin-right: 15px; }
                .legend-color { display: inline-block; width: 20px; height: 20px; border-radius: 3px; margin-right: 5px; vertical-align: middle; }
                .loading {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0,0,0,0.5);
                    display: none;
                    justify-content: center;
                    align-items: center;
                    z-index: 1000;
                }
                .loading.active {
                    display: flex;
                }
                .loading-spinner {
                    background: white;
                    padding: 20px;
                    border-radius: 8px;
                    font-size: 16px;
                }
            </style>
        </head>
        <body>
        <div class="loading" id="loading">
            <div class="loading-spinner">正在重新计算...</div>
        </div>
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
                    <button id="reset-config" class="secondary">重置默认</button>
                </div>
            </div>
            <div class="config-panel">
                <h3>参数配置</h3>
                <div class="config-sections" id="config-sections">
                    ${configForm}
                </div>
                <div class="config-actions">
                    <button id="apply-params">应用参数并重新计算</button>
                    <button id="reset-params" class="secondary">重置参数</button>
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
                return order;
            }
            
            // 获取当前参数配置
            function getCurrentParams() {
                const params = {};
                document.querySelectorAll('.config-field input').forEach(input => {
                    const name = input.getAttribute('data-param');
                    if (name) {
                        let value;
                        if (input.type === 'checkbox') {
                            value = input.checked;
                        } else if (input.type === 'number') {
                            value = parseFloat(input.value);
                        } else {
                            value = input.value;
                        }
                        params[name] = value;
                    }
                });
                return params;
            }
            
            // 显示加载状态
            function showLoading() {
                document.getElementById('loading').classList.add('active');
            }
            
            function hideLoading() {
                document.getElementById('loading').classList.remove('active');
            }
            
            // 刷新页面（通过 URL 参数）
            function refreshWithConfig(stepOrder, params) {
                showLoading();
                const stepsParam = encodeURIComponent(JSON.stringify(stepOrder));
                const paramsParam = encodeURIComponent(JSON.stringify(params));
                const newUrl = '/?steps=' + stepsParam + '&params=' + paramsParam;
                window.location.href = newUrl;
            }
            
            // 应用步骤配置
            document.getElementById('apply-config').addEventListener('click', () => {
                const stepOrder = getCurrentStepConfig();
                const params = getCurrentParams();
                refreshWithConfig(stepOrder, params);
            });
            
            // 应用参数配置
            document.getElementById('apply-params').addEventListener('click', () => {
                const stepOrder = getCurrentStepConfig();
                const params = getCurrentParams();
                refreshWithConfig(stepOrder, params);
            });
            
            // 重置参数
            document.getElementById('reset-params').addEventListener('click', () => {
                refreshWithConfig(getCurrentStepConfig(), {});
            });
            
            // 重置默认步骤
            const defaultOrder = ${JSON.stringify(usedSteps.map(s => s.name))};
            document.getElementById('reset-config').addEventListener('click', () => {
                refreshWithConfig(defaultOrder, getCurrentParams());
            });
        </script>
        </body>
        </html>
    `;
}

/**
 * 生成参数配置表单（高亮当前值）
 */
function generateConfigForm(serverConfig, currentParamConfig) {
    if (!serverConfig) return '<div>无法加载配置</div>';
    
    const configGroups = {
        '窗口检测': ['windowSize', 'step', 'mahalPercentile'],
        '精确定位': ['refineWindowSize', 'refineStep', 'minSequenceLength', 'maxCV'],
        '豁免规则': ['entropyThreshold', 'consecutiveDigitsPattern', 'extendChars', 'sigmaThreshold'],
        '其他': ['debug']
    };
    
    const configDescriptions = {
        windowSize: '窗口大小 (字符)',
        step: '滑动步长',
        mahalPercentile: '马氏距离分位数 (0-1)',
        refineWindowSize: '精细窗口大小',
        refineStep: '精细步长',
        minSequenceLength: '最小连续窗口数',
        maxCV: '最大变异系数',
        entropyThreshold: '低熵阈值 (0-1)',
        consecutiveDigitsPattern: '连续数字正则',
        extendChars: '边界扩展字符数',
        sigmaThreshold: '3σ 阈值倍数',
        debug: '调试模式'
    };
    
    const configHints = {
        windowSize: '建议 50-200',
        step: '建议 5-20',
        mahalPercentile: '0.9-0.99',
        refineWindowSize: '5-20',
        refineStep: '1-5',
        minSequenceLength: '1-5',
        maxCV: '0.3-0.8',
        entropyThreshold: '0.3-0.6',
        extendChars: '10-50',
        sigmaThreshold: '2-4'
    };
    
    let formHtml = '';
    for (const [groupName, keys] of Object.entries(configGroups)) {
        formHtml += `
            <div class="config-section">
                <h4>${groupName}</h4>
        `;
        for (const key of keys) {
            let value = serverConfig[key];
            let inputType = 'number';
            let step = 'any';
            
            // 如果有当前参数配置，优先使用当前值
            if (currentParamConfig && currentParamConfig.params && currentParamConfig.params[key] !== undefined) {
                value = currentParamConfig.params[key];
            }
            
            if (key === 'consecutiveDigitsPattern') {
                inputType = 'text';
                if (value && typeof value === 'object' && value.source) {
                    value = value.source;
                } else if (value && typeof value === 'string') {
                    value = value;
                } else {
                    value = '';
                }
            } else if (key === 'debug') {
                inputType = 'checkbox';
                value = value ? 'checked' : '';
            } else if (typeof value === 'number') {
                step = '0.01';
                value = value.toString();
            } else {
                value = String(value);
            }
            
            const displayValue = value === 'checked' ? '' : escapeHtml(String(value));
            
            formHtml += `
                <div class="config-field">
                    <label title="${configDescriptions[key] || key}">${key}:</label>
                    <input type="${inputType}" data-param="${key}" value="${displayValue}" step="${step}" ${value === 'checked' ? 'checked' : ''}>
                    <span class="hint">${configHints[key] || ''}</span>
                </div>
            `;
        }
        formHtml += `</div>`;
    }
    return formHtml;
}

/**
 * 应用高亮标记
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