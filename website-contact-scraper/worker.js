const Queue = require('bee-queue');

const Constants = require('./constants');
// const { startScrapingFromURL } = require('../website-contact-scraper');

const queue = new Queue(
  Constants.WEBSITE_CONTACT_SCRAPER_QUEUE,
  {
    // redis: {
    //   host: 'somewhereElse'
    // },
    isWorker: true,
  },
);

// Process jobs from as many servers or processes as you like
queue.process((job, done) => {
  // startScrapingFromURL(job.data.url);
  console.log(`Processing job ${job.id}`);
  return done(null, JSON.stringify(job.data));
});
