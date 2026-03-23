import { countClasses } from '../../classify.js';
import { isWindowAbnormalBy3Sigma } from '../anomaly.js';
import { computeWindowFeatures, computeMeanStd } from '../stats.js';
import { subtractIntervals } from '../utils/intervalUtils.js';
import { config } from '../config.js';

// 缓存全局统计（避免重复计算）
let cachedGlobalStats = null;

function getGlobalStats(text) {
    if (cachedGlobalStats) return cachedGlobalStats;
    const windows = computeWindowFeatures(text, config.windowSize, config.step);
    if (windows.length === 0) return null;
    const stats = computeMeanStd(windows);
    cachedGlobalStats = stats;
    return stats;
}

/**
 * 步骤：对片段进行连续数字豁免
 * 如果片段包含至少三个连续数字，且移除数字后特征恢复正常（3σ内），则移除整个片段
 * @param {Array} intervals - 输入片段列表
 * @param {string} text - 全文
 * @param {Object} context - 共享上下文（未使用）
 * @returns {Array} 处理后的片段列表
 */
export function stepConsecutiveDigits(intervals, text, context) {
    if (!intervals || intervals.length === 0) return intervals;
    
    if (config.debug) console.log('[步骤3] 连续数字豁免');
    
    const globalStats = getGlobalStats(text);
    if (!globalStats) return intervals;
    
    const newIntervals = [];
    for (const frag of intervals) {
        const fragmentText = text.slice(frag.start, frag.end);
        const hasConsecutiveDigits = config.consecutiveDigitsPattern.test(fragmentText);
        if (!hasConsecutiveDigits) {
            newIntervals.push(frag);
            continue;
        }
        const processed = fragmentText.replace(config.consecutiveDigitsPattern, ' ');
        const counts = countClasses(processed);
        if (counts.total === 0) {
            newIntervals.push(frag);
            continue;
        }
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
        if (!isWindowAbnormalBy3Sigma(features, globalStats.means, globalStats.stds, config.sigmaThreshold)) {
            if (config.debug) console.log(`[步骤3] 豁免片段 ${frag.start}-${frag.end}`);
            // 整个片段豁免，不加入新列表
        } else {
            newIntervals.push(frag);
        }
    }
    return newIntervals;
}