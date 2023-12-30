import express from "express";
import admin from "firebase-admin"; // Import the Firebase Admin SDK
import "dotenv/config";
import User from '../models/User.js';
// import serviceAccount from "../el-ropero.json";

const router = express.Router();
// Import the JSON data with the correct import assertion
import jsonData from '../el-ropero.json' assert { type: 'json' };
import checkUserAuthentication from "../middleware/authMiddleware.js";
import Notifications from "../models/Notification.js";

// Initialize the Firebase Admin SDK with your credentials
admin.initializeApp({
    credential: admin.credential.cert(jsonData), // Use your credentials here
    messagingSenderId: process.env.SERVER_KEY
 // Replace with your Firebase project URL
});

router.post('/send-notification', checkUserAuthentication, async (req, res) => {
  try {
    const sender = req.user;
    console.log(sender.username)
    const { userId, title, message } = req.body;

    // Find the user by their ID
    const user = await User.findByPk(userId);

    // Check if the user has an FCM token
    if (!user || !user.fcm_token) {
      return res.status(400).json({ error: 'User not found or FCM token not available' });
    }

    await Notifications.create({
      sender_name:sender.username,
      sender_image:sender.profileImage,
      reciver_id:userId,
      title: title
    });

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

// Get All notification by id
router.get('/all-notification/:id', async (req, res) => {
  try {
    const userId = req.params.id;
    const notifications = await Notifications.findAll({
      where: { reciver_id: userId }, // Use object syntax for 'where'
    });
    
    res.json(notifications);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
);

// Update notification by Id
router.put('/update-notification/:id', async (req, res) => {
  try {
    const notificationId = req.params.id;
    const notification = await Notifications.findByPk(notificationId);

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    notification.status = "read";
    await notification.save();
    return res.json({ message: 'Notification updated successfully' });
  } catch (error) {

    res.status(500).json({ error: error });
  }
});
export default router;
