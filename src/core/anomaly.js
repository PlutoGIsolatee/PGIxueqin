import { FEATURES } from './stats.js';

/**
 * 3σ 原则判断窗口是否异常
 * @param {Object} features - 窗口特征
 * @param {Object} means - 均值
 * @param {Object} stds - 标准差
 * @param {number} sigma - σ倍数，默认3
 * @returns {boolean}
 */
export function isWindowAbnormalBy3Sigma(features, means, stds, sigma = 3) {
    for (const f of FEATURES) {
        const val = features[f.name];
        const mean = means[f.name];
        const std = stds[f.name];
        if (std === 0) continue;
        if (Math.abs(val - mean) > sigma * std) {
            return true;
        }
    }
    return false;
}

/**
 * 计算窗口的异常分数（各特征偏离标准差的加权和）
 * @param {Object} features - 窗口特征
 * @param {Object} means - 均值
 * @param {Object} stds - 标准差
 * @returns {number}
 */
export function computeAnomalyScore(features, means, stds) {
    let score = 0;
    for (const f of FEATURES) {
        const val = features[f.name];
        const mean = means[f.name];
        const std = stds[f.name];
        if (std === 0) continue;
        const deviation = Math.abs(val - mean) / std; // 偏离多少个标准差
        score += deviation;
    }
    return score;
}