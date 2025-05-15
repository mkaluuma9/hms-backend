const express = require('express');
const router = express.Router();
const multer = require('multer');
const {
  getPendingApplications,
  rejectApplication,
  verifyApplication,
  addEmploymentDetails,
  getAllEmployees
} = require('../controllers/hrController');

const upload = multer({
  dest: 'uploads/contracts',
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype !== 'application/pdf') {
      return cb(new Error('Only PDF allowed'));
    }
    cb(null, true);
  }
});

router.get('/pending', getPendingApplications);
router.post('/reject', rejectApplication);
router.post('/verify', verifyApplication);
router.post('/employment-details', upload.single('contractFile'), addEmploymentDetails);
router.get('/employees', getAllEmployees);

module.exports = router;
