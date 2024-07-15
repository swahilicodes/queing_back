const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const patient = require('./data/patient')
const queue = require('./data/queue')
const ticket = require('./data/ticket')
const service = require('./data/services')
const counter = require('./data/counters')
const attendant = require('./data/attendant')
const user = require('./data/users')
const morgan = require('morgan')

const app = express();
const port = 5000;
app.use(morgan('dev'));

app.use(cors());
app.use(bodyParser.json());
app.use('/patients',patient)
app.use('/queues',queue)
app.use('/tickets',ticket)
app.use('/services',service)
app.use('/counters',counter)
app.use('/attendants',attendant)
app.use('/users',user)

// Error handling middleware
// app.use((err, req, res, next) => {
//     console.error(err.stack);  // Log the error details
//     res.status(err.status || 500).json({
//       error: {
//         message: err.message || 'Internal Server Error'
//       }
//     });
//   });

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
