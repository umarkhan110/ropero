const express = require('express');
const router = express.Router();
const Posts = require('../models/Posts');

// Create a new size
router.post('/post', async (req, res) => {
  try {
    const { name, categoryId, subcategoryId, nestedsubcategoryId, subnestedsubcategoryId } = req.body;
    const post = await  Posts.create({ name,categoryId, subcategoryId, nestedsubcategoryId, subnestedsubcategoryId  });
    res.status(201).json(post);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred while creating a post.' });
  }
});

// Get post
router.get('/post', async (req, res) => {
  try {
    const posts = await Posts.findAll();
    
    res.json(posts);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
);

module.exports = router;
