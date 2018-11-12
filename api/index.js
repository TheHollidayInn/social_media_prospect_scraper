const express = require('express');
const http = require('http');
const io = require('socket.io');

const { createWebsiteScrapRequest } = require('../website-contact-scraper/producer');

const app = express();
const httpServer = http.Server(app);
const IO = io(httpServer);
const port = 3000;

IO.on('connection', (socket) => {
  console.log(`a user connected${socket}`);

  socket.on('webscraped', (msg) => {
    IO.emit('webscraped', msg);
  });

  socket.on('requestscrape', (msg) => {
    console.log(msg);
    createWebsiteScrapRequest(msg);
  });
});

app.use(express.static('public'));

// @TODO: Make post
app.get('/request', (req, res) => {
  createWebsiteScrapRequest('http://test.com');
  res.send('Hello World!');
});

// @TODO: Why not app?
httpServer.listen(port, () => {
  console.log(`Example app listening on port ${port}!`);
});
