import { computeWindowFeatures } from '../stats.js';
import { getGlobalStats, computeMahalanobis } from './mahalanobisUtils.js';

// 可调参数
const REFINE_WINDOW_SIZE = 20;
const REFINE_STEP = 1;
const MIN_SEQUENCE_LENGTH = 3;          // 允许单个窗口作为序列
const MAX_CV = 0.5;                     // 放宽变异系数
const DIST_THRESHOLD_PERCENTILE = 0.95; // 使用95%分位数（可改为0.90、0.85等）
const DEBUG = true;

const FEATURE_NAMES = ['han', 'zhPunc', 'enChar', 'enPunc', 'digit', 'other'];

function extractFeatures(features) {
    return FEATURE_NAMES.map(k => features[k]);
}

/**
 * 寻找稳定高距离序列（距离 ≥ 阈值）
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
        if (len < MIN_SEQUENCE_LENGTH) continue;
        // 计算变异系数（标准差/均值）
        const seqDist = distances.slice(start, end + 1);
        const mean = seqDist.reduce((a,b)=>a+b,0) / len;
        const std = Math.sqrt(seqDist.reduce((s,val)=>s+(val-mean)**2,0) / len);
        const cv = std / mean;
        if (cv <= MAX_CV) {
            sequences.push({ startIndex: start, endIndex: end });
        }
    }
    return sequences;
}

export function stepMahalanobisRefine(intervals, text) {
    if (!intervals || intervals.length === 0) return intervals;
    
    if (DEBUG) console.log('[步骤2] 基于马氏距离的精确定位');
    
    // 获取第一步缓存的全局统计
    const globalStats = getGlobalStats();
    if (!globalStats.mean || !globalStats.cov) {
        console.warn('[步骤2] 未找到全局统计，回退到原片段');
        return intervals;
    }
    const { mean, cov } = globalStats;
    
    // 计算全局距离分布（用于设置阈值）
    const allWindows = computeWindowFeatures(text, 75, 10); // 与第一步窗口一致
    const allDistances = allWindows.map(win => computeMahalanobis(extractFeatures(win.features), mean, cov));
    const sorted = [...allDistances].sort((a,b)=>a-b);
    const globalThreshold = sorted[Math.floor(sorted.length * DIST_THRESHOLD_PERCENTILE)];
    if (DEBUG) console.log(`全局阈值 (${DIST_THRESHOLD_PERCENTILE*100}%分位数): ${globalThreshold.toFixed(4)}`);
    
    const refined = [];
    for (const frag of intervals) {
        const subText = text.slice(frag.start, frag.end);
        const subWindows = computeWindowFeatures(subText, REFINE_WINDOW_SIZE, REFINE_STEP);
        if (subWindows.length === 0) {
            refined.push(frag);
            continue;
        }
        const distances = subWindows.map(win => computeMahalanobis(extractFeatures(win.features), mean, cov));
        const sequences = findStableHighSequences(distances, globalThreshold);
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
            if (DEBUG) console.log(`  找到稳定高距离序列: ${start}-${end} (距离范围 ${distances[seq.startIndex].toFixed(2)}-${distances[seq.endIndex].toFixed(2)})`);
        }
    }
    
    if (DEBUG) console.log(`[步骤2] 处理完成，片段数量: ${refined.length}`);
    return refined;
}
