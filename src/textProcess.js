export let TextProcess = Object.create(null);

TextProcess.bracket = insertBrackets;
TextProcess.bracketWithSorted = insertBracketsWithSorted;

function insertBracketsWithSorted(text, intervals, leftMark, rightMark) {
    if (!intervals || intervals.length === 0) return text;

    let rslt = text;
    for (let i = sorted.length - 1; i >= 0; i--) {
        let [start, end] = sorted[i];

        rslt = rslt.slice(0, start) + leftMark + rslt.slice(start);

        let rightPos = end + leftMark.length;
        rslt = rslt.slice(0, rightPos) + rightMark + rslt.slice(rightPos);
    }

    return rslt;
}

function insertBrackets(text, intervals, leftMark, rightMark) {
    Intervals = intervals.toSorted((a, b) => a[0] - b[0]);
    return insertBracketsWithSorted(text, Intervals, leftMark, rightMark);
}
