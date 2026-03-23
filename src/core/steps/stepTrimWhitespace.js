import { trimFragment } from '../utils/intervalUtils.js';
import { config } from '../config.js';
import { createLogger } from '../utils/logger.js';

const logger = createLogger('Step6');

export function stepTrimWhitespace(intervals, text, context) {
    if (!intervals || intervals.length === 0) return intervals;
    
    logger.info('开始修剪空白');
    logger.debug(`输入片段数量: ${intervals.length}`);
    
    const newIntervals = [];
    let trimmedCount = 0;
    
    for (let idx = 0; idx < intervals.length; idx++) {
        const frag = intervals[idx];
        const trimmed = trimFragment(text, frag.start, frag.end);
        
        if (trimmed.start < trimmed.end) {
            newIntervals.push(trimmed);
            if (trimmed.start !== frag.start || trimmed.end !== frag.end) {
                trimmedCount++;
                logger.debug(`片段 ${idx + 1}: ${frag.start}-${frag.end} → ${trimmed.start}-${trimmed.end}`);
            }
        } else {
            logger.debug(`片段 ${idx + 1}: ${frag.start}-${frag.end} 修剪后为空，丢弃`);
        }
    }
    
    logger.info(`修剪空白完成: 输入 ${intervals.length} 个片段，输出 ${newIntervals.length} 个片段，共修剪 ${trimmedCount} 个片段`);
    return newIntervals;
}