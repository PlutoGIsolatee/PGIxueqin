import { getCachedParagraphs, getCachedParagraphEntropy, computePermutationEntropy } from '../paragraph.js';

const DEBUG = true;
const ENTROPY_THRESHOLD = 0.4;

/**
 * 步骤：移除片段中属于低熵自然段的部分
 * @param {Array} intervals - 输入片段列表
 * @param {string} text - 全文
 * @returns {Array} 处理后的片段列表（可能被拆分为多个）
 */
export function stepLowEntropyParagraph(intervals, text) {
    if (!intervals || intervals.length === 0) return intervals;
    
    if (DEBUG) console.log('[步骤3] 低熵段落豁免');
    
    const paragraphs = getCachedParagraphs();
    if (!paragraphs || paragraphs.length === 0) return intervals;
    
    const newIntervals = [];
    for (const frag of intervals) {
        let currentStart = frag.start;
        let currentEnd = frag.end;
        const removeIntervals = [];
        
        for (const para of paragraphs) {
            if (para.start >= currentEnd || para.end <= currentStart) continue;
            // 计算段落熵
            let entropy;
            const paraIndex = paragraphs.findIndex(p => p.start === para.start && p.end === para.end);
            if (paraIndex !== -1) {
                entropy = getCachedParagraphEntropy(paraIndex);
            }
            if (entropy === undefined) {
                const paraText = text.slice(para.start, para.end);
                entropy = computePermutationEntropy(paraText);
            }
            if (entropy < ENTROPY_THRESHOLD) {
                const overlapStart = Math.max(currentStart, para.start);
                const overlapEnd = Math.min(currentEnd, para.end);
                if (overlapStart < overlapEnd) {
                    removeIntervals.push({ start: overlapStart, end: overlapEnd });
                    if (DEBUG) console.log(`[步骤3] 移除低熵段落 ${para.start}-${para.end} 重叠部分 ${overlapStart}-${overlapEnd}, 熵=${entropy}`);
                }
            }
        }
        
        if (removeIntervals.length === 0) {
            newIntervals.push(frag);
        } else {
            // 裁剪片段
            const kept = subtractIntervals(frag, removeIntervals);
            newIntervals.push(...kept);
        }
    }
    return newIntervals;
}

function subtractIntervals(fragment, removeIntervals) {
    const result = [];
    let currentStart = fragment.start;
    removeIntervals.sort((a,b)=>a.start-b.start);
    for (const rem of removeIntervals) {
        if (rem.end <= fragment.start || rem.start >= fragment.end) continue;
        const start = Math.max(currentStart, rem.start);
        const end = Math.min(fragment.end, rem.end);
        if (start > currentStart) {
            result.push({ start: currentStart, end: start });
        }
        currentStart = Math.max(currentStart, end);
        if (currentStart >= fragment.end) break;
    }
    if (currentStart < fragment.end) {
        result.push({ start: currentStart, end: fragment.end });
    }
    return result;
}