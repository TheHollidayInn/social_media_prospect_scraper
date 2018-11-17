const fs = require("fs");
var request = require("request");
var cheerio = require("cheerio");
const filename = "test-facebook-profile_page.html";
extractProfilesFromCommentsHTMLFromFilePath(`./${filename}`);
// @TODO: must be about page we get here
function extractProfilesFromCommentsHTMLFromFilePath(filePath) {
    var $ = cheerio.load(fs.readFileSync(filePath));
    const timelineCoverSelector = "#fb-timeline-cover-name";
    const title = $(timelineCoverSelector).text();
    const containerSelector = "div.clearfix._ikh._5c0g";
    const container = $(containerSelector);
    // seperate does contain 'website' or some other qualifier
    // @TODO: change this to map
    container.children().each(function (i, element) {
        // Gets list items including work, location, etc.
        const listItems = $(this).find("li");
        const title = "div._c24._50f4";
        const subtitle = "div.fsm.fwn.fcg";
        const titleTexts = listItems
            .find(title)
            .map(function () {
            return $(this).text();
        })
            .get();
        const subtitleTexts = listItems
            .find(subtitle)
            .map(function () {
            return $(this).text();
        })
            .get();
        console.log(titleTexts);
        console.log(subtitleTexts);
        // Finds website cell
        const websiteCellTexts = listItems
            .find("span")
            .find("div")
            .map(function () {
            return $(this).text();
        })
            .get();
        console.log(websiteCellTexts);
        console.log("––––––––");
    });
}
