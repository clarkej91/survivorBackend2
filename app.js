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
    socket.on('sendMessage', (data) => {
      socketIO.emit('getMessage', data);
      console.log(data);
    });
    socket.on('sendRatioVal', (data) => {
      socketIO.emit('getRatioVal', data);
      console.log(data);
    });
    socket.on('sendIdolMessage', (data) => {
      socketIO.emit('getIdolMessage', data);
      console.log(data);
    });
    socket.on('sendRoundMessage', (data) => {
      socketIO.emit('getRoundMessage', data);
      console.log(data);
    });
    socket.on('sendTribalVotes', (data) => {
      socketIO.emit('getTribalVotes', data);
      console.log(data);
    });
    socket.on('sendVote', (data) => {
      socketIO.emit('getVote', data);
      console.log(data);
    });
    socket.on('sendRevealVote', (data) => {
      socketIO.emit('getRevealVote', data);
      console.log(data);
    });
    socket.on('disconnect', function() {
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

app.get('/events', (req,res) => {
  client.query('SELECT * FROM public.event_outcome ORDER BY id DESC;').then(data => {
    if(data.rows.length){
      res.json(data.rows);
    } else {
      res.json({dataExists: 'false'})
    }
  })
  .catch(err => res.status(400).json({dbError: 'db error'}));
})

app.put('/updatePlayerScore', (req,res) => {
  const { name, playerScore, tribal } = req.body
  client.query(`UPDATE public.players SET playerscore =${playerScore}, tribal =${tribal} WHERE name = '${name}';`).then(data => {
    res.json({data: 'updated'});
  })
  .catch(err => res.status(400).json({dbError: 'db error'}));
})

app.put('/setTribalToFalse', (req,res) => {
  const { name, playerScore, tribal } = req.body
  client.query(`UPDATE players SET tribal = false`).then(data => {
    res.json({data: 'updated'});
  })
  .catch(err => res.status(400).json({dbError: 'db error'}));
})

app.put('/changeShowData', (req,res) => {
  const { showData } = req.body
  client.query(`UPDATE public.game_data SET showdata = ${showData}`).then(data => {
    res.json({data: 'updated'});
  })
  .catch(err => res.status(400).json({dbError: 'db error'}));
})

app.get('/gameData', (req,res) => {
  client.query('SELECT * FROM public.game_data ORDER BY id ASC;').then(data => {
    if(data.rows.length){
      res.json(data.rows);
      socketIO.sockets.emit("GameData", data.rows);
    } else {
      res.json({dataExists: 'false'})
    }
  })
  .catch(err => res.status(400).json({dbError: 'db error'}));
})

//PUT ROUTES

app.put('/updateTribeNumber', (req,res) => {
  const { name, tribeNumber } = req.body
  client.query(`UPDATE public.players SET tribe_number =${tribeNumber} WHERE name = '${name}';`).then(data => {
    res.json({data: 'updated'});
  })
  .catch(err => res.status(400).json({dbError: 'db error'}));
})

app.put('/updateChallengeRatio', (req,res) => {
  const { num } = req.body
  client.query(`UPDATE public.game_data SET challenge_ratio = ${num}`).then(data => {
    res.json({data: 'updated'});
  })
  .catch(err => res.status(400).json({dbError: 'db error'}));
})

app.put('/updateRoundData', (req,res) => {
  const { id, roundData } = req.body
  client.query(`UPDATE public.game_data SET round_data =${roundData} WHERE id = ${id};`).then(data => {
    res.json({data: 'updated'});
  })
  .catch(err => res.status(400).json({dbError: 'db error'}));
})

app.put('/updateIdolCount', (req,res) => {
  const { id, idolCount } = req.body
  client.query(`UPDATE public.players SET idol_count =${idolCount} WHERE id = ${id};`).then(data => {
    res.json({data: 'updated'});
  })
  .catch(err => res.status(400).json({dbError: 'db error'}));
})

app.put('/updateImmunity', (req,res) => {
  const { id, immunity } = req.body
  client.query(`UPDATE public.players SET immunity =${immunity} WHERE id = ${id};`).then(data => {
    res.json({data: 'updated'});
  })
  .catch(err => res.status(400).json({dbError: 'db error'}));
})

app.put('/updateScoreData', (req,res) => {
  const { id, tribe1, tribe2, tribe3 } = req.body
  client.query(`UPDATE public.game_data SET tribe1score=${tribe1}, tribe2score=${tribe2}, tribe3score=${tribe3} WHERE id = ${id};`).then(data => {
    res.json({data: 'updated'});
  })
  .catch(err => res.status(400).json({dbError: 'db error'}));
})

app.put('/updateGameData', (req,res) => {
  const { id, gameData } = req.body
  client.query(`UPDATE public.game_data SET game_data =${gameData} WHERE id = ${id};`).then(data => {
    res.json({data: 'updated'});
  })
  .catch(err => res.status(400).json({dbError: 'db error'}));
})

app.put('/getEvent', (req,res) => {
  var myArray = req.body.id
  var sql = format("SELECT * FROM public.event_outcome WHERE id IN (%L)", myArray);
  client
    .query(sql)
    .then(data => {
      if(data.rows.length){
        res.json(data.rows);
        socketIO.sockets.emit("FromGetEvent", data.rows);
      } else {
        res.json({dataExists: 'false'})
      }
    })
    .catch(err => res.status(400).json({dbError: 'db error'}));
  })

app.put('/getPlayer', (req,res) => {
  var myArray = req.body.name
  var sql = format("SELECT * FROM public.players WHERE name IN (%L)", myArray);
  client
    .query(sql)
    .then(data => {
      if(data.rows.length){
        res.json(data.rows);
        socketIO.sockets.emit("FromgetPlayerAPI", data.rows);
      } else {
        res.json({dataExists: 'false'})
      }
    })
    .catch(err => res.status(400).json({dbError: 'db error'}));
  })

  app.put('/getTribe', (req,res) => {
    var myArray = req.body.tribe
    var sql = format("SELECT * FROM public.players WHERE tribe IN (%L)", myArray);
    client
      .query(sql)
      .then(data => {
        if(data.rows.length){
          res.json(data.rows);
          socketIO.sockets.emit("FromgetTribeAPI", data.rows);
        } else {
          res.json({dataExists: 'false'})
        }
      })
      .catch(err => res.status(400).json({dbError: 'db error'}));
    })

  app.put('/updateCount', (req, res) => {
    const { id, likeness } = req.body
    client.query(`UPDATE public.players SET likeness =${likeness} WHERE id = ${id};`).then(data => {
      res.json({data: 'updated'});
    })
    .catch(err => res.status(400).json({dbError: 'db error'}));
  })

  app.put('/updateStrength', (req, res) => {
    const { id, strength } = req.body
    client.query(`UPDATE public.players SET strength =${strength} WHERE id = ${id};`).then(data => {
      res.json({data: 'updated'});
    })
    .catch(err => res.status(400).json({dbError: 'db error'}));
  })

  app.put('/updateChallenge', (req, res) => {
    const { id, challenge } = req.body
    client.query(`UPDATE public.players SET join_game =${challenge} WHERE id = ${id};`).then(data => {
      res.json({data: 'updated'});
    })
    .catch(err => res.status(400).json({dbError: 'db error'}));
  })

  app.put('/updateWit', (req, res) => {
    const { id, wit } = req.body
    client.query(`UPDATE public.players SET wit =${wit} WHERE id = ${id};`).then(data => {
      res.json({data: 'updated'});
    })
    .catch(err => res.status(400).json({dbError: 'db error'}));
  })

  app.put('/updateTribe', (req, res) => {
    var myArray = req.body.id
    var tribe = req.body.tribe
    var sql = format("UPDATE public.players SET tribe = %L WHERE id IN (%L)", tribe, myArray);
    client
      .query(sql)
      .then(data => {
        res.json({data: 'updated'});
      })
      .catch(e => {
        console.error(e.stack)
      })
  })

//POST ROUTES

app.post('/addEvent', (req, res) => {
  const { events } = req.body
  client.query(`INSERT INTO public.event_outcome (events)
VALUES ('${events}');`).then(data => {
    res.json({data: 'updated'});
  })
  .catch(err => res.status(400).json({dbError: 'db error'}));
})

//DELETE ROUTES
app.delete('/deleteEvent', (req,res) => {
  const { id } = req.body
  client.query(`DELETE FROM public.event_outcome WHERE id=${id};`).then(data => {
      res.json({data: 'deleted'});
  })
  .catch(err => res.status(400).json({dbError: 'db error'}));
})

http.listen(port, () => console.log(`BACK_END_SERVICE_PORT: ${port}`));
