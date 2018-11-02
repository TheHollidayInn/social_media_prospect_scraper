export class InfoItemWithSource {
    urlSource: string;
    item: string;
    // @TODO: make enum
    type: number;

    constructor(urlSource: string, item: string, type: number) {
        this.urlSource = urlSource;
        this.item = item;
        this.type = type;
    }

    isEmail() {
        return this.type == -0;
    }

    isPhone() {
        return this.type === 1;
    }
}

export class ItemWithSources {
    item: string;
    sources: string[];
    type: number;
    constructor(item: string, sources: string[], type: number) {
        this.item = item;
        this.sources = sources;
        this.type = type;
    }
}
