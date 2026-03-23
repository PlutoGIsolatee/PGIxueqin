import { computeWindowFeatures } from './stats.js';
import { computeAnomalyScore } from './anomaly.js';
import { computePerplexity } from './transitions.js';

const REFINE_WINDOW_SIZE = 30;
const REFINE_STEP = 5;
const REFINE_SCORE_THRESHOLD = 0.7;
const PERPLEXITY_WEIGHT = 0.5;
const MAX_WINDOW_GAP = 10;

export function mergeWindows(windows) {
    // 合并连续异常窗口，间隔不超过 MAX_WINDOW_GAP
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

function computeCombinedScore(features, globalStats, probs, windowText) {
    const anomalyScore = computeAnomalyScore(features, globalStats.means, globalStats.stds);
    const perplexity = computePerplexity(windowText, probs);
    // 归一化：对数后除以10（经验值）
    const normalizedPerplexity = Math.log(perplexity) / 10;
    const combined = (1 - PERPLEXITY_WEIGHT) * anomalyScore + PERPLEXITY_WEIGHT * normalizedPerplexity;
    return Math.max(0, combined);
}

export function refineFragment(text, fragment, globalStats, probs) {
    const subText = text.slice(fragment.start, fragment.end);
    const subWindows = computeWindowFeatures(subText, REFINE_WINDOW_SIZE, REFINE_STEP);
    if (subWindows.length === 0) return [];

    const scores = subWindows.map(win => {
        const winText = text.slice(win.start + fragment.start, win.end + fragment.start);
        return computeCombinedScore(win.features, globalStats, probs, winText);
    });
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