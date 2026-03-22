import {
    JSONPath
} from "./jsonpath.js";


export function CharCatConfig(mani, container) {
    return processReadCharCatConfig(readCharCatConfig(mani, container));
}



function processReadCharCatConfig(readConfig) {
    let globalMap = new Map();

    function setInMap(map, key, value) {
        let current = map.get(key);
        if (current === undefined) {
            map.set(key, [value]);
        } else {
            current.push(value);
        }
    }

    function* model(readConfig) {
        for (let {
                name,
                flag,
                data,
                type,
            }
            of readConfig) {
            let size;


            switch (type) {
                case "charList": {
                    size = data.length;
                    for (let i = 0; i < size; i++) {
                        let char = data[i];

                        setInMap(globalMap, char, {
                            name,
                            index: i,
                        });
                    }

                    break;
                }
                case "charsLayers": {
                    size = [];
                    for (let index = 0; index < data.length; index++) {
                        let layer = data[index];
                        size.push(Array.from(layer).length);

                        for (let char of layer) {
                            setInMap(globalMap, char, {
                                name,
                                index,
                            });
                        }
                    }

                    break;
                }
            }

            yield [name, {
                flag,
                type,
                size,
            }];
        }
    }

    return {
        cats: new Map(model(readConfig)),
        map: globalMap,
    };
}



function* readCharCatConfig(manifest, dataContainer) {
    let targetConfig = manifest.target;

    for (let {
            name,
            item,
            type: Targettype,
        }
        of targetConfig) {
        let {
            type: dataType,
            path,
        } = manifest.items[item];

        let data = jsonPathGet(dataContainer, path);

        let flag = {};
        Targettype.split("&").forEach(t => {
            flag[t] = true;
        });

        yield {
            name,
            data,
            flag,
            type: dataType,
        };
    }
}
