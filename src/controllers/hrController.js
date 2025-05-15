const prisma = require('../prismaClient');
const bcrypt = require('bcryptjs');
const { sendEmail } = require('../utils/email');

const getPendingApplications = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      where: { isVerified: false },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        nationalId: true,
        personalEmail: true,
        phone: true,
        createdAt: true,
      }
    });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching pending applications.' });
  }
};

const rejectApplication = async (req, res) => {
  const { userId, reason } = req.body;
  if (!userId || !reason) return res.status(400).json({ message: 'UserId and reason are required.' });

  try {
    await prisma.user.update({
      where: { id: userId },
      data: {
        isVerified: false,
        rejectedReason: reason,
      }
    });

    await sendEmail({
      to: user.personalEmail, // fetch applicant email dynamically
      subject: 'Onboarding Application Rejected',
      text: `Your onboarding application was rejected for this reason: ${reason}`
    });

    res.json({ message: 'Application rejected and applicant notified.' });
  } catch (err) {
    res.status(500).json({ message: 'Error rejecting application.' });
  }
};

const verifyApplication = async (req, res) => {
  const { userId } = req.body;
  if (!userId) return res.status(400).json({ message: 'UserId is required.' });

  try {
    // Update verified status to true
    await prisma.user.update({
      where: { id: userId },
      data: { isVerified: true, rejectedReason: null },
    });

    // HR will now input position, supervisor, salary and contract in a next step
    res.json({ message: 'Application verified. Proceed to employment details.' });
  } catch (err) {
    res.status(500).json({ message: 'Error verifying application.' });
  }
};

const addEmploymentDetails = async (req, res) => {
  /*
    Expects:
      userId
      position
      supervisorId
      grossSalary
      contractStartDate
      contractEndDate
      contractType
      contractFile (upload)
  */

  try {
    const {
      userId,
      position,
      supervisorId,
      grossSalary,
      contractStartDate,
      contractEndDate,
      contractType,
    } = req.body;

    const contractFile = req.file ? req.file.path : null;

    // Validate user exists
    const user = await prisma.user.findUnique({ where: { id: userId }});
    if (!user) return res.status(404).json({ message: 'User not found.' });

    // Generate employee ID in format GT0001, GT0002, etc.
    // Get last employeeId number
    const lastUser = await prisma.user.findFirst({
      where: {
        employeeId: { not: null }
      },
      orderBy: {
        employeeId: 'desc'
      }
    });

    let newIdNumber = 1;
    if (lastUser && lastUser.employeeId) {
      // Parse number after GT and increment
      newIdNumber = parseInt(lastUser.employeeId.slice(2)) + 1;
    }

    const newEmployeeId = 'GT' + newIdNumber.toString().padStart(4, '0');

    // Create work email lastname.firstname@bodabodaunion.ug
    const workEmail = `${user.lastName.toLowerCase()}.${user.firstName.toLowerCase()}@bodabodaunion.ug`;

    // Generate a default password (can be random string or a fixed default)
    const defaultPassword = 'Welcome123'; // For example. You should send a password reset email later
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);

    // Update user with employment details
    await prisma.user.update({
      where: { id: userId },
      data: {
        position,
        supervisorId,
        employeeId: newEmployeeId,
        workEmail,
        password: hashedPassword,
        grossSalary: parseFloat(grossSalary),
      }
    });

    // Save contract
    await prisma.contract.create({
      data: {
        userId,
        startDate: new Date(contractStartDate),
        endDate: new Date(contractEndDate),
        contractType,
        contractFile,
        lastEditedAt: new Date(),
      }
    });

    // Send welcome email to employee with work email and login instructions
    await sendEmail({
      to: user.personalEmail,
      subject: 'Your Employment Has Been Confirmed',
      text: `Hello ${user.firstName},\n\nYour employment has been confirmed. Your work email is ${workEmail} and your temporary password is ${defaultPassword}. Please reset your password after first login.\n\nRegards,\nHR Team`
    });

    res.json({ message: 'Employment details added and employee notified.' });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error adding employment details.' });
  }
};

const getAllEmployees = async (req, res) => {
  try {
    const employees = await prisma.user.findMany({
      where: { isVerified: true },
      select: {
        id: true,
        employeeId: true,
        firstName: true,
        lastName: true,
        position: true,
        workEmail: true,
      }
    });
    res.json(employees);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching employees.' });
  }
};

module.exports = {
  getPendingApplications,
  rejectApplication,
  verifyApplication,
  addEmploymentDetails,
  getAllEmployees,
};
