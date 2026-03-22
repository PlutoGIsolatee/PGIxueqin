import { charFreqLayers } from './charFreqCats.js';

// 构建各层级的字符集合
const zhCharSets = charFreqLayers.zhChar.map(layer => new Set(layer));
const zhPuncSet = new Set(charFreqLayers.zhPunc);
const enCharSets = charFreqLayers.enChar.map(layer => new Set(layer));
const enPuncSet = new Set(charFreqLayers.enPunc);
const digitSet = new Set('0123456789');

// 定义所有类别及其编号（用于转移矩阵）
export const CATEGORIES = {
    zhChar_0: 0,
    zhChar_1: 1,
    zhChar_2: 2,
    zhChar_3: 3,
    zhChar_4: 4,
    zhPunc: 5,
    enChar_0: 6,
    enChar_1: 7,
    enChar_2: 8,
    enChar_3: 9,
    enPunc: 10,
    digit: 11,
    other: 12
};
export const NUM_CATEGORIES = Object.keys(CATEGORIES).length;

/**
 * 获取字符的类别ID（用于转移矩阵）
 */
export function getCharCategoryId(ch) {
    for (let i = 0; i < zhCharSets.length; i++) {
        if (zhCharSets[i].has(ch)) return CATEGORIES[`zhChar_${i}`];
    }
    if (zhPuncSet.has(ch)) return CATEGORIES.zhPunc;
    for (let i = 0; i < enCharSets.length; i++) {
        if (enCharSets[i].has(ch)) return CATEGORIES[`enChar_${i}`];
    }
    if (enPuncSet.has(ch)) return CATEGORIES.enPunc;
    if (digitSet.has(ch)) return CATEGORIES.digit;
    return CATEGORIES.other;
}

/**
 * 获取字符的类别信息（用于窗口统计）
 * @param {string} ch
 * @returns {Object} { category: string, layerIndex: number }
 */
export function getCharClass(ch) {
    for (let i = 0; i < zhCharSets.length; i++) {
        if (zhCharSets[i].has(ch)) return { category: 'zhChar', layerIndex: i };
    }
    if (zhPuncSet.has(ch)) return { category: 'zhPunc', layerIndex: -1 };
    for (let i = 0; i < enCharSets.length; i++) {
        if (enCharSets[i].has(ch)) return { category: 'enChar', layerIndex: i };
    }
    if (enPuncSet.has(ch)) return { category: 'enPunc', layerIndex: -1 };
    if (digitSet.has(ch)) return { category: 'digit', layerIndex: -1 };
    return { category: 'other', layerIndex: -1 };
}

/**
 * 统计一段文本中各类别的计数（包含分层）
 * @param {string} text
 * @returns {Object} 计数对象
 */
export function countClasses(text) {
    const counts = {
        zhChar: new Array(zhCharSets.length).fill(0),
        zhPunc: 0,
        enChar: new Array(enCharSets.length).fill(0),
        enPunc: 0,
        digit: 0,
        other: 0,
        total: 0
    };
    for (const ch of text) {
        const cls = getCharClass(ch);
        counts.total++;
        switch (cls.category) {
            case 'zhChar':
                counts.zhChar[cls.layerIndex]++;
                break;
            case 'zhPunc':
                counts.zhPunc++;
                break;
            case 'enChar':
                counts.enChar[cls.layerIndex]++;
                break;
            case 'enPunc':
                counts.enPunc++;
                break;
            case 'digit':
                counts.digit++;
                break;
            default:
                counts.other++;
        }
    }
    return counts;
}