const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const fileUpload = require('express-fileupload');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(fileUpload());

app.get('/', (req, res) => {
  res.send('HR System Running');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
