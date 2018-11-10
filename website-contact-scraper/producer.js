const Queue = require('bee-queue');
const Constants = require('./constants');

const queue = new Queue(Constants.WEBSITE_CONTACT_SCRAPER_QUEUE);

function createWebsiteScrapRequest(url, IO) {
  const job = queue.createJob({ url });
  job.save();

  job.on('succeeded', (result) => {
    IO.emit('webscraped', result);
  });
}

module.exports = { createWebsiteScrapRequest };
