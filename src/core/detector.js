import { runPipeline } from './pipeline.js';
import {
    stepSlidingWindowDetection,
    stepRefineBoundary,
    stepConsecutiveDigits,
    stepLowEntropyParagraph,
    stepNormalParagraphExemption,
    stepTrimWhitespace,
    stepMergeIntervals
} from './steps/index.js';

// 步骤定义（带名称）
const STEPS = [
    { name: '1. 滑动窗口粗检测', fn: stepSlidingWindowDetection },
    { name: '2. 细粒度精确定位', fn: stepRefineBoundary },
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