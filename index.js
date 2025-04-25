const express = require('express');
const path = require('path')
const bodyParser = require('body-parser');
const cors = require('cors');
const queue = require('./data/queue')
const ticket = require('./data/ticket')
const service = require('./data/services')
const counter = require('./data/counters')
const admins = require('./data/admins')
const user = require('./data/users')
const advert = require('./data/adverts')
const doctor = require('./data/doctors')
const nurse = require('./data/nurse')
const suggestion = require('./data/suggestions')
const clinics = require('./data/clinic')
const doktas = require('./data/dokta')
const rooms = require('./data/rooms')
const networks = require('./data/network')
const attendant_clinic = require('./data/attendant_clinics')
const stream = require('./data/socket')
const active = require('./data/active')
const uploads = require('./data/video')
const currentClinic = require('./data/current_clinic')
const speaker = require('./data/speaker')
const analytics = require('./data/analytics')
const newanalytics = require('./data/new_analysis')
const { Ticket } = require('./models/index')
const cron = require('node-cron');

const corsOptions ={
  // origin:'https://qms.mloganzila.or.tz', 
  origin:'*', 
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  credentials:true,            //access-control-allow-credentials:true
  optionSuccessStatus:200,
  allowedHeaders: ['Content-Type', 'Authorization'],
}


const app = express();
app.use(express.urlencoded({ extended: true }));
const port = 5000;
app.use(cors(corsOptions));

app.use(cors());
app.use(bodyParser.json());
app.use('/queues',queue)
app.use('/tickets',ticket)
app.use('/services',service)
app.use('/counters',counter)
app.use('/users',user)
app.use('/admins',admins)
app.use('/adverts',advert)
app.use('/doctors',doctor)
app.use('/nurse',nurse)
app.use('/suggestion',suggestion)
app.use('/clinic',clinics)
app.use('/doktas',doktas)
app.use('/rooms',rooms)
app.use('/network',networks)
app.use('/attendant_clinics',attendant_clinic)
app.use('/socket',stream)
app.use('/active',active)
app.use('/current_clinic',currentClinic)
app.use('/speaker',speaker)
app.use('/analytics',analytics)
app.use('/new_analytics',newanalytics)
app.use('/uploads',uploads)
app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));
app.use('/public', express.static(path.join(__dirname, 'public')));



cron.schedule('0 0 * * *', async () => {
  try {
    await Ticket.destroy({
      truncate: true
    });
    console.log('All tokens deleted successfully at 00:00');
  } catch (error) {
    console.error('Error deleting tokens:', error);
  }
});
  app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
