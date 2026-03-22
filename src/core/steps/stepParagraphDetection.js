import { getParagraphs, getCachedParagraphFeatures, getNearbyParagraphStatsCached, precomputeParagraphStats } from '../paragraph.js';
import { isWindowAbnormalBy3Sigma } from '../anomaly.js';

const SIGMA_THRESHOLD = 3;
const DEBUG = true;

/**
 * 第一步：基于自然段检测异常段落
 * @param {Array|null} intervals - 输入（null）
 * @param {string} text - 全文
 * @returns {Array} 异常段落对应的片段（每个段落一个区间）
 */
export function stepParagraphDetection(intervals, text) {
    if (intervals !== null) {
        // 如果不是第一步，直接返回原区间（该步骤只应在第一步执行）
        return intervals;
    }
    
    if (DEBUG) console.log('[步骤1] 开始自然段异常检测');
    
    // 预计算段落统计（特征、长度、熵、相近统计）
    precomputeParagraphStats(text, 0.2, 2);
    
    const paragraphs = getParagraphs(text);
    if (!paragraphs.length) {
        console.error('段落分割失败');
        return [];
    }
    
    // 计算全局统计（用于回退）
    const globalStats = computeGlobalStats(paragraphs, text);
    if (!globalStats) return [];
    
    const abnormalFragments = [];
    for (let i = 0; i < paragraphs.length; i++) {
        const para = paragraphs[i];
        const features = getCachedParagraphFeatures(i);
        if (!features) continue;
        
        const localStats = getNearbyParagraphStatsCached(i);
        let isAbnormal;
        if (localStats) {
            isAbnormal = isWindowAbnormalBy3Sigma(features, localStats.means, localStats.stds, SIGMA_THRESHOLD);
            if (DEBUG) console.log(`段落 ${i} (${para.start}-${para.end}) 局部基准判断异常: ${isAbnormal}`);
        } else {
            isAbnormal = isWindowAbnormalBy3Sigma(features, globalStats.means, globalStats.stds, SIGMA_THRESHOLD);
            if (DEBUG) console.log(`段落 ${i} (${para.start}-${para.end}) 全局基准判断异常: ${isAbnormal}`);
        }
        if (isAbnormal) {
            abnormalFragments.push({ start: para.start, end: para.end });
        }
    }
    
    if (DEBUG) console.log(`[步骤1] 检测到 ${abnormalFragments.length} 个异常段落`);
    return abnormalFragments;
}

function computeGlobalStats(paragraphs, text) {
    const featuresList = [];
    for (let i = 0; i < paragraphs.length; i++) {
        const features = getCachedParagraphFeatures(i);
        if (features) featuresList.push(features);
    }
    if (featuresList.length === 0) return null;
    
    const means = { han:0, zhPunc:0, enChar:0, enPunc:0, digit:0, other:0 };
    for (const f of featuresList) {
        for (const key in means) means[key] += f[key];
    }
    for (const key in means) means[key] /= featuresList.length;
    
    const stds = { han:0, zhPunc:0, enChar:0, enPunc:0, digit:0, other:0 };
    for (const f of featuresList) {
        for (const key in stds) stds[key] += (f[key] - means[key]) ** 2;
    }
    for (const key in stds) stds[key] = Math.sqrt(stds[key] / featuresList.length);
    
    return { means, stds };
}