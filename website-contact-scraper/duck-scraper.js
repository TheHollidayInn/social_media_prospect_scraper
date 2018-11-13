const puppeteer = require("puppeteer");
const duckURL = "https://duckduckgo.com/?q=";
const keyword = "dallas";
async function scrapeSearchWithKeyword(keyword) {
    const url = duckURL + keyword;
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    console.log(`Connecting to ${url}`);
    page.goto(url);
    await page.waitForNavigation({ waitUntil: "networkidle0" });
    console.log(`Connected to ${url}`);
    console.log("Scrolling to end of page");
    await scrollPageToEnd(page);
    console.log("Done scrolling to end of page");
    const pageCount = 4;
    console.log(`Clicking more button ${pageCount} times`);
    await expandPageResultsForPageCount(pageCount, page);
    console.log("Done clicking more buttons");
    const urlResults = await page.evaluate(() => Array.from(document.querySelectorAll(".result__extras__url")).map(x => x.textContent));
    console.log(`Found ${urlResults.length} urls`);
    browser.close();
}
async function expandPageResultsForPageCount(pageCount, page) {
    const moreButtonSelector = ".btn--full";
    for (let i = 0; i < pageCount; i++) {
        await page.click(moreButtonSelector);
        // @TODO: handle if there is no selector
        await page.waitForSelector(moreButtonSelector);
        console.log(`Finished clicking ${i + 1} / ${pageCount} more buttons`);
    }
}
async function scrollPageToEnd(page) {
    await page.evaluate(_ => {
        window.scrollBy(0, window.innerHeight);
    });
}
scrapeSearchWithKeyword(keyword);
