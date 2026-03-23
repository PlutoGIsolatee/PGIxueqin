import { computeWindowFeatures } from '../stats.js';
import { mergeWindows } from '../refine.js';
import { computeGlobalCovariance, setGlobalStats, computeMahalanobis } from './mahalanobisUtils.js';

const WINDOW_SIZE = 75;   // 用户已修改为75
const STEP = 10;
const DEBUG = true;

const FEATURE_NAMES = ['han', 'zhPunc', 'enChar', 'enPunc', 'digit', 'other'];

function extractFeatures(features) {
    return FEATURE_NAMES.map(k => features[k]);
}

export function stepMahalanobisWindowDetection(intervals, text) {
    if (intervals !== null) return intervals;
    
    if (DEBUG) console.log('[步骤1] 马氏距离滑动窗口检测');
    
    const windows = computeWindowFeatures(text, WINDOW_SIZE, STEP);
    if (windows.length === 0) return [];
    
    const featuresMatrix = windows.map(w => extractFeatures(w.features));
    const { mean, cov } = computeGlobalCovariance(featuresMatrix);
    
    // 存入全局缓存
    setGlobalStats(mean, cov);
    
    // 计算每个窗口的马氏距离
    const distances = windows.map(win => {
        const vec = extractFeatures(win.features);
        return computeMahalanobis(vec, mean, cov);
    });
    
    // 设置阈值：99% 分位数
    const sorted = [...distances].sort((a,b)=>a-b);
    const threshold = sorted[Math.floor(sorted.length * 0.99)];
    if (DEBUG) console.log(`马氏距离阈值: ${threshold.toFixed(4)}`);
    
    for (let i = 0; i < windows.length; i++) {
        windows[i].isAbnormal = distances[i] > threshold;
        if (DEBUG && windows[i].isAbnormal) console.log(`窗口 ${i} 异常，距离=${distances[i].toFixed(4)}`);
    }
    
    const fragments = mergeWindows(windows);
    if (DEBUG) console.log(`[步骤1] 检测到 ${fragments.length} 个片段`);
    return fragments;
}