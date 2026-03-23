/**
 * 合并连续的异常窗口
 * @param {Array} windows - 窗口列表，每个包含 start, end, isAbnormal
 * @returns {Array} 合并后的片段列表
 */
export function mergeWindows(windows) {
    const fragments = [];
    let current = null;
    for (const win of windows) {
        if (win.isAbnormal) {
            if (!current) {
                current = { start: win.start, end: win.end };
            } else {
                if (win.start - current.end <= 10) { // MAX_WINDOW_GAP
                    current.end = Math.max(current.end, win.end);
                } else {
                    fragments.push(current);
                    current = { start: win.start, end: win.end };
                }
            }
        } else {
            if (current) {
                fragments.push(current);
                current = null;
            }
        }
    }
    if (current) fragments.push(current);
    return fragments;
}