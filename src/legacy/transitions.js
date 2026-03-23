import { getCharCategoryId, NUM_CATEGORIES } from '../classify.js';

/**
 * 从文本构建转移矩阵（计数）
 * @param {string} text
 * @returns {Array<Array<number>>} matrix[NUM_CATEGORIES][NUM_CATEGORIES]
 */
export function buildTransitionMatrix(text) {
    const matrix = Array(NUM_CATEGORIES).fill().map(() => Array(NUM_CATEGORIES).fill(0));
    if (text.length < 2) return matrix;

    let prevId = getCharCategoryId(text[0]);
    for (let i = 1; i < text.length; i++) {
        const currId = getCharCategoryId(text[i]);
        matrix[prevId][currId]++;
        prevId = currId;
    }
    return matrix;
}

/**
 * 从计数矩阵计算转移概率（拉普拉斯平滑，平滑参数alpha=1）
 * @param {Array<Array<number>>} countMatrix
 * @returns {Array<Array<number>>} 概率矩阵，每行和为1
 */
export function computeTransitionProbs(countMatrix, alpha = 1) {
    const probs = Array(NUM_CATEGORIES).fill().map(() => Array(NUM_CATEGORIES).fill(0));
    for (let i = 0; i < NUM_CATEGORIES; i++) {
        const rowTotal = countMatrix[i].reduce((a,b) => a+b, 0) + alpha * NUM_CATEGORIES;
        for (let j = 0; j < NUM_CATEGORIES; j++) {
            probs[i][j] = (countMatrix[i][j] + alpha) / rowTotal;
        }
    }
    return probs;
}

/**
 * 计算一段文本的困惑度（基于给定的转移概率矩阵）
 * @param {string} text
 * @param {Array<Array<number>>} probs
 * @returns {number} 困惑度，如果文本长度<2返回 Infinity
 */
export function computePerplexity(text, probs) {
    if (text.length < 2) return Infinity;
    let logSum = 0;
    let prevId = getCharCategoryId(text[0]);
    for (let i = 1; i < text.length; i++) {
        const currId = getCharCategoryId(text[i]);
        const p = probs[prevId][currId];
        // 理论上p > 0，因为拉普拉斯平滑保证了所有转移概率>0
        logSum += Math.log(p);
        prevId = currId;
    }
    const avgLog = logSum / (text.length - 1);
    return Math.exp(-avgLog);
}