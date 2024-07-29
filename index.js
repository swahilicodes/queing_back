const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const patient = require('./data/patient')
const queue = require('./data/queue')
const ticket = require('./data/ticket')
const service = require('./data/services')
const counter = require('./data/counters')
const attendant = require('./data/attendant')
const admins = require('./data/admins')
const user = require('./data/users')
const advert = require('./data/adverts')
const morgan = require('morgan')
// const WebSocket = require('ws');
const http = require("http")
const { Server } =  require('socket.io');
const socketSetup = require('./src/socket')

const corsOptions ={
  origin:'*', 
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  credentials:true,            //access-control-allow-credentials:true
  optionSuccessStatus:200
}


const app = express();
const port = 5000;
app.use(cors(corsOptions));
const server = http.createServer(app);
const io = new Server(server,{cors: {
  origin: "*"
}});

app.use(cors());
app.use(bodyParser.json());
app.use('/patients',patient)
app.use('/queues',queue)
app.use('/tickets',ticket)
app.use('/services',service)
app.use('/counters',counter)
app.use('/attendants',attendant)
app.use('/users',user)
app.use('/admins',admins)
app.use('/adverts',advert)
//socketSetup(io);

// app.listen(port, () => {
server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
io.on('connection', (socket) => {
  // console.log('a user connected');

  socket.on('disconnect', () => {
    // console.log('user disconnected');
  });

  socket.on('data', (msg) => {
    io.emit('data', msg);
    console.log('message: ' + msg);
  });
});
