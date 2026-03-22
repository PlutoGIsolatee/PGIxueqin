import { countClasses } from '../classify.js';
import { isWindowAbnormalBy3Sigma } from './anomaly.js';
import { 
    getCachedParagraphs,
    getCachedParagraphEntropy,
    computePermutationEntropy
} from './paragraph.js';
import { getGlobalStats } from './detector.js';

const DEBUG = true;

/**
 * 从片段中移除指定的区间
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
 * 规则：连续数字豁免
 */
function ruleConsecutiveDigits(fragment, globalStats) {
    try {
        const hasConsecutiveDigits = /\d{3,}/.test(fragment.text);
        if (!hasConsecutiveDigits) return [];
        const processed = fragment.text.replace(/\d{3,}/g, ' ');
        const counts = countClasses(processed);
        if (counts.total === 0) return [];
        const hanTotal = counts.zhChar.reduce((a,b)=>a+b,0);
        const enTotal = counts.enChar.reduce((a,b)=>a+b,0);
        const features = {
            han: hanTotal / counts.total,
            zhPunc: counts.zhPunc / counts.total,
            enChar: enTotal / counts.total,
            enPunc: counts.enPunc / counts.total,
            digit: counts.digit / counts.total,
            other: counts.other / counts.total
        };
        if (!isWindowAbnormalBy3Sigma(features, globalStats.means, globalStats.stds, 3)) {
            if (DEBUG) console.log(`[ruleConsecutiveDigits] 豁免整个片段: ${fragment.start}-${fragment.end}`);
            return [{ start: fragment.start, end: fragment.end }];
        }
        return [];
    } catch (err) {
        console.error(`[ruleConsecutiveDigits] 处理出错:`, err);
        return [];
    }
}

/**
 * 规则：低熵段落豁免
 */
function ruleRemoveLowEntropyParagraphs(fragment, text, paragraphs, entropyThreshold = 0.4) {
    try {
        if (!paragraphs) return [];
        const removeIntervals = [];
        const cachedParagraphs = getCachedParagraphs();
        for (const para of paragraphs) {
            if (para.start >= fragment.end || para.end <= fragment.start) continue;
            let entropy;
            if (cachedParagraphs) {
                const paraIndex = cachedParagraphs.findIndex(p => p.start === para.start && p.end === para.end);
                if (paraIndex !== -1) {
                    entropy = getCachedParagraphEntropy(paraIndex);
                }
            }
            if (entropy === undefined) {
                const paraText = text.slice(para.start, para.end);
                entropy = computePermutationEntropy(paraText);
            }
            if (entropy < entropyThreshold) {
                const overlapStart = Math.max(fragment.start, para.start);
                const overlapEnd = Math.min(fragment.end, para.end);
                if (overlapStart < overlapEnd) {
                    removeIntervals.push({ start: overlapStart, end: overlapEnd });
                    if (DEBUG) console.log(`[ruleRemoveLowEntropyParagraphs] 移除低熵段落 ${para.start}-${para.end} 重叠部分 ${overlapStart}-${overlapEnd}, 熵=${entropy}`);
                }
            }
        }
        removeIntervals.sort((a, b) => a.start - b.start);
        return removeIntervals;
    } catch (err) {
        console.error(`[ruleRemoveLowEntropyParagraphs] 处理出错:`, err);
        return [];
    }
}

/**
 * 第二步：应用豁免规则
 * @param {Array} intervals - 上一步的片段
 * @param {string} text - 原文本
 * @returns {Array} 裁剪后的片段
 */
export function stepApplyExemptions(intervals, text) {
    if (DEBUG) console.log('[Step2] 开始应用豁免规则...');
    const globalStats = getGlobalStats();
    if (!globalStats) {
        console.error('无法获取全局统计，跳过豁免');
        return intervals;
    }
    const paragraphs = getParagraphs(text); // 需要从 paragraph.js 导入 getParagraphs
    if (!paragraphs) return intervals;

    let currentIntervals = intervals;
    // 应用连续数字规则
    const rule1Results = [];
    for (const frag of currentIntervals) {
        const fragmentObj = { start: frag.start, end: frag.end, text: text.slice(frag.start, frag.end) };
        const remove = ruleConsecutiveDigits(fragmentObj, globalStats);
        if (remove.length === 0) {
            rule1Results.push(frag);
        } else {
            const kept = subtractIntervals(frag, mergeIntervals(remove));
            rule1Results.push(...kept);
        }
    }
    currentIntervals = rule1Results;
    if (DEBUG) console.log('[Step2] 连续数字规则处理后片段数:', currentIntervals.length);

    // 应用低熵段落规则
    const rule2Results = [];
    for (const frag of currentIntervals) {
        const fragmentObj = { start: frag.start, end: frag.end, text: text.slice(frag.start, frag.end) };
        const remove = ruleRemoveLowEntropyParagraphs(fragmentObj, text, paragraphs);
        if (remove.length === 0) {
            rule2Results.push(frag);
        } else {
            const kept = subtractIntervals(frag, mergeIntervals(remove));
            rule2Results.push(...kept);
        }
    }
    if (DEBUG) console.log('[Step2] 低熵段落规则处理后片段数:', rule2Results.length);
    return rule2Results;
}