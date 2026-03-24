import { runPipeline } from './pipeline.js';
import { config } from '../config.js';
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

const STEP_MAP = {
    'stepMahalanobisWindowDetection': stepMahalanobisWindowDetection,
    'stepMahalanobisRefine': stepMahalanobisRefine,
    'stepConsecutiveDigits': stepConsecutiveDigits,
    'stepLowEntropyParagraph': stepLowEntropyParagraph,
    'stepNormalParagraphExemption': stepNormalParagraphExemption,
    'stepTrimWhitespace': stepTrimWhitespace,
    'stepMergeIntervals': stepMergeIntervals
};

export function getAvailableSteps() {
    return Object.keys(STEP_MAP).map(name => ({
        name: name,
        displayName: name.replace(/^step/, '').replace(/([A-Z])/g, ' $1').trim()
    }));
}

function buildSteps(stepNames) {
    return stepNames.map(name => ({
        name: name,
        fn: STEP_MAP[name]
    })).filter(step => step.fn);
}

export function detectNoiseFragments(text, stepConfig = null, paramConfig = null) {
    const originalConfig = { ...config };
    
    try {
        if (paramConfig && paramConfig.params) {
            for (const [key, value] of Object.entries(paramConfig.params)) {
                if (key === 'consecutiveDigitsPattern' && typeof value === 'string') {
                    try {
                        config[key] = new RegExp(value);
                    } catch (e) {
                        console.warn(`正则表达式解析失败: ${value}`);
                    }
                } else if (key === 'debug') {
                    config[key] = value === true || value === 'true';
                } else if (typeof value === 'number' || !isNaN(parseFloat(value))) {
                    config[key] = parseFloat(value);
                } else {
                    config[key] = value;
                }
            }
        }
        
        const context = {};
        
        const windows = computeWindowFeatures(text, config.windowSize, config.step);
        if (windows.length > 0) {
            context.globalStats = computeMeanStd(windows);
        }
        
        let steps;
        if (stepConfig && stepConfig.steps && stepConfig.steps.length > 0) {
            steps = buildSteps(stepConfig.steps);
        } else {
            steps = [
                { name: '1. 马氏距离滑动窗口检测', fn: stepMahalanobisWindowDetection },
                { name: '2. 马氏距离精确定位', fn: stepMahalanobisRefine },
                { name: '3. 连续数字豁免', fn: stepConsecutiveDigits },
                { name: '4. 低熵段落豁免', fn: stepLowEntropyParagraph },
                { name: '5. 正常段落豁免', fn: stepNormalParagraphExemption },
                { name: '6. 修剪空白', fn: stepTrimWhitespace },
                { name: '7. 合并区间', fn: stepMergeIntervals }
            ];
        }
        
        const { finalIntervals, stepResults } = runPipeline(steps, text, context);
        return { fragments: finalIntervals, stepResults, usedSteps: steps };
    } catch (err) {
        console.error('检测过程出错:', err);
        Object.assign(config, originalConfig);
        throw err;
    }
}