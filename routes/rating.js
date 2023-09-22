import express from 'express';
import User from '../models/User.js';
import Rating from '../models/Rating.js';
const router = express.Router();

// Add a new rating to a user
router.post('/rate/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;
    const { rating, who_rated_me_id } = req.body;

    // Validate the rating (e.g., ensure it's within a valid range)

    // Check if the user has already rated the target user
    const existingRating = await Rating.findOne({
      where: {
        who_rated_me_id: who_rated_me_id, // The user who is rating
        userId: userId,     // The user being rated
      },
    });

    if (existingRating) {
      return res.status(400).json({ error: 'You have already rated this user.' });
    }

    // Find the user to rate
    const userToRate = await User.findByPk(userId);

    if (!userToRate) {
      return res.status(404).json({ error: 'User not found.' });
    }

    // Create a new rating record and associate it with the user
    const newRating = await userToRate.createRating({ rating, userId: who_rated_me_id });

    res.status(201).json(newRating);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred while adding the rating.' });
  }
});


  // Endpoint to get a user's average rating
router.get('/view-rating/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;

    // Query the database to find the user's ratings
    const ratings = await Rating.findAll({
      where: { userId },
    });

    // Calculate the average rating
    if (ratings.length > 0) {
      const totalRating = ratings.reduce((sum, rating) => sum + rating.rating, 0);
      const averageRating = totalRating / ratings.length;
      res.json({ averageRating });
    } else {
      res.json({ averageRating: 0 }); // No ratings yet, return 0
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

export default router;