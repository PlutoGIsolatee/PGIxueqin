export default {
    // 测试环境
    testEnvironment: 'node',
    
    // 根目录
    rootDir: '.',
    
    // 测试文件匹配模式
    testMatch: [
        '**/__tests__/**/*.js',
        '**/?(*.)+(spec|test).js'
    ],
    
    // 忽略的目录
    testPathIgnorePatterns: [
        '/node_modules/',
        '/legacy/'
    ],
    
    // 模块文件扩展名
    moduleFileExtensions: ['js', 'json'],
    
    // 转换器（使用原生 ES 模块，不需要 babel）
    transform: {},
    
    // 收集覆盖率
    collectCoverage: true,
    coverageDirectory: 'coverage',
    coverageReporters: ['text', 'lcov', 'html'],
    collectCoverageFrom: [
        'src/core/**/*.js',
        'src/classify.js',
        '!src/core/steps/**/*.js',      // 步骤文件暂时排除（可后续加入）
        '!src/core/utils/logger.js',    // 日志工具排除
        '!src/legacy/**/*.js'
    ],
    
    // 覆盖率阈值（可选）
    coverageThreshold: {
        global: {
            statements: 70,
            branches: 60,
            functions: 70,
            lines: 70
        }
    },
    
    // 模块名称映射（支持别名）
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1'
    },
    
    // 详细输出
    verbose: true,
    
    // 测试超时时间（毫秒）
    testTimeout: 10000
};
