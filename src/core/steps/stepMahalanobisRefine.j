import { computeWindowFeatures } from '../stats.js';
import { computeMahalanobis } from './mahalanobisUtils.js';
import { extractFeatures } from '../utils/featureUtils.js';
import { config } from '../config.js';

export function stepMahalanobisRefine(intervals, text, context) {
    if (!intervals || intervals.length === 0) return intervals;
    
    if (config.debug) console.log('[步骤2] 基于马氏距离的精确定位');
    
    // 从上下文获取第一步的统计信息
    const { mean, cov, mahalThreshold } = context.mahalStats || {};
    if (!mean || !cov) {
        console.warn('[步骤2] 未找到全局统计，回退到原片段');
        return intervals;
    }
    
    const refined = [];
    for (const frag of intervals) {
        const subText = text.slice(frag.start, frag.end);
        const subWindows = computeWindowFeatures(subText, config.refineWindowSize, config.refineStep);
        if (subWindows.length === 0) {
            refined.push(frag);
            continue;
        }
        
        const distances = subWindows.map(win => 
            computeMahalanobis(extractFeatures(win.features), mean, cov)
        );
        
        // 寻找稳定高距离序列
        const sequences = findStableHighSequences(distances, mahalThreshold);
        if (sequences.length === 0) {
            refined.push(frag);
            continue;
        }
        
        for (const seq of sequences) {
            const winStart = subWindows[seq.startIndex];
            const winEnd = subWindows[seq.endIndex];
            const start = winStart.start + frag.start;
            const end = winEnd.end + frag.start;
            refined.push({ start, end });
            if (config.debug) {
                console.log(`  找到稳定高距离序列: ${start}-${end} (距离范围 ${distances[seq.startIndex].toFixed(2)}-${distances[seq.endIndex].toFixed(2)})`);
            }
        }
    }
    
    if (config.debug) console.log(`[步骤2] 处理完成，片段数量: ${refined.length}`);
    return refined;
}

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
        }
    }
    return sequences;
}