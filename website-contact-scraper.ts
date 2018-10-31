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

  console.log(filteredWebScrapeInfos);
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
        console.log(error, "error for: requestHTMLAndFindEmailAndPhonesForURL");
      }
    })
  );

  return Promise.all<WebScrapeInfo>(searchRequests).then(webScrapeInfos => {
    return webScrapeInfos;
  });
}

class WebScrapeInfo {
  url: string;
  emails: [string];
  phoneNumbers: [string];
  constructor(url: string, emails: [string], phoneNumbers: [string]) {
    this.url = url;
    this.emails = emails;
    this.phoneNumbers = phoneNumbers;
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

  return new WebScrapeInfo(url, emailArrays, phoneArrays);
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

function uniq(a) {
  return Array.from(new Set(a));
}
