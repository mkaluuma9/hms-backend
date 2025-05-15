const prisma = require('../prismaClient'); // We'll create this
const bcrypt = require('bcryptjs');
const { sendEmail } = require('../utils/email');
const path = require('path');
const fs = require('fs');

const submitOnboarding = async (req, res) => {
  try {
    // Multipart form with files and fields separated
    // req.body contains text fields, req.files contains uploaded files

    // Step 1 fields:
    const {
      firstName,
      lastName,
      nationalId,
      personalEmail,
      phone,
      dateOfBirth,
      gender,
      nextOfKinName,
      nextOfKinRelation,
      homeDistrict,
      dependants,
      bankName,
      accountNumber,
      tinNumber,
      nssfNumber
    } = req.body;

    // Files uploaded (passportPhoto, cv, referenceLetter, academicDocs[])
    const passportPhoto = req.files['passportPhoto'] ? req.files['passportPhoto'][0].path : null;
    const cv = req.files['cv'] ? req.files['cv'][0].path : null;
    const referenceLetter = req.files['referenceLetter'] ? req.files['referenceLetter'][0].path : null;
    const academicDocs = req.files['academicDocs'] || []; // array of files

    // Validation for required fields can be added here

    // Check if user with nationalId or personalEmail already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { nationalId },
          { personalEmail }
        ]
      }
    });

    if (existingUser) {
      return res.status(400).json({ message: 'User with this National ID or Email already exists.' });
    }

    // Save user but mark isVerified = false and no employeeId yet
    const newUser = await prisma.user.create({
      data: {
        firstName,
        lastName,
        nationalId,
        personalEmail,
        phone,
        dateOfBirth: new Date(dateOfBirth),
        gender,
        passportPhoto,
        nextOfKinName,
        nextOfKinRelation,
        homeDistrict,
        dependants: parseInt(dependants, 10),

        bankName,
        accountNumber,
        tinNumber,
        nssfNumber,

        cv,
        referenceLetter,

        isVerified: false,
        password: '',  // empty until HR sets or user resets on first login

      }
    });

    // Save academic documents records
    for (const doc of academicDocs) {
      await prisma.academicDocument.create({
        data: {
          userId: newUser.id,
          filePath: doc.path,
        }
      });
    }

    // Send notification email to HR about new onboarding submission
    await sendEmail({
      to: process.env.HR_EMAIL, 
      subject: `New Onboarding Submission from ${firstName} ${lastName}`,
      text: `A new onboarding application has been submitted. Please review and verify.`
    });

    res.status(201).json({ message: 'Onboarding application submitted successfully.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error submitting onboarding.' });
  }
};

const getMyOnboardingStatus = async (req, res) => {
  // Assuming employee is authenticated and userId available in req.user.id
  const userId = req.user.id;

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        isVerified: true,
        employeeId: true,
        workEmail: true,
        role: true,
      }
    });
    if (!user) return res.status(404).json({ message: 'User not found.' });

    res.json({ status: user.isVerified ? 'Verified' : 'Pending', employeeId: user.employeeId, workEmail: user.workEmail });
  } catch (err) {
    res.status(500).json({ message: 'Server error fetching status.' });
  }
};

module.exports = {
  submitOnboarding,
  getMyOnboardingStatus,
};
