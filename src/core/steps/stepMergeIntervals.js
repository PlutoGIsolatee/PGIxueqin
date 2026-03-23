import { mergeIntervals } from '../utils/intervalUtils.js';
import { config } from '../config.js';
import { createLogger } from '../utils/logger.js';

const logger = createLogger('Step7');

export function stepMergeIntervals(intervals, text, context) {
    if (!intervals || intervals.length === 0) return intervals;
    
    logger.info('开始合并区间');
    logger.debug(`输入片段数量: ${intervals.length}`);
    
    const merged = mergeIntervals(intervals);
    
    if (merged.length < intervals.length) {
        logger.info(`合并完成: ${intervals.length} → ${merged.length} 个片段`);
        if (config.debug && merged.length > 0) {
            merged.forEach((f, i) => {
                logger.debug(`片段 ${i+1}: ${f.start}-${f.end} (长度=${f.end-f.start})`);
            });
        }
    } else {
        logger.debug(`无合并，片段数量不变: ${merged.length}`);
    }
    
    return merged;
}