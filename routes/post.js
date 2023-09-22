import express from  'express';
const router = express.Router();
import Posts from  '../models/Posts.js';
import multer from  'multer';
import uploadImagesToS3 from  '../factory/s3services.js';
import Images from  '../models/PostImages.js';
import Brand from  '../models/Brand.js';
import Category from  '../models/Category.js';
import Subcategory from  '../models/Subcategory.js';
import NestedSubcategory from  '../models/NestedSubcategory.js';
import SubNestedSubcategory from  '../models/SubNestedSubcategory.js';
import Size from  '../models/Size.js';
import Colors from  '../models/Colors.js';
import Material from  '../models/Material.js';
import { Op } from  'sequelize';
import User from  '../models/User.js';

  // Configure multer for file uploads
  const storage = multer.memoryStorage(); // Store files in memory for further processing
  const upload = multer({ storage });

// Create a new post
router.post('/post', upload.array('images', 10), async (req, res) => {
  try {
    // Prepare images for uploading to S3
    const images = req.files.map((file, index) => {
      return {
        imageData: file.buffer,
        fileName: file.originalname,
      };
    });
    // Upload images to S3
    const uploadedImages = await uploadImagesToS3(images);
    
    const {userId, title,description,price,colorId, sizeId, materialId, parcel_size, brandId, condition, delivery_type, shipping, type, lat,lng, city,street, floor,state, categoryId, subcategoryId, nestedsubcategoryId, subnestedsubcategoryId } = req.body;
     // Check for missing required fields
     if (!userId || !title || !price || !categoryId || !city || !street || !lat || !lng || !brandId || !state) {
      return res.status(400).json({ error: 'All fields must be filled.' });
    }

    // Check if no images were uploaded
    if (uploadedImages.length === 0) {
      return res.status(400).json({ error: 'At least one image is required.' });
    }

     // Check if colorId is provided before using split
     const colorIds = colorId ? colorId.split(',').map(Number) : [];

     const materialIds = materialId ? materialId.split(',').map(Number) : [];

    const post = await  Posts.create({ userId,title,description,price,colorId:colorIds, sizeId, materialId:materialIds, parcel_size, brandId, condition, delivery_type, shipping, type, lat,lng, city,street, floor,state,categoryId, subcategoryId, nestedsubcategoryId, subnestedsubcategoryId });
   
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
    const { type } = req.query;
    const filters = {};

    if (type) {
      filters.type = type;
    }
    const posts = await Posts.findAll({
      where: filters,
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
      { model: User, as: 'user' },
    ], 
   
    });
    
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }
    post.views += 1;
    await post.save();
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

// Filter posts
router.get('/postsfilter', async (req, res) => {
  try {
    const {
      type,
      categoryId,
      subcategoryId,
      nestedsubcategoryId,
      subnestedsubcategoryId,
      brandId,
      colorId,
      materialId,
      sizeId,
      state,
      price,
      condition
    } = req.query;
    const filters = {};

    if (type) {
      filters.type = type;
    }

    if (categoryId) {
      filters.categoryId = categoryId;
    }

    if (subcategoryId) {
      filters.subcategoryId = subcategoryId;
    }

    if (nestedsubcategoryId) {
      filters.nestedsubcategoryId = nestedsubcategoryId;
    }

    if (subnestedsubcategoryId) {
      filters.subnestedsubcategoryId = subnestedsubcategoryId;
    }

    if (brandId) {
      filters.brandId = brandId;
    }

    if (sizeId) {
      filters.sizeId = sizeId;
    }
    
    if (state) {
      filters.state = state;
    }

    if (price) {
      filters.price = price;
    }

    if (condition) {
      filters.condition = condition;
    }

    const includeArray = [
      { model: Images, as: 'images' },
      { model: Brand, as: 'brand' },
      { model: Size, as: 'size', attributes: ['name'] },
      { model: Colors, as: 'colors', attributes: ['id', 'name'] },
      { model: Material, as: 'material', attributes: ['id', 'name'] },
      { model: Category, as: 'category' },
      { model: Subcategory, as: 'subcategory' },
      { model: NestedSubcategory, as: 'nestedsubcategory' },
      { model: SubNestedSubcategory, as: 'subnestedsubcategory' },
    ];

    // Conditionally include the 'colors' association if 'colorId' is provided
    if (colorId) {
      includeArray.push({
        model: Colors,
        as: 'colors',
        where: { id: { [Op.in]: colorId.split(',') } },
      });
    }
    if (materialId) {
      includeArray.push({
        model: Material, 
        as: 'material',
        where: { id: { [Op.in]: materialId.split(',') } },
      });
    }

    const filteredPosts = await Posts.findAll({
      where: filters,
      include: includeArray,
    });

    if (filteredPosts.length === 0) {
      return res.status(404).json({ message: 'No posts match the selected filters.' });
    }

    const postsWithS3Urls = filteredPosts.map((post) => {
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
        brand: undefined,
        colors: colors,
        material: materials,
        category: undefined,
        subcategory: undefined,
        nestedsubcategory: undefined,
        subnestedsubcategory: undefined,
      };
    });

    res.json(postsWithS3Urls);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Route to get the 5 posts with the highest views
router.get('/popular-posts', async (req, res) => {
  try {
    const { type } = req.query;
    const filters = {};

    if (type) {
      filters.type = type;
    }
    const highestViewsPosts = await Posts.findAll({
      where: filters,
      limit: 5, // Limit the result to 5 posts
      order: [['views', 'DESC']], // Order by views in descending order
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

    if (highestViewsPosts.length < 1) {
      return res.status(404).json({ error: 'No posts found' });
    }

    const postsWithS3Urls = highestViewsPosts.map(post => {
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
    res.status(500).json({ message: 'Server error' });
  }
});

// Get the 10 newest posts
router.get('/newest-posts', async (req, res) => {
  try {
    const { type } = req.query;
    const filters = {};

    if (type) {
      filters.type = type;
    }
    const newestPosts = await Posts.findAll({
      where: filters,
      limit: 10, // Limit the result to 10 posts
      order: [['createdAt', 'DESC']], // Order by creation date in descending order
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

    if (newestPosts.length < 1) {
      return res.status(404).json({ error: 'No posts found' });
    }

    const postsWithS3Urls = newestPosts.map(post => {
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
    res.status(500).json({ error: 'An error occurred while fetching the newest posts.' });
  }
});

export default router;
