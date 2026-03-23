/**
 * 执行步骤流水线并记录每步结果
 * @param {Array<Object>} steps - 步骤对象数组，每个对象 { name, fn }
 * @param {string} text - 原始文本
 * @returns {Object} { finalIntervals, stepResults }
 */
export function runPipeline(steps, text) {
    let intervals = null;
    const stepResults = [];
    
    for (const step of steps) {
        try {
            intervals = step.fn(intervals, text);
            if (!Array.isArray(intervals)) {
                console.error(`步骤 ${step.name} 返回的不是数组:`, intervals);
                intervals = [];
            }
            stepResults.push({
                stepName: step.name,
                intervals: intervals ? [...intervals] : [] // 深拷贝
            });
        } catch (err) {
            console.error(`步骤 ${step.name} 执行失败:`, err);
            intervals = intervals || [];
            stepResults.push({
                stepName: step.name,
                intervals: intervals,
                error: err.message
            });
        }
    }
    
    return { finalIntervals: intervals, stepResults };
}