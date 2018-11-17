const fs = require("fs");
var request = require("request");
var cheerio = require("cheerio");

const filename = "test-facebook-reaction_page.html";

extractProfilesFromCommentsHTMLFromFilePath(`./${filename}`);

function extractProfilesFromCommentsHTMLFromFilePath(filePath) {
  var $ = cheerio.load(fs.readFileSync(filePath));

  const containerSelector = "ul.uiList._5i_n._4kg._6-h._6-j._6-i";
  //   const container = $(this).find("ul");
  const container = $(containerSelector);
  //   console.log(container);
  // @TODO: change this to map
  container.children().each(function(i, element) {
    // ignore request sent
    // get arefs
    const text = $(this)
      .find("li")
      .find("._6a._5j0c")
      .find("a")
      .map(function() {
        // return $(this).text();
        return $(this).attr("href");
      })
      .get();

    console.log(text);
  });

  //   // seperate does contain 'website' or some other qualifier
  //   container.children().each(function(i, element) {
  //     // Gets list items including work, location, etc.
  //     const listItems = $(this).find("li");

  //     const title = "div._c24._50f4";
  //     const subtitle = "div.fsm.fwn.fcg";

  //     const titleTexts = listItemsdd
  //       .find(title)
  //       .map(function() {
  //         return $(this).text();
  //       })
  //       .get();

  //     const subtitleTexts = listItems
  //       .find(subtitle)
  //       .map(function() {
  //         return $(this).text();
  //       })
  //       .get();

  //     console.log(titleTexts);
  //     console.log(subtitleTexts);

  //     // Finds website cell
  //     const websiteCellTexts = listItems
  //       .find("span")
  //       .find("div")
  //       .map(function() {
  //         return $(this).text();
  //       })
  //       .get();
  //     console.log(websiteCellTexts);
  //     console.log("––––––––");
  //   });
}
