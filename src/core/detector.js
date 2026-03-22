import { runPipeline } from './pipeline.js';
import {
    stepSlidingWindowDetection,
    stepRefineBoundary,
    stepConsecutiveDigits,
    stepLowEntropyParagraph,
    stepTrimWhitespace,
    stepMergeIntervals
} from './steps/index.js';

// 步骤顺序：
// 1. 滑动窗口粗检测
// 2. 简单细粒度精确定位
// 3. 连续数字豁免
// 4. 低熵段落豁免
// 5. 修剪空白
// 6. 合并区间
const STEPS = [
    stepSlidingWindowDetection,
    stepRefineBoundary,
    stepConsecutiveDigits,
    stepLowEntropyParagraph,
    stepTrimWhitespace,
    stepMergeIntervals
];

export function detectNoiseFragments(text) {
    return runPipeline(STEPS, text);
}