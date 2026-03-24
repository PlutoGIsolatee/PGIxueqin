export const config = {
    windowSize: 75,
    step: 10,
    mahalPercentile: 0.95,
    refineWindowSize: 10,
    refineStep: 1,
    minSequenceLength: 1,
    maxCV: 0.5,
    entropyThreshold: 0.4,
    consecutiveDigitsPattern: /\d{3,}/,
    extendChars: 20,
    sigmaThreshold: 3,
    debug: true,
    logLevel: 'debug',
    enableModuleLogging: {
        step1: true,
        step2: true,
        step3: true,
        step4: true,
        step5: true,
        step6: true,
        step7: true,
        paragraph: true,
        mahalanobis: true,
        interval: false
    }
};