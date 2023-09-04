const express = require('express');
const bcrypt = require('bcrypt');
const User = require('../models/User'); // Import the User model
const crypto = require('crypto');
const multer = require('multer');
const { sequelize } = require('../config/database');
const { Op } = require('sequelize');
const path = require('path');
const router = express.Router();
const sgMail = require('@sendgrid/mail')
const profileImageToS3 = require('../factory/profileUpload');
const axios = require('axios');
sgMail.setApiKey(process.env.SG_MAIL);

  // Configure multer for file uploads
  const storage = multer.memoryStorage(); // Store files in memory for further processing
  const upload = multer({ storage });

const createToken = () => {
  const tokenValue = Math.random().toString(36).substr(2);
  return tokenValue + tokenValue;
  };
  
// Social Logins
router.post('/socialLogin', async (req, res) => {
  const id_token = req.body.id_token;
  const provider = req.body.provider;
  try {
    let usrRes, username, email, userData, profileImage;
    if (provider === 'google') {
      usrRes = await axios.get(
        `https://www.googleapis.com/oauth2/v1/userinfo?alt=json&access_token=${id_token}`,
        {
          headers: {
            Authorization: `Bearer ${id_token}`,
          },
        },
      );
      userData = usrRes.data;
      username = userData.given_name + " " + userData.family_name;
      email = userData.email;
      profileImage = userData.picture;
    } else if (provider === 'facebook') {
      usrRes = await axios.get(
        `https://graph.facebook.com/v12.0/me?fields=id,name,first_name,last_name,email,picture&access_token=${id_token}`,
        {
          headers: {
            Authorization: `Bearer ${id_token}`,
          },
        },
      );
      userData = usrRes.data;
      username = userData.first_name;
      email = userData.email;
      profileImage = userData.picture.data.url;
    }

    const user = await User.findOne({ where: { email: email } });
    console.log(user)
    if ((user && user.provider === 'google') || (user && user.provider === 'facebook')) {
      // means we already have a user with this email and this email was registered through social
      // const token = jwt.sign({ userId: user.id }, JWT_SECRET, {
      //   expiresIn: TOKEN_EXPIRY_DAYS,
      // });
      const data = { user: user };
      return res.status(200).json({ data, message:"User login successfully"});
    } else {
      try {
        const userData = await User.create({
          username,
          email,
          password: '',
          profileImage,
          provider:provider,
          isVerified: true
        });
        // const token = jwt.sign({ userId: userData.id }, JWT_SECRET, {
        //   expiresIn: TOKEN_EXPIRY_DAYS,
        // });
        const data = { user: userData };
        return res.status(200).json({ data, message:"User login successfully"});
      } catch (err) {
        return res.status(400).json({ error1:err });
      }
    }
  } catch (error) {
    return res.status(400).json({ error: error });
  }
}
) 

// Registration
router.post('/register',upload.single('profileImage'), async (req, res) => {
  try {
//console.log("body",req.body)
    const token = createToken();
    const { username, email, password  } = req.body;
const existingUser = await User.findOne({
      where: {
        [Op.or]: [{ username }, { email }],
      },
    });

    if (existingUser) {
      return res.status(400).json({ error: 'Username or email is already in use.' });
    }
const saltRounds = 10;
 const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Get the uploaded image path
//    const imagePath = req.file ? req.file.filename : null;
// Upload profile image to S3
    let profileImage = null;
    if (req.file) {
      const uploadResponse = await profileImageToS3(req.file.buffer, req.file.originalname);
//console.log(uploadResponse); 
    profileImage = uploadResponse.Location; // Store the S3 URL in the database
    }
//console.log(profileImage)
    const msg = {
      to: email, // Change to your recipient
      from: 'elropero@elropero.app', // Change to your verified sender
      subject: 'Email Verification Code',
      text: 'This is your email verification code',
      html: `<strong><a href="https://www.elropero.app/loading?token=${token}">Verify Email</a></strong>`,
    }
    sgMail.send(msg)


 await User.create({
      username,
      email,
      password:hashedPassword,
     // image: imagePath,  // Store the hashed password in the database
      token:token,
      profileImage:req?.file?.originalname
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

//Resend Email Verification
router.post('/resend-verification', async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }
    if (user.isVerified) {
      return res.status(400).json({ error: 'User is already verified.' });
    }
    // Generate a new verification token and update the user record
    const token = createToken(); // Implement your own token generation logic
    user.token = token;
    await user.save();

    // Send the verification email
    const msg = {
      to: email, // Change to your recipient
      from: 'elropero@elropero.app', // Change to your verified sender
      subject: 'Email Verification Code',
      text: 'This is your email verification code',
      html: `<strong><a href="https://www.elropero.app/loading?token=${token}">Verify Code</a></strong>`,
    }
    sgMail.send(msg)

    res.json({ message: 'Verification email sent successfully.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred while resending verification email.' });
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

    res.json({ message: 'Login successful.',
user: {
        id: user.id,
        username: user.username,
profileImage: `https://ropero.s3.sa-east-1.amazonaws.com/${user.profileImage}`
      }, });
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

     // Update the user's reset token in the database
      const user = await User.findOne({ where: { email } });
      if (user) {
        user.resetToken = resetToken;
        await user.save();
  
        // Send reset token email
        // sendResetEmail(user);
      

      const msg = {
        to: email, // Change to your recipient
        from: 'elropero@elropero.app', // Change to your verified sender
        subject: 'Reset Link',
        text: 'This is your password reset code',
        html: `<strong><a href="https://www.elropero.app/reset-password?token=${resetToken}">Password Reset Code</a></strong>`,
      }
      sgMail.send(msg)
  return res.status(200).json({ error: 'Reset token is sent to your provided email.'});  
//  res.json({ message: `This is your reset token ${resetToken}` });
}else{
  return res.status(401).json({ error: 'This email is not registered.' });  
}} catch (error) {
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
console.log(newPassword) 

if(newPassword){      // Hash the new password
const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
  
      // Update user's password and reset token
      user.password = hashedPassword;
      user.resetToken = null; // Clear the reset token
      await user.save();
  
 return   res.json({ message: 'Password reset successfully.' });
}else{
return res.status(400).json({ error : 'New Password is required'});
}
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'An error occurred while resetting password.' });
    }
  });

  

// Delete user by ID
router.delete('/deleteuser/:id', async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Delete the user
    await user.destroy();

    return res.status(200).json({message: 'User removed successfully.'});
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = router;
