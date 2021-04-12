const { Client } = require('pg');
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
var format = require('pg-format');
const app = require('express')();
const http = require('http').Server(app);
const socketIO = require('socket.io')(http, {
  cors: {
    origin: '*',
  }
});

require('dotenv').config()

const port = process.env.PORT || 5000;

const client = new Client({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_DATABASE,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: {
  rejectUnauthorized: false
}
})

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(cors());

client.connect();

socketIO.on('connection', function(socket) {
    console.log('Client connected.');
    socketIO.on('disconnect', function() {
        console.log('Client disconnected.');
    });
});

app.use(cors());

app.get('/', (req,res) => {
  client.query('SELECT * FROM public.players ORDER BY id ASC;').then(data => {
    if(data.rows.length){
      res.json(data.rows);
      socketIO.sockets.emit("FromAPI", data.rows);
    } else {
      res.json({dataExists: 'false'})
    }
  })
  .catch(err => res.status(400).json({dbError: 'db error'}));
})

http.listen(port, () => console.log(`BACK_END_SERVICE_PORT: ${port}`));
