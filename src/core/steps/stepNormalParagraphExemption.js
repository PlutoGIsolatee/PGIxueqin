import { 
    getCachedParagraphs, 
    getCachedParagraphFeatures,
    getNearbyParagraphStatsCached,
    getParagraphFeatures
} from '../paragraph.js';
import { isWindowAbnormalBy3Sigma } from '../anomaly.js';
import { subtractIntervals } from '../utils/intervalUtils.js';
import { config } from '../config.js';
import { computeWindowFeatures, computeMeanStd } from '../stats.js';  // 静态导入

/**
 * 步骤：正常段落豁免
 * @param {Array} intervals - 输入片段列表
 * @param {string} text - 全文
 * @param {Object} context - 共享上下文（包含全局统计）
 * @returns {Array} 处理后的片段列表
 */
export function stepNormalParagraphExemption(intervals, text, context) {
    if (!intervals || intervals.length === 0) return intervals;
    
    if (config.debug) console.log('[步骤5] 正常段落豁免规则');
    
    const paragraphs = getCachedParagraphs();
    if (!paragraphs || paragraphs.length === 0) return intervals;
    
    // 从上下文获取全局统计（或使用回退）
    let globalStats = context.globalStats;
    if (!globalStats) {
        // 回退：重新计算全局统计
        const windows = computeWindowFeatures(text, config.windowSize, config.step);
        if (windows.length > 0) {
            globalStats = computeMeanStd(windows);
        } else {
            return intervals;
        }
    }
    
    const newIntervals = [];
    
    for (const frag of intervals) {
        if (config.debug) console.log(`处理片段 ${frag.start}-${frag.end}`);
        
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
                if (isNormalText(text, para.start, para.end, globalStats, index)) {
                    removeIntervals.push({ start: para.start, end: para.end });
                    if (config.debug) console.log(`  豁免完全包含的正常段落 ${para.start}-${para.end}`);
                }
            }
        }
        
        // 2. 处理两端未完全覆盖的段落
        const leftPara = overlappingParas.find(p => p.para.start <= frag.start && p.para.end > frag.start);
        if (leftPara) {
            const { index, para } = leftPara;
            const checkStart = Math.max(para.start, frag.start - config.extendChars);
            const checkEnd = frag.start;
            if (checkStart < checkEnd) {
                if (isNormalText(text, checkStart, checkEnd, globalStats, index)) {
                    const removeStart = frag.start;
                    const removeEnd = Math.min(frag.end, para.end);
                    if (removeStart < removeEnd) {
                        removeIntervals.push({ start: removeStart, end: removeEnd });
                        if (config.debug) console.log(`  豁免左边界段落部分 ${removeStart}-${removeEnd} (扩展区域 ${checkStart}-${checkEnd})`);
                    }
                }
            }
        }
        
        const rightPara = overlappingParas.find(p => p.para.start < frag.end && p.para.end >= frag.end);
        if (rightPara) {
            const { index, para } = rightPara;
            const checkStart = frag.end;
            const checkEnd = Math.min(para.end, frag.end + config.extendChars);
            if (checkStart < checkEnd) {
                if (isNormalText(text, checkStart, checkEnd, globalStats, index)) {
                    const removeStart = Math.max(frag.start, para.start);
                    const removeEnd = frag.end;
                    if (removeStart < removeEnd) {
                        removeIntervals.push({ start: removeStart, end: removeEnd });
                        if (config.debug) console.log(`  豁免右边界段落部分 ${removeStart}-${removeEnd} (扩展区域 ${checkStart}-${checkEnd})`);
                    }
                }
            }
        }
        
        if (removeIntervals.length === 0) {
            newIntervals.push(frag);
        } else {
            const kept = subtractIntervals(frag, removeIntervals);
            newIntervals.push(...kept);
            if (config.debug) console.log(`  裁剪后保留:`, kept);
        }
    }
    
    if (config.debug) console.log(`[步骤5] 处理完成，片段数量: ${newIntervals.length}`);
    return newIntervals;
}

function isNormalText(text, start, end, globalStats, paragraphIndex) {
    const sampleText = text.slice(start, end);
    const features = getParagraphFeatures(sampleText);
    if (!features) return false;
    
    const localStats = getNearbyParagraphStatsCached(paragraphIndex);
    if (localStats) {
        return !isWindowAbnormalBy3Sigma(features, localStats.means, localStats.stds, config.sigmaThreshold);
    }
    return !isWindowAbnormalBy3Sigma(features, globalStats.means, globalStats.stds, config.sigmaThreshold);
}