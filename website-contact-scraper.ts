var request = require("request");
var cheerio = require("cheerio");
var validator = require("validator");

const testURL = "https://www.contactusinc.com/";

runFromStartURL(testURL);

async function runFromStartURL(startURL) {
  const html = await requestHTMLFromURL(startURL);
  getAllLinksInHTML(html);
}

function requestHTMLFromURL(url) {
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

function getAllLinksInHTML(html) {
  var $ = cheerio.load(html);

  const linkHrefs = $("a")
    .map(function() {
      return $(this).attr("href");
    })
    .get();

  // de dupe list
  const deDupedLinks = uniq(linkHrefs);
  // filter non website links
  const nonWebsiteLinks = deDupedLinks.filter(url => !validator.isURL(url));
  // search for phone or email in non website links
  const emailArraysFromNonLinks = nonWebsiteLinks
    .map(link => matchingEmailsFrom(link))
    .filter(item => item != null);

  const phoneArraysFromNonLinks = nonWebsiteLinks
    .map(link => matchPhoneNumbersFrom(link))
    .filter(item => item != null);

  console.log(emailArraysFromNonLinks);
  console.log(phoneArraysFromNonLinks);

  // get next website links to follow
  const websiteLinks = deDupedLinks.filter(url => validator.isURL(url));
  console.log(websiteLinks);
}

function matchingEmailsFrom(string) {
  const emailRegex = /[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/gi;
  return string.match(emailRegex);
}

function matchPhoneNumbersFrom(string) {
  const phoneRegex = /[+]*[(]{0,1}[0-9]{1,4}[)]{0,1}[-\s\./0-9]*$/gi;
  return string.match(phoneRegex);
}

function uniq(a) {
  return Array.from(new Set(a));
}

function extractEmailsAndPhoneNumbersInHTML(html) {
  var $ = cheerio.load(html);

  //   const actorSelector = "a.UFICommentActorName";
  //   const profiles = $(actorSelector)
  //     .map(function() {
  //       return $(this).attr("href");
  //     })
  //     .get();

  //   console.log(profiles);
}

// add about to url then make request for those pages
// can add `section=` to url as well
// scrape profile pages
