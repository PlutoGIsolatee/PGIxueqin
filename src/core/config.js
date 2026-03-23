// 核心检测参数
export const config = {
    // 第一步：滑动窗口检测
    windowSize: 75,
    step: 10,
    mahalPercentile: 0.95,
    
    // 第二步：精确定位
    refineWindowSize: 10,
    refineStep: 1,
    minSequenceLength: 1,
    maxCV: 0.5,
    
    // 豁免规则
    entropyThreshold: 0.4,
    consecutiveDigitsPattern: /\d{3,}/,
    extendChars: 20,
    
    // 其他
    sigmaThreshold: 3,
    
    // 日志配置
    debug: true,                    // 全局调试开关
    logLevel: 'debug',              // debug, info, warn, error, none
    enableModuleLogging: {
        'step1': true,              // 步骤1日志开关
        'step2': true,
        'step3': true,
        'step4': true,
        'step5': true,
        'step6': true,
        'step7': true,
        'paragraph': true,          // 段落处理模块
        'mahalanobis': true,        // 马氏距离模块
        'interval': false           // 区间操作模块（默认关闭）
    }
};