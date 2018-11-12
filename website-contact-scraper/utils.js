"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function uniq(a) {
    return Array.from(new Set(a));
}
exports.uniq = uniq;
function isArrayEmpty(array) {
    if (array === undefined) {
        return true;
    }
    if (!Array.isArray(array) || !array.length) {
        // array does not exist, is not an array, or is empty
        return true;
    }
    return false;
}
exports.isArrayEmpty = isArrayEmpty;
function removeDuplicates(myArr, prop) {
    return myArr.filter((obj, pos, arr) => {
        return arr.map(mapObj => mapObj[prop]).indexOf(obj[prop]) === pos;
    });
}
exports.removeDuplicates = removeDuplicates;
function isStringProbablyAnImagePath(string) {
    const imageExtensions = [
        ".tif",
        ".tiff",
        ".bmp",
        ".jpg",
        ".jpeg",
        ".gif",
        ".png",
        ".eps",
        ".raw ",
        ".cr2 ",
        ".nef ",
        ".orf ",
        ".sr2"
    ];
    let result = false;
    imageExtensions.forEach(extension => {
        const endsWith = string.endsWith(extension);
        if (endsWith === true) {
            result = true;
        }
    });
    return result;
}
exports.isStringProbablyAnImagePath = isStringProbablyAnImagePath;
