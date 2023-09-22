import express  from 'express';
import Wishlist from '../models/Whislist.js';
import Posts from '../models/Posts.js';

import { Op }  from 'sequelize';
const router = express.Router();

router.post('/add', async (req, res) => {
    try {
      const { postId, userId } = req.body;
  
      // Check if the post is already in the wishlist
      const existingWishlistItem = await Wishlist.findOne({
        where: {
          postId,
          userId,
        },
      });
  
      if (existingWishlistItem) {
        return res.status(400).json({ error: 'This post is already in your wishlist.' });
      }
  
      // Create a new wishlist item
      const wishlistItem = await Wishlist.create({ postId, userId });
  
      res.status(201).json(wishlistItem);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'An error occurred while adding the post to the wishlist.' });
    }
  });

  router.get('/view/:userId', async (req, res) => {
    try {
      const userId = req.params.userId;
  
      // Find all posts in the user's wishlist
      const wishlistItems = await Wishlist.findAll({
        where: {
          userId,
        },
        include: [
          {
            model: Posts, // Include the associated post
            as: 'post',
          },
        ],
      });
  
      res.json(wishlistItems);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'An error occurred while retrieving the wishlist.' });
    }
  });


  router.delete('/remove/:id', async (req, res) => {
    try {
      const wishlistItemId = req.params.id;
  
      // Check if the wishlist item exists
      const wishlistItem = await Wishlist.findByPk(wishlistItemId);
  
      if (!wishlistItem) {
        return res.status(404).json({ error: 'Wishlist item not found.' });
      }
  
      // Delete the wishlist item
      await wishlistItem.destroy();
      return res.status(200).json({message: 'Post removed from whislist.'});
    //   res.status(204).send(); // Respond with a 204 No Content status
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'An error occurred while removing the post from the wishlist.' });
    }
  });
  
  export default router;