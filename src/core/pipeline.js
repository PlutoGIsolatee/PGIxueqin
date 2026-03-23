/**
 * 执行步骤流水线并记录每步结果
 * @param {Array<Object>} steps - 步骤对象数组，每个对象 { name, fn }
 * @param {string} text - 原始文本
 * @param {Object} context - 共享上下文（初始为空）
 * @returns {Object} { finalIntervals, stepResults, context }
 */
export function runPipeline(steps, text, context = {}) {
    let intervals = null;
    const stepResults = [];
    
    for (const step of steps) {
        try {
            // 传递上下文，每个步骤可修改
            intervals = step.fn(intervals, text, context);
            if (!Array.isArray(intervals)) {
                console.error(`步骤 ${step.name} 返回的不是数组:`, intervals);
                intervals = [];
            }
            stepResults.push({
                stepName: step.name,
                intervals: intervals ? [...intervals] : [],
                contextSnapshot: { ...context } // 浅拷贝用于调试
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
    
    return { finalIntervals: intervals, stepResults, context };
}