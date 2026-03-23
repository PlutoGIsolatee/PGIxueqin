import { computeWindowFeatures } from '../stats.js';
import { computeMahalanobis } from './mahalanobisUtils.js';
import { extractFeatures } from '../utils/featureUtils.js';
import { config } from '../config.js';
import { createLogger } from '../utils/logger.js';

const logger = createLogger('Step2');

/**
 * 寻找稳定高距离序列
 */
function findStableHighSequences(distances, threshold) {
    const sequences = [];
    let i = 0;
    const n = distances.length;
    
    while (i < n) {
        if (distances[i] < threshold) {
            i++;
            continue;
        }
        let start = i;
        while (i < n && distances[i] >= threshold) i++;
        let end = i - 1;
        const len = end - start + 1;
        
        if (len < config.minSequenceLength) continue;
        
        const seqDist = distances.slice(start, end + 1);
        const mean = seqDist.reduce((a,b)=>a+b,0) / len;
        const std = Math.sqrt(seqDist.reduce((s,val)=>s+(val-mean)**2,0) / len);
        const cv = std / mean;
        
        if (cv <= config.maxCV) {
            sequences.push({ startIndex: start, endIndex: end });
            logger.debug(`找到稳定序列: 索引 ${start}-${end}, 长度=${len}, CV=${cv.toFixed(4)}`);
        }
    }
    return sequences;
}

export function stepMahalanobisRefine(intervals, text, context) {
    if (!intervals || intervals.length === 0) return intervals;
    
    logger.info('开始马氏距离精确定位');
    logger.debug(`输入片段数量: ${intervals.length}`);
    
    // 从上下文获取第一步的统计信息
    const { mean, cov, mahalThreshold } = context.mahalStats || {};
    if (!mean || !cov) {
        logger.warn('未找到全局统计，回退到原片段');
        return intervals;
    }
    logger.debug(`使用全局阈值: ${mahalThreshold?.toFixed(4) || '未设置'}`);
    
    const refined = [];
    let totalSequences = 0;
    
    for (let idx = 0; idx < intervals.length; idx++) {
        const frag = intervals[idx];
        logger.debug(`处理片段 ${idx + 1}/${intervals.length}: ${frag.start}-${frag.end} (长度=${frag.end - frag.start})`);
        
        const subText = text.slice(frag.start, frag.end);
        const subWindows = computeWindowFeatures(subText, config.refineWindowSize, config.refineStep);
        
        if (subWindows.length === 0) {
            logger.debug(`  片段内无窗口，保留原片段`);
            refined.push(frag);
            continue;
        }
        
        const distances = subWindows.map(win => 
            computeMahalanobis(extractFeatures(win.features), mean, cov)
        );
        
        const sequences = findStableHighSequences(distances, mahalThreshold);
        
        if (sequences.length === 0) {
            logger.debug(`  未找到稳定序列，保留原片段`);
            refined.push(frag);
            continue;
        }
        
        totalSequences += sequences.length;
        for (const seq of sequences) {
            const winStart = subWindows[seq.startIndex];
            const winEnd = subWindows[seq.endIndex];
            const start = winStart.start + frag.start;
            const end = winEnd.end + frag.start;
            refined.push({ start, end });
            logger.debug(`  找到序列 ${seq.startIndex}-${seq.endIndex}: ${start}-${end} (距离范围 ${distances[seq.startIndex].toFixed(2)}-${distances[seq.endIndex].toFixed(2)})`);
        }
    }
    
    logger.info(`精确定位完成: 输入 ${intervals.length} 个片段，输出 ${refined.length} 个片段，共找到 ${totalSequences} 个稳定序列`);
    return refined;
}