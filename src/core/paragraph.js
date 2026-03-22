import { countClasses } from '../classify.js';
import { isWindowAbnormalBy3Sigma } from './anomaly.js';

// 缓存全局段落信息和预计算的相似段落统计
let cachedParagraphs = null;
let cachedParagraphFeatures = null;
let cachedParagraphLengths = null;
let cachedNearbyStats = null;
let cachedEntropies = null;

/**
 * 获取文本中所有自然段的起止索引（基于换行符分割）
 */
export function getParagraphs(text) {
    const paragraphs = [];
    let start = 0;
    const lineBreakRegex = /\r?\n/g;
    let match;
    while ((match = lineBreakRegex.exec(text)) !== null) {
        const end = match.index;
        if (end > start) paragraphs.push({ start, end });
        start = end + match[0].length;
    }
    if (start < text.length) paragraphs.push({ start, end: text.length });
    return paragraphs;
}

/**
 * 计算段落的特征比例（与全局统计一致）
 */
export function getParagraphFeatures(paraText) {
    const counts = countClasses(paraText);
    if (counts.total === 0) return null;
    const hanTotal = counts.zhChar.reduce((a,b)=>a+b,0);
    const enTotal = counts.enChar.reduce((a,b)=>a+b,0);
    return {
        han: hanTotal / counts.total,
        zhPunc: counts.zhPunc / counts.total,
        enChar: enTotal / counts.total,
        enPunc: counts.enPunc / counts.total,
        digit: counts.digit / counts.total,
        other: counts.other / counts.total
    };
}

/**
 * 判断段落是否异常（基于全局3σ）
 */
export function isParagraphAbnormal(paraText, globalStats, sigma = 3) {
    const features = getParagraphFeatures(paraText);
    if (!features) return false;
    return isWindowAbnormalBy3Sigma(features, globalStats.means, globalStats.stds, sigma);
}

/**
 * 预计算所有段落的特征、长度和排列熵，并计算相近段落统计
 */
export function precomputeParagraphStats(text, lenRatio = 0.2, minSimilar = 2) {
    if (cachedParagraphs !== null) return; // 已缓存
    
    cachedParagraphs = getParagraphs(text);
    if (cachedParagraphs.length === 0) return;
    
    const n = cachedParagraphs.length;
    cachedParagraphFeatures = new Array(n);
    cachedParagraphLengths = new Array(n);
    cachedEntropies = new Array(n);
    
    // 1. 计算每个段落的特征、长度和排列熵
    for (let i = 0; i < n; i++) {
        const para = cachedParagraphs[i];
        const paraText = text.slice(para.start, para.end);
        cachedParagraphFeatures[i] = getParagraphFeatures(paraText);
        cachedParagraphLengths[i] = para.end - para.start;
        cachedEntropies[i] = computePermutationEntropy(paraText);
    }
    
    // 2. 预计算每个段落的相近段落统计
    cachedNearbyStats = new Array(n);
    
    for (let i = 0; i < n; i++) {
        const targetLen = cachedParagraphLengths[i];
        const lowerBound = targetLen * (1 - lenRatio);
        const upperBound = targetLen * (1 + lenRatio);
        const similarFeatures = [];
        
        for (let j = 0; j < n; j++) {
            if (i === j) continue;
            const len = cachedParagraphLengths[j];
            if (len >= lowerBound && len <= upperBound) {
                if (cachedParagraphFeatures[j]) similarFeatures.push(cachedParagraphFeatures[j]);
            }
        }
        
        if (similarFeatures.length < minSimilar) {
            cachedNearbyStats[i] = null; // 回退到全局统计
            continue;
        }
        
        // 计算均值和标准差
        const means = { han:0, zhPunc:0, enChar:0, enPunc:0, digit:0, other:0 };
        for (const f of similarFeatures) {
            for (const key in means) means[key] += f[key];
        }
        for (const key in means) means[key] /= similarFeatures.length;
        
        const stds = { han:0, zhPunc:0, enChar:0, enPunc:0, digit:0, other:0 };
        for (const f of similarFeatures) {
            for (const key in stds) stds[key] += (f[key] - means[key]) ** 2;
        }
        for (const key in stds) stds[key] = Math.sqrt(stds[key] / similarFeatures.length);
        
        cachedNearbyStats[i] = { means, stds };
    }
}

/**
 * 获取缓存的段落信息
 */
export function getCachedParagraphs() {
    return cachedParagraphs;
}

/**
 * 获取缓存的段落特征
 */
export function getCachedParagraphFeatures(index) {
    if (!cachedParagraphFeatures) return null;
    return cachedParagraphFeatures[index];
}

/**
 * 获取缓存的段落排列熵
 */
export function getCachedParagraphEntropy(index) {
    if (!cachedEntropies) return null;
    return cachedEntropies[index];
}

/**
 * 获取与目标段落长度相近的段落的特征统计（使用预计算缓存）
 */
export function getNearbyParagraphStatsCached(paragraphIndex) {
    if (!cachedNearbyStats) return null;
    if (paragraphIndex < 0 || paragraphIndex >= cachedNearbyStats.length) return null;
    return cachedNearbyStats[paragraphIndex];
}

/**
 * 清除缓存（用于重新加载文本时）
 */
export function clearParagraphCache() {
    cachedParagraphs = null;
    cachedParagraphFeatures = null;
    cachedParagraphLengths = null;
    cachedNearbyStats = null;
    cachedEntropies = null;
}

/**
 * 计算排列熵（Permutation Entropy），直接基于字符的Unicode码点
 */
export function computePermutationEntropy(text, m = 3, tau = 1) {
    if (text.length < m) return 0;
    const seq = [];
    for (let i = 0; i < text.length; i++) {
        seq.push(text.charCodeAt(i));
    }
    const n = seq.length;
    const patterns = new Map();
    for (let i = 0; i <= n - m; i += tau) {
        const window = seq.slice(i, i + m);
        const sortedIndices = [...window.keys()].sort((a, b) => window[a] - window[b]);
        const pattern = sortedIndices.join(',');
        patterns.set(pattern, (patterns.get(pattern) || 0) + 1);
    }
    const total = Array.from(patterns.values()).reduce((a,b)=>a+b,0);
    let entropy = 0;
    for (const count of patterns.values()) {
        const p = count / total;
        entropy -= p * Math.log(p);
    }
    const maxEntropy = Math.log(factorial(m));
    return maxEntropy === 0 ? 0 : entropy / maxEntropy;
}

function factorial(n) {
    if (n <= 1) return 1;
    return n * factorial(n - 1);
}