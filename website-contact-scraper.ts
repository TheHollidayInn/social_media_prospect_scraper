var request = require("request");
var cheerio = require("cheerio");
var validator = require("validator");

const testURL = "https://www.contactusinc.com/";

runFromStartURL(testURL);

async function runFromStartURL(startURL) {
    // Fetch links for two levels deep
    const firstSetOfURLs = await requestHTMLAndGetLinksForURL(startURL);
    const secondSetOfURLs = await getLinksFromArrayOfLinks(firstSetOfURLs);
    const mergedURLs = firstSetOfURLs.concat(secondSetOfURLs);
    mergedURLs.forEach(
        async url =>
            await requestHTMLAndFindEmailAndPhonesForURL(url).catch(error => {
                if (error) {
                    console.log(
                        error,
                        "error for: requestHTMLAndFindEmailAndPhonesForURL"
                    );
                }
            })
    );
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

async function requestHTMLAndFindEmailAndPhonesForURL(url) {
    const html = await requestHTMLFromURL(url).catch(error => {
        throw error;
    });
    // search for phone or email in html
    const emailArrays = matchingEmailsFrom(html).filter(x => x);

    const phoneArrays = matchPhoneNumbersFrom(html).filter(x => x);

    console.log(emailArrays, "emails");
    console.log(phoneArrays, "phones");
}

async function requestHTMLAndGetLinksForURL(url) {
    const html = await requestHTMLFromURL(url);
    const links = await getAllLinksInHTML(html);
    return links;
}

async function getLinksFromArrayOfLinks(links) {
    const linkRequestPromises = await links.map(
        async link => await requestHTMLAndGetLinksForURL(link)
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
        .filter(x => x);

    const phoneArraysFromNonLinks = nonWebsiteLinks
        .map(link => matchPhoneNumbersFrom(link))
        .filter(x => x);

    // @TODO: do something with these
    // console.log(emailArraysFromNonLinks);
    // console.log(phoneArraysFromNonLinks);

    // get next website links to follow
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
