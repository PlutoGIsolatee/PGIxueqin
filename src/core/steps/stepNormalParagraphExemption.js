import { 
    getCachedParagraphs, 
    getCachedParagraphFeatures,
    getNearbyParagraphStatsCached,
    getParagraphFeatures
} from '../paragraph.js';
import { isWindowAbnormalBy3Sigma } from '../anomaly.js';
import { computeWindowFeatures, computeMeanStd } from '../stats.js';

const DEBUG = true;
const SIGMA_THRESHOLD = 3;
const EXTEND_CHARS = 20;  // 两端扩展的最大字符数

// 缓存全局统计（避免重复计算）
let cachedGlobalStats = null;

function getGlobalStats(text) {
    if (cachedGlobalStats) return cachedGlobalStats;
    const windows = computeWindowFeatures(text, 100, 10);
    if (windows.length === 0) return null;
    const stats = computeMeanStd(windows);
    cachedGlobalStats = stats;
    return stats;
}

/**
 * 裁剪片段：移除指定的区间
 */
function subtractIntervals(fragment, removeIntervals) {
    const result = [];
    let currentStart = fragment.start;
    removeIntervals.sort((a,b)=>a.start-b.start);
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
 * 判断一个段落的特征是否正常（基于局部或全局基准）
 * @param {string} text - 全文
 * @param {number} start - 起始位置
 * @param {number} end - 结束位置
 * @param {Object} globalStats - 全局统计
 * @param {number} paragraphIndex - 段落索引（用于获取局部基准）
 * @returns {boolean} true 表示正常（应豁免），false 表示异常（保留）
 */
function isNormalText(text, start, end, globalStats, paragraphIndex) {
    const sampleText = text.slice(start, end);
    const features = getParagraphFeatures(sampleText);
    if (!features) return false;
    
    // 优先使用局部基准
    const localStats = getNearbyParagraphStatsCached(paragraphIndex);
    if (localStats) {
        return !isWindowAbnormalBy3Sigma(features, localStats.means, localStats.stds, SIGMA_THRESHOLD);
    }
    // 回退到全局基准
    return !isWindowAbnormalBy3Sigma(features, globalStats.means, globalStats.stds, SIGMA_THRESHOLD);
}

/**
 * 步骤：正常段落豁免
 * 规则：
 * 1. 完全在片段内部的自然段，若特征正常则豁免
 * 2. 片段两端未完全覆盖的自然段，从边界处向外扩展最多 20 字符，若扩展后区域正常则豁免该边界部分
 * @param {Array} intervals - 输入片段列表
 * @param {string} text - 全文
 * @returns {Array} 处理后的片段列表
 */
export function stepNormalParagraphExemption(intervals, text) {
    if (!intervals || intervals.length === 0) return intervals;
    
    if (DEBUG) console.log('[步骤5] 正常段落豁免规则');
    
    const paragraphs = getCachedParagraphs();
    if (!paragraphs || paragraphs.length === 0) return intervals;
    
    // 获取全局统计
    const globalStats = getGlobalStats(text);
    if (!globalStats) return intervals;
    
    const newIntervals = [];
    
    for (const frag of intervals) {
        if (DEBUG) console.log(`处理片段 ${frag.start}-${frag.end}`);
        
        // 找出与片段重叠的所有段落
        const overlappingParas = [];
        for (let i = 0; i < paragraphs.length; i++) {
            const para = paragraphs[i];
            if (para.start >= frag.end || para.end <= frag.start) continue;
            overlappingParas.push({ index: i, para });
        }
        
        if (overlappingParas.length === 0) {
            newIntervals.push(frag);
            continue;
        }
        
        const removeIntervals = [];
        
        // 1. 处理完全包含的段落（中间段落）
        for (const { index, para } of overlappingParas) {
            if (para.start >= frag.start && para.end <= frag.end) {
                // 完全包含
                if (isNormalText(text, para.start, para.end, globalStats, index)) {
                    removeIntervals.push({ start: para.start, end: para.end });
                    if (DEBUG) console.log(`  豁免完全包含的正常段落 ${para.start}-${para.end}`);
                }
            }
        }
        
        // 2. 处理两端未完全覆盖的段落
        // 左端：片段起始所在的段落
        const leftPara = overlappingParas.find(p => p.para.start <= frag.start && p.para.end > frag.start);
        if (leftPara) {
            const { index, para } = leftPara;
            const checkStart = Math.max(para.start, frag.start - EXTEND_CHARS);
            const checkEnd = frag.start;
            if (checkStart < checkEnd) {
                if (isNormalText(text, checkStart, checkEnd, globalStats, index)) {
                    // 正常，移除该段落在片段中的部分
                    const removeStart = frag.start;
                    const removeEnd = Math.min(frag.end, para.end);
                    if (removeStart < removeEnd) {
                        removeIntervals.push({ start: removeStart, end: removeEnd });
                        if (DEBUG) console.log(`  豁免左边界段落部分 ${removeStart}-${removeEnd} (扩展区域 ${checkStart}-${checkEnd})`);
                    }
                }
            }
        }
        
        // 右端：片段结束所在的段落
        const rightPara = overlappingParas.find(p => p.para.start < frag.end && p.para.end >= frag.end);
        if (rightPara) {
            const { index, para } = rightPara;
            const checkStart = frag.end;
            const checkEnd = Math.min(para.end, frag.end + EXTEND_CHARS);
            if (checkStart < checkEnd) {
                if (isNormalText(text, checkStart, checkEnd, globalStats, index)) {
                    // 正常，移除该段落在片段中的部分
                    const removeStart = Math.max(frag.start, para.start);
                    const removeEnd = frag.end;
                    if (removeStart < removeEnd) {
                        removeIntervals.push({ start: removeStart, end: removeEnd });
                        if (DEBUG) console.log(`  豁免右边界段落部分 ${removeStart}-${removeEnd} (扩展区域 ${checkStart}-${checkEnd})`);
                    }
                }
            }
        }
        
        if (removeIntervals.length === 0) {
            newIntervals.push(frag);
        } else {
            const kept = subtractIntervals(frag, removeIntervals);
            newIntervals.push(...kept);
            if (DEBUG) console.log(`  裁剪后保留:`, kept);
        }
    }
    
    if (DEBUG) console.log(`[步骤5] 处理完成，片段数量: ${newIntervals.length}`);
    return newIntervals;
}