import { config } from '../../config.js';

// 日志级别定义
export const LOG_LEVELS = {
    DEBUG: 0,
    INFO: 1,
    WARN: 2,
    ERROR: 3,
    NONE: 4
};

// 当前日志级别（从配置读取）
let currentLevel = config.debug ? LOG_LEVELS.DEBUG : LOG_LEVELS.INFO;

/**
 * 设置日志级别
 * @param {number} level - LOG_LEVELS 中的值
 */
export function setLogLevel(level) {
    currentLevel = level;
}

/**
 * 格式化日志输出
 * @param {string} module - 模块名称
 * @param {string} level - 日志级别名称
 * @param {string} message - 日志内容
 * @param {any} data - 可选附加数据
 */
function formatLog(module, level, message, data) {
    const timestamp = new Date().toISOString().slice(11, 23);
    let output = `[${timestamp}] [${module}] [${level}] ${message}`;
    if (data !== undefined) {
        output += `\n  数据: ${JSON.stringify(data, null, 2)}`;
    }
    return output;
}

/**
 * 输出调试日志
 * @param {string} module - 模块名称
 * @param {string} message - 日志内容
 * @param {any} data - 可选附加数据
 */
export function debug(module, message, data) {
    if (currentLevel <= LOG_LEVELS.DEBUG) {
        console.log(formatLog(module, 'DEBUG', message, data));
    }
}

/**
 * 输出信息日志
 * @param {string} module - 模块名称
 * @param {string} message - 日志内容
 * @param {any} data - 可选附加数据
 */
export function info(module, message, data) {
    if (currentLevel <= LOG_LEVELS.INFO) {
        console.log(formatLog(module, 'INFO', message, data));
    }
}

/**
 * 输出警告日志
 * @param {string} module - 模块名称
 * @param {string} message - 日志内容
 * @param {any} data - 可选附加数据
 */
export function warn(module, message, data) {
    if (currentLevel <= LOG_LEVELS.WARN) {
        console.warn(formatLog(module, 'WARN', message, data));
    }
}

/**
 * 输出错误日志
 * @param {string} module - 模块名称
 * @param {string} message - 日志内容
 * @param {any} data - 可选附加数据
 */
export function error(module, message, data) {
    if (currentLevel <= LOG_LEVELS.ERROR) {
        console.error(formatLog(module, 'ERROR', message, data));
    }
}

/**
 * 创建带模块前缀的日志器
 * @param {string} moduleName - 模块名称
 * @returns {Object} 日志方法对象
 */
export function createLogger(moduleName) {
    return {
        debug: (message, data) => debug(moduleName, message, data),
        info: (message, data) => info(moduleName, message, data),
        warn: (message, data) => warn(moduleName, message, data),
        error: (message, data) => error(moduleName, message, data)
    };
}
