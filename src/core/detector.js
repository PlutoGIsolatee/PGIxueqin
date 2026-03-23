import { runPipeline } from './pipeline.js';
import {
    stepMahalanobisWindowDetection,
    stepMahalanobisRefine,   // 使用新步骤
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
    const { finalIntervals, stepResults } = runPipeline(STEPS, text);
    return { fragments: finalIntervals, stepResults };
}