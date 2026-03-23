export const FEATURE_NAMES = ['han', 'zhPunc', 'enChar', 'enPunc', 'digit', 'other'];

/**
 * 从窗口特征对象提取特征向量
 * @param {Object} features - 窗口特征对象
 * @returns {Array<number>} 特征向量
 */
export function extractFeatures(features) {
    return FEATURE_NAMES.map(k => features[k]);
}

/**
 * 从窗口列表提取特征矩阵
 * @param {Array} windows - 窗口列表，每个元素包含 features 对象
 * @returns {Array<Array<number>>} 特征矩阵
 */
export function extractFeatureMatrix(windows) {
    return windows.map(win => extractFeatures(win.features));
}