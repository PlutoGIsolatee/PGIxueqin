import { 
    getCachedParagraphs, 
    getCachedParagraphEntropy, 
    computePermutationEntropy,
    precomputeParagraphStats 
} from '../paragraph.js';
import { subtractIntervals } from '../utils/intervalUtils.js';
import { config } from '../config.js';

/**
 * 步骤：低熵段落豁免
 * 移除片段中属于低熵自然段的部分
 * @param {Array} intervals - 输入片段列表
 * @param {string} text - 全文
 * @param {Object} context - 共享上下文（未使用）
 * @returns {Array} 处理后的片段列表
 */
export function stepLowEntropyParagraph(intervals, text, context) {
    if (!intervals || intervals.length === 0) return intervals;
    
    if (config.debug) console.log('[步骤4] 低熵段落豁免');
    
    // 确保段落缓存已预计算
    let paragraphs = getCachedParagraphs();
    if (!paragraphs || paragraphs.length === 0) {
        if (config.debug) console.log('[步骤4] 段落缓存为空，执行预计算...');
        precomputeParagraphStats(text, 0.2, 2);
        paragraphs = getCachedParagraphs();
        if (!paragraphs) return intervals;
    }
    
    const newIntervals = [];
    for (const frag of intervals) {
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
            
            if (config.debug) {
                console.log(`  段落 ${para.start}-${para.end} (长度=${para.end-para.start}) 熵值: ${entropy.toFixed(4)}`);
            }
            
            if (entropy < config.entropyThreshold) {
                const overlapStart = Math.max(frag.start, para.start);
                const overlapEnd = Math.min(frag.end, para.end);
                if (overlapStart < overlapEnd) {
                    removeIntervals.push({ start: overlapStart, end: overlapEnd });
                    if (config.debug) console.log(`  [豁免] 移除低熵段落重叠部分 ${overlapStart}-${overlapEnd}, 熵=${entropy}`);
                }
            }
        }
        
        if (removeIntervals.length === 0) {
            newIntervals.push(frag);
        } else {
            const kept = subtractIntervals(frag, removeIntervals);
            newIntervals.push(...kept);
            if (config.debug) console.log(`  片段 ${frag.start}-${frag.end} 裁剪后保留:`, kept);
        }
    }
    
    if (config.debug) console.log(`[步骤4] 处理完成，片段数量: ${newIntervals.length}`);
    return newIntervals;
}