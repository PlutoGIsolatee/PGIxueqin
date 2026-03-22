const DEBUG = true;

/**
 * 步骤：修剪片段首尾空白字符（包括换行、空格等）
 * @param {Array} intervals - 输入片段列表
 * @param {string} text - 全文
 * @returns {Array} 修剪后的片段列表
 */
export function stepTrimWhitespace(intervals, text) {
    if (!intervals || intervals.length === 0) return intervals;
    
    if (DEBUG) console.log('[步骤4] 修剪空白');
    
    const newIntervals = [];
    for (const frag of intervals) {
        let start = frag.start;
        let end = frag.end;
        while (start < end && /\s/.test(text[start])) start++;
        while (end > start && /\s/.test(text[end - 1])) end--;
        if (start < end) {
            newIntervals.push({ start, end });
        }
    }
    return newIntervals;
}