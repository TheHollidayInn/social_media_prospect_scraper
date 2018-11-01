const testURL = "https://www.contactusinc.com/";

runFromStartURL(testURL);

async function runFromStartURL(startURL) {
    // Fetch links for two levels deep
    const firstSetOfURLs = await requestHTMLAndGetLinksForURL(startURL);
    const secondSetOfURLs = await getLinksFromArrayOfLinks(firstSetOfURLs);
    const mergedURLs = firstSetOfURLs.concat(secondSetOfURLs);

    const allWebsScrapeInfos = await fetchWebScrapeInfoForAllUrls(mergedURLs);
    const filteredWebScrapeInfos = allWebsScrapeInfos.filter(
        info =>
            info !== undefined &&
            (!isArrayEmpty(info.emails) || !isArrayEmpty(info.phoneNumbers))
    );

    const emailItems = seperateScrapeInfosIntoURLEmailArray(
        filteredWebScrapeInfos
    );
    const phoneItems = seperateScrapeInfosIntoURLPhoneArray(
        filteredWebScrapeInfos
    );
    const allItems = emailItems.concat(phoneItems);
    console.log(allItems);
}

function seperateScrapeInfosIntoURLEmailArray(
    webScrapeInfos
): InfoItemWithSource[] {
    const filteredInfos = webScrapeInfos.filter(
        info => !isArrayEmpty(info.emails)
    );
    const items = filteredInfos.map(info => {
        const url = info.url;
        return info.emails.map(email => {
            return new InfoItemWithSource(url, email, 0);
        });
    });
    return [].concat(...items);
}

function seperateScrapeInfosIntoURLPhoneArray(
    webScrapeInfos
): InfoItemWithSource[] {
    const filteredInfos = webScrapeInfos.filter(
        info => !isArrayEmpty(info.phoneNumbers)
    );
    const items = filteredInfos.map(info => {
        const url = info.url;
        return info.phoneNumbers.map(phone => {
            return new InfoItemWithSource(url, phone, 1);
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

async function fetchWebScrapeInfoForAllUrls(urls): Promise<WebScrapeInfo[]> {
    // @TODO: throw errors
    const searchRequests = urls.map(url =>
        findEmailsAndPhonesForURL(url).catch(error => {
            if (error) {
                console.log(
                    error,
                    "error for: requestHTMLAndFindEmailAndPhonesForURL"
                );
            }
        })
    );

    return Promise.all<WebScrapeInfo>(searchRequests).then(webScrapeInfos => {
        return webScrapeInfos;
    });
}

class WebScrapeInfo {
    url: string;
    emails: any[];
    phoneNumbers: any[];
    constructor(url: string, emails: any[], phoneNumbers: any[]) {
        this.url = url;
        this.emails = emails;
        this.phoneNumbers = phoneNumbers;
    }
}

class InfoItemWithSource {
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

function requestHTMLFromURL(url) {
    const request = require("request");
    return new Promise(function(resolve, reject) {
        request(url, function(error, res, body) {
            if (!error && res.statusCode == 200) {
                resolve(body);
            } else {
                reject(error);
            }
        });
    });
}

async function seperateWebScrapeInfoIntoOccurencesObject(webScrapeInfo) {}

async function findEmailsAndPhonesForURL(url): Promise<WebScrapeInfo> {
    const html = await requestHTMLFromURL(url).catch(error => {
        throw error;
    });
    // search for phone or email in html
    const emailArrays = matchingEmailsFrom(html).filter(x => x);

    const phoneArrays = matchPhoneNumbersFrom(html).filter(x => x);

    return new WebScrapeInfo(url, uniq(emailArrays), uniq(phoneArrays));
}

async function requestHTMLAndGetLinksForURL(url) {
    const html = await requestHTMLFromURL(url);
    const links = await getAllLinksInHTML(html);
    return links;
}

async function getLinksFromArrayOfLinks(links) {
    const linkRequestPromises = links.map(link =>
        requestHTMLAndGetLinksForURL(link)
    );

    return Promise.all(linkRequestPromises).then(arrayOfLinksFromFirstSet => {
        const dupedSecondSetOfLinks = [].concat(...arrayOfLinksFromFirstSet);
        const secondSetOfLinks = uniq(dupedSecondSetOfLinks);

        const linksInSecondSetNotInFirst = secondSetOfLinks.filter(
            link => !links.includes(link)
        );
        return linksInSecondSetNotInFirst;
    });
}

function getAllLinksInHTML(html) {
    const cheerio = require("cheerio");
    var $ = cheerio.load(html);

    const linkHrefs = $("a")
        .map(function() {
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

function matchingEmailsFrom(string): string[] {
    const emailRegex = /[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/gi;
    const match = string.match(emailRegex);
    return match != null ? match : [];
}

function matchPhoneNumbersFrom(string): string[] {
    const phoneRegex = /[+]*[(]{0,1}[0-9]{1,4}[)]{0,1}[-\s\./0-9]*$/gi;
    const match = string.match(phoneRegex);
    return match != null ? match : [];
}

function uniq(a): any[] {
    return Array.from(new Set(a));
}
