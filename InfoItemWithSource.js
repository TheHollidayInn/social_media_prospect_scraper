"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class InfoItemWithSource {
    constructor(urlSource, item, type) {
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
exports.InfoItemWithSource = InfoItemWithSource;
