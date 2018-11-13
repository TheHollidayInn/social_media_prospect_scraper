"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const puppeteer = require('puppeteer');
const urlUtils_1 = require("./urlUtils");
const utils_1 = require("./utils");
const emailPhoneUtils_1 = require("./emailPhoneUtils");
const models_1 = require("./models");
async function scrapeURLWithBrowser(url, browser) {
    const response = await getHTMLForURLUsingPuppeteerBrowser(url, browser);
    const html = response.html;
    const links = getAllLinksInHTML(html);
    const emailAndPhoneScrapeInfo = getEmailsAndPhonesForHTML(html, response.url);
    return new models_1.PageScrapeInfo(response.url, emailAndPhoneScrapeInfo, links);
}
async function scrapeMultipleURLSWithBrowser(urls, browser) {
    let results = [];
    await processMutlipleURLs(urls, browser).then(function (result) {
        results = result;
    }, function (reason) {
        // rejection happened
        console.log(reason, "rejection");
    });
    return results;
}
async function processMutlipleURLs(urls, browser) {
    let resultTimes = [];
    let results = [];
    for (let i = 0; i < urls.length; i++) {
        const url = urls[i];
        const start = Date.now();
        let r = await scrapeURLWithBrowser(url, browser).catch(x => console.log(x));
        const endTime = (Date.now() - start) / 1000;
        resultTimes.push(endTime);
        results.push(r);
    }
    const totalTime = resultTimes.reduce((total, number) => total + number);
    const average = totalTime / resultTimes.length;
    console.log(`––––––– total time elapsed for ${urls.length} urls: ${totalTime} secs`);
    console.log(`––––––– average time elapsed for puppeteer request: ${average} secs`);
    return results;
}
function emailAndPhoneScrapeInfosToItemsWithSources(emailAndPhoneScrapeInfos) {
    // Filter out completely empty web infos
    const filteredEmailAndPhoneScrapeInfos = emailAndPhoneScrapeInfos.filter(info => info !== undefined &&
        (!utils_1.isArrayEmpty(info.emails) || !utils_1.isArrayEmpty(info.phoneNumbers)));
    // seperate all infos into individual items of url and single email or single phone
    const emailItems = seperateScrapeInfosIntoURLEmailArray(filteredEmailAndPhoneScrapeInfos);
    const phoneItems = seperateScrapeInfosIntoURLPhoneArray(filteredEmailAndPhoneScrapeInfos);
    const allItems = emailItems.concat(phoneItems);
    // merge emails/merge phones between items to get email and [urls] or phone and [urls]
    const itemsWithSources = allItems.map(object => {
        // @TODO: reduce duplication of mappings
        const itemToFind = object.item;
        const allMatchingItemsWithSource = getAllObjectsWithMatchingItem(allItems, itemToFind);
        const sources = allMatchingItemsWithSource.map(x => x.urlSource);
        return new models_1.ItemWithSources(itemToFind, sources, object.type);
    });
    // remove duplicates
    const uniqueItemsWithSources = utils_1.removeDuplicates(itemsWithSources, "item");
    // Do some verification or more strict filtering on items here
    const validItems = uniqueItemsWithSources.filter(info => {
        const item = info.item;
        return (emailPhoneUtils_1.strictEmailRegexCheck(item) &&
            !utils_1.isStringProbablyAnImagePath(item) &&
            !urlUtils_1.endExtensionIsOnlyNumbers(item));
    });
    return validItems;
}
function getAllObjectsWithMatchingItem(objects, itemToFind) {
    return objects.filter(function (obj) {
        return obj.item === itemToFind;
    });
}
function seperateScrapeInfosIntoURLEmailArray(emailAndPhoneScrapeInfos) {
    const filteredInfos = emailAndPhoneScrapeInfos.filter(info => !utils_1.isArrayEmpty(info.emails));
    const items = filteredInfos.map(info => {
        const url = info.url;
        return info.emails.map(email => {
            return new models_1.InfoItemWithSource(url, email, 0);
        });
    });
    return [].concat(...items);
}
function seperateScrapeInfosIntoURLPhoneArray(emailAndPhoneScrapeInfos) {
    const filteredInfos = emailAndPhoneScrapeInfos.filter(info => !utils_1.isArrayEmpty(info.phoneNumbers));
    const items = filteredInfos.map(info => {
        const url = info.url;
        return info.phoneNumbers.map(phone => {
            return new models_1.InfoItemWithSource(url, phone, 1);
        });
    });
    return [].concat(...items);
}
async function fetchEmailAndPhoneScrapeInfoForAllUrls(urls) {
    const htmlRequests = urls.map(url => {
        return requestHTMLFromURL(url).catch(error => {
            if (error) {
                console.log(error, "fetchEmailAndPhoneScrapeInfoForAllUrls.requestHTMLFromURL error");
            }
        });
    });
    return Promise.all(htmlRequests).then(requestResponses => {
        return requestResponses
            .filter(x => x)
            .map(response => findEmailsAndPhonesForRequestResponse(response));
    });
}
// MARK: Puppeteer Retrieve html
async function getHTMLForURLUsingPuppeteerBrowser(url, browser) {
    const page = await browser.newPage();
    console.log(`Connecting to ${url}`);
    page.goto(url);
    await page.waitForNavigation({ waitUntil: "networkidle0" });
    const body = await page.evaluate(() => document.body.innerHTML);
    if (body === undefined) {
        throw new Error("No html returned from page");
    }
    console.log(`Connected to ${url}`);
    const response = new models_1.WebsiteHTMLResponse(url, body);
    return response;
}
function requestHTMLFromURL(url) {
    const request = require("request");
    return new Promise(function (resolve, reject) {
        request(url, function (error, res, body) {
            if (!error && res.statusCode == 200) {
                if (body === undefined) {
                    reject(new Error("No html returned from page"));
                    return;
                }
                const response = new models_1.WebsiteHTMLResponse(url, body);
                resolve(response);
            }
            else {
                reject(error);
            }
        });
    });
}
function getEmailsAndPhonesForHTML(html, url) {
    // search for phone or email in html
    const emailArrays = emailPhoneUtils_1.matchingEmailsFrom(html).filter(x => x);
    const phoneArrays = emailPhoneUtils_1.matchPhoneNumbersFrom(html).filter(x => x);
    return new models_1.EmailAndPhoneScrapeInfo(url, utils_1.uniq(emailArrays), utils_1.uniq(phoneArrays));
}
function findEmailsAndPhonesForRequestResponse(requestResponse) {
    const html = requestResponse.html;
    // search for phone or email in html
    const emailArrays = emailPhoneUtils_1.matchingEmailsFrom(html).filter(x => x);
    const phoneArrays = emailPhoneUtils_1.matchPhoneNumbersFrom(html).filter(x => x);
    return new models_1.EmailAndPhoneScrapeInfo(requestResponse.url, utils_1.uniq(emailArrays), utils_1.uniq(phoneArrays));
}
async function requestHTMLAndGetLinksForURL(url) {
    const response = await requestHTMLFromURL(url);
    const links = await getAllLinksInHTML(response.html);
    return links;
}
async function getLinksFromArrayOfLinks(links) {
    const linkRequestPromises = links.map(link => requestHTMLAndGetLinksForURL(link).catch(error => {
        if (error) {
            console.log(error, "getLinksFromArrayOfLinks error");
        }
    }));
    return Promise.all(linkRequestPromises).then(arrayOfLinksFromFirstSet => {
        const dupedSecondSetOfLinks = [].concat(...arrayOfLinksFromFirstSet);
        const secondSetOfLinks = utils_1.uniq(dupedSecondSetOfLinks);
        const linksInSecondSetNotInFirst = secondSetOfLinks.filter(link => !links.includes(link));
        return linksInSecondSetNotInFirst;
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
    const deDupedLinks = utils_1.uniq(linkHrefs);
    // get next website links to follow
    const validator = require("validator");
    const websiteLinks = deDupedLinks.filter(url => validator.isURL(url));
    return websiteLinks;
}
async function scrapeURLForEmailorPhoneitems(startURL) {
    console.time("getting links");
    console.log("–––––––– Started getting links");
    // Fetch links for three levels deep
    const firstSetOfURLs = await requestHTMLAndGetLinksForURL(startURL);
    const secondSetOfURLs = await getLinksFromArrayOfLinks(firstSetOfURLs);
    const thirdSetOfURLs = await getLinksFromArrayOfLinks(secondSetOfURLs);
    const mergedURLs = firstSetOfURLs
        .concat(secondSetOfURLs)
        .concat(thirdSetOfURLs);
    // filter urls that do not match the startUrl's domain
    const rootURL = urlUtils_1.extractRootDomain(startURL);
    const finalURLs = mergedURLs
        .filter(x => x)
        .filter(url => urlUtils_1.extractRootDomain(url) === rootURL);
    console.log(`–––––––– Finished getting ${finalURLs.length} links`);
    console.timeEnd("getting links");
    console.time("scraping urls");
    console.log("–––––––– Started scraping urls");
    // Get web scrape infos which are url with [emails] and [phones]
    const allWebsScrapeInfos = await fetchEmailAndPhoneScrapeInfoForAllUrls(finalURLs);
    console.log(`–––––––– Finished scraping ${allWebsScrapeInfos.length} urls`);
    console.timeEnd("scraping urls");
    const items = emailAndPhoneScrapeInfosToItemsWithSources(allWebsScrapeInfos);
    console.log(`–––––––– scrape infos found: ${allWebsScrapeInfos.length}`);
    console.log(`–––––––– returning/found ${items.length} Email or Phone items`);
    return items;
}
exports.scrapeURLForEmailorPhoneitems = scrapeURLForEmailorPhoneitems;
async function startScrapingFromURL(startURL) {
    const start = Date.now();
    const browser = await puppeteer.launch();
    // Scrape start url
    console.log("––––––– started First set of scraping");
    const firstPageInfo = await scrapeURLWithBrowser(startURL, browser);
    // Scrape second level deep
    console.log("––––––– started SECOND set of scraping");
    const secondSetOfPageInfos = await scrapeMultipleURLSWithBrowser(firstPageInfo.foundURLS, browser);
    // @TODO: throw for no found urls or null web info
    const currentURLS = secondSetOfPageInfos
        .filter(info => info.foundURLS)
        .map(info => info.foundURLS);
    const rootURL = urlUtils_1.extractRootDomain(startURL);
    const mergedURLs = []
        .concat(...currentURLS)
        .filter(url => !firstPageInfo.foundURLS.includes(url))
        .filter(url => urlUtils_1.extractRootDomain(url) === rootURL);
    const uniqueMergedURLs = utils_1.uniq(mergedURLs);
    // Scrape one more level deep
    console.log("––––––– started THIRD set of scraping");
    const thirdSetOfPageInfos = await scrapeMultipleURLSWithBrowser(uniqueMergedURLs, browser);
    const allPageInfos = [firstPageInfo]
        .concat(...secondSetOfPageInfos)
        .concat(...thirdSetOfPageInfos)
        .filter(x => x)
        .filter(x => x.emailAndPhoneScrapeInfo)
        .map(x => x.emailAndPhoneScrapeInfo);
    const items = emailAndPhoneScrapeInfosToItemsWithSources(utils_1.uniq(allPageInfos));
    console.log(items);
    const endTime = (Date.now() - start) / 1000;
    console.log(`––––––– total time elapsed for all url scraping and filtering: ${endTime} secs`);
    await browser.close();
    return items;
}
exports.startScrapingFromURL = startScrapingFromURL;
// const testURL = "https://www.roosterteeth.com/";
// const testURL = "https://www.contactusinc.com/";
// const testURL = "https://www.bonjoro.com/";
// scrapeURLForEmailorPhoneitems(testURL);
// startScrapingFromURL(testURL);
