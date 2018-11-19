import { url } from "inspector";
const puppeteer = require("puppeteer");
const { Cluster } = require("puppeteer-cluster");
const defaultPuppeteerArgs = [
  "--disable-gpu",
  "--disable-dev-shm-usage",
  "--disable-setuid-sandbox",
  "--no-first-run",
  "--no-sandbox",
  "--no-zygote",
  "--single-process"
];
const maxConcurrentBrowsers = 20;

import {
  endExtensionIsOnlyNumbers,
  extractHostname,
  extractRootDomain
} from "./urlUtils";
import {
  uniq,
  removeDuplicates,
  isStringProbablyAnImagePath,
  isArrayEmpty
} from "./utils";
import {
  matchingEmailsFrom,
  matchPhoneNumbersFrom,
  strictEmailRegexCheck
} from "./emailPhoneUtils";
import {
  InfoItemWithSource,
  ItemWithSources,
  EmailAndPhoneScrapeInfo,
  WebsiteHTMLResponse,
  PageScrapeInfo
} from "./models";

import { scrapeSearchWithKeyword } from "./duck-scraper";

async function scrapeURLWithPage(url, page): Promise<PageScrapeInfo> {
  const response = await getHTMLForURLUsingPuppeteerPage(url, page);
  const html = response.html;
  const links = getAllLinksInHTML(html);
  const emailAndPhoneScrapeInfo = getEmailsAndPhonesForHTML(html, response.url);
  return new PageScrapeInfo(response.url, emailAndPhoneScrapeInfo, links);
}

function emailAndPhoneScrapeInfosToItemsWithSources(
  emailAndPhoneScrapeInfos
): ItemWithSources[] {
  // Filter out completely empty web infos
  const filteredEmailAndPhoneScrapeInfos = emailAndPhoneScrapeInfos.filter(
    info =>
      info !== undefined &&
      (!isArrayEmpty(info.emails) || !isArrayEmpty(info.phoneNumbers))
  );
  // seperate all infos into individual items of url and single email or single phone
  const emailItems = seperateScrapeInfosIntoURLEmailArray(
    filteredEmailAndPhoneScrapeInfos
  );
  const phoneItems = seperateScrapeInfosIntoURLPhoneArray(
    filteredEmailAndPhoneScrapeInfos
  );
  const allItems = emailItems.concat(phoneItems);

  // merge emails/merge phones between items to get email and [urls] or phone and [urls]
  const itemsWithSources = allItems.map(object => {
    // @TODO: reduce duplication of mappings
    const itemToFind = object.item;
    const allMatchingItemsWithSource = getAllObjectsWithMatchingItem(
      allItems,
      itemToFind
    );
    const sources = allMatchingItemsWithSource.map(x => x.urlSource);

    return new ItemWithSources(itemToFind, sources, object.type);
  });
  // remove duplicates
  const uniqueItemsWithSources = removeDuplicates(itemsWithSources, "item");

  // Do some verification or more strict filtering on items here
  const validItems = uniqueItemsWithSources.filter(info => {
    const item = info.item;
    return strictIsValidEmail(item);
  });

  return validItems;
}

function strictIsValidEmail(string) {
  return (
    strictEmailRegexCheck(string) &&
    !isStringProbablyAnImagePath(string) &&
    !endExtensionIsOnlyNumbers(string)
  );
}

function getAllObjectsWithMatchingItem(objects, itemToFind): any[] {
  return objects.filter(function(obj) {
    return obj.item === itemToFind;
  });
}

function seperateScrapeInfosIntoURLEmailArray(
  emailAndPhoneScrapeInfos
): InfoItemWithSource[] {
  const filteredInfos = emailAndPhoneScrapeInfos.filter(
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
  emailAndPhoneScrapeInfos
): InfoItemWithSource[] {
  const filteredInfos = emailAndPhoneScrapeInfos.filter(
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

// MARK: Puppeteer Retrieve html
async function getHTMLForURLUsingPuppeteerPage(
  url,
  page
): Promise<WebsiteHTMLResponse> {
  console.log(`Connecting to ${url}`);

  page.goto(url);
  await page
    .waitForNavigation({ waitUntil: "networkidle0" })
    .catch(x => console.log(url, " exceeded network idle timeout"));
  const body = await page.evaluate(() => document.body.innerHTML);
  if (body === undefined) {
    throw new Error("No html returned from page");
  }

  console.log(`Connected to ${url}`);

  const response = new WebsiteHTMLResponse(url, body);
  return response;
}

function getEmailsAndPhonesForHTML(html, url): EmailAndPhoneScrapeInfo {
  // search for phone or email in html
  const emailArrays = matchingEmailsFrom(html).filter(x => x);

  const phoneArrays = matchPhoneNumbersFrom(html).filter(x => x);

  return new EmailAndPhoneScrapeInfo(url, uniq(emailArrays), uniq(phoneArrays));
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

async function scrapeURLsWithCluster(urls, cluster): Promise<PageScrapeInfo[]> {
  let results = [];
  urls.map(url => {
    cluster.queue(url, async ({ page, data: url }) => {
      const result = await scrapeURLWithPage(url, page).catch(x =>
        console.log(x)
      );
      if (result != undefined) {
        results.push(result);
      }
    });
  });
  await cluster.idle();
  return results;
}

export async function startScrapingFromURL(
  startURL,
  cluster
): Promise<ItemWithSources[]> {
  let currentCluster = cluster;
  if (currentCluster == undefined) {
    currentCluster = await Cluster.launch({
      concurrency: Cluster.CONCURRENCY_CONTEXT,
      maxConcurrency: maxConcurrentBrowsers,
      args: defaultPuppeteerArgs
    });
  }

  const start = Date.now();
  const browser = await puppeteer.launch();
  const startPage = await browser.newPage();

  // Scrape start url
  console.log(
    `––––––– started First set of scraping for original url: ${startURL}`
  );
  const firstPageInfo = await scrapeURLWithPage(startURL, startPage);
  // Scrape second level deep
  console.log(
    `––––––– started SECOND set of scraping for original url: ${startURL}`
  );
  const rootURL = extractRootDomain(startURL);
  const firstSetOfURLs = firstPageInfo.foundURLS
    .filter(url => extractRootDomain(url) === rootURL)
    .filter(url => !isStringProbablyAnImagePath(url));
  const secondSetOfPageInfos = await scrapeURLsWithCluster(
    firstSetOfURLs,
    cluster
  );

  const currentURLS = secondSetOfPageInfos
    .filter(info => info.foundURLS)
    .map(info => info.foundURLS);

  const mergedURLs = []
    .concat(...currentURLS)
    .filter(url => !firstPageInfo.foundURLS.includes(url))
    .filter(url => extractRootDomain(url) === rootURL)
    .filter(url => !isStringProbablyAnImagePath(url));

  const uniqueMergedURLs = uniq(mergedURLs);
  // Scrape one more level deep
  console.log(
    `––––––– started THIRD set of scraping for original url: ${startURL}`
  );
  const thirdSetOfPageInfos = await scrapeURLsWithCluster(
    uniqueMergedURLs,
    cluster
  );
  await browser.close();

  const allPageInfos = [firstPageInfo]
    .concat(...secondSetOfPageInfos)
    .concat(...thirdSetOfPageInfos)
    .filter(x => x)
    .filter(x => x.emailAndPhoneScrapeInfo)
    .map(x => x.emailAndPhoneScrapeInfo);

  const items = emailAndPhoneScrapeInfosToItemsWithSources(uniq(allPageInfos));

  const endTime = (Date.now() - start) / 1000;
  console.log(
    `––––––– total time elapsed for all url scraping and filtering: ${endTime} secs`
  );
  console.log(
    `–––––––– returning/found ${
      items.length
    } Email or Phone items for original url: ${startURL}`
  );
  await cluster.close();
  return items;
}

async function startScrapingWithKeyword(keyword) {
  const urls = await scrapeSearchWithKeyword("dallas small business");
  const cluster = await Cluster.launch({
    concurrency: Cluster.CONCURRENCY_CONTEXT,
    maxConcurrency: maxConcurrentBrowsers,
    args: defaultPuppeteerArgs
  });

  const urlsWithRootDomains = urls.map(url => {
    return { url: url, rootDomain: extractHostname(url) };
  });
  // Get unique by root domain name for urls
  const uniqURLs = removeDuplicates(urlsWithRootDomains, "rootDomain").map(
    item => item.url
  );
  const allScrapers = uniqURLs.map(url => startScrapingFromURL(url, cluster));
  return Promise.all(allScrapers).then(response => {
    return response;
  });
}

// const testURL = "https://www.roosterteeth.com/";
// const testURL = "https://www.contactusinc.com/";
// const testURL = "https://www.bonjoro.com/";
// startScrapingFromURL(testURL);
