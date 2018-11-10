const Queue = require('bee-queue');
const Constants = require('./constants');

const queue = new Queue(
  Constants.WEBSITE_CONTACT_SCRAPER_QUEUE,
  {
    // redis: {
    //   host: 'somewhereElse'
    // },
    isWorker: true,
  }
);

// Process jobs from as many servers or processes as you like
queue.process(function (job, done) {
  console.log(`Processing job ${job.id}`);
  return done(null, job.data.x + job.data.y);
});