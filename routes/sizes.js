const express = require('express');
const router = express.Router();
const Size = require('../models/Size');

// Create a new size
router.post('/size', async (req, res) => {
  try {
    const { name } = req.body;
    const size = await  Size.create({ name });
    res.status(201).json(size);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred while creating a size.' });
  }
});

// Get size
router.get('/size', async (req, res) => {
  try {
    const sizes = await Size.findAll();
    
    res.json(sizes);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
);

module.exports = router;
