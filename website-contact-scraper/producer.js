const Queue = require('bee-queue');
const Constants = require('./constants');

const queue = new Queue(Constants.WEBSITE_CONTACT_SCRAPER_QUEUE);

function createWebsiteScrapRequest(url) {
  const job = queue.createJob({ url });
  job.save();
}

module.exports = { createWebsiteScrapRequest };
