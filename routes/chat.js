import express from 'express';
const router = express.Router();
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, addDoc, getDocs, query, orderBy, getDoc, setDoc, where, updateDoc } from 'firebase/firestore';
import firebaseConfig from '../config/firebaseConfig.js'; // Adjust the path to your firebaseConfig.js
import User from '../models/User.js';

// Initialize Firebase with your configuration
const firebaseApp = initializeApp(firebaseConfig);
const firestore = getFirestore(firebaseApp);

// POST route to send a message and update the last_message field
router.post('/sendMessage', async (req, res) => {
  const { messageText, senderId, receiverId } = req.body;

  try {
    const roomId = `room_for_sender_${senderId}_and_receiver_${receiverId}`;
    const roomRef = doc(firestore, 'rooms', roomId);
    const roomSnapshot = await getDoc(roomRef);

    // Find the user by ID
    const sender = await User.findByPk(senderId, {
      attributes: ['username', 'profileImage'],
    });
    const receiver = await User.findByPk(receiverId, {
      attributes: ['username', 'profileImage'],
    });

    const roomData = {
      participants: [senderId, receiverId],
      senderName: sender ? sender.username : '',
      senderImage: sender
        ? `https://ropero.s3.sa-east-1.amazonaws.com/${sender.profileImage}`
        : '',
      receiverName: receiver ? receiver.username : '',
      receiverImage: receiver
        ? `https://ropero.s3.sa-east-1.amazonaws.com/${receiver.profileImage}`
        : '',
      last_message: {
        text: messageText,
        senderId,
        receiverId,
        timestamp: new Date(),
      },
    };

    if (!roomSnapshot.exists()) {
      // Create a new room if it doesn't exist
      await setDoc(roomRef, {
        ...roomData,
        messages: [],
      });
      const messagesRef = collection(roomRef, 'messages');
      await addDoc(messagesRef, {
        text: messageText,
        senderId,
        receiverId,
        timestamp: new Date(),
      });
    } else {
      // Room already exists, add the message to the messages collection
      const messagesRef = collection(roomRef, 'messages');
      await addDoc(messagesRef, {
        text: messageText,
        senderId,
        receiverId,
        timestamp: new Date(),
      });

      // Update the last_message field
      await updateDoc(roomRef, {
        last_message: roomData.last_message,
      });
    }

    res.status(200).send('Message sent successfully');
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).send('Error sending message');
  }
});




// GET route to listen for messages in a room
router.get('/listenMessages/:roomId', async (req, res) => {
  const roomId = req.params.roomId;

  try {
    // Listen for real-time updates in the specified chat room
    const messagesRef = collection(firestore, 'rooms', roomId, 'messages');
    const q = query(messagesRef, orderBy('timestamp'));

    const messagesSnapshot = await getDocs(q);
    const messages = [];

    messagesSnapshot.forEach((doc) => {
      messages.push({ id: doc.id, ...doc.data() });
    });

    res.json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).send('Error fetching messages');
  }
});

// GET route to get chat rooms related to a sender
router.get('/getChatRooms/:senderId', async (req, res) => {
  const senderId = req.params.senderId;

  try {
    // Query Firestore to find all rooms where the sender is a participant
    const roomsRef = collection(firestore, 'rooms');
    const q = query(roomsRef, where('participants', 'array-contains', senderId));

    const roomsSnapshot = await getDocs(q);
    const chatRooms = [];

    roomsSnapshot.forEach((doc) => {
      chatRooms.push({ id: doc.id, ...doc.data() });
    });

    res.json(chatRooms);
  } catch (error) {
    console.error('Error fetching chat rooms:', error);
    res.status(500).send('Error fetching chat rooms');
  }
});

export default router;
