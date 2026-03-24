import { countClasses, getCharCategoryId, CATEGORIES } from '../classify.js';

describe('字符分类模块', () => {
    test('countClasses 应正确统计各类字符', () => {
        const text = '你好abc123，。';
        const counts = countClasses(text);
        
        expect(counts.total).toBe(10); // 修正：实际10个字符
        expect(counts.zhChar.reduce((a,b)=>a+b,0)).toBe(2); // 你好
        expect(counts.enChar.reduce((a,b)=>a+b,0)).toBe(3); // abc
        expect(counts.digit).toBe(3); // 123
        expect(counts.zhPunc).toBe(2); // ，。
        expect(counts.enPunc).toBe(0);
        expect(counts.other).toBe(0);
    });
    
    test('countClasses 应正确处理空字符串', () => {
        const counts = countClasses('');
        expect(counts.total).toBe(0);
        expect(counts.zhChar.reduce((a,b)=>a+b,0)).toBe(0);
    });
    
    test('getCharCategoryId 应返回正确的类别ID', () => {
        // 汉字
        const hanId = getCharCategoryId('中');
        expect(hanId).toBeGreaterThanOrEqual(CATEGORIES.zhChar_0);
        expect(hanId).toBeLessThanOrEqual(CATEGORIES.zhChar_4);
        
        // 中文标点
        const zhPuncId = getCharCategoryId('，');
        expect(zhPuncId).toBe(CATEGORIES.zhPunc);
        
        // 英文字母
        const enId = getCharCategoryId('a');
        expect(enId).toBeGreaterThanOrEqual(CATEGORIES.enChar_0);
        expect(enId).toBeLessThanOrEqual(CATEGORIES.enChar_3);
        
        // 数字
        const digitId = getCharCategoryId('5');
        expect(digitId).toBe(CATEGORIES.digit);
        
        // 其他
        const otherId = getCharCategoryId('@');
        expect(otherId).toBe(CATEGORIES.other);
    });
});