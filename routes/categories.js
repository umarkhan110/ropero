import express from 'express';
import Category from '../models/Category.js';
import Subcategory from '../models/Subcategory.js';
import NestedSubcategory from '../models/NestedSubcategory.js';
import SubNestedSubcategory from '../models/SubNestedSubcategory.js';
import Brand from '../models/Brand.js';

const router = express.Router();

// Create a new brand
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

// Update Brand by Id
router.put('/update-brand/:id', async (req, res) => {
  try {
    const brandId = req.params.id;
    const { name } = req.body;
    const brand = await Brand.findByPk(brandId);

    if (!brand) {
      return res.status(404).json({ message: 'Brand not found' });
    }
    brand.name = name;
    await brand.save();
    return res.json({ message: 'Brand updated successfully' });

    res.status(201).json(brand);
  } catch (error) {

    res.status(500).json({ error: error });
  }
});

// Delete Brand by ID
router.delete("/delete-brand/:id", async (req, res) => {
  try {
    const brandId = req.params.id;
    const brand = await Brand.findByPk(brandId);

    if (!brand) {
      return res.status(404).json({ error: "Brand not found" });
    }

    // Delete the brand
    await brand.destroy();

    return res.status(200).json({ message: "Brand removed successfully." });
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

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

// Update a category, subcategory, nested subcategory, or sub-nested subcategory
router.put('/update-categories/:id', async (req, res) => {
  const { type, name } = req.body;
  const id = req.params.id;
  try {
    switch (type) {
      case 'category':
        const category = await Category.findByPk(id);
        if (!category) {
          return res.status(404).json({ message: 'Category not found' });
        }
        category.name = name;
        await category.save();
        return res.json({ message: 'Category updated successfully' });
        break;
      case 'subcategory':
        const subCategory = await Subcategory.findByPk(id);
        if (!subCategory) {
          return res.status(404).json({ message: 'SubCategory not found' });
        }
        subCategory.name = name;
        await subCategory.save();
        return res.json({ message: 'SubCategory updated successfully' });
        break;
      case 'nestedsubcategory':
        const nestedsubcategory = await NestedSubcategory.findByPk(id);
        if (!nestedsubcategory) {
          return res.status(404).json({ message: 'nestedsubcategory not found' });
        }
        nestedsubcategory.name = name;
        await nestedsubcategory.save();
        return res.json({ message: 'Nestedsubcategory updated successfully' });
        break;
      case 'subnestedsubcategory':
        const subnestedsubcategory = await SubNestedSubcategory.findByPk(id);
        if (!subnestedsubcategory) {
          return res.status(404).json({ message: 'Subnestedsubcategory not found' });
        }
        subnestedsubcategory.name = name;
        await subnestedsubcategory.save();
        return res.json({ message: 'Subnestedsubcategory updated successfully' });
        break;
      default:
        res.status(400).json({ error: 'Invalid type specified in the request.' });
        break;
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred while updating the categories.' });
  }
});

// Route to delete a category and its related entities
router.delete('/delete-categories/:id', async (req, res) => {
  const id = req.params.id;
  const { type } = req.body;
  try {
    // Find the main category by ID, including its related subcategories
    switch (type) {
      case 'category':
        const category = await Category.findByPk(id, {
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
                    },
                  ],
                },
              ],
            },
          ],
        });
    
        if (!category) {
          return res.status(404).json({ message: 'Category not found' });
        }
        // Delete the main category and its related entities will be deleted due to associations
        await category.destroy({ cascade: true });
    
        res.json({ message: 'Category and its related entities deleted successfully' });
        break;
      case 'subcategory':
        const subCategory = await Subcategory.findByPk(id, {
          include: [
            {
                  model: NestedSubcategory,
                  as: 'NestedSubcategory',
                  include: [
                    {
                      model: SubNestedSubcategory,
                      as: 'SubNestedSubcategory',
                    },
                  ],
                },
              ],
        });
    
        if (!subCategory) {
          return res.status(404).json({ message: 'SubCategory not found' });
        }
        // Delete the main subCategory and its related entities will be deleted due to associations
        await subCategory.destroy({ cascade: true });
    
        res.json({ message: 'SubCategory and its related entities deleted successfully' });
        break;
      case 'nestedsubcategory':
        const nestedsubCategory = await NestedSubcategory.findByPk(id, {
          include: [
            {
              model: SubNestedSubcategory,
              as: 'SubNestedSubcategory',
            },
              ],
        });
    
        if (!nestedsubCategory) {
          return res.status(404).json({ message: 'NestedsubCategory not found' });
        }
        // Delete the main nestedsubCategory and its related entities will be deleted due to associations
        await nestedsubCategory.destroy({ cascade: true });
    
        res.json({ message: 'NestedsubCategory and its related entities deleted successfully' });
        break;
      case 'subnestedsubcategory':
        const subnestedsubCategory = await SubNestedSubcategory.findByPk(id);
    
        if (!subnestedsubCategory) {
          return res.status(404).json({ message: 'NestedsubCategory not found' });
        }
        // Delete the main subnestedsubCategory and its related entities will be deleted due to associations
        await subnestedsubCategory.destroy({ cascade: true });
    
        res.json({ message: 'SubnestedsubCategory deleted successfully' });
        break;
      default:
        res.status(400).json({ error: 'Invalid type specified in the request.' });
        break;
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred while deleting the category and its related entities' });
  }
});

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

export default router;
