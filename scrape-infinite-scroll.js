const fs = require("fs");
const puppeteer = require("puppeteer");

// function extractItems() {
//   const extractedElements = document.querySelectorAll("div._gse");
//   const items = [];
//   for (let element of extractedElements) {
//     const name = element.querySelector("#js_28j");
//     console.log(name);
//     items.push(element.innerText);
//   }
//   return items;
// }

function extractItems() {
  const resultsSelector = ".fcb a";

  const anchors = Array.from(document.querySelectorAll(resultsSelector));
  console.log(anchors, "items");
  return anchors.map(anchor => {
    return anchor.href;
    //   const title = anchor.textContent.split("|")[0].trim();
    //   return `${title} - ${anchor.href}`;
  });
}

async function scrapeInfiniteScrollItems(
  page,
  extractItems,
  itemTargetCount,
  scrollDelay = 1000
) {
  let items = [];
  try {
    let previousHeight;
    while (items.length < itemTargetCount) {
      items = await page.evaluate(extractItems);
      previousHeight = await page.evaluate("document.body.scrollHeight");
      await page.evaluate("window.scrollTo(0, document.body.scrollHeight)");
      await page.waitForFunction(
        `document.body.scrollHeight > ${previousHeight}`
      );
      await page.waitFor(scrollDelay);
    }
  } catch (e) {}
  return items;
}

async function facebookLogin(page) {
  await page.goto("https://www.facebook.com/");

  await page.$eval(
    "input[type=email]",
    el => (el.value = "hollidaycraig@yahoo.com")
  );

  await page.$eval("input[type=password]", el => (el.value = "9578PRMdFj3qah"));

  await page.click('input[type="submit"]');

  await page.waitForNavigation({ waitUntil: "networkidle2" });
}

(async () => {
  // Set up browser and page.
  const browser = await puppeteer.launch({
    headless: false,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-notifications"
    ]
  });
  const page = await browser.newPage();
  page.setViewport({ width: 1280, height: 926 });

  // login to facebook
  await facebookLogin(page);

  await page.goto("https://www.facebook.com/groups/571436979623574/members/");
  await page.waitForSelector(".fcb a");

  // Scroll and extract items from the page.
  const items = await scrapeInfiniteScrollItems(page, extractItems, 200);
  console.log(items.length, "test");

  //   // Save extracted items to a file.
  //   fs.writeFileSync("./items.txt", items.join("\n") + "\n");

  // Close the browser.
  await browser.close();
})();
