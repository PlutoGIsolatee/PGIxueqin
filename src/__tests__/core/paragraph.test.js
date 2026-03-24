import { getParagraphs, computePermutationEntropy } from '../../core/paragraph.js';

describe('段落处理模块', () => {
    test('getParagraphs 应正确分割段落', () => {
        const text = '第一段\n第二段\n\n第三段';
        const paragraphs = getParagraphs(text);
        expect(paragraphs).toHaveLength(3);
        expect(paragraphs[0].start).toBe(0);
        expect(paragraphs[0].end).toBe(3);
        expect(paragraphs[1].start).toBe(4);
        expect(paragraphs[1].end).toBe(7);
        expect(paragraphs[2].start).toBe(9);
        expect(paragraphs[2].end).toBe(12);
    });
    
    test('getParagraphs 应处理空文本', () => {
        const paragraphs = getParagraphs('');
        expect(paragraphs).toEqual([]);
    });
    
    test('computePermutationEntropy 应返回正确的熵值', () => {
        // 完全重复序列，所有窗口模式相同，熵为0
        const text1 = 'aaaaaa';
        const entropy1 = computePermutationEntropy(text1);
        expect(entropy1).toBe(0);
        
        // 严格递增序列，所有窗口模式相同（都是[0,1,2]），熵也为0
        const text2 = 'abcdefghijklmnopqrstuvwxyz';
        const entropy2 = computePermutationEntropy(text2);
        expect(entropy2).toBe(0);
        
        // 随机序列，熵应大于0（不严格要求 >0.5，因为短序列可能达不到）
        const text3 = 'ghefcdab'; // 乱序
        const entropy3 = computePermutationEntropy(text3);
        expect(entropy3).toBeGreaterThan(0);
        
        // 更随机的序列，熵应该较高
        const text4 = 'bdacfeg'; // 7个字符，稍随机
        const entropy4 = computePermutationEntropy(text4);
        expect(entropy4).toBeGreaterThan(0.3);
        
        // 短文本（长度小于m=3）
        const text5 = 'ab';
        const entropy5 = computePermutationEntropy(text5);
        expect(entropy5).toBe(0);
    });
});