import express from "express";
import admin from "firebase-admin"; // Import the Firebase Admin SDK
import "dotenv/config";
import User from '../models/User.js';
// import serviceAccount from "../el-ropero.json";

const router = express.Router();
// Import the JSON data with the correct import assertion
import jsonData from '../el-ropero.json' assert { type: 'json' };

// Initialize the Firebase Admin SDK with your credentials
admin.initializeApp({
    credential: admin.credential.cert(jsonData), // Use your credentials here
    messagingSenderId: process.env.SERVER_KEY
 // Replace with your Firebase project URL
});

router.post('/send-notification', async (req, res) => {
  try {
    const { userId, title, message } = req.body;

    // Find the user by their ID
    const user = await User.findByPk(userId);

    // Check if the user has an FCM token
    if (!user || !user.fcm_token) {
      return res.status(400).json({ error: 'User not found or FCM token not available' });
    }

    // Prepare the push notification message
    const pushMessage = {
      notification: {
        title: title,
        body: message,
      },
      token: user.fcm_token,
    };

    // Send the push notification
    admin.messaging().send(pushMessage)
      .then((response) => {
        console.log('Successfully sent message:', response);
        return res.status(200).json({ success: true, message: 'Notification sent successfully' });
      })
      .catch((error) => {
        console.error('Error sending message:', error);
        return res.status(500).json({ error: 'Failed to send notification' });
      });
  } catch (err) {
    console.error("error2", err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
