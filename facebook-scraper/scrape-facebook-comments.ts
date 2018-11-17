const fs = require("fs");
var request = require("request");
var cheerio = require("cheerio");

const filename = "test-facebook-comments.html";

extractProfilesFromCommentsHTMLFromFilePath(`./${filename}`);

function extractProfilesFromCommentsHTMLFromFilePath(filePath) {
  var $ = cheerio.load(fs.readFileSync(filePath));

  // @TODO: refactor this to find all hrefs in list of comments instead of very specific actor name element

  const actorSelector = "a.UFICommentActorName";
  const profiles = $(actorSelector)
    .map(function() {
      return $(this).attr("href");
    })
    .get();

  console.log(profiles);
}

// add about to url then make request for those pages
// can add `section=` to url as well
// scrape profile pages
