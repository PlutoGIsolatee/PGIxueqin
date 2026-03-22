import { countClasses } from '../classify.js';
import { isWindowAbnormalBy3Sigma } from './anomaly.js';
import { 
    computePermutationEntropy, 
    getParagraphFeatures, 
    getCachedParagraphs,
    getNearbyParagraphStatsCached,
    precomputeParagraphStats,
    getCachedParagraphFeatures
} from './paragraph.js';

const DEBUG = false;

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
    if (!paragraphs || paragraphs.length === 0) return [];
    
    const removeIntervals = [];
    for (const para of paragraphs) {
        if (para.start >= fragment.end || para.end <= fragment.start) continue;
        
        const paraText = text.slice(para.start, para.end);
        const entropy = computePermutationEntropy(paraText);
        
        if (entropy < entropyThreshold) {
            const overlapStart = Math.max(fragment.start, para.start);
            const overlapEnd = Math.min(fragment.end, para.end);
            if (overlapStart < overlapEnd) {
                removeIntervals.push({ start: overlapStart, end: overlapEnd });
                if (DEBUG) console.log(`[ruleRemoveLowEntropyParagraphs] 移除低熵段落 ${para.start}-${para.end}`);
            }
        }
    }
    removeIntervals.sort((a, b) => a.start - b.start);
    return removeIntervals;
}

export function ruleRemoveNormalParagraphs(fragment, globalStats, context) {
    const { paragraphs, text, sigma = 3 } = context;
    if (!paragraphs || paragraphs.length === 0) return [];
    
    const removeIntervals = [];
    const cachedParagraphs = getCachedParagraphs();
    const cachedFeatures = getCachedParagraphFeatures();
    
    // 快速路径：如果没有缓存，直接使用全局统计
    if (!cachedParagraphs || cachedParagraphs.length === 0) {
        for (const para of paragraphs) {
            if (para.start >= fragment.end || para.end <= fragment.start) continue;
            const paraText = text.slice(para.start, para.end);
            const isAbnormal = isParagraphAbnormal(paraText, globalStats, sigma);
            if (!isAbnormal) {
                const overlapStart = Math.max(fragment.start, para.start);
                const overlapEnd = Math.min(fragment.end, para.end);
                if (overlapStart < overlapEnd) {
                    removeIntervals.push({ start: overlapStart, end: overlapEnd });
                }
            }
        }
        removeIntervals.sort((a, b) => a.start - b.start);
        return removeIntervals;
    }
    
    // 构建段落索引映射，加速查找
    const paraIndexMap = new Map();
    for (let i = 0; i < cachedParagraphs.length; i++) {
        const p = cachedParagraphs[i];
        paraIndexMap.set(`${p.start},${p.end}`, i);
    }
    
    for (const para of paragraphs) {
        if (para.start >= fragment.end || para.end <= fragment.start) continue;
        
        const key = `${para.start},${para.end}`;
        const paraIndex = paraIndexMap.get(key);
        const paraText = text.slice(para.start, para.end);
        
        let isAbnormal;
        
        if (paraIndex !== undefined && cachedFeatures && cachedFeatures[paraIndex]) {
            const localStats = getNearbyParagraphStatsCached(paraIndex);
            if (localStats) {
                const features = cachedFeatures[paraIndex];
                if (features) {
                    isAbnormal = isWindowAbnormalBy3Sigma(features, localStats.means, localStats.stds, sigma);
                    if (DEBUG) console.log(`段落 ${para.start}-${para.end} 局部判断: ${isAbnormal}`);
                } else {
                    isAbnormal = isParagraphAbnormal(paraText, globalStats, sigma);
                }
            } else {
                isAbnormal = isParagraphAbnormal(paraText, globalStats, sigma);
            }
        } else {
            isAbnormal = isParagraphAbnormal(paraText, globalStats, sigma);
        }
        
        if (!isAbnormal) {
            const overlapStart = Math.max(fragment.start, para.start);
            const overlapEnd = Math.min(fragment.end, para.end);
            if (overlapStart < overlapEnd) {
                removeIntervals.push({ start: overlapStart, end: overlapEnd });
                if (DEBUG) console.log(`[ruleRemoveNormalParagraphs] 移除正常段落 ${para.start}-${para.end}`);
            }
        }
    }
    
    removeIntervals.sort((a, b) => a.start - b.start);
    return removeIntervals;
}

// 导出预计算函数
export function initParagraphStats(text, lenRatio = 0.2, minSimilar = 2) {
    precomputeParagraphStats(text, lenRatio, minSimilar);
}

export const EXEMPTION_RULES = [
    ruleConsecutiveDigits,
    ruleRemoveLowEntropyParagraphs,
    ruleRemoveNormalParagraphs
];