"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const puppeteer = require("puppeteer");
const duckRootURL = "https://duckduckgo.com/?q=";
async function scrapeSearchWithKeyword(keyword) {
    const url = duckRootURL + keyword;
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    console.log(`Connecting to ${url}`);
    page.goto(url);
    await page.waitForNavigation({ waitUntil: "networkidle0" });
    console.log(`Connected to ${url}`);
    console.log("Scrolling to end of page");
    await scrollPageToEnd(page);
    console.log("Done scrolling to end of page");
    const buttonCount = 4;
    console.log(`Clicking more button ${buttonCount} times`);
    await expandPageResultsForButtonCount(buttonCount, page);
    console.log("Done clicking more buttons");
    const urlResults = await page.evaluate(() => {
        // const anchors = document.querySelectorAll(".result__extras__url");
        const anchors = document.querySelectorAll(".result__url");
        return [].map.call(anchors, a => a.href);
    });
    console.log(`Found ${urlResults.length} urls`);
    browser.close();
    return urlResults.filter(x => x);
}
exports.scrapeSearchWithKeyword = scrapeSearchWithKeyword;
async function expandPageResultsForButtonCount(buttonCount, page) {
    const moreButtonSelector = ".btn--full";
    for (let i = 0; i < buttonCount; i++) {
        await page.click(moreButtonSelector);
        // @TODO: handle if there is no selector
        await page.waitForSelector(moreButtonSelector);
        console.log(`Finished clicking ${i + 1} / ${buttonCount} more buttons`);
    }
}
async function scrollPageToEnd(page) {
    await page.evaluate(_ => {
        window.scrollBy(0, window.innerHeight);
    });
}
// scrapeSearchWithKeyword("dallas small business");
