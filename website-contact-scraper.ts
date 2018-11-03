import { InfoItemWithSource, ItemWithSources } from "./InfoItemWithSource.js";

const testURL = "https://www.contactusinc.com/";

// @TODO: turn into export function
runFromStartURL(testURL);

async function runFromStartURL(startURL) {
  console.log("–––––––– Started Getting Links");
  // Fetch links for two levels deep
  const firstSetOfURLs = await requestHTMLAndGetLinksForURL(startURL);
  const secondSetOfURLs = await getLinksFromArrayOfLinks(firstSetOfURLs);
  const mergedURLs = firstSetOfURLs.concat(secondSetOfURLs).filter(x => x);
  console.log("–––––––– Finished getting links");

  console.log("–––––––– Started scraping urls");
  // Get web scrape infos which are url with [emails] and [phones]
  const allWebsScrapeInfos = await fetchWebScrapeInfoForAllUrls(mergedURLs);
  console.log("–––––––– Finished scraping urls");

  const items = webScrapeInfosToItemsWithSources(allWebsScrapeInfos);
  return items;
}

function webScrapeInfosToItemsWithSources(webScrapeInfos): ItemWithSources[] {
  // Filter out completely empty web infos
  const filteredWebScrapeInfos = webScrapeInfos.filter(
    info =>
      info !== undefined &&
      (!isArrayEmpty(info.emails) || !isArrayEmpty(info.phoneNumbers))
  );
  // seperate all infos into individual items of url and single email or single phone
  const emailItems = seperateScrapeInfosIntoURLEmailArray(
    filteredWebScrapeInfos
  );
  const phoneItems = seperateScrapeInfosIntoURLPhoneArray(
    filteredWebScrapeInfos
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
    return (
      strictEmailRegexCheck(item) &&
      !isStringProbablyAnImagePath(item) &&
      !endExtensionIsOnlyNumbers(item)
    );
  });

  return validItems;
}

function getAllObjectsWithMatchingItem(objects, itemToFind): any[] {
  return objects.filter(function(obj) {
    return obj.item === itemToFind;
  });
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
  const htmlRequests = urls.map(url => {
    return requestHTMLFromURL(url).catch(error => {
      if (error) {
        console.log(
          error,
          "fetchWebScrapeInfoForAllUrls.requestHTMLFromURL error"
        );
      }
    });
  });

  return Promise.all<WebScrapeInfo>(htmlRequests).then(requestResponses => {
    return requestResponses
      .filter(x => x)
      .map(response => findEmailsAndPhonesForRequestResponse(response));
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

class WebsiteHTMLResponse {
  url: string;
  html: string;
  constructor(url: string, html: string) {
    this.url = url;
    this.html = html;
  }
}

function requestHTMLFromURL(url): Promise<WebsiteHTMLResponse> {
  const request = require("request");
  return new Promise(function(resolve, reject) {
    request(url, function(error, res, body) {
      if (!error && res.statusCode == 200) {
        console.log(body === undefined);
        if (body === undefined) {
          reject(new Error("No html returned from page"));
          return;
        }
        const response = new WebsiteHTMLResponse(url, body);
        resolve(response);
      } else {
        reject(error);
      }
    });
  });
}

function findEmailsAndPhonesForRequestResponse(requestResponse): WebScrapeInfo {
  const html = requestResponse.html;

  // search for phone or email in html
  const emailArrays = matchingEmailsFrom(html).filter(x => x);

  const phoneArrays = matchPhoneNumbersFrom(html).filter(x => x);

  return new WebScrapeInfo(
    requestResponse.url,
    uniq(emailArrays),
    uniq(phoneArrays)
  );
}

async function requestHTMLAndGetLinksForURL(url) {
  const response = await requestHTMLFromURL(url);
  const links = await getAllLinksInHTML(response.html);
  return links;
}

async function getLinksFromArrayOfLinks(links) {
  const linkRequestPromises = links.map(link =>
    requestHTMLAndGetLinksForURL(link).catch(error => {
      if (error) {
        console.log(error, "getLinksFromArrayOfLinks error");
      }
    })
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

function strictEmailRegexCheck(string): boolean {
  const strictEmailRegex = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return strictEmailRegex.test(string);
}

function uniq(a): any[] {
  return Array.from(new Set(a));
}

function removeDuplicates(myArr, prop) {
  return myArr.filter((obj, pos, arr) => {
    return arr.map(mapObj => mapObj[prop]).indexOf(obj[prop]) === pos;
  });
}

function isStringProbablyAnImagePath(string): boolean {
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

function endExtensionIsOnlyNumbers(string): boolean {
  const extension = string.split(".").pop();
  return /^\d+$/.test(extension);
}
