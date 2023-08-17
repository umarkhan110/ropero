const express = require('express');
const bcrypt = require('bcrypt');
const User = require('../models/User'); // Import the User model
const crypto = require('crypto');
const multer = require('multer');
const path = require('path');
const router = express.Router();
const sgMail = require('@sendgrid/mail')
sgMail.setApiKey("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")

// Set up storage for uploaded images
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

const createToken = () => {
  const tokenValue = Math.random().toString(36).substr(2);
  return tokenValue + tokenValue;
  };


// Registration
router.post('/register', upload.single('image'), async (req, res) => {
  try {
    const token = createToken();
    const { username, email, password  } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10); // Hash the provided password

    // Get the uploaded image path
    const imagePath = req.file ? req.file.path : null;


    const msg = {
      to: email, // Change to your recipient
      from: 'elropero@elropero.app', // Change to your verified sender
      subject: 'Email Verification Code',
      text: 'This is your email verification code',
      html: `<strong>${token}</strong>`,
    }
    sgMail.send(msg)


    await User.create({
      username,
      email,
      password: hashedPassword,
      image: imagePath,  // Store the hashed password in the database
      token:token
    });

    res.status(201).json({ message: 'Please check your Email for account confirmation' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred while registering.' });
  }
});

// Email Verification Endpoint
router.get('/verify/:token', async (req, res) => {
  try {
    const { token } = req.params;

    // Find the user by verification token
    const user = await User.findOne({ where: { token } });

    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    // Mark user as verified
    user.isVerified = true;
    await user.save();

    res.json({ message: 'Email verification successful. You can now log in.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred while verifying email.' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    const isVerified = user.isVerified
    if(!isVerified){
      return res.status(401).json({ error: 'Email is not verified.' });
    }

    const passwordMatch = await bcrypt.compare(password, user.password); // Compare hashed password
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    // Set user session
    req.session.user = user;

    res.json({ message: 'Login successful.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred while logging in.' });
  }
});

// Logout
router.post('/logout', (req, res) => {
  req.session.destroy(); // Destroy the user's session
  res.json({ message: 'Logged out successfully.' });
});

// Request reset password
router.post('/reset-password-request', async (req, res) => {
    try {
      const { email } = req.body;
  
      // Generate a reset token
      const resetToken = crypto.randomBytes(20).toString('hex');

      const msg = {
        to: email, // Change to your recipient
        from: 'elropero@elropero.app', // Change to your verified sender
        subject: 'Reset Link',
        text: 'This is your password reset code',
        html: `<strong>${resetToken}</strong>`,
      }
      sgMail.send(msg)

      // Update the user's reset token in the database
      const user = await User.findOne({ where: { email } });
      if (user) {
        user.resetToken = resetToken;
        await user.save();
  
        // Send reset token email
        // sendResetEmail(user);
      }
  
      res.json({ message: `This is your reset token ${resetToken}` });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'An error occurred while requesting reset.' });
    }
  });

// Reset password using the reset token
router.post('/reset-password', async (req, res) => {
    try {
      const { resetToken, newPassword } = req.body;
  
      // Find user by reset token
      const user = await User.findOne({ where: { resetToken } });
  
      if (!user) {
        return res.status(400).json({ error: 'Invalid reset token.' });
      }
  
      // Hash the new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);
  
      // Update user's password and reset token
      user.password = hashedPassword;
      user.resetToken = null; // Clear the reset token
      await user.save();
  
      res.json({ message: 'Password reset successfully.' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'An error occurred while resetting password.' });
    }
  });

  


module.exports = router;