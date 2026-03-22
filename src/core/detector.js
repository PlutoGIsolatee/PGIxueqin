import { computeMeanStd } from './stats.js';
import { isWindowAbnormalBy3Sigma } from './anomaly.js';
import { mergeWindows } from './refine.js';
import { EXEMPTION_RULES, initParagraphStats } from './exemptions.js';
import { 
    getParagraphs, 
    getCachedParagraphs, 
    getNearbyParagraphStatsCached, 
    getCachedParagraphFeatures
} from './paragraph.js';

const SIGMA_THRESHOLD = 3;
const DEBUG = true;

/**
 * 从片段中移除指定的区间（全局坐标），返回新的片段列表（可能多个）
 */
function subtractIntervals(fragment, removeIntervals) {
    const result = [];
    let currentStart = fragment.start;
    for (const rem of removeIntervals) {
        if (rem.end <= fragment.start || rem.start >= fragment.end) continue;
        const start = Math.max(currentStart, rem.start);
        const end = Math.min(fragment.end, rem.end);
        if (start > currentStart) {
            result.push({ start: currentStart, end: start });
        }
        currentStart = Math.max(currentStart, end);
        if (currentStart >= fragment.end) break;
    }
    if (currentStart < fragment.end) {
        result.push({ start: currentStart, end: fragment.end });
    }
    return result;
}

/**
 * 合并重叠或相邻的区间
 */
function mergeIntervals(intervals) {
    if (intervals.length === 0) return [];
    intervals.sort((a, b) => a.start - b.start);
    const merged = [];
    let current = intervals[0];
    for (let i = 1; i < intervals.length; i++) {
        const next = intervals[i];
        if (next.start <= current.end) {
            current.end = Math.max(current.end, next.end);
        } else {
            merged.push(current);
            current = next;
        }
    }
    merged.push(current);
    return merged;
}

/**
 * 对片段列表应用豁免规则，返回新的片段列表
 */
function applyExemptions(fragments, text, globalStats, paragraphs) {
    const safeParagraphs = Array.isArray(paragraphs) ? paragraphs : [];
    let currentFragments = fragments;
    for (const rule of EXEMPTION_RULES) {
        const nextFragments = [];
        for (const frag of currentFragments) {
            const fragmentObj = {
                start: frag.start,
                end: frag.end,
                text: text.slice(frag.start, frag.end)
            };
            const context = {
                paragraphs: safeParagraphs,
                text,
                entropyThreshold: 0.4,
                sigma: SIGMA_THRESHOLD
            };
            let removeIntervals = rule(fragmentObj, globalStats, context);
            if (removeIntervals.length === 0) {
                nextFragments.push(frag);
            } else {
                removeIntervals = mergeIntervals(removeIntervals);
                const kept = subtractIntervals(frag, removeIntervals);
                nextFragments.push(...kept);
            }
        }
        currentFragments = nextFragments;
        if (currentFragments.length === 0) break;
    }
    return currentFragments;
}

/**
 * 修剪片段首尾空白字符
 */
function trimFragment(text, start, end) {
    let newStart = start;
    let newEnd = end;
    while (newStart < newEnd && /\s/.test(text[newStart])) newStart++;
    while (newEnd > newStart && /\s/.test(text[newEnd - 1])) newEnd--;
    return { start: newStart, end: newEnd };
}

/**
 * 从段落计算全局统计（均值、标准差）
 */
function computeGlobalStatsFromParagraphs(paragraphs, text) {
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

export function detectNoiseFragments(text) {
    if (DEBUG) console.log('开始检测，文本长度:', text.length);
    
    // 1. 预计算段落统计（长度、特征、熵、相近段落统计）
    initParagraphStats(text, 0.2, 2);
    
    // 2. 获取所有段落
    const paragraphs = getParagraphs(text);
    if (!Array.isArray(paragraphs) || paragraphs.length === 0) {
        console.error('段落分割失败或文本为空');
        return [];
    }
    if (DEBUG) console.log(`段落总数: ${paragraphs.length}`);
    
    // 3. 为每个段落计算异常标记（基于局部基准或全局基准）
    const globalStats = computeGlobalStatsFromParagraphs(paragraphs, text);
    if (!globalStats) return [];
    
    const paragraphAbnormal = new Array(paragraphs.length);
    for (let i = 0; i < paragraphs.length; i++) {
        const para = paragraphs[i];
        const features = getCachedParagraphFeatures(i);
        if (!features) {
            paragraphAbnormal[i] = false;
            continue;
        }
        
        // 尝试使用局部基准
        const localStats = getNearbyParagraphStatsCached(i);
        let isAbnormal;
        if (localStats) {
            isAbnormal = isWindowAbnormalBy3Sigma(features, localStats.means, localStats.stds, SIGMA_THRESHOLD);
            if (DEBUG) console.log(`段落 ${i} (${para.start}-${para.end}) 局部基准判断异常: ${isAbnormal}`);
        } else {
            isAbnormal = isWindowAbnormalBy3Sigma(features, globalStats.means, globalStats.stds, SIGMA_THRESHOLD);
            if (DEBUG) console.log(`段落 ${i} (${para.start}-${para.end}) 全局基准判断异常: ${isAbnormal}`);
        }
        paragraphAbnormal[i] = isAbnormal;
    }
    
    // 4. 将连续异常段落合并为窗口对象（用于 mergeWindows）
    const windows = [];
    for (let i = 0; i < paragraphs.length; i++) {
        windows.push({
            start: paragraphs[i].start,
            end: paragraphs[i].end,
            isAbnormal: paragraphAbnormal[i]
        });
    }
    let firstFragments = mergeWindows(windows);
    if (DEBUG) console.log('初次检测片段（异常段落合并）:', firstFragments);
    
    // 5. 应用豁免规则（连续数字豁免、低熵段落豁免）
    const afterExemptions = applyExemptions(firstFragments, text, globalStats, paragraphs);
    if (DEBUG) console.log('豁免后片段:', afterExemptions);
    
    // 6. 最终修剪空白并返回
    const trimmedFragments = [];
    for (const frag of afterExemptions) {
        const trimmed = trimFragment(text, frag.start, frag.end);
        if (trimmed.start < trimmed.end) {
            trimmedFragments.push(trimmed);
        }
    }
    if (DEBUG) console.log('最终片段:', trimmedFragments);
    return trimmedFragments;
}