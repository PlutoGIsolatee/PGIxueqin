import { countClasses } from '../classify.js';

// 定义特征提取规则（与 countClasses 字段对应）
export const FEATURES = [
    { name: 'han',         getValue: (counts) => counts.zhChar.reduce((a,b)=>a+b,0) / counts.total },
    { name: 'zhPunc',      getValue: (counts) => counts.zhPunc / counts.total },
    { name: 'enChar',      getValue: (counts) => counts.enChar.reduce((a,b)=>a+b,0) / counts.total },
    { name: 'enPunc',      getValue: (counts) => counts.enPunc / counts.total },
    { name: 'digit',       getValue: (counts) => counts.digit / counts.total },
    { name: 'other',       getValue: (counts) => counts.other / counts.total }
];

/**
 * 计算滑动窗口的特征值
 * @param {string} text - 文本
 * @param {number} windowSize - 窗口大小
 * @param {number} step - 步长
 * @returns {Array<{start: number, end: number, features: Object}>}
 */
export function computeWindowFeatures(text, windowSize, step) {
    const len = text.length;
    const windows = [];
    for (let start = 0; start < len; start += step) {
        const end = Math.min(start + windowSize, len);
        const windowText = text.slice(start, end);
        const counts = countClasses(windowText);
        if (counts.total === 0) continue;
        const features = {};
        for (const f of FEATURES) {
            features[f.name] = f.getValue(counts);
        }
        windows.push({ start, end, features });
    }
    return windows;
}

/**
 * 计算各特征的均值和标准差
 * @param {Array<Object>} windows - 窗口列表，每个包含 features
 * @returns {Object} { means: {}, stds: {} }
 */
export function computeMeanStd(windows) {
    const sums = {};
    const sumsq = {};
    for (const f of FEATURES) {
        sums[f.name] = 0;
        sumsq[f.name] = 0;
    }
    const n = windows.length;
    for (const win of windows) {
        for (const f of FEATURES) {
            const val = win.features[f.name];
            sums[f.name] += val;
            sumsq[f.name] += val * val;
        }
    }
    const means = {};
    const stds = {};
    for (const f of FEATURES) {
        const mean = sums[f.name] / n;
        const variance = (sumsq[f.name] / n) - mean * mean;
        const std = Math.sqrt(Math.max(0, variance));
        means[f.name] = mean;
        stds[f.name] = std;
    }
    return { means, stds };
}