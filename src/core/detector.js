import { runPipeline } from './pipeline.js';
import {
    stepParagraphDetection,
    stepConsecutiveDigits,
    stepLowEntropyParagraph,
    stepTrimWhitespace,
    stepMergeIntervals
} from './steps/index.js';

// 定义步骤顺序
const STEPS = [
    stepParagraphDetection,   // 第一步：自然段异常检测
    stepConsecutiveDigits,    // 连续数字豁免
    stepLowEntropyParagraph,  // 低熵段落豁免
    stepTrimWhitespace,       // 修剪空白
    stepMergeIntervals        // 合并区间
];

/**
 * 检测文本中的噪声片段
 * @param {string} text - 全文
 * @returns {Array<{start, end}>} 最终片段
 */
export function detectNoiseFragments(text) {
    const intervals = runPipeline(STEPS, text);
    return intervals;
}