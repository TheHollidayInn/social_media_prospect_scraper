"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const InfoItemWithSource_js_1 = require("./InfoItemWithSource.js");
const testURL = "https://www.contactusinc.com/";
runFromStartURL(testURL);
function runFromStartURL(startURL) {
    return __awaiter(this, void 0, void 0, function* () {
        // Fetch links for two levels deep
        const firstSetOfURLs = yield requestHTMLAndGetLinksForURL(startURL);
        const secondSetOfURLs = yield getLinksFromArrayOfLinks(firstSetOfURLs);
        const mergedURLs = firstSetOfURLs.concat(secondSetOfURLs);
        // Get web scrape infos which are url with [emails] and [phones]
        const allWebsScrapeInfos = yield fetchWebScrapeInfoForAllUrls(mergedURLs);
        // Filter out completely empty web infos
        const filteredWebScrapeInfos = allWebsScrapeInfos.filter(info => info !== undefined &&
            (!isArrayEmpty(info.emails) || !isArrayEmpty(info.phoneNumbers)));
        // seperate all infos into individual items of url and single email or single phone
        const emailItems = seperateScrapeInfosIntoURLEmailArray(filteredWebScrapeInfos);
        const phoneItems = seperateScrapeInfosIntoURLPhoneArray(filteredWebScrapeInfos);
        const allItems = emailItems.concat(phoneItems);
        // const one = new InfoItemWithSource(
        //     "https://www.contactusinc.com/contactus-communications-appoints-chief-business-development-officer/",
        //     "hr@contactusinc.com",
        //     0
        // );
        // const two = new InfoItemWithSource(
        //     "https://www.contactusinc.com/contactus-communications-appoints-chief-business-officer/",
        //     "hr@contactusinc.com",
        //     0
        // );
        // const allItems = [one, two];
        // merge emails/merge phones between items to get email and [urls] or phone and [urls]
        const itemsWithSources = allItems.map(object => {
            // @TODO: reduce duplication of mappings
            const itemToFind = object.item;
            const allMatchingItemsWithSource = getAllObjectsWithMatchingItem(allItems, itemToFind);
            const sources = allMatchingItemsWithSource.map(x => x.urlSource);
            return new InfoItemWithSource_js_1.ItemWithSources(itemToFind, sources, object.type);
        });
        // remove duplicates
        const uniqueItemsWithSources = removeDuplicates(itemsWithSources, "item");
        console.log(uniqueItemsWithSources);
        // Do some verification or more strict filtering on items here
        const validItems = uniqueItemsWithSources.filter(info => {
            const item = info.item;
            return (strictEmailRegexCheck(item) &&
                !isStringProbablyAnImagePath(item) &&
                !endExtensionIsOnlyNumbers(item));
        });
        console.log(validItems);
        // done here
    });
}
function getAllObjectsWithMatchingItem(objects, itemToFind) {
    return objects.filter(function (obj) {
        return obj.item === itemToFind;
    });
}
function seperateScrapeInfosIntoURLEmailArray(webScrapeInfos) {
    const filteredInfos = webScrapeInfos.filter(info => !isArrayEmpty(info.emails));
    const items = filteredInfos.map(info => {
        const url = info.url;
        return info.emails.map(email => {
            return new InfoItemWithSource_js_1.InfoItemWithSource(url, email, 0);
        });
    });
    return [].concat(...items);
}
function seperateScrapeInfosIntoURLPhoneArray(webScrapeInfos) {
    const filteredInfos = webScrapeInfos.filter(info => !isArrayEmpty(info.phoneNumbers));
    const items = filteredInfos.map(info => {
        const url = info.url;
        return info.phoneNumbers.map(phone => {
            return new InfoItemWithSource_js_1.InfoItemWithSource(url, phone, 1);
        });
    });
    return [].concat(...items);
}
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
function fetchWebScrapeInfoForAllUrls(urls) {
    return __awaiter(this, void 0, void 0, function* () {
        // @TODO: throw errors
        const searchRequests = urls.map(url => findEmailsAndPhonesForURL(url).catch(error => {
            if (error) {
                console.log(error, "error for: requestHTMLAndFindEmailAndPhonesForURL");
            }
        }));
        return Promise.all(searchRequests).then(webScrapeInfos => {
            return webScrapeInfos;
        });
    });
}
class WebScrapeInfo {
    constructor(url, emails, phoneNumbers) {
        this.url = url;
        this.emails = emails;
        this.phoneNumbers = phoneNumbers;
    }
}
function requestHTMLFromURL(url) {
    const request = require("request");
    return new Promise(function (resolve, reject) {
        request(url, function (error, res, body) {
            if (!error && res.statusCode == 200) {
                resolve(body);
            }
            else {
                reject(error);
            }
        });
    });
}
function findEmailsAndPhonesForURL(url) {
    return __awaiter(this, void 0, void 0, function* () {
        const html = yield requestHTMLFromURL(url).catch(error => {
            throw error;
        });
        // search for phone or email in html
        const emailArrays = matchingEmailsFrom(html).filter(x => x);
        const phoneArrays = matchPhoneNumbersFrom(html).filter(x => x);
        return new WebScrapeInfo(url, uniq(emailArrays), uniq(phoneArrays));
    });
}
function requestHTMLAndGetLinksForURL(url) {
    return __awaiter(this, void 0, void 0, function* () {
        const html = yield requestHTMLFromURL(url);
        const links = yield getAllLinksInHTML(html);
        return links;
    });
}
function getLinksFromArrayOfLinks(links) {
    return __awaiter(this, void 0, void 0, function* () {
        const linkRequestPromises = links.map(link => requestHTMLAndGetLinksForURL(link));
        return Promise.all(linkRequestPromises).then(arrayOfLinksFromFirstSet => {
            const dupedSecondSetOfLinks = [].concat(...arrayOfLinksFromFirstSet);
            const secondSetOfLinks = uniq(dupedSecondSetOfLinks);
            const linksInSecondSetNotInFirst = secondSetOfLinks.filter(link => !links.includes(link));
            return linksInSecondSetNotInFirst;
        });
    });
}
function getAllLinksInHTML(html) {
    const cheerio = require("cheerio");
    var $ = cheerio.load(html);
    const linkHrefs = $("a")
        .map(function () {
        return $(this).attr("href");
    })
        .get();
    // de dupe list
    const deDupedLinks = uniq(linkHrefs);
    // get next website links to follow
    const validator = require("validator");
    const websiteLinks = deDupedLinks.filter(url => validator.isURL(url));
    return websiteLinks;
}
function matchingEmailsFrom(string) {
    const emailRegex = /[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/gi;
    const match = string.match(emailRegex);
    return match != null ? match : [];
}
function matchPhoneNumbersFrom(string) {
    const phoneRegex = /[+]*[(]{0,1}[0-9]{1,4}[)]{0,1}[-\s\./0-9]*$/gi;
    const match = string.match(phoneRegex);
    return match != null ? match : [];
}
function strictEmailRegexCheck(string) {
    const strictEmailRegex = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return strictEmailRegex.test(string);
}
function uniq(a) {
    return Array.from(new Set(a));
}
function removeDuplicates(myArr, prop) {
    return myArr.filter((obj, pos, arr) => {
        return arr.map(mapObj => mapObj[prop]).indexOf(obj[prop]) === pos;
    });
}
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
function endExtensionIsOnlyNumbers(string) {
    const extension = string.split(".").pop();
    return /^\d+$/.test(extension);
}
