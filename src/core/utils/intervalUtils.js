/**
 * 合并重叠或相邻的区间
 * @param {Array<{start, end}>} intervals - 区间列表
 * @returns {Array<{start, end}>} 合并后的区间
 */
export function mergeIntervals(intervals) {
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
 * 从片段中移除指定的区间
 * @param {Object} fragment - { start, end }
 * @param {Array<{start, end}>} removeIntervals - 要移除的区间列表
 * @returns {Array<{start, end}>} 裁剪后的片段列表
 */
export function subtractIntervals(fragment, removeIntervals) {
    if (removeIntervals.length === 0) return [fragment];
    const result = [];
    let currentStart = fragment.start;
    const sorted = [...removeIntervals].sort((a, b) => a.start - b.start);
    for (const rem of sorted) {
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
 * 修剪片段首尾空白字符
 * @param {string} text - 全文
 * @param {Object} fragment - { start, end }
 * @returns {Object} 修剪后的片段
 */
export function trimFragment(text, start, end) {
    let newStart = start;
    let newEnd = end;
    while (newStart < newEnd && /\s/.test(text[newStart])) newStart++;
    while (newEnd > newStart && /\s/.test(text[newEnd - 1])) newEnd--;
    return { start: newStart, end: newEnd };
}