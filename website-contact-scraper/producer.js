const Queue = require('bee-queue');
const Constants = require('./constants');

const queue = new Queue(Constants.WEBSITE_CONTACT_SCRAPER_QUEUE);

const job = queue.createJob({ x: 2, y: 3 })
job.save();
job.on('succeeded', (result) => {
  console.log(`Received result for job ${job.id}: ${result}`);
});
