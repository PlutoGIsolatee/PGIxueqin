import { mergeIntervals } from '../utils/intervalUtils.js';
import { config } from '../config.js';

/**
 * 步骤：合并重叠或相邻的区间
 * @param {Array} intervals - 输入片段列表
 * @param {string} text - 全文（未使用）
 * @param {Object} context - 共享上下文（未使用）
 * @returns {Array} 合并后的片段列表
 */
export function stepMergeIntervals(intervals, text, context) {
    if (!intervals || intervals.length === 0) return intervals;
    
    if (config.debug) console.log('[步骤7] 合并区间');
    
    const merged = mergeIntervals(intervals);
    if (config.debug) console.log(`[步骤7] 合并后片段数量: ${merged.length}`);
    return merged;
}