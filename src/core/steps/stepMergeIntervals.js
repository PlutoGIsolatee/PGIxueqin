const DEBUG = true;

/**
 * 步骤：合并重叠或相邻的区间
 * @param {Array} intervals - 输入片段列表
 * @param {string} text - 全文（未使用）
 * @returns {Array} 合并后的片段列表
 */
export function stepMergeIntervals(intervals, text) {
    if (!intervals || intervals.length === 0) return intervals;
    
    if (DEBUG) console.log('[步骤5] 合并区间');
    
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