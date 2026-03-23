import { computeWindowFeatures } from '../stats.js';
import { mergeIntervals } from '../utils/intervalUtils.js';
import { extractFeatures, extractFeatureMatrix } from '../utils/featureUtils.js';
import { computeGlobalCovariance, setGlobalStats, computeMahalanobis } from './mahalanobisUtils.js';
import { config } from '../config.js';

export function stepMahalanobisWindowDetection(intervals, text, context) {
    if (intervals !== null) return intervals;
    
    if (config.debug) console.log('[步骤1] 马氏距离滑动窗口检测');
    
    // 计算所有窗口的特征（一次）
    const windows = computeWindowFeatures(text, config.windowSize, config.step);
    if (windows.length === 0) return [];
    
    // 提取特征矩阵
    const featuresMatrix = extractFeatureMatrix(windows);
    const { mean, cov } = computeGlobalCovariance(featuresMatrix);
    
    // 存入上下文，供后续步骤复用
    context.mahalStats = { mean, cov };
    
    // 计算每个窗口的马氏距离
    const distances = windows.map(win => 
        computeMahalanobis(extractFeatures(win.features), mean, cov)
    );
    
    // 缓存距离数组供第二步使用
    context.mahalDistances = distances;
    
    // 设置阈值
    const sorted = [...distances].sort((a,b)=>a-b);
    const threshold = sorted[Math.floor(sorted.length * config.mahalPercentile)];
    context.mahalThreshold = threshold;
    
    if (config.debug) console.log(`马氏距离阈值 (${config.mahalPercentile*100}%): ${threshold.toFixed(4)}`);
    
    // 标记异常窗口
    for (let i = 0; i < windows.length; i++) {
        windows[i].isAbnormal = distances[i] > threshold;
        if (config.debug && windows[i].isAbnormal) {
            console.log(`窗口 ${i} 异常，距离=${distances[i].toFixed(4)}`);
        }
    }
    
    // 合并异常窗口
    const fragments = mergeIntervals(
        windows.filter(w => w.isAbnormal).map(w => ({ start: w.start, end: w.end }))
    );
    
    if (config.debug) console.log(`[步骤1] 检测到 ${fragments.length} 个片段`);
    return fragments;
}