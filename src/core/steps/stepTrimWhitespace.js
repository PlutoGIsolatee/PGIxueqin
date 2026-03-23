import { trimFragment } from '../utils/intervalUtils.js';
import { config } from '../config.js';

/**
 * 步骤：修剪片段首尾空白字符
 * @param {Array} intervals - 输入片段列表
 * @param {string} text - 全文
 * @param {Object} context - 共享上下文（未使用）
 * @returns {Array} 修剪后的片段列表
 */
export function stepTrimWhitespace(intervals, text, context) {
    if (!intervals || intervals.length === 0) return intervals;
    
    if (config.debug) console.log('[步骤6] 修剪空白');
    
    const newIntervals = [];
    for (const frag of intervals) {
        const trimmed = trimFragment(text, frag.start, frag.end);
        if (trimmed.start < trimmed.end) {
            newIntervals.push(trimmed);
        }
    }
    return newIntervals;
}