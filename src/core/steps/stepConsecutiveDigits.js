import { countClasses } from '../../classify.js';
import { isWindowAbnormalBy3Sigma } from '../anomaly.js';
import { computeWindowFeatures, computeMeanStd } from '../stats.js';
import { config } from '../config.js';
import { createLogger } from '../utils/logger.js';

const logger = createLogger('Step3');

// 缓存全局统计
let cachedGlobalStats = null;

function getGlobalStats(text) {
    if (cachedGlobalStats) return cachedGlobalStats;
    logger.debug('计算全局统计...');
    const windows = computeWindowFeatures(text, config.windowSize, config.step);
    if (windows.length === 0) return null;
    const stats = computeMeanStd(windows);
    cachedGlobalStats = stats;
    logger.debug('全局统计计算完成');
    return stats;
}

export function stepConsecutiveDigits(intervals, text, context) {
    if (!intervals || intervals.length === 0) return intervals;
    
    logger.info('开始连续数字豁免');
    logger.debug(`输入片段数量: ${intervals.length}`);
    
    const globalStats = getGlobalStats(text);
    if (!globalStats) {
        logger.warn('无法获取全局统计，跳过豁免');
        return intervals;
    }
    
    const newIntervals = [];
    let exemptedCount = 0;
    
    for (let idx = 0; idx < intervals.length; idx++) {
        const frag = intervals[idx];
        const fragmentText = text.slice(frag.start, frag.end);
        const hasConsecutiveDigits = config.consecutiveDigitsPattern.test(fragmentText);
        
        if (!hasConsecutiveDigits) {
            newIntervals.push(frag);
            continue;
        }
        
        logger.debug(`片段 ${frag.start}-${frag.end} 包含连续数字，检查豁免条件...`);
        
        const processed = fragmentText.replace(config.consecutiveDigitsPattern, ' ');
        const counts = countClasses(processed);
        
        if (counts.total === 0) {
            newIntervals.push(frag);
            continue;
        }
        
        const hanTotal = counts.zhChar.reduce((a,b)=>a+b,0);
        const enTotal = counts.enChar.reduce((a,b)=>a+b,0);
        const features = {
            han: hanTotal / counts.total,
            zhPunc: counts.zhPunc / counts.total,
            enChar: enTotal / counts.total,
            enPunc: counts.enPunc / counts.total,
            digit: counts.digit / counts.total,
            other: counts.other / counts.total
        };
        
        if (!isWindowAbnormalBy3Sigma(features, globalStats.means, globalStats.stds, config.sigmaThreshold)) {
            logger.info(`豁免片段 ${frag.start}-${frag.end} (移除数字后特征正常)`);
            exemptedCount++;
        } else {
            newIntervals.push(frag);
            logger.debug(`片段 ${frag.start}-${frag.end} 保留 (移除数字后仍异常)`);
        }
    }
    
    logger.info(`连续数字豁免完成: 输入 ${intervals.length} 个片段，豁免 ${exemptedCount} 个，输出 ${newIntervals.length} 个片段`);
    return newIntervals;
}