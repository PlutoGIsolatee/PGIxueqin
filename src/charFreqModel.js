export function CharFreqModel(src, config) {
    src = Array.from(src);
    let len = this.txtLen = src.length;

    if (!config) {
        for (let i = 0; i < len; i++) {
            let char = src[i];
            let current = this.get(char);

            if (current) {
                current[0].push(i);
            } else {
                this.set(char, [
                    [i]
                ]);
            }
        }
        return this;
    }


    let {
        cats: categories,
        map: charToCats
    } = config;
    this.cats = categories;

    for (let [name, {
            type,
            size,
        }] of categories.entries()) {
        let layersNum = (type === 'charList') ? size : size.length;
        let idxInCat2IdxsInTxt = Array.from({
            length: layersNum
        }, () => []);
        this.set(name, idxInCat2IdxsInTxt);
    }

    for (let i = 0; i < len; i++) {
        let ch = src[i];
        let cats = charToCats.get(ch);
        if (!cats) continue;

        for (let {
                name,
                index,
            }
            of cats) {
            let idxInCat2IdxsInTxt = this.get(name);
            if (idxInCat2IdxsInTxt && index >= 0 && index < idxInCat2IdxsInTxt.length) {
                idxInCat2IdxsInTxt[index].push(i);
            }
        }
    }

    return this;
}

CharFreqModel.prototype = Object.create(Map.prototype);
