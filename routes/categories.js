const express = require('express');
const Category = require('../models/Category');
const Subcategory = require('../models/Subcategory');
const NestedSubcategory = require('../models/NestedSubcategory');
const SubNestedSubcategory = require('../models/SubNestedSubcategory');
const Brand = require('../models/Brand');

const router = express.Router();

// Create a new category
router.post('/brand', async (req, res) => {
  try {
    const { name } = req.body;
    const brand = await Brand.create({ name });
    res.status(201).json(brand);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred while creating a brand.' });
  }
});

// Get brand
router.get('/brand', async (req, res) => {
  try {
    const brands = await Brand.findAll();
    
    res.json(brands);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
);

// Create a new category
router.post('/categories', async (req, res) => {
  try {
    const { name } = req.body;
    const category = await Category.create({ name });
    res.status(201).json(category);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred while creating a category.' });
  }
});

// Create a new subcategory under a specific category
router.post('/subcategory', async (req, res) => {
  const { name, categoryId } = req.body;
  try {
    const subcategory = await Subcategory.create({ name, categoryId });
    res.status(201).json(subcategory);
  } catch (error) {
    res.status(500).json({ error: 'An error occurred while creating the brand.' });
  }
});

// Create a new nested subcategory under a specific category
router.post('/nestedsubcategory', async (req, res) => {
  const { name, subcategoryId } = req.body;
  try {
    const nestedsubcategory = await NestedSubcategory.create({ name, subcategoryId });
    res.status(201).json(nestedsubcategory);
  } catch (error) {
    res.status(500).json({ error: 'An error occurred while creating the brand.' });
  }
});

// Create a new sub nested subcategory under a specific category
router.post('/subnestedsubcategory', async (req, res) => {
  const { name, nestedsubcategoryId } = req.body;
  try {
    const subnestedsubcategory = await SubNestedSubcategory.create({ name, nestedsubcategoryId });
    res.status(201).json(subnestedsubcategory);
  } catch (error) {
    res.status(500).json({ error: 'An error occurred while creating the brand.' });
  }
});

// Get all categories with subcategories
router.get('/allcategories', async (req, res) => {
  try {
    const categories = await Category.findAll({
      include: [
        {
          model: Subcategory,
          as: 'Subcategory',
          include: [
            {
              model: NestedSubcategory,
              as: 'NestedSubcategory',
              include: [
                {
                  model: SubNestedSubcategory,
                  as: 'SubNestedSubcategory',
                }
              ]
            }
          ]
        }
      ],
    });
    
    res.json(categories);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
);

// Get category
router.get('/category', async (req, res) => {
  try {
    const categories = await Category.findAll();
    
    res.json(categories);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
);

// Get sub categories
router.get('/subcategory', async (req, res) => {
  try {
    const categories = await Subcategory.findAll();
    
    res.json(categories);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
);

// Get nested sub categories
router.get('/nestedsubcategory', async (req, res) => {
  try {
    const categories = await NestedSubcategory.findAll();
    
    res.json(categories);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
);

// Get sub nested sub categories
router.get('/subnestedsubcategory', async (req, res) => {
  try {
    const categories = await SubNestedSubcategory.findAll();
    
    res.json(categories);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
);

// Create a new category
// router.post('/categories', async (req, res) => {
//   try {
//     const { name, parentId } = req.body;
//     const category = await Category.create({ name, parentId });
//     res.status(201).json(category);
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ error: 'Server error' });
//   }
// });

// Create a new subcategory
// router.post('/subcategories', async (req, res) => {
//     try {
//       const { name, categoryId, parentSubcategoryId } = req.body;
  
//       // If parentSubcategoryId is provided, check if the parent subcategory exists
//       if (parentSubcategoryId) {
//         const parentSubcategory = await Subcategory.findOne({
//           where: { id: parentSubcategoryId, categoryId },
//         });
  
//         if (!parentSubcategory) {
//           return res.status(400).json({ error: 'Invalid parent subcategory.' });
//         }
//       }
  
//       // Create the subcategory
//       const subcategory = await Subcategory.create({
//         name,
//         categoryId,
//         parentSubcategoryId,
//       });
  
//       res.status(201).json(subcategory);
//     } catch (error) {
//       console.error(error);
//       res.status(500).json({ error: 'An error occurred while creating a subcategory.' });
//     }
//   });
  


// router.get('/allcategories', async (req, res) => {
//   try {
//     const categories = await Category.findAll({
//       include: {
//         model: Category,
//         as: 'subcategories',
//         include: {
//           model: Category,
//           as: 'subcategories',
//           include: {
//             model: Category,
//             as: 'subcategories',
//           },
//         },
//       },
//       where: { parentId: null }, // Retrieve top-level categories
//     });
//     res.status(200).json(categories);
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ error: 'Server error' });
//   }
// });

module.exports = router;
