import { computeWindowFeatures, computeMeanStd } from '../stats.js';
import { isWindowAbnormalBy3Sigma } from '../anomaly.js';
import { mergeWindows } from '../refine.js';

const WINDOW_SIZE = 100;
const STEP = 10;
const SIGMA_THRESHOLD = 3;
const DEBUG = true;

/**
 * 第一步：滑动窗口3σ粗检测
 * @param {Array|null} intervals - 输入（null）
 * @param {string} text - 全文
 * @returns {Array} 初步片段列表
 */
export function stepSlidingWindowDetection(intervals, text) {
    if (intervals !== null) return intervals; // 只作为第一步
    
    if (DEBUG) console.log('[步骤1] 滑动窗口3σ粗检测');
    
    const windows = computeWindowFeatures(text, WINDOW_SIZE, STEP);
    if (windows.length === 0) return [];
    const globalStats = computeMeanStd(windows);
    for (const win of windows) {
        win.isAbnormal = isWindowAbnormalBy3Sigma(win.features, globalStats.means, globalStats.stds, SIGMA_THRESHOLD);
    }
    const fragments = mergeWindows(windows);
    if (DEBUG) console.log(`[步骤1] 检测到 ${fragments.length} 个片段`);
    return fragments;
}