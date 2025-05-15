const express = require('express');
const router = express.Router();
const multer = require('multer');
const { submitOnboarding, getMyOnboardingStatus } = require('../controllers/onboardingController');

const upload = multer({
  dest: 'uploads/',
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype !== 'application/pdf' && !file.mimetype.startsWith('image/')) {
      return cb(new Error('Only PDF and images allowed'));
    }
    cb(null, true);
  }
});

router.post('/submit', upload.fields([
  { name: 'passportPhoto', maxCount: 1 },
  { name: 'cv', maxCount: 1 },
  { name: 'referenceLetter', maxCount: 1 },
  { name: 'academicDocs', maxCount: 10 },
]), submitOnboarding);

router.get('/status', getMyOnboardingStatus);

module.exports = router;
