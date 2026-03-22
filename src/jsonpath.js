export let JSONPath = Object.create(null);
JSONPath.get = jsonPathGet;

function jsonPathGet(obj, path) {
    if (!path.startsWith('$')) {
        throw new Error('Path must start with $');
    }

    let regex = /\.([^\.\[\]]+)|\[\'([^\']*)\'\]|\[\"([^\"]*)\"\]|\[(\d+)\]/g;
    let keys = [];
    let match;

    while ((match = regex.exec(path)) !== null) {
        if (match[1] !== undefined) {
            keys.push(match[1]);
        } else if (match[2] !== undefined) {
            keys.push(match[2]);
        } else if (match[3] !== undefined) {
            keys.push(match[3]);
        } else if (match[4] !== undefined) {
            keys.push(parseInt(match[4], 10));
        }
    }

    let current = obj;
    for (let key of keys) {
        if (current === null || typeof current !== 'object') {
            return undefined;
        }
        current = current[key];
        if (current === undefined) {
            return undefined;
        }
    }
    return current;
}
