// routes/followers.js
import express from 'express';
const router = express.Router();
import Follower from '../models/Follower.js';
import User from '../models/User.js';

// Follow a user
router.post('/follow', async (req, res) => {
  try {
    const { followerId, followingId } = req.body;

    // Check if the relationship already exists
    const existingRelationship = await Follower.findOne({
      where: { followerId, followingId },
    });

    if (existingRelationship) {
      return res.status(400).json({ error: 'You are already following this user.' });
    }

    // Create a new follower relationship
    const newFollower = await Follower.create({ followerId, followingId });

    res.status(201).json(newFollower);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred while following the user.' });
  }
});


// Get followers of a user
router.get('/followers/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;

    // Check if the user exists
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    // Find all followers of the user
    const followers = await Follower.findAll({
      where: { followingId: userId },
      include: [{ model: User, as: 'user' }],
    });

    console.log("thisis follow : ",followers)
    // Extract follower information
    const followerList = followers.map((follow) => {
      return {
        userId: follow.user.id,
        username:follow.user.username,
        profileImage:`https://ropero.s3.sa-east-1.amazonaws.com/${follow.user.profileImage}`
      };
    });

    res.json(followerList);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred while fetching followers.' });
  }
});

export default router;