import {
    Calculate
} from "./calculate.js";

export let Analyze = Object.create(null);
Analyze.indexesOfScalarAnomalies = indexesOfScalarAnomalies;

/**
 * 
 * @param {[index, value][]} arr
 */
function indexesOfScalarAnomalies(arr, zThresh = 3) {
    let values = arr.map(([, v]) => v);

    let mean = Calculate.mean(values);
    let std = Calculate.std(values, mean);
    let upper = mean + std * zThresh;
    let lower = mean - std * zThresh;

    let anomalyIndexes = arr.filter(([_, value]) => value < lower || value > upper)
        .map(([index, ]) => index);
    return anomalyIndexes;
}
