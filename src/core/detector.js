import { runPipeline } from './pipeline.js';
import { config } from './config.js';
import { computeWindowFeatures, computeMeanStd } from './stats.js';
import {
    stepMahalanobisWindowDetection,
    stepMahalanobisRefine,
    stepConsecutiveDigits,
    stepLowEntropyParagraph,
    stepNormalParagraphExemption,
    stepTrimWhitespace,
    stepMergeIntervals
} from './steps/index.js';

const STEPS = [
    { name: '1. 马氏距离滑动窗口检测', fn: stepMahalanobisWindowDetection },
    { name: '2. 马氏距离精确定位', fn: stepMahalanobisRefine },
    { name: '3. 连续数字豁免', fn: stepConsecutiveDigits },
    { name: '4. 低熵段落豁免', fn: stepLowEntropyParagraph },
    { name: '5. 正常段落豁免', fn: stepNormalParagraphExemption },
    { name: '6. 修剪空白', fn: stepTrimWhitespace },
    { name: '7. 合并区间', fn: stepMergeIntervals }
];

export function detectNoiseFragments(text) {
    const context = {};
    
    // 预计算全局统计并存入上下文（供步骤5使用）
    const windows = computeWindowFeatures(text, config.windowSize, config.step);
    if (windows.length > 0) {
        context.globalStats = computeMeanStd(windows);
    }
    
    const { finalIntervals, stepResults } = runPipeline(STEPS, text, context);
    return { fragments: finalIntervals, stepResults };
}