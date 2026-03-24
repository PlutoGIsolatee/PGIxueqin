import { computeGlobalCovariance, computeMahalanobis, invertMatrix } from '../../core/steps/mahalanobisUtils.js';

describe('马氏距离工具', () => {
    test('computeGlobalCovariance 应正确计算均值和协方差', () => {
        const featuresMatrix = [
            [1, 2, 3, 4, 5, 6],
            [2, 3, 4, 5, 6, 7],
            [3, 4, 5, 6, 7, 8]
        ];
        const { mean, cov } = computeGlobalCovariance(featuresMatrix);
        expect(mean).toHaveLength(6);
        expect(mean[0]).toBe(2);
        expect(mean[1]).toBe(3);
        expect(cov).toHaveLength(6);
        expect(cov[0][0]).toBeGreaterThan(0);
    });
    
    test('computeMahalanobis 应计算正确距离', () => {
        const mean = [0, 0];
        const cov = [[1, 0], [0, 1]];
        const x = [1, 0];
        const distance = computeMahalanobis(x, mean, cov);
        expect(distance).toBeCloseTo(1, 5);
    });
    
    test('invertMatrix 应正确计算逆矩阵', () => {
        const matrix = [[2, 1], [1, 2]];
        const inv = invertMatrix(matrix);
        expect(inv[0][0]).toBeCloseTo(2/3, 5);
        expect(inv[0][1]).toBeCloseTo(-1/3, 5);
        expect(inv[1][0]).toBeCloseTo(-1/3, 5);
        expect(inv[1][1]).toBeCloseTo(2/3, 5);
    });
});