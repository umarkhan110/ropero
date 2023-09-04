const express = require('express');
const router = express.Router();
const Posts = require('../models/Posts');
const multer = require('multer');
const uploadImagesToS3 = require('../factory/s3services');
const Images = require('../models/PostImages');
const Brand = require('../models/Brand');
const Category = require('../models/Category');
const Subcategory = require('../models/Subcategory');
const NestedSubcategory = require('../models/NestedSubcategory');
const SubNestedSubcategory = require('../models/SubNestedSubcategory');
const Size = require('../models/Size');
const Colors = require('../models/Colors');
const Material = require('../models/Material');

  // Configure multer for file uploads
  const storage = multer.memoryStorage(); // Store files in memory for further processing
  const upload = multer({ storage });

// Create a new post
router.post('/post', upload.array('images', 5), async (req, res) => {
  try {
    // Prepare images for uploading to S3
    const images = req.files.map((file, index) => {
      return {
        imageData: file.buffer,
        fileName: file.originalname,
      };
    });
console.log(images)
    // Upload images to S3
    const uploadedImages = await uploadImagesToS3(images);
    
    const { title,description,price,colorId, sizeId, materialId, parcel_size, brandId, condition, delivery_type, shipping, type, lat,lng, city,street, floor, categoryId, subcategoryId, nestedsubcategoryId, subnestedsubcategoryId } = req.body;
     // Check for missing required fields
     if (!title || !price || !categoryId || !city || !street || !lat || !lng || !brandId) {
      return res.status(400).json({ error: 'All fields must be filled.' });
    }

    // Check if no images were uploaded
    if (uploadedImages.length === 0) {
      return res.status(400).json({ error: 'At least one image is required.' });
    }

     // Check if colorId is provided before using split
     const colorIds = colorId ? colorId.split(',').map(Number) : [];

     const materialIds = materialId ? materialId.split(',').map(Number) : [];

    const post = await  Posts.create({ title,description,price,colorId:colorIds, sizeId, materialId:materialIds, parcel_size, brandId, condition, delivery_type, shipping, type, lat,lng, city,street, floor,categoryId, subcategoryId, nestedsubcategoryId, subnestedsubcategoryId });
   
        // Associate colors with the post
        await post.setColors(colorIds);
        await post.setMaterial(materialIds);
        
    // Create Images records and associate with the post
    for (const imageName of uploadedImages) {
      await Images.create({
        postId: post.id,
        imageUrl: imageName,
      });
    }

    res.status(201).json(post);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred while creating a post.' });
  }
});

// Get post
router.get('/post', async (req, res) => {
  try {
    const posts = await Posts.findAll({
      include: [{ model: Images, as: 'images' },
      { model: Brand, as: 'brand' },
      { model: Size, as: 'size', attributes: ['name']},
      { model: Colors, as: 'colors', attributes: ['id', 'name']  },
      { model: Material, as: 'material', attributes: ['id', 'name']  },
      { model: Category, as: 'category' },
      { model: Subcategory, as: 'subcategory' },
      { model: NestedSubcategory, as: 'nestedsubcategory' },
      { model: SubNestedSubcategory, as: 'subnestedsubcategory' },
    ], 
   
    });
    
        // Map the posts to add S3 URLs to each image
        const postsWithS3Urls = posts.map(post => {
          const postJson = post.toJSON();
          postJson.images = postJson.images.map(image => {
            return {
              ...image,
              imageUrl: `https://ropero.s3.sa-east-1.amazonaws.com/${image.imageUrl}`,
            };
          });
          const colors = postJson.colors.map(color => ({
            id: color.id,
            name: color.name,
          }));
          const materials = postJson.material.map(material => ({
            id: material.id,
            name: material.name,
          }));
          return {
            ...postJson,
            brandName: postJson.brand.name,
            categoryName: postJson.category.name,
            subcategoryName: postJson.subcategory.name,
            nestedsubcategoryName: postJson.nestedsubcategory.name,
            subnestedsubcategoryName: postJson.subnestedsubcategory.name,
            brand: undefined, // Add brand name to the response
            colors: colors,
            material: materials,
            category: undefined,
            subcategory: undefined,
            nestedsubcategory: undefined,
            subnestedsubcategory: undefined,
          };
          // return postJson;
        });
    
        res.json(postsWithS3Urls);
    
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
);

// Get post by Id
router.get('/viewpost/:id', async (req, res) => {
  try {
    const postId = req.params.id;
    const post = await Posts.findByPk(postId,{
      include: [{ model: Images, as: 'images' },
      { model: Brand, as: 'brand' },
      { model: Size, as: 'size', attributes: ['name']},
      { model: Colors, as: 'colors', attributes: ['id', 'name']  },
      { model: Material, as: 'material', attributes: ['id', 'name']  },
      { model: Category, as: 'category' },
      { model: Subcategory, as: 'subcategory' },
      { model: NestedSubcategory, as: 'nestedsubcategory' },
      { model: SubNestedSubcategory, as: 'subnestedsubcategory' },
    ], 
   
    });
    
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

          const postJson = post.toJSON();
          postJson.images = postJson.images.map(image => {
            return {
              ...image,
              imageUrl: `https://ropero.s3.sa-east-1.amazonaws.com/${image.imageUrl}`,
            };
          });
          const colors = postJson.colors.map(color => ({
            id: color.id,
            name: color.name,
          }));
          const materials = postJson.material.map(material => ({
            id: material.id,
            name: material.name,
          }));

	    
          const posts = await Posts.findAll({
            where: {
              '$nestedsubcategory.id$': postJson.nestedsubcategoryId,
              '$subnestedsubcategory.id$': postJson.subnestedsubcategoryId,
            },
            include: [
              { model: Images, as: 'images' },
              { model: Brand, as: 'brand' },
              { model: Size, as: 'size', attributes: ['name'] },
              { model: Colors, as: 'colors', attributes: ['id', 'name'] },
              { model: Material, as: 'material', attributes: ['id', 'name'] },
              { model: Category, as: 'category' },
              { model: Subcategory, as: 'subcategory' },
              { model: NestedSubcategory, as: 'nestedsubcategory' },
              { model: SubNestedSubcategory, as: 'subnestedsubcategory' },
            ],
          });
          
          const postsresponse = posts.map((post) => {
            const postJson = post.toJSON();
            postJson.images = postJson.images.map((image) => ({
              ...image,
              imageUrl: `https://ropero.s3.sa-east-1.amazonaws.com/${image.imageUrl}`,
            }));
            const colors = postJson.colors.map((color) => ({
              id: color.id,
              name: color.name,
            }));
            const materials = postJson.material.map((material) => ({
              id: material.id,
              name: material.name,
            }));
      
            return {
              ...postJson,
              brandName: postJson.brand.name,
              categoryName: postJson.category.name,
              subcategoryName: postJson.subcategory.name,
              nestedsubcategoryName: postJson.nestedsubcategory.name,
              subnestedsubcategoryName: postJson.subnestedsubcategory.name,
              brand: undefined, // Add brand name to the response
              colors,
              material: materials,
              category: undefined,
              subcategory: undefined,
              nestedsubcategory: undefined,
              subnestedsubcategory: undefined,
            };
          });

          const response = {
            ...postJson,
            brandName: postJson.brand.name,
            categoryName: postJson.category.name,
            subcategoryName: postJson.subcategory.name,
            nestedsubcategoryName: postJson.nestedsubcategory.name,
            subnestedsubcategoryName: postJson.subnestedsubcategory.name,
            brand: undefined, // Add brand name to the response
            colors: colors,
            material: materials,
            category: undefined,
            subcategory: undefined,
            nestedsubcategory: undefined,
            subnestedsubcategory: undefined,
           relatedpost:[...postsresponse]
          };
          
    
        res.json(response);
    
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
);

// Delete post by ID
router.delete('/deletepost/:id', async (req, res) => {
  try {
    const postId = req.params.id;
    const post = await Posts.findByPk(postId);

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    // Delete the post
    await post.destroy();

    return res.status(200).json({message: 'Post removed successfully.'});
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = router;
