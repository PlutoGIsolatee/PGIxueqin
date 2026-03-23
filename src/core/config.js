// 核心检测参数
export const config = {
    // 第一步：滑动窗口检测
    windowSize: 75,
    step: 10,
    mahalPercentile: 0.95,        // 马氏距离阈值分位数
    
    // 第二步：精确定位
    refineWindowSize: 10,
    refineStep: 1,
    minSequenceLength: 1,          // 最小连续窗口数
    maxCV: 0.5,                    // 最大变异系数
    
    // 豁免规则
    entropyThreshold: 0.4,         // 低熵段落阈值
    consecutiveDigitsPattern: /\d{3,}/,
    extendChars: 20,               // 正常段落豁免扩展字符数
    
    // 其他
    sigmaThreshold: 3,             // 3σ 阈值（备用）
    debug: true                    // 全局调试开关
};