import { countClasses } from '../classify.js';
import { isWindowAbnormalBy3Sigma } from './anomaly.js';

// 全局缓存
let cachedParagraphs = null;
let cachedParagraphFeatures = null;
let cachedNearbyStats = null;

/**
 * 获取文本中所有自然段的起止索引
 */
export function getParagraphs(text) {
    if (cachedParagraphs) return cachedParagraphs;
    
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
    
    cachedParagraphs = paragraphs;
    return paragraphs;
}

/**
 * 计算段落的特征比例
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
 * 预计算所有段落的特征和相近段落统计
 */
export function precomputeParagraphStats(text, lenRatio = 0.2, minSimilar = 2) {
    if (cachedParagraphFeatures) return; // 已缓存
    
    const paragraphs = getParagraphs(text);
    if (paragraphs.length === 0) return;
    
    // 1. 计算每个段落的特征和长度
    const paraFeatures = new Array(paragraphs.length);
    const paraLengths = new Array(paragraphs.length);
    
    for (let i = 0; i < paragraphs.length; i++) {
        const para = paragraphs[i];
        const paraText = text.slice(para.start, para.end);
        const features = getParagraphFeatures(paraText);
        paraFeatures[i] = features;
        paraLengths[i] = para.end - para.start;
    }
    
    // 2. 预计算每个段落的相近段落统计
    cachedNearbyStats = new Array(paragraphs.length);
    
    for (let i = 0; i < paragraphs.length; i++) {
        if (!paraFeatures[i]) continue;
        
        const targetLen = paraLengths[i];
        const lowerBound = targetLen * (1 - lenRatio);
        const upperBound = targetLen * (1 + lenRatio);
        
        // 收集相似段落的特征
        let sumHan = 0, sumZhPunc = 0, sumEnChar = 0, sumEnPunc = 0, sumDigit = 0, sumOther = 0;
        let count = 0;
        
        for (let j = 0; j < paragraphs.length; j++) {
            if (i === j) continue;
            if (!paraFeatures[j]) continue;
            
            const len = paraLengths[j];
            if (len >= lowerBound && len <= upperBound) {
                const f = paraFeatures[j];
                sumHan += f.han;
                sumZhPunc += f.zhPunc;
                sumEnChar += f.enChar;
                sumEnPunc += f.enPunc;
                sumDigit += f.digit;
                sumOther += f.other;
                count++;
            }
        }
        
        if (count < minSimilar) {
            cachedNearbyStats[i] = null;
            continue;
        }
        
        // 计算均值
        const means = {
            han: sumHan / count,
            zhPunc: sumZhPunc / count,
            enChar: sumEnChar / count,
            enPunc: sumEnPunc / count,
            digit: sumDigit / count,
            other: sumOther / count
        };
        
        // 计算标准差（需要二次遍历）
        let varHan = 0, varZhPunc = 0, varEnChar = 0, varEnPunc = 0, varDigit = 0, varOther = 0;
        
        for (let j = 0; j < paragraphs.length; j++) {
            if (i === j) continue;
            if (!paraFeatures[j]) continue;
            
            const len = paraLengths[j];
            if (len >= lowerBound && len <= upperBound) {
                const f = paraFeatures[j];
                varHan += (f.han - means.han) ** 2;
                varZhPunc += (f.zhPunc - means.zhPunc) ** 2;
                varEnChar += (f.enChar - means.enChar) ** 2;
                varEnPunc += (f.enPunc - means.enPunc) ** 2;
                varDigit += (f.digit - means.digit) ** 2;
                varOther += (f.other - means.other) ** 2;
            }
        }
        
        cachedNearbyStats[i] = {
            means,
            stds: {
                han: Math.sqrt(varHan / count),
                zhPunc: Math.sqrt(varZhPunc / count),
                enChar: Math.sqrt(varEnChar / count),
                enPunc: Math.sqrt(varEnPunc / count),
                digit: Math.sqrt(varDigit / count),
                other: Math.sqrt(varOther / count)
            }
        };
    }
    
    cachedParagraphFeatures = paraFeatures;
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
 * 获取缓存的段落信息
 */
export function getCachedParagraphs() {
    return cachedParagraphs;
}

/**
 * 获取缓存的段落特征
 */
export function getCachedParagraphFeatures() {
    return cachedParagraphFeatures;
}

/**
 * 清除缓存
 */
export function clearParagraphCache() {
    cachedParagraphs = null;
    cachedParagraphFeatures = null;
    cachedNearbyStats = null;
}

/**
 * 计算排列熵（性能优化版）
 */
export function computePermutationEntropy(text, m = 3, tau = 1) {
    const len = text.length;
    if (len < m) return 0;
    
    // 快速路径：如果文本全是相同字符，直接返回0
    const firstChar = text[0];
    let allSame = true;
    for (let i = 1; i < len; i++) {
        if (text[i] !== firstChar) {
            allSame = false;
            break;
        }
    }
    if (allSame) return 0;
    
    // 转换为字符码点序列
    const seq = new Array(len);
    for (let i = 0; i < len; i++) {
        seq[i] = text.charCodeAt(i);
    }
    
    const n = seq.length;
    const patterns = new Map();
    const maxStart = n - m;
    
    for (let i = 0; i <= maxStart; i += tau) {
        // 获取窗口并计算排序索引
        const window = new Array(m);
        for (let k = 0; k < m; k++) {
            window[k] = seq[i + k];
        }
        
        // 获取排序后的索引顺序
        const indices = new Array(m);
        for (let k = 0; k < m; k++) indices[k] = k;
        indices.sort((a, b) => window[a] - window[b]);
        
        // 生成模式字符串
        const pattern = indices.join(',');
        patterns.set(pattern, (patterns.get(pattern) || 0) + 1);
    }
    
    const total = patterns.size;
    let entropy = 0;
    for (const count of patterns.values()) {
        const p = count / total;
        entropy -= p * Math.log(p);
    }
    
    const maxEntropy = Math.log(factorial(m));
    return maxEntropy === 0 ? 0 : entropy / maxEntropy;
}

function factorial(n) {
    let result = 1;
    for (let i = 2; i <= n; i++) result *= i;
    return result;
}