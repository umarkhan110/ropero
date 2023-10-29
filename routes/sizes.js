import express from 'express';
import Size from '../models/Size.js';
import Colors from '../models/Colors.js';
const router = express.Router();

// Create a new size
router.post('/size', async (req, res) => {
  try {
    const { name, size_category } = req.body;
    const size = await  Size.create({ name, size_category });
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

// Create a new color
router.post('/addColor', async (req, res) => {
  try {
    const { name } = req.body;
    const color = await  Colors.create({ name });
    res.status(201).json(color);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred while creating a color.' });
  }
});

// View Color's
router.get('/viewColor', async (req, res) => {
  try {
    const color = await Colors.findAll();
    
    res.json(color);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
);
export default router;
