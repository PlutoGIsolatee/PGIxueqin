import { 
    getCachedParagraphs, 
    getCachedParagraphFeatures,
    getNearbyParagraphStatsCached,
    getParagraphFeatures
} from '../paragraph.js';
import { isWindowAbnormalBy3Sigma } from '../anomaly.js';
import { subtractIntervals } from '../utils/intervalUtils.js';
import { config } from '../../config.js';
import { createLogger } from '../utils/logger.js';
import { computeWindowFeatures, computeMeanStd } from '../stats.js';

const logger = createLogger('Step5');

function isNormalText(text, start, end, globalStats, paragraphIndex) {
    const sampleText = text.slice(start, end);
    const features = getParagraphFeatures(sampleText);
    if (!features) return false;
    
    const localStats = getNearbyParagraphStatsCached(paragraphIndex);
    if (localStats) {
        const isAbnormal = isWindowAbnormalBy3Sigma(features, localStats.means, localStats.stds, config.sigmaThreshold);
        return !isAbnormal;
    }
    const isAbnormal = isWindowAbnormalBy3Sigma(features, globalStats.means, globalStats.stds, config.sigmaThreshold);
    return !isAbnormal;
}

export function stepNormalParagraphExemption(intervals, text, context) {
    if (!intervals || intervals.length === 0) return intervals;
    
    logger.info('开始正常段落豁免规则');
    logger.debug(`输入片段数量: ${intervals.length}`);
    
    const paragraphs = getCachedParagraphs();
    if (!paragraphs || paragraphs.length === 0) {
        logger.warn('段落缓存为空，跳过豁免');
        return intervals;
    }
    logger.debug(`共 ${paragraphs.length} 个段落`);
    
    let globalStats = context.globalStats;
    if (!globalStats) {
        logger.info('上下文中无全局统计，重新计算...');
        const windows = computeWindowFeatures(text, config.windowSize, config.step);
        if (windows.length > 0) {
            globalStats = computeMeanStd(windows);
            logger.debug('全局统计计算完成');
        } else {
            logger.warn('无法计算全局统计，跳过豁免');
            return intervals;
        }
    }
    
    const newIntervals = [];
    let totalRemoved = 0;
    
    for (let idx = 0; idx < intervals.length; idx++) {
        const frag = intervals[idx];
        logger.debug(`处理片段 ${idx + 1}/${intervals.length}: ${frag.start}-${frag.end} (长度=${frag.end - frag.start})`);
        
        const overlappingParas = [];
        for (let i = 0; i < paragraphs.length; i++) {
            const para = paragraphs[i];
            if (para.start >= frag.end || para.end <= frag.start) continue;
            overlappingParas.push({ index: i, para });
        }
        
        if (overlappingParas.length === 0) {
            newIntervals.push(frag);
            logger.debug(`  无重叠段落，保留`);
            continue;
        }
        logger.debug(`  重叠段落数: ${overlappingParas.length}`);
        
        const removeIntervals = [];
        
        // 完全包含的段落
        for (const { index, para } of overlappingParas) {
            if (para.start >= frag.start && para.end <= frag.end) {
                if (isNormalText(text, para.start, para.end, globalStats, index)) {
                    removeIntervals.push({ start: para.start, end: para.end });
                    logger.debug(`  豁免完全包含的正常段落 ${para.start}-${para.end}`);
                }
            }
        }
        
        // 左边界段落
        const leftPara = overlappingParas.find(p => p.para.start <= frag.start && p.para.end > frag.start);
        if (leftPara) {
            const { index, para } = leftPara;
            const checkStart = Math.max(para.start, frag.start - config.extendChars);
            const checkEnd = frag.start;
            if (checkStart < checkEnd) {
                if (isNormalText(text, checkStart, checkEnd, globalStats, index)) {
                    const removeStart = frag.start;
                    const removeEnd = Math.min(frag.end, para.end);
                    if (removeStart < removeEnd) {
                        removeIntervals.push({ start: removeStart, end: removeEnd });
                        logger.debug(`  豁免左边界段落部分 ${removeStart}-${removeEnd} (扩展区域 ${checkStart}-${checkEnd})`);
                    }
                }
            }
        }
        
        // 右边界段落
        const rightPara = overlappingParas.find(p => p.para.start < frag.end && p.para.end >= frag.end);
        if (rightPara) {
            const { index, para } = rightPara;
            const checkStart = frag.end;
            const checkEnd = Math.min(para.end, frag.end + config.extendChars);
            if (checkStart < checkEnd) {
                if (isNormalText(text, checkStart, checkEnd, globalStats, index)) {
                    const removeStart = Math.max(frag.start, para.start);
                    const removeEnd = frag.end;
                    if (removeStart < removeEnd) {
                        removeIntervals.push({ start: removeStart, end: removeEnd });
                        logger.debug(`  豁免右边界段落部分 ${removeStart}-${removeEnd} (扩展区域 ${checkStart}-${checkEnd})`);
                    }
                }
            }
        }
        
        if (removeIntervals.length === 0) {
            newIntervals.push(frag);
            logger.debug(`  无豁免区域，保留`);
        } else {
            const kept = subtractIntervals(frag, removeIntervals);
            newIntervals.push(...kept);
            totalRemoved += removeIntervals.length;
            logger.debug(`  裁剪后保留 ${kept.length} 个片段`);
        }
    }
    
    logger.info(`正常段落豁免完成: 输入 ${intervals.length} 个片段，输出 ${newIntervals.length} 个片段，共移除 ${totalRemoved} 个正常段落区域`);
    return newIntervals;
}