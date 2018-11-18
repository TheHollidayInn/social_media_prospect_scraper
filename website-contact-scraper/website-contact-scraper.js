"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const puppeteer = require("puppeteer");
const { Cluster } = require("puppeteer-cluster");
const urlUtils_1 = require("./urlUtils");
const utils_1 = require("./utils");
const emailPhoneUtils_1 = require("./emailPhoneUtils");
const models_1 = require("./models");
async function scrapeURLWithPage(url, page) {
    const response = await getHTMLForURLUsingPuppeteerPage(url, page);
    const html = response.html;
    const links = getAllLinksInHTML(html);
    const emailAndPhoneScrapeInfo = getEmailsAndPhonesForHTML(html, response.url);
    return new models_1.PageScrapeInfo(response.url, emailAndPhoneScrapeInfo, links);
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
// MARK: Puppeteer Retrieve html
async function getHTMLForURLUsingPuppeteerPage(url, page) {
    console.log(`Connecting to ${url}`);
    page.goto(url);
    await page
        .waitForNavigation({ waitUntil: "networkidle0" })
        .catch(x => console.log(`${url} exceeded network idle timeout`));
    const body = await page.evaluate(() => document.body.innerHTML);
    if (body === undefined) {
        throw new Error("No html returned from page");
    }
    console.log(`Connected to ${url}`);
    const response = new models_1.WebsiteHTMLResponse(url, body);
    return response;
}
function getEmailsAndPhonesForHTML(html, url) {
    // search for phone or email in html
    const emailArrays = emailPhoneUtils_1.matchingEmailsFrom(html).filter(x => x);
    const phoneArrays = emailPhoneUtils_1.matchPhoneNumbersFrom(html).filter(x => x);
    return new models_1.EmailAndPhoneScrapeInfo(url, utils_1.uniq(emailArrays), utils_1.uniq(phoneArrays));
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
async function clusterScrapeURLs(urls) {
    const cluster = await Cluster.launch({
        concurrency: Cluster.CONCURRENCY_CONTEXT,
        maxConcurrency: 50
    });
    let results = [];
    urls.map(url => {
        cluster.queue(url, async ({ page, data: url }) => {
            const result = await scrapeURLWithPage(url, page).catch(x => console.log(x));
            if (result != undefined) {
                results.push(result);
            }
        });
    });
    await cluster.idle();
    await cluster.close();
    return results;
}
async function startScrapingFromURL(startURL) {
    const start = Date.now();
    const browser = await puppeteer.launch();
    const startPage = await browser.newPage();
    // Scrape start url
    console.log("––––––– started First set of scraping");
    const firstPageInfo = await scrapeURLWithPage(startURL, startPage);
    // await browser.close();
    // Scrape second level deep
    console.log("––––––– started SECOND set of scraping");
    const secondSetOfPageInfos = await clusterScrapeURLs(firstPageInfo.foundURLS);
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
    const thirdSetOfPageInfos = await clusterScrapeURLs(uniqueMergedURLs);
    browser.close();
    const allPageInfos = [firstPageInfo]
        .concat(...secondSetOfPageInfos)
        .concat(...thirdSetOfPageInfos)
        .filter(x => x)
        .filter(x => x.emailAndPhoneScrapeInfo)
        .map(x => x.emailAndPhoneScrapeInfo);
    const items = emailAndPhoneScrapeInfosToItemsWithSources(utils_1.uniq(allPageInfos));
    const endTime = (Date.now() - start) / 1000;
    console.log(`––––––– total time elapsed for all url scraping and filtering: ${endTime} secs`);
    console.log(`–––––––– returning/found ${items.length} Email or Phone items`);
    return items;
}
exports.startScrapingFromURL = startScrapingFromURL;
// const testURL = "https://www.roosterteeth.com/";
// const testURL = "https://www.contactusinc.com/";
// const testURL = "https://www.bonjoro.com/";
// startScrapingFromURL(testURL);
