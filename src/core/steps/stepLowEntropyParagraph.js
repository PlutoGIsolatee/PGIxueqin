import { 
    getCachedParagraphs, 
    getCachedParagraphEntropy, 
    computePermutationEntropy,
    precomputeParagraphStats 
} from '../paragraph.js';

const DEBUG = true;
const ENTROPY_THRESHOLD = 0.4;

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

export function stepLowEntropyParagraph(intervals, text) {
    if (!intervals || intervals.length === 0) return intervals;
    
    if (DEBUG) console.log('[步骤4] 低熵段落豁免');
    
    // 确保段落缓存已预计算
    let paragraphs = getCachedParagraphs();
    if (!paragraphs || paragraphs.length === 0) {
        if (DEBUG) console.log('[步骤4] 段落缓存为空，执行预计算...');
        precomputeParagraphStats(text, 0.2, 2);
        paragraphs = getCachedParagraphs();
        if (!paragraphs) return intervals;
    }
    
    const newIntervals = [];
    for (let idx = 0; idx < intervals.length; idx++) {
        const frag = intervals[idx];
        const removeIntervals = [];
        
        for (let i = 0; i < paragraphs.length; i++) {
            const para = paragraphs[i];
            if (para.start >= frag.end || para.end <= frag.start) continue;
            
            let entropy;
            const cachedEntropy = getCachedParagraphEntropy(i);
            if (cachedEntropy !== undefined && cachedEntropy !== null) {
                entropy = cachedEntropy;
            } else {
                const paraText = text.slice(para.start, para.end);
                entropy = computePermutationEntropy(paraText);
            }
            
            if (DEBUG) {
                console.log(`  段落 ${para.start}-${para.end} (长度=${para.end-para.start}) 熵值: ${entropy.toFixed(4)}`);
            }
            
            if (entropy < ENTROPY_THRESHOLD) {
                const overlapStart = Math.max(frag.start, para.start);
                const overlapEnd = Math.min(frag.end, para.end);
                if (overlapStart < overlapEnd) {
                    removeIntervals.push({ start: overlapStart, end: overlapEnd });
                    if (DEBUG) console.log(`  [豁免] 移除低熵段落重叠部分 ${overlapStart}-${overlapEnd}, 熵=${entropy}`);
                }
            }
        }
        
        if (removeIntervals.length === 0) {
            newIntervals.push(frag);
        } else {
            const kept = subtractIntervals(frag, removeIntervals);
            newIntervals.push(...kept);
            if (DEBUG) console.log(`  片段 ${frag.start}-${frag.end} 裁剪后保留:`, kept);
        }
    }
    
    if (DEBUG) console.log(`[步骤4] 处理完成，片段数量: ${newIntervals.length}`);
    return newIntervals;
}