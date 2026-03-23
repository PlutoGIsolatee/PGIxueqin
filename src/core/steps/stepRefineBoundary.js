import { computeWindowFeatures, computeMeanStd } from '../stats.js';
import { computeAnomalyScore } from '../anomaly.js';

// 细粒度扫描参数（已调整为窗口=10，步长=1）
const REFINE_WINDOW_SIZE = 10;    // 窗口大小改为 10
const REFINE_STEP = 1;            // 步长改为 1
const REFINE_SCORE_THRESHOLD = 0.5; // 保留分数阈值
const MAX_WINDOW_GAP = 5;         // 合并窗口时允许的最大间隔（相应调小）
const DEBUG = true;

// 缓存全局统计（避免重复计算）
let cachedGlobalStats = null;

function getGlobalStats(text) {
    if (cachedGlobalStats) return cachedGlobalStats;
    const windows = computeWindowFeatures(text, 100, 10);
    if (windows.length === 0) return null;
    const stats = computeMeanStd(windows);
    cachedGlobalStats = stats;
    return stats;
}

function mergeWindows(windows) {
    const fragments = [];
    let current = null;
    for (const win of windows) {
        if (win.isAbnormal) {
            if (!current) {
                current = { start: win.start, end: win.end };
            } else {
                if (win.start - current.end <= MAX_WINDOW_GAP) {
                    current.end = Math.max(current.end, win.end);
                } else {
                    fragments.push(current);
                    current = { start: win.start, end: win.end };
                }
            }
        } else {
            if (current) {
                fragments.push(current);
                current = null;
            }
        }
    }
    if (current) fragments.push(current);
    return fragments;
}

function tightenBoundary(windows, scores, threshold) {
    const maxScore = Math.max(...scores);
    if (maxScore === 0) return { startIndex: -1, endIndex: -1 };
    const absThreshold = maxScore * threshold;
    let startIdx = windows.findIndex((_, i) => scores[i] >= absThreshold);
    let endIdx = windows.length - 1;
    for (; endIdx >= 0; endIdx--) {
        if (scores[endIdx] >= absThreshold) break;
    }
    if (startIdx === -1 || endIdx === -1 || startIdx > endIdx) {
        return { startIndex: -1, endIndex: -1 };
    }
    return { startIndex: startIdx, endIndex: endIdx };
}

function refineSingleFragment(fragment, text, globalStats) {
    const subText = text.slice(fragment.start, fragment.end);
    const subWindows = computeWindowFeatures(subText, REFINE_WINDOW_SIZE, REFINE_STEP);
    if (subWindows.length === 0) return [fragment];
    
    const scores = subWindows.map(win => computeAnomalyScore(win.features, globalStats.means, globalStats.stds));
    for (let i = 0; i < subWindows.length; i++) subWindows[i].score = scores[i];
    
    const { startIndex, endIndex } = tightenBoundary(subWindows, scores, REFINE_SCORE_THRESHOLD);
    if (startIndex === -1) return [];
    
    const tightWindows = subWindows.slice(startIndex, endIndex + 1);
    for (const win of tightWindows) win.isAbnormal = true;
    const subFrags = mergeWindows(tightWindows);
    return subFrags.map(f => ({
        start: f.start + fragment.start,
        end: f.end + fragment.start
    }));
}

export function stepRefineBoundary(intervals, text) {
    if (!intervals || intervals.length === 0) return intervals;
    
    if (DEBUG) console.log('[步骤2] 简单细粒度精确定位 (窗口=10, 步长=1)');
    
    const globalStats = getGlobalStats(text);
    if (!globalStats) return intervals;
    
    const refined = [];
    for (const frag of intervals) {
        const subFrags = refineSingleFragment(frag, text, globalStats);
        refined.push(...subFrags);
    }
    if (DEBUG) console.log(`[步骤2] 精确定位后片段数量: ${refined.length}`);
    return refined;
}
