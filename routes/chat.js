import express from 'express';
const router = express.Router();
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, addDoc, getDocs, query, orderBy } from 'firebase/firestore';
import firebaseConfig from '../config/firebaseConfig.js'; // Adjust the path to your firebaseConfig.js

// Initialize Firebase with your configuration
const firebaseApp = initializeApp(firebaseConfig);
const firestore = getFirestore(firebaseApp);

// POST route to send a message
router.post('/sendMessage', async (req, res) => {
  const { roomId, messageText } = req.body;

  try {
    // Create a new message in Firestore
    const messagesRef = collection(firestore, 'rooms', roomId, 'messages');
    await addDoc(messagesRef, {
      text: messageText,
      timestamp: new Date(),
    });
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

export default router;
