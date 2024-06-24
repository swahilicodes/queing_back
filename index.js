const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const patient = require('./data/patient')

const app = express();
const port = 4000;

app.use(cors());
app.use(bodyParser.json());
app.use('/patients',patient)

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
