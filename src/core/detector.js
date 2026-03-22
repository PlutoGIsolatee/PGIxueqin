import { computeWindowFeatures, computeMeanStd } from './stats.js';
import { isWindowAbnormalBy3Sigma } from './anomaly.js';
import { mergeWindows, refineFragment } from './refine.js';
import { EXEMPTION_RULES, initParagraphStats } from './exemptions.js';
import { getParagraphs } from './paragraph.js';
import { buildTransitionMatrix, computeTransitionProbs } from './transitions.js';

const WINDOW_SIZE = 100;
const STEP = 10;
const SIGMA_THRESHOLD = 3;
const DEBUG = false;

function subtractIntervals(fragment, removeIntervals) {
    const result = [];
    let currentStart = fragment.start;
    for (const rem of removeIntervals) {
        if (rem.end <= fragment.start || rem.start >= fragment.end) continue;
        const start = Math.max(currentStart, rem.start);
        const end = Math.min(fragment.end, rem.end);
        if (start > currentStart) {
            result.push({ start: currentStart, end: start });
        }
        currentStart = Math.max(currentStart, end);
        if (currentStart >= fragment.end) break;
    }
    if (currentStart < fragment.end) {
        result.push({ start: currentStart, end: fragment.end });
    }
    return result;
}

function mergeIntervals(intervals) {
    if (intervals.length === 0) return [];
    intervals.sort((a, b) => a.start - b.start);
    const merged = [];
    let current = intervals[0];
    for (let i = 1; i < intervals.length; i++) {
        const next = intervals[i];
        if (next.start <= current.end) {
            current.end = Math.max(current.end, next.end);
        } else {
            merged.push(current);
            current = next;
        }
    }
    merged.push(current);
    return merged;
}

function applyExemptions(fragments, text, globalStats, paragraphs) {
    const safeParagraphs = Array.isArray(paragraphs) ? paragraphs : [];
    let currentFragments = fragments;
    
    for (const rule of EXEMPTION_RULES) {
        const nextFragments = [];
        for (const frag of currentFragments) {
            const fragmentObj = {
                start: frag.start,
                end: frag.end,
                text: text.slice(frag.start, frag.end)
            };
            const context = {
                paragraphs: safeParagraphs,
                text,
                entropyThreshold: 0.4,
                sigma: SIGMA_THRESHOLD
            };
            const removeIntervals = rule(fragmentObj, globalStats, context);
            
            if (removeIntervals.length === 0) {
                nextFragments.push(frag);
            } else {
                const mergedRemove = mergeIntervals(removeIntervals);
                const kept = subtractIntervals(frag, mergedRemove);
                nextFragments.push(...kept);
            }
        }
        currentFragments = nextFragments;
        if (currentFragments.length === 0) break;
    }
    return currentFragments;
}

function trimFragment(text, start, end) {
    let newStart = start;
    let newEnd = end;
    while (newStart < newEnd && /\s/.test(text[newStart])) newStart++;
    while (newEnd > newStart && /\s/.test(text[newEnd - 1])) newEnd--;
    return { start: newStart, end: newEnd };
}

export function detectNoiseFragments(text) {
    // 预计算段落统计（只执行一次）
    initParagraphStats(text, 0.2, 2);
    
    // 第一次检测
    const windows = computeWindowFeatures(text, WINDOW_SIZE, STEP);
    if (windows.length === 0) return [];
    
    const globalStats = computeMeanStd(windows);
    for (const win of windows) {
        win.isAbnormal = isWindowAbnormalBy3Sigma(win.features, globalStats.means, globalStats.stds, SIGMA_THRESHOLD);
    }
    
    let firstFragments = mergeWindows(windows);
    if (DEBUG) console.log('Initial fragments:', firstFragments.length);
    
    const paragraphs = getParagraphs(text);
    if (!Array.isArray(paragraphs)) return [];
    
    // 应用豁免规则
    const afterExemptions = applyExemptions(firstFragments, text, globalStats, paragraphs);
    if (DEBUG) console.log('After exemptions:', afterExemptions.length);
    
    // 转移特征精确定位
    const countMatrix = buildTransitionMatrix(text);
    const probs = computeTransitionProbs(countMatrix);
    const refinedFragments = [];
    for (const frag of afterExemptions) {
        const refined = refineFragment(text, frag, globalStats, probs);
        refinedFragments.push(...refined);
    }
    
    // 合并片段
    if (refinedFragments.length === 0) return [];
    refinedFragments.sort((a, b) => a.start - b.start);
    const merged = [];
    let current = refinedFragments[0];
    for (let i = 1; i < refinedFragments.length; i++) {
        const next = refinedFragments[i];
        if (next.start <= current.end) {
            current.end = Math.max(current.end, next.end);
        } else {
            merged.push(current);
            current = next;
        }
    }
    merged.push(current);
    
    // 修剪空白字符
    const trimmedFragments = [];
    for (const frag of merged) {
        const trimmed = trimFragment(text, frag.start, frag.end);
        if (trimmed.start < trimmed.end) {
            trimmedFragments.push(trimmed);
        }
    }
    
    return trimmedFragments;
}