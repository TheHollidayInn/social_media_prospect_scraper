const puppeteer = require("puppeteer");

async function test() {
  const browser = await puppeteer.launch();

  const page = await browser.newPage();

  await page.goto("https://www.facebook.com/");

  await page.$eval(
    "input[type=email]",
    el => (el.value = "hollidaycraig@yahoo.com")
  );

  await page.$eval("input[type=password]", el => (el.value = "9578PRMdFj3qah"));

  await page.click('input[type="submit"]');

  await page.waitForNavigation({ waitUntil: "networkidle2" });

  await page.screenshot({ path: "screenshot.png" });

  await browser.close();
}

test();
