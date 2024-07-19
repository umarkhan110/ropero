import express from "express";
import admin from "firebase-admin";
import "dotenv/config";
import User from "../models/User.js";

const router = express.Router();
// Import the JSON data with the correct import assertion
// import jsonData from "../el-ropero.json" assert { type: "json" };
import checkUserAuthentication from "../middleware/authMiddleware.js";
import Notifications from "../models/Notification.js";
const params = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  privateKey: process.env.FIREBASE_PRIVATE_KEY ? process.env.FIREBASE_PRIVATE_KEY.replace(/\@/g, "\n") : undefined,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
};
// Initialize the Firebase Admin SDK with your credentials
admin.initializeApp({
  credential: admin.credential.cert(params),
  messagingSenderId: process.env.SERVER_KEY,
});

router.post("/send-notification", checkUserAuthentication, async (req, res) => {
  try {
    const sender = req.user;
    console.log(sender);
    const { userId, title, message } = req.body;
    const user = await User.findByPk(userId);

    if (!user || !user.fcm_token) {
      return res
        .status(400)
        .json({ error: "User not found or FCM token not available" });
    }

    const newNotification = await Notifications.create({
      sender_id: sender.id,
      sender_name: sender.username,
      sender_image: sender.profileImage,
      reciver_id: userId,
      title: title,
      message: message,
      status: "unread",
    });

    const pushMessage = {
      notification: {
        title: title,
        body: message,
      },
      data: {
        notificationId: newNotification.id.toString(),
        status: "unread",
        sender_id: sender.id.toString(),
        sender_name: String(sender.username),
        sender_image: String(sender.profileImage),
      },
      token: user.fcm_token,
    };

    admin
      .messaging()
      .send(pushMessage)
      .then((response) => {
        console.log("Successfully sent message:", response);
        return res
          .status(200)
          .json({ success: true, message: "Notification sent successfully" });
      })
      .catch((error) => {
        console.error("Error sending message:", error);
        return res.status(500).json({ error: error });
      });
  } catch (err) {
    console.error("error2", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// Get All notification by id
router.get("/all-notification/:id", async (req, res) => {
  try {
    const userId = req.params.id;
    const notifications = await Notifications.findAll({
      where: { reciver_id: userId },
    });

    res.json(notifications);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Update notification by Id
router.put("/update-notification/:id", async (req, res) => {
  try {
    const notificationId = req.params.id;
    const notification = await Notifications.findByPk(notificationId);

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }
    notification.status = "read";
    await notification.save();
    return res.json({ message: "Notification updated successfully" });
  } catch (error) {
    res.status(500).json({ error: error });
  }
});
router.put("/update-all-notification/:id", async (req, res) => {
  try {
    const userId = req.params.id;
    const notifications = await Notifications.findAll({
      where: { reciver_id: userId },
    });
    // Update all fetched notifications to 'read'
    const updatePromises = notifications.map((notification) => {
      return notification.update({ status: "read" });
    });
    await Promise.all(updatePromises);
    res.status(200).json({ message: "Notifications updated to read" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

//Send Notification to all user by admin
router.post("/sendNotificationToAllUser", async (req, res) => {
  try {
    const { title, message } = req.body;

    const pushMessage = {
      notification: {
        title: title,
        body: message,
      },
      data: {
        notificationId: "",
        status: "unread",
        sender_id: "admin",
        sender_name: "admin",
        sender_image: "admin",
      },
    };
    const arrayOfId = [];
    const users = await User.findAll({
      attributes: ["fcm_token", "id"],
    });
    users.forEach((user) => {
      if (user.fcm_token) {
        arrayOfId.push(user.fcm_token);
      }
    });
    const response = await admin
      .messaging()
      .sendEachForMulticast({ ...pushMessage, tokens: arrayOfId });

    response.responses.forEach((res, idx) => {
      if (res.success) {
        console.log(`Successfully sent message to token: ${arrayOfId[idx]}`);
      } else {
        console.error(
          `Failed to send message to token: ${arrayOfId[idx]}`,
          res.error
        );
        throw new Error(
          `Failed to send message to token: ${arrayOfId[idx]} ${res.error}`
        );
      }
    });
      // Create notification records for each user
      const sender = { id: "admin", username: "admin", profileImage: "admin" };
      await Promise.all(users.map(async user => {
        console.log(user.id)
        await Notifications.create({
          sender_id: 999999999999999,
          sender_name: sender.username,
          sender_image: sender.profileImage,
          reciver_id: user.id,
          title: title,
          message: message,
          status: "unread",
        });
      }));
    return res.status(200).json({ message: "Notification sent successfully." });
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({ error: error });
  }
});


router.post("/sendFCM", async (req, res) => {
  try {
    const { fcm } = req.body;
    const pushMessage = {
      notification: {
        title: fcm,
        body: fcm,
      },
      data: {
        notificationId: "",
        status: "unread",
        sender_id: "admin",
        sender_name: "admin",
        sender_image: "admin",
      },
      token: fcm,
    };

    admin
      .messaging()
      .send(pushMessage)
      .then((response) => {
        console.log("Successfully sent message:", response);
        return res
          .status(200)
          .json({ success: true, message: "Notification sent successfully" });
      })
      .catch((error) => {
        console.error("Error sending message:", error);
        return res.status(500).json({ error: "Failed to send notification" });
      });
    
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error });
  }
});

export default router;
