const Queue = require('bee-queue');
const Constants = require('./constants');

const queue = new Queue(Constants.DUCK_SCRAPER_QUEUE);

function createDuckScrapRequest(keyword) {
  const job = queue.createJob({ keyword });
  job.save();
}

module.exports = { createDuckScrapRequest };
