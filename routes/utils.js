import express from 'express';
import Size from '../models/Size.js';
import Colors from '../models/Colors.js';
import Material from '../models/Material.js';
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

// Update Size by Id
router.put('/update-size/:id', async (req, res) => {
  try {
    const sizeId = req.params.id;
    const { name, size_category } = req.body;
    const size = await Size.findByPk(sizeId);

    if (!size) {
      return res.status(404).json({ message: 'Brand not found' });
    }
    size.name = name;
    size.size_category = size_category;
    await size.save();
    return res.json({ message: 'Size updated successfully' });
  } catch (error) {

    res.status(500).json({ error: error });
  }
});

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

// Update Color by Id
router.put('/update-color/:id', async (req, res) => {
  try {
    const colorId = req.params.id;
    const { name } = req.body;
    const color = await Colors.findByPk(colorId);

    if (!color) {
      return res.status(404).json({ message: 'Color not found' });
    }
    color.name = name;
    await color.save();
    return res.json({ message: 'Color updated successfully' });
  } catch (error) {

    res.status(500).json({ error: error });
  }
});

// Create a new Material
router.post('/addMaterial', async (req, res) => {
  try {
    const { name } = req.body;
    const material = await  Material.create({ name });
    res.status(201).json(material);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred while creating a material.' });
  }
});

// View Material
router.get('/viewMaterial', async (req, res) => {
  try {
    const material = await Material.findAll();
    
    res.json(material);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
);

// Update Material by Id
router.put('/update-material/:id', async (req, res) => {
  try {
    const materialId = req.params.id;
    const { name } = req.body;
    const material = await Material.findByPk(materialId);

    if (!material) {
      return res.status(404).json({ message: 'Brand not found' });
    }
    material.name = name;
    await material.save();
    return res.json({ message: 'Material updated successfully' });
  } catch (error) {

    res.status(500).json({ error: error });
  }
});

export default router;
