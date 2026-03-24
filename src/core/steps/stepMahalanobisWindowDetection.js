import { computeWindowFeatures } from '../stats.js';
import { mergeIntervals } from '../utils/intervalUtils.js';
import { extractFeatures, extractFeatureMatrix } from '../utils/featureUtils.js';
import { computeGlobalCovariance, computeMahalanobis } from './mahalanobisUtils.js';
import { config } from '../../config.js';
import { createLogger } from '../utils/logger.js';

const logger = createLogger('Step1');

export function stepMahalanobisWindowDetection(intervals, text, context) {
    if (intervals !== null) return intervals;
    
    logger.info('开始马氏距离滑动窗口检测');
    logger.debug(`参数: 窗口大小=${config.windowSize}, 步长=${config.step}, 分位数=${config.mahalPercentile}`);
    
    const windows = computeWindowFeatures(text, config.windowSize, config.step);
    if (windows.length === 0) {
        logger.warn('未检测到任何窗口');
        return [];
    }
    logger.debug(`共 ${windows.length} 个窗口`);
    
    const featuresMatrix = extractFeatureMatrix(windows);
    const { mean, cov } = computeGlobalCovariance(featuresMatrix);
    
    const distances = windows.map(win => computeMahalanobis(extractFeatures(win.features), mean, cov));
    
    const sorted = [...distances].sort((a,b)=>a-b);
    const threshold = sorted[Math.floor(sorted.length * config.mahalPercentile)];
    
    // 统一存入 context
    context.mahalStats = { mean, cov, threshold };
    context.mahalDistances = distances;
    
    logger.info(`马氏距离阈值 (${config.mahalPercentile*100}%): ${threshold.toFixed(4)}`);
    logger.debug(`距离统计: min=${Math.min(...distances).toFixed(4)}, max=${Math.max(...distances).toFixed(4)}, mean=${(distances.reduce((a,b)=>a+b,0)/distances.length).toFixed(4)}`);
    
    let abnormalCount = 0;
    for (let i = 0; i < windows.length; i++) {
        windows[i].isAbnormal = distances[i] > threshold;
        if (windows[i].isAbnormal) {
            abnormalCount++;
            if (config.debug && abnormalCount <= 10) {
                logger.debug(`窗口 ${i} 异常，距离=${distances[i].toFixed(4)}`);
            }
        }
    }
    logger.info(`异常窗口数量: ${abnormalCount} / ${windows.length} (${(abnormalCount/windows.length*100).toFixed(2)}%)`);
    
    const fragments = mergeIntervals(
        windows.filter(w => w.isAbnormal).map(w => ({ start: w.start, end: w.end }))
    );
    
    logger.info(`检测到 ${fragments.length} 个片段`);
    if (config.debug && fragments.length > 0) {
        fragments.forEach((f, i) => {
            logger.debug(`片段 ${i+1}: ${f.start}-${f.end} (长度=${f.end-f.start})`);
        });
    }
    
    return fragments;
}