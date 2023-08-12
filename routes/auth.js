const express = require('express');
const bcrypt = require('bcrypt');
const User = require('../models/User'); // Import the User model
const crypto = require('crypto');
const router = express.Router();

// Registration
router.post('/register', async (req, res) => {
  try {
    const { email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10); // Hash the provided password

    await User.create({
      email,
      password: hashedPassword, // Store the hashed password in the database
    });

    res.status(201).json({ message: 'User registered successfully.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred while registering.' });
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
  
    // const resetToken ="4798"

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
