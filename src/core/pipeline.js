/**
 * 执行步骤流水线
 * @param {Array<Function>} steps - 步骤函数数组，每个函数签名 (intervals, text) => intervals
 * @param {string} text - 原始文本
 * @returns {Array} 最终片段区间列表
 */
export function runPipeline(steps, text) {
    let intervals = null; // 初始为 null，第一步会特殊处理
    for (const step of steps) {
        try {
            intervals = step(intervals, text);
            // 确保返回值是数组
            if (!Array.isArray(intervals)) {
                console.error(`步骤 ${step.name} 返回的不是数组:`, intervals);
                intervals = [];
            }
        } catch (err) {
            console.error(`步骤 ${step.name} 执行失败:`, err);
            // 出错时返回当前 intervals 或空数组，避免中断
            intervals = intervals || [];
        }
    }
    return intervals;
}