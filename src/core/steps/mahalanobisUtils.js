let globalMean = null;
let globalCov = null;

/**
 * 设置全局统计（由第一步调用）
 */
export function setGlobalStats(mean, cov) {
    globalMean = mean;
    globalCov = cov;
}

/**
 * 获取全局统计
 */
export function getGlobalStats() {
    return { mean: globalMean, cov: globalCov };
}

/**
 * 求逆矩阵（高斯消元法）
 */
export function invertMatrix(matrix) {
    const n = matrix.length;
    const aug = matrix.map(row => [...row, ...Array(n).fill(0)]);
    for (let i = 0; i < n; i++) aug[i][n + i] = 1;
    for (let i = 0; i < n; i++) {
        let maxRow = i;
        for (let j = i + 1; j < n; j++) {
            if (Math.abs(aug[j][i]) > Math.abs(aug[maxRow][i])) maxRow = j;
        }
        [aug[i], aug[maxRow]] = [aug[maxRow], aug[i]];
        if (Math.abs(aug[i][i]) < 1e-12) {
            throw new Error('Matrix is singular');
        }
        const pivot = aug[i][i];
        for (let k = 0; k < 2 * n; k++) aug[i][k] /= pivot;
        for (let j = 0; j < n; j++) {
            if (j !== i) {
                const factor = aug[j][i];
                for (let k = 0; k < 2 * n; k++) aug[j][k] -= factor * aug[i][k];
            }
        }
    }
    return aug.map(row => row.slice(n));
}

/**
 * 计算协方差矩阵和均值
 */
export function computeGlobalCovariance(featuresMatrix) {
    const n = featuresMatrix.length;
    const dim = featuresMatrix[0].length;
    const mean = Array(dim).fill(0);
    for (let i = 0; i < n; i++) {
        for (let j = 0; j < dim; j++) {
            mean[j] += featuresMatrix[i][j];
        }
    }
    for (let j = 0; j < dim; j++) mean[j] /= n;
    
    const cov = Array(dim).fill().map(() => Array(dim).fill(0));
    for (let i = 0; i < n; i++) {
        const diff = featuresMatrix[i].map((val, j) => val - mean[j]);
        for (let j = 0; j < dim; j++) {
            for (let k = 0; k < dim; k++) {
                cov[j][k] += diff[j] * diff[k];
            }
        }
    }
    for (let j = 0; j < dim; j++) {
        for (let k = 0; k < dim; k++) {
            cov[j][k] /= n;
        }
    }
    // 添加正则项防止奇异
    const reg = 1e-6;
    for (let j = 0; j < dim; j++) cov[j][j] += reg;
    return { mean, cov };
}

/**
 * 计算马氏距离
 */
export function computeMahalanobis(x, mean, cov) {
    const dim = mean.length;
    const diff = x.map((val, i) => val - mean[i]);
    const invCov = invertMatrix(cov);
    let sum = 0;
    for (let i = 0; i < dim; i++) {
        for (let j = 0; j < dim; j++) {
            sum += diff[i] * invCov[i][j] * diff[j];
        }
    }
    return Math.sqrt(Math.max(0, sum));
}