export function uniq(a): any[] {
  return Array.from(new Set(a));
}

export function isArrayEmpty(array) {
  if (array === undefined) {
    return true;
  }
  if (!Array.isArray(array) || !array.length) {
    // array does not exist, is not an array, or is empty
    return true;
  }
  return false;
}

export function removeDuplicates(myArr, prop) {
  return myArr.filter((obj, pos, arr) => {
    return arr.map(mapObj => mapObj[prop]).indexOf(obj[prop]) === pos;
  });
}

export function isStringProbablyAnImagePath(string): boolean {
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
