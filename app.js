const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors')
require('dotenv').config()
const port = 3001;

const app = express();

app.use(cors(),bodyParser.json());

app.listen(port , function() {
  console.log('Arya Payroll is running');
});
