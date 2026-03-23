import { createLogger } from './utils/logger.js';

const logger = createLogger('Pipeline');

/**
 * 执行步骤流水线并记录每步结果
 */
export function runPipeline(steps, text, context = {}) {
    let intervals = null;
    const stepResults = [];
    
    logger.info(`开始执行流水线，共 ${steps.length} 个步骤`);
    
    for (let stepIdx = 0; stepIdx < steps.length; stepIdx++) {
        const step = steps[stepIdx];
        try {
            logger.debug(`执行步骤 ${stepIdx + 1}: ${step.name}`);
            intervals = step.fn(intervals, text, context);
            if (!Array.isArray(intervals)) {
                logger.error(`步骤 ${step.name} 返回的不是数组`, intervals);
                intervals = [];
            }
            logger.info(`步骤 ${step.name} 完成，片段数量: ${intervals.length}`);
            stepResults.push({
                stepName: step.name,
                intervals: intervals ? [...intervals] : [],
                contextSnapshot: { ...context }
            });
        } catch (err) {
            logger.error(`步骤 ${step.name} 执行失败`, { error: err.message, stack: err.stack });
            intervals = intervals || [];
            stepResults.push({
                stepName: step.name,
                intervals: intervals,
                error: err.message
            });
        }
    }
    
    logger.info(`流水线执行完成，最终片段数量: ${intervals.length}`);
    return { finalIntervals: intervals, stepResults, context };
}