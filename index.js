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
//socketSetup(io);

// app.listen(port, () => {
server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});

io.on("connection",(socket)=> {
  console.log('websocket connected there wait...')
  socket.on("disconnect", ()=> {
    console.log("websocket disconnected")
  })
})

// WebSocket Server
// const wss = new WebSocket.Server({ server });

// wss.on('connection', (ws) => {
//   console.log('WebSocket client connected');

//   ws.send('Connected to WebSocket server');

//   ws.on('message', (message) => {
//     console.log(`Received message => ${message}`);
//     // Handle incoming messages as needed
//   });

//   ws.on('close', () => {
//     console.log('WebSocket client disconnected');
//   });
// });

// Handle clean shutdown
// process.on('SIGINT', async () => {
//   console.log('Closing server gracefully');
//   await sequelize.close();
//   app.close(() => {
//     console.log('Server closed');
//     process.exit(0);
//   });
// });
