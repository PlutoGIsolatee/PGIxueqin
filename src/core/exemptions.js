import { countClasses } from '../classify.js';
import { isWindowAbnormalBy3Sigma } from './anomaly.js';
import { 
    getCachedParagraphs,
    getCachedParagraphEntropy,
    computePermutationEntropy,
    precomputeParagraphStats
} from './paragraph.js';

const DEBUG = true; // 保持调试开启

export function ruleConsecutiveDigits(fragment, globalStats, context) {
    const hasConsecutiveDigits = /\d{3,}/.test(fragment.text);
    if (!hasConsecutiveDigits) return [];
    const processed = fragment.text.replace(/\d{3,}/g, ' ');
    const counts = countClasses(processed);
    if (counts.total === 0) return [];
    const hanTotal = counts.zhChar.reduce((a,b)=>a+b,0);
    const enTotal = counts.enChar.reduce((a,b)=>a+b,0);
    const features = {
        han: hanTotal / counts.total,
        zhPunc: counts.zhPunc / counts.total,
        enChar: enTotal / counts.total,
        enPunc: counts.enPunc / counts.total,
        digit: counts.digit / counts.total,
        other: counts.other / counts.total
    };
    if (!isWindowAbnormalBy3Sigma(features, globalStats.means, globalStats.stds, 3)) {
        if (DEBUG) console.log(`[ruleConsecutiveDigits] 豁免整个片段: ${fragment.start}-${fragment.end}`);
        return [{ start: fragment.start, end: fragment.end }];
    }
    return [];
}

export function ruleRemoveLowEntropyParagraphs(fragment, globalStats, context) {
    const { paragraphs, text, entropyThreshold = 0.4 } = context;
    if (!paragraphs) return [];
    const removeIntervals = [];
    const cachedParagraphs = getCachedParagraphs();
    
    for (let idx = 0; idx < paragraphs.length; idx++) {
        const para = paragraphs[idx];
        if (para.start >= fragment.end || para.end <= fragment.start) continue;
        
        // 尝试使用缓存的熵值
        let entropy;
        if (cachedParagraphs) {
            const paraIndex = cachedParagraphs.findIndex(p => p.start === para.start && p.end === para.end);
            if (paraIndex !== -1) {
                entropy = getCachedParagraphEntropy(paraIndex);
            }
        }
        if (entropy === undefined) {
            const paraText = text.slice(para.start, para.end);
            entropy = computePermutationEntropy(paraText);
        }
        
        if (DEBUG) console.log(`段落 ${para.start}-${para.end} 熵值: ${entropy.toFixed(4)}`);
        if (entropy < entropyThreshold) {
            const overlapStart = Math.max(fragment.start, para.start);
            const overlapEnd = Math.min(fragment.end, para.end);
            if (overlapStart < overlapEnd) {
                removeIntervals.push({ start: overlapStart, end: overlapEnd });
                if (DEBUG) console.log(`[ruleRemoveLowEntropyParagraphs] 移除低熵段落 ${para.start}-${para.end} 重叠部分 ${overlapStart}-${overlapEnd}, 熵=${entropy}`);
            }
        }
    }
    removeIntervals.sort((a, b) => a.start - b.start);
    return removeIntervals;
}

export const EXEMPTION_RULES = [
    ruleConsecutiveDigits,
    ruleRemoveLowEntropyParagraphs
];

// 导出预计算函数供 detector 调用
export function initParagraphStats(text, lenRatio = 0.2, minSimilar = 2) {
    precomputeParagraphStats(text, lenRatio, minSimilar);
}