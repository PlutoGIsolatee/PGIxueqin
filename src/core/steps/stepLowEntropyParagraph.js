import { 
    getCachedParagraphs, 
    getCachedParagraphEntropy, 
    computePermutationEntropy,
    precomputeParagraphStats 
} from '../paragraph.js';
import { subtractIntervals } from '../utils/intervalUtils.js';
import { config } from '../config.js';
import { createLogger } from '../utils/logger.js';

const logger = createLogger('Step4');

export function stepLowEntropyParagraph(intervals, text, context) {
    if (!intervals || intervals.length === 0) return intervals;
    
    logger.info('开始低熵段落豁免');
    logger.debug(`输入片段数量: ${intervals.length}`);
    
    // 确保段落缓存已预计算
    let paragraphs = getCachedParagraphs();
    if (!paragraphs || paragraphs.length === 0) {
        logger.info('段落缓存为空，执行预计算...');
        precomputeParagraphStats(text, 0.2, 2);
        paragraphs = getCachedParagraphs();
        if (!paragraphs) {
            logger.warn('段落预计算失败，跳过豁免');
            return intervals;
        }
    }
    logger.debug(`共 ${paragraphs.length} 个段落`);
    
    const newIntervals = [];
    let totalRemoved = 0;
    
    for (let idx = 0; idx < intervals.length; idx++) {
        const frag = intervals[idx];
        logger.debug(`处理片段 ${idx + 1}/${intervals.length}: ${frag.start}-${frag.end}`);
        
        const removeIntervals = [];
        
        for (let i = 0; i < paragraphs.length; i++) {
            const para = paragraphs[i];
            if (para.start >= frag.end || para.end <= frag.start) continue;
            
            let entropy;
            const cachedEntropy = getCachedParagraphEntropy(i);
            if (cachedEntropy !== undefined && cachedEntropy !== null) {
                entropy = cachedEntropy;
            } else {
                const paraText = text.slice(para.start, para.end);
                entropy = computePermutationEntropy(paraText);
                logger.debug(`  段落 ${i} 熵未缓存，计算得: ${entropy.toFixed(4)}`);
            }
            
            if (entropy < config.entropyThreshold) {
                const overlapStart = Math.max(frag.start, para.start);
                const overlapEnd = Math.min(frag.end, para.end);
                if (overlapStart < overlapEnd) {
                    removeIntervals.push({ start: overlapStart, end: overlapEnd });
                    logger.debug(`  豁免段落 ${i}: ${para.start}-${para.end}, 重叠部分 ${overlapStart}-${overlapEnd}, 熵=${entropy.toFixed(4)}`);
                }
            }
        }
        
        if (removeIntervals.length === 0) {
            newIntervals.push(frag);
            logger.debug(`  片段无豁免，保留`);
        } else {
            const kept = subtractIntervals(frag, removeIntervals);
            newIntervals.push(...kept);
            totalRemoved += removeIntervals.length;
            logger.debug(`  片段裁剪: 移除 ${removeIntervals.length} 个区间，保留 ${kept.length} 个片段`);
        }
    }
    
    logger.info(`低熵段落豁免完成: 输入 ${intervals.length} 个片段，输出 ${newIntervals.length} 个片段，共移除 ${totalRemoved} 个低熵段落区域`);
    return newIntervals;
}