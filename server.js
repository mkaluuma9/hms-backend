const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
//const fileUpload = require('express-fileupload');
const onboardingRouter = require('./src/routes/onboardingRoutes');
const hrRouter = require('./src/routes/hrRoutes');

require('dotenv').config();

const app = express();



app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
//app.use(fileUpload());

app.use('/', onboardingRouter); 
app.use('/', hrRouter); 

app.get('/', (req, res) => {
  res.send('HR System Running');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server started on port ${PORT}`));

app.use((err, req, res, next) => {
  console.error('❌ Global error handler:', err.message);
  res.status(500).json({ error: err.message });
});