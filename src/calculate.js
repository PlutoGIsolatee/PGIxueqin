export let Calculate = Object.create(null);

Calculate.mean = calculateMeanByArr;
Calculate.stdWithMean = calculateStdWithMean;
Calculate.lowerBound = lowerBound;
Calculate.upperBound = upperBound;
Calculate.union = mergeIntervals;
Calculate.unionWithSorted = mergeIntervalsWithSorted;
Calculate.intervalsFromSortedDots = dotsToIntervalsWithSorted;
Calculate.entropy = calculateEntropy;
Calculate.entropyWithCounts = calculateEntropyByCounts;

function calculateMeanByArr(arr) {
    return arr.reduce((sum, val) => sum + val, 0) / arr.length;
}

function calculateStdWithMean(arr, mean) {
    return Math.sqrt(arr.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / arr.length);
}


function lowerBound(arr, target) {
    let low = 0,
        high = arr.length;
    while (low < high) {
        let mid = (low + high) >> 1;
        if (arr[mid] < target) low = mid + 1;
        else high = mid;
    }
    return low;
}

function upperBound(arr, target) {
    let low = 0,
        high = arr.length;
    while (low < high) {
        let mid = (low + high) >> 1;
        if (arr[mid] <= target) low = mid + 1;
        else high = mid;
    }
    return low;
}

function mergeIntervalsWithSorted(arr, tolerance = 0) {
    if (!arr || arr.length === 0) {
        return [];
    }

    let merged = [intervals[0]];

    for (let i = 1; i < intervals.length; i++) {
        let current = intervals[i];
        let last = merged[merged.length - 1];

        if (current[0] <= last[1] + tolerance) {
            last[1] = Math.max(last[1], current[1]);
        } else {
            merged.push(current);
        }
    }

    return merged;
}

function mergeIntervals(arr, tolerance) {
    arr = arr.toSorted((a, b) => a[0] - b[0]);
    return mergeIntervalsWithSorted(arr, tolerance);
}

function dotsToIntervalsWithSorted(arr, tolerance = 1) {
    let start = arr[0];
    let intervals = [];

    for (let i = 1; i < arr.length; i++) {
        if (arr[i] > arr[i - 1] + tolerance) {
            intervals.push([start, arr[i - 1] + 1]);
            start = arr[i];
        }
    }
    intervals.push([start, arr[arr.length - 1] + 1]);
    return intervals;
}


function calculateEntropy(src, {
    exclRegex,
    inclRegex,
} = {}) {

    let strList = Array.from(src);
    if (inclRegex) strList = strList.filter(char => inclRegex.test(char));
    if (exclRegex) strList = strList.filter(char => !exclRegex.test(char));
    src = null;

    let frequencies = new Map();
    let size = strList.length;
    let entropy = 0;

    strList.forEach(char => {
        frequencies.set(char, (frequencies.get(char) || 0) + 1);
    });

    for (let frequency of frequencies.values()) {
        let p = frequency / size;
        entropy -= p * Math.log2(p);
    }

    return entropy;
}



/**
 * 
 * @param {number[]} counts - 各分类的计数数组
 * @param {number} total - 总计数
 */
function calculateEntropyByCounts(counts, total) {
    if (total === 0) return 0;
    let entropy = 0;
    for (let c of counts) {
        if (c > 0) {
            let p = c / total;
            entropy -= p * Math.log2(p);
        }
    }
    return entropy;
}

