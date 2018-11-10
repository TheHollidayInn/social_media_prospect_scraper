const express = require('express');
const { createWebsiteScrapRequest } = require('../website-contact-scraper/producer');

const app = express();
const port = 3000;

// @TODO: Make post
app.get('/', (req, res) => {
  createWebsiteScrapRequest('http://test.com');
  res.send('Hello World!');
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}!`);
});
