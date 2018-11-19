const Queue = require('bee-queue');
const SocketIO = require('socket.io-client');

const socket = SocketIO('http://localhost:3000');
socket.on('connect_error', (err) => {
  console.log(err);
});

const Constants = require('./constants');
const { scrapeSearchWithKeyword } = require('./duck-scraper');

const queue = new Queue(
  Constants.DUCK_SCRAPER_QUEUE,
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
  console.log(`Processing job ${job.id} ${job.data.keyword}`);
  const results = await scrapeSearchWithKeyword(job.data.keyword).catch(e => console.log(e));
  socket.emit('webscraped', JSON.stringify(results));
  return done(null, JSON.stringify(job.data));
});
