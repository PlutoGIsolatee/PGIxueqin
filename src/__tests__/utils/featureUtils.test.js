import { extractFeatures, extractFeatureMatrix, FEATURE_NAMES } from '../../core/utils/featureUtils.js';

describe('特征提取工具', () => {
    test('extractFeatures 应正确提取特征向量', () => {
        const features = {
            han: 0.5,
            zhPunc: 0.1,
            enChar: 0.2,
            enPunc: 0.05,
            digit: 0.1,
            other: 0.05
        };
        const vector = extractFeatures(features);
        expect(vector).toEqual([0.5, 0.1, 0.2, 0.05, 0.1, 0.05]);
        expect(vector.length).toBe(FEATURE_NAMES.length);
    });
    
    test('extractFeatureMatrix 应正确提取特征矩阵', () => {
        const windows = [
            { features: { han: 0.5, zhPunc: 0.1, enChar: 0.2, enPunc: 0.05, digit: 0.1, other: 0.05 } },
            { features: { han: 0.3, zhPunc: 0.2, enChar: 0.3, enPunc: 0.05, digit: 0.1, other: 0.05 } }
        ];
        const matrix = extractFeatureMatrix(windows);
        expect(matrix).toHaveLength(2);
        expect(matrix[0]).toHaveLength(6);
        expect(matrix[1]).toHaveLength(6);
    });
});