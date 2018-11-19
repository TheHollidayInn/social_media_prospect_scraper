const Queue = require('bee-queue');
const SocketIO = require('socket.io-client');

const socket = SocketIO('http://localhost:3000');
socket.on('connect_error', (err) => {
  console.log(err);
});

const Constants = require('./constants');
const { startScrapingFromURL } = require('./website-contact-scraper');

const queue = new Queue(
  Constants.WEBSITE_CONTACT_SCRAPER_QUEUE,
  {
    // redis: {
    //   host: 'somewhereElse'
    // },
    isWorker: true,
    removeOnSuccess: true,
  },
);

// Process jobs from as many servers or processes as you like
queue.process(async (job, done) => {
  console.log(`Processing job ${job.id} ${job.data.url}`);
  const results = await startScrapingFromURL(job.data.url).catch(e => console.log(e));
  socket.emit('webscraped', JSON.stringify(results));
  return done(null, JSON.stringify(job.data));
});
