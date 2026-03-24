import { mergeIntervals, subtractIntervals, trimFragment } from '../../core/utils/intervalUtils.js';

describe('区间操作工具', () => {
    test('mergeIntervals 应正确合并重叠区间', () => {
        const intervals = [
            { start: 10, end: 20 },
            { start: 15, end: 25 },
            { start: 30, end: 40 }
        ];
        const merged = mergeIntervals(intervals);
        expect(merged).toEqual([
            { start: 10, end: 25 },
            { start: 30, end: 40 }
        ]);
    });
    
    test('mergeIntervals 应正确合并相邻区间', () => {
        const intervals = [
            { start: 10, end: 20 },
            { start: 20, end: 30 }
        ];
        const merged = mergeIntervals(intervals);
        expect(merged).toEqual([{ start: 10, end: 30 }]);
    });
    
    test('subtractIntervals 应正确裁剪片段', () => {
        const fragment = { start: 0, end: 100 };
        const remove = [
            { start: 20, end: 30 },
            { start: 50, end: 60 }
        ];
        const result = subtractIntervals(fragment, remove);
        expect(result).toEqual([
            { start: 0, end: 20 },
            { start: 30, end: 50 },
            { start: 60, end: 100 }
        ]);
    });
    
    test('subtractIntervals 应处理空移除区间', () => {
        const fragment = { start: 0, end: 100 };
        const result = subtractIntervals(fragment, []);
        expect(result).toEqual([fragment]);
    });
    
    test('trimFragment 应正确修剪空白', () => {
        const text = '  hello world  ';
        // 字符串长度: 前后各2空格 + "hello"5 + 1空格 + "world"5 = 15
        const trimmed = trimFragment(text, 0, 15);
        expect(trimmed.start).toBe(2);   // 第一个非空白字符索引
        expect(trimmed.end).toBe(13);    // 最后一个非空白字符索引+1 ("world"末尾)
    });
    
    test('trimFragment 应正确处理无空白', () => {
        const text = 'hello';
        const trimmed = trimFragment(text, 0, 5);
        expect(trimmed.start).toBe(0);
        expect(trimmed.end).toBe(5);
    });
});