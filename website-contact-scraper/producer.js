const Queue = require('bee-queue');
const Constants = require('./constants');

const queue = new Queue(Constants.WEBSITE_CONTACT_SCRAPER_QUEUE);

function createWebsiteScrapRequest(url) {
  const job = queue.createJob({ url });
  job.save();

  // @TODO: Allow for callback? OR maybe just remove and replace with websocket
  job.on('succeeded', (result) => {
    console.log(`Received result for job ${job.id}: ${result}`);
  });
}

module.exports = { createWebsiteScrapRequest };
