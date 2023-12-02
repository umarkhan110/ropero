import express from "express";
const router = express.Router();
import Posts from "../models/Posts.js";
import multer from "multer";
import uploadImagesToS3 from "../factory/s3services.js";
import Images from "../models/PostImages.js";
import Brand from "../models/Brand.js";
import Category from "../models/Category.js";
import Subcategory from "../models/Subcategory.js";
import NestedSubcategory from "../models/NestedSubcategory.js";
import SubNestedSubcategory from "../models/SubNestedSubcategory.js";
import Size from "../models/Size.js";
import Colors from "../models/Colors.js";
import Material from "../models/Material.js";
import { Op, Sequelize } from "sequelize";
import User from "../models/User.js";
import checkUserAuthentication from "../middleware/authMiddleware.js";
// Configure multer for file uploads
const storage = multer.memoryStorage(); // Store files in memory for further processing
const upload = multer({ storage });

// Create a new post
router.post(
  "/post",
  checkUserAuthentication,
  upload.array("images", 10),
  async (req, res) => {
    try {
      if (req.user.no_of_posts > 5) {
        if (req.user.credits > 1) {
          // Prepare images for uploading to S3
          console.log("req:", req.files);
          const images = req.files.map((file, index) => {
            return {
              imageData: file.buffer,
              fileName: file.originalname,
            };
          });
          // Upload images to S3
          const uploadedImages = await uploadImagesToS3(images);

          const {
            userId,
            title,
            description,
            price,
            discount_price,
            colorId,
            sizeId,
            materialId,
            parcel_size,
            brandId,
            condition,
            delivery_type,
            shipping,
            type,
            lat,
            lng,
            city,
            street,
            floor,
            state,
            categoryId,
            subcategoryId,
            nestedsubcategoryId,
            subnestedsubcategoryId,
            address,
          } = req.body;
          // Check for missing required fields
          if (
            !userId ||
            !title ||
            !price ||
            !categoryId ||
            !city ||
            !street ||
            !lat ||
            !lng ||
            !brandId ||
            !state
          ) {
            return res
              .status(400)
              .json({ error: "All fields must be filled." });
          }

          // Check if no images were uploaded
          if (uploadedImages.length === 0) {
            return res
              .status(400)
              .json({ error: "At least one image is required." });
          }

          // Check if colorId is provided before using split
          const colorIds = colorId ? colorId.split(",").map(Number) : [];

          const materialIds = materialId
            ? materialId.split(",").map(Number)
            : [];

          const post = await Posts.create({
            userId,
            title,
            description,
            price,
            discount_price,
            colorId: colorIds,
            sizeId,
            materialId: materialIds,
            parcel_size,
            brandId,
            condition,
            delivery_type,
            shipping,
            type,
            lat,
            lng,
            city,
            street,
            floor,
            state,
            categoryId,
            subcategoryId,
            nestedsubcategoryId,
            subnestedsubcategoryId,
            address,
          });

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

          const user = req.user;
          user.credits = user.credits - 2;
          user.no_of_posts = user.no_of_posts + 1;
          await user.save();
          res.status(201).json(post);
        } else {
          return res.status(400).json({ message: "You do not have credit" });
        }
      } else {
        // Prepare images for uploading to S3
        const images = req.files.map((file, index) => {
          return {
            imageData: file.buffer,
            fileName: file.originalname,
          };
        });
        // Upload images to S3
        const uploadedImages = await uploadImagesToS3(images);

        const {
          userId,
          title,
          description,
          price,
          discount_price,
          colorId,
          sizeId,
          materialId,
          parcel_size,
          brandId,
          condition,
          delivery_type,
          shipping,
          type,
          lat,
          lng,
          city,
          street,
          floor,
          state,
          categoryId,
          subcategoryId,
          nestedsubcategoryId,
          subnestedsubcategoryId,
          address,
        } = req.body;
        // Check for missing required fields
        if (
          !userId ||
          !title ||
          !price ||
          !categoryId ||
          !city ||
          !street ||
          !lat ||
          !lng ||
          !brandId ||
          !state
        ) {
          return res.status(400).json({ error: "All fields must be filled." });
        }

        // Check if no images were uploaded
        if (uploadedImages.length === 0) {
          return res
            .status(400)
            .json({ error: "At least one image is required." });
        }

        // Check if colorId is provided before using split
        const colorIds = colorId ? colorId.split(",").map(Number) : [];

        const materialIds = materialId ? materialId.split(",").map(Number) : [];

        const post = await Posts.create({
          userId,
          title,
          description,
          price,
          discount_price,
          colorId: colorIds,
          sizeId,
          materialId: materialIds,
          parcel_size,
          brandId,
          condition,
          delivery_type,
          shipping,
          type,
          lat,
          lng,
          city,
          street,
          floor,
          state,
          categoryId,
          subcategoryId,
          nestedsubcategoryId,
          subnestedsubcategoryId,
          address,
        });

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

        const user = req.user;
        // user.credits = user.credits - 1;
        user.no_of_posts = user.no_of_posts + 1;
        await user.save();
        res.status(201).json(post);
      }
    } catch (error) {
      console.error(error);
      res
        .status(500)
        .json({ error: "An error occurred while creating a post." });
    }
  }
);

// Get post
router.get("/post", async (req, res) => {
  try {
    const { type } = req.query;
    const filters = {};

    if (type) {
      filters.type = type;
    }
    filters.is_Approved = true;
    const posts = await Posts.findAll({
      where: filters,
      include: [
        { model: Images, as: "images" },
        { model: Brand, as: "brand" },
        { model: Size, as: "size", attributes: ["name"] },
        { model: Colors, as: "colors", attributes: ["id", "name"] },
        { model: Material, as: "material", attributes: ["id", "name"] },
        { model: Category, as: "category" },
        { model: Subcategory, as: "subcategory" },
        { model: NestedSubcategory, as: "nestedsubcategory" },
        { model: SubNestedSubcategory, as: "subnestedsubcategory" },
        {
          model: User,
          as: "user",
          attributes: ["id", "username", "profileImage"],
        },
      ],
    });

    // Map the posts to add S3 URLs to each image
    const postsWithS3Urls = posts.map((post) => {
      const postJson = post.toJSON();
      // postJson.images = postJson.images.map((image) => {
      //   return {
      //     ...image,
      //     imageUrl: `https://ropero.s3.sa-east-1.amazonaws.com/${image.imageUrl}`,
      //   };
      // });
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
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Get post by admin
router.get("/get-all-post-by-admin", async (req, res) => {
  try {
    let { page = 1, pageSize = 10, search } = req.query;

    // Ensure that pageSize is a numeric value
    pageSize = parseInt(pageSize, 10);

    const offset = (page - 1) * pageSize;
    const whereClause = {
      // Add search functionality
      [Op.or]: [
        // Customize this list to include relevant fields you want to search in
        { title: { [Op.like]: `%${search}%` } },
        // Add more fields as needed
      ],
    };
    const total = await Posts.count();
    const posts = await Posts.findAndCountAll({
      where: whereClause,
      include: [
        { model: Images, as: "images" },
        { model: Brand, as: "brand" },
        { model: Size, as: "size", attributes: ["name"] },
        { model: Colors, as: "colors", attributes: ["id", "name"] },
        { model: Material, as: "material", attributes: ["id", "name"] },
        { model: Category, as: "category" },
        { model: Subcategory, as: "subcategory" },
        { model: NestedSubcategory, as: "nestedsubcategory" },
        { model: SubNestedSubcategory, as: "subnestedsubcategory" },
        { model: User, as: "user", attributes: ["id", "username", "email"] },
      ],
      offset,
      limit: pageSize,
    });

    // Map the posts to add S3 URLs to each image
    const postsWithS3Urls = posts.rows.map((post) => {
      const postJson = post.toJSON();
      // postJson.images = postJson.images.map((image) => {
      //   return {
      //     ...image,
      //     imageUrl: `https://ropero.s3.sa-east-1.amazonaws.com/${image.imageUrl}`,
      //   };
      // });
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
        colors: colors,
        material: materials,
        category: undefined,
        subcategory: undefined,
        nestedsubcategory: undefined,
        subnestedsubcategory: undefined,
      };
      // return postJson;
    });

    res.json({
      total,
      page,
      pageSize,
      postsWithS3Urls,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Get post by Id
router.get("/viewpost/:id", async (req, res) => {
  try {
    const postId = req.params.id;
    const post = await Posts.findByPk(postId, {
      include: [
        { model: Images, as: "images" },
        { model: Brand, as: "brand" },
        { model: Size, as: "size", attributes: ["name"] },
        { model: Colors, as: "colors", attributes: ["id", "name"] },
        { model: Material, as: "material", attributes: ["id", "name"] },
        { model: Category, as: "category" },
        { model: Subcategory, as: "subcategory" },
        { model: NestedSubcategory, as: "nestedsubcategory" },
        { model: SubNestedSubcategory, as: "subnestedsubcategory" },
        {
          model: User,
          as: "user",
          attributes: ["id", "username", "profileImage"],
        },
      ],
    });

    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }
    post.views += 1;
    await post.save();
    const postJson = post.toJSON();
    // postJson.images = postJson.images.map((image) => {
    //   return {
    //     ...image,
    //     imageUrl: `https://ropero.s3.sa-east-1.amazonaws.com/${image.imageUrl}`,
    //   };
    // });
    const colors = postJson.colors.map((color) => ({
      id: color.id,
      name: color.name,
    }));
    const materials = postJson.material.map((material) => ({
      id: material.id,
      name: material.name,
    }));

    const posts = await Posts.findAll({
      where: {
        "$nestedsubcategory.id$": postJson.nestedsubcategoryId,
        "$subnestedsubcategory.id$": postJson.subnestedsubcategoryId,
        id: {
          [Op.not]: post.id, // Exclude the current post by ID
        },
      },
      include: [
        { model: Images, as: "images" },
        { model: Brand, as: "brand" },
        { model: Size, as: "size", attributes: ["name"] },
        { model: Colors, as: "colors", attributes: ["id", "name"] },
        { model: Material, as: "material", attributes: ["id", "name"] },
        { model: Category, as: "category" },
        { model: Subcategory, as: "subcategory" },
        { model: NestedSubcategory, as: "nestedsubcategory" },
        { model: SubNestedSubcategory, as: "subnestedsubcategory" },
        {
          model: User,
          as: "user",
          attributes: ["id", "username", "profileImage"],
        },
      ],
    });

    const postsresponse = posts.map((post) => {
      const postJson = post.toJSON();
      // postJson.images = postJson.images.map((image) => ({
      //   ...image,
      //   imageUrl: `https://ropero.s3.sa-east-1.amazonaws.com/${image.imageUrl}`,
      // }));
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
      relatedpost: [...postsresponse],
    };

    res.json(response);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Update Post by Id
router.put("/update-post/:id", upload.array("images", 10), async (req, res) => {
  try {
    // const user = req.user;
    const postId = req.params.id;
    const postExist = await Posts.findByPk(postId);

    if (!postExist) {
      return res.status(404).json({ error: "Post not found" });
    }
    // Prepare images for uploading to S3
    const images = req?.files.map((file, index) => {
      return {
        imageData: file.buffer,
        fileName: file.originalname,
      };
    });
    // Upload images to S3
    const uploadedImages = await uploadImagesToS3(images);

    const {
      title,
      description,
      price,
      discount_price,
      colorId,
      sizeId,
      materialId,
      parcel_size,
      brandId,
      condition,
      delivery_type,
      shipping,
      type,
      lat,
      lng,
      city,
      street,
      floor,
      state,
      categoryId,
      subcategoryId,
      nestedsubcategoryId,
      subnestedsubcategoryId,
      address,
      deletedImages,
    } = req.body;

    const colorIds = colorId
      ? colorId.split(",").map(Number)
      : postExist.colorId;

    const materialIds = materialId
      ? materialId.split(",").map(Number)
      : postExist.materialId;

    // const post = await  Posts.update({
    // (postExist.userId = user.id),
    (postExist.title = title ? title : postExist.title),
      (postExist.address = address ? address : postExist.address),
      (postExist.description = description
        ? description
        : postExist.description),
      (postExist.price = price ? price : postExist.price),
      (postExist.discount_price = discount_price
        ? discount_price
        : postExist.discount_price),
      (postExist.colorId = colorIds),
      (postExist.sizeId = sizeId ? sizeId : postExist.sizeId),
      (postExist.materialId = materialIds),
      (postExist.parcel_size = parcel_size
        ? parcel_size
        : postExist.parcel_size),
      (postExist.brandId = brandId ? brandId : postExist.brandId),
      (postExist.condition = condition ? condition : postExist.condition),
      (postExist.delivery_type = delivery_type
        ? delivery_type
        : postExist.delivery_type),
      (postExist.shipping = shipping ? shipping : postExist.shipping),
      (postExist.type = type ? type : postExist.type),
      (postExist.lat = lat ? lat : postExist.lat),
      (postExist.lng = lng ? lng : postExist.lng),
      (postExist.city = city ? city : postExist.city),
      (postExist.street = street ? street : postExist.street),
      (postExist.floor = floor ? floor : postExist.floor),
      (postExist.state = state ? state : postExist.state),
      (postExist.categoryId = categoryId ? categoryId : postExist.categoryId),
      (postExist.subcategoryId = subcategoryId
        ? subcategoryId
        : postExist.subcategoryId),
      (postExist.nestedsubcategoryId = nestedsubcategoryId
        ? nestedsubcategoryId
        : postExist.nestedsubcategoryId),
      (postExist.subnestedsubcategoryId = subnestedsubcategoryId
        ? subnestedsubcategoryId
        : postExist.subnestedsubcategoryId);
    //  });
    await postExist.save();
    // Associate colors with the post
    await postExist.setColors(colorIds);
    await postExist.setMaterial(materialIds);
    const deletedImagesArray = deletedImages.split(",").map(Number);
    if (Array.isArray(deletedImagesArray) && deletedImagesArray.length > 0) {
      await Images.destroy({
        where: {
          postId: postExist.id,
          id: { [Sequelize.Op.in]: deletedImagesArray },
        },
      });
    }
    // Create Images records and associate with the post
    for (const imageName of uploadedImages) {
      await Images.create({
        postId: postId,
        imageUrl: imageName,
      });
    }
    return res.json({ postExist, message: "Post updated successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error });
  }
});

// Feature Post by Id
router.put("/feature-post/:id", checkUserAuthentication, async (req, res) => {
  try {
    const user = req.user;
    if (user) {
      if (req.user.credits < 5) {
        return res.status(404).json({ error: "You don't have enough credits" });
      }
      const postId = req.params.id;
      const postExist = await Posts.findByPk(postId);

      if (!postExist) {
        return res.status(404).json({ error: "Post not found" });
      }

      if (postExist.featured === true) {
        return res.status(404).json({ error: "Post is already featured" });
      }

      // Set the featuredExpiry date to one day from the current date
      const oneDayInMilliseconds = 24 * 60 * 60 * 1000 * 14;
      const currentDateTime = new Date();
      const featuredExpiryDate = new Date(
        currentDateTime.getTime() + oneDayInMilliseconds
      );
      postExist.featured = true;
      postExist.featuredExpiry = featuredExpiryDate;

      await postExist.save();
      return res.json({ postExist, message: "Post featured successfully" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "An error occurred while creating a post." });
  }
});

// Reserve a post by Id
router.put("/reserve-post/:id", checkUserAuthentication, async (req, res) => {
  try {
    const user = req.user;
    if (req.user.credits < 5) {
      return res.status(404).json({ error: "You don't have enough credits" });
    }
    const postId = req.params.id;
    const postExist = await Posts.findByPk(postId);

    if (!postExist) {
      return res.status(404).json({ error: "Post not found" });
    }

    if (postExist.reserved === true) {
      return res.status(404).json({ error: "Post is already reserved" });
    }

    // Set the reservedExpiry date to one day from the current date
    const oneDayInMilliseconds = 24 * 60 * 60 * 1000;
    const currentDateTime = new Date();
    const reservedExpiryDate = new Date(
      currentDateTime.getTime() + oneDayInMilliseconds
    );

    postExist.reserved = true;
    postExist.reservedExpiry = reservedExpiryDate;

    await postExist.save();
    return res.json({ postExist, message: "Post reserved successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "An error occurred while creating a post." });
  }
});

// Get all posts of user
router.get("/users-posts", checkUserAuthentication, async (req, res) => {
  try {
    const userId = req.user.id;
    const filters = {};
    filters.is_Approved = true;
    filters.userId = userId;
    const posts = await Posts.findAll({
      where: filters,
      include: [
        { model: Images, as: "images" },
        { model: Brand, as: "brand" },
        { model: Size, as: "size", attributes: ["name"] },
        { model: Colors, as: "colors", attributes: ["id", "name"] },
        { model: Material, as: "material", attributes: ["id", "name"] },
        { model: Category, as: "category" },
        { model: Subcategory, as: "subcategory" },
        { model: NestedSubcategory, as: "nestedsubcategory" },
        { model: SubNestedSubcategory, as: "subnestedsubcategory" },
        {
          model: User,
          as: "user",
          attributes: ["id", "username", "profileImage"],
        },
      ],
    });

    // Map the posts to add S3 URLs to each image
    const postsWithS3Urls = posts.map((post) => {
      const postJson = post.toJSON();
      // postJson.images = postJson.images.map((image) => {
      //   return {
      //     ...image,
      //     imageUrl: `https://ropero.s3.sa-east-1.amazonaws.com/${image.imageUrl}`,
      //   };
      // });
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
    res.status(500).json({ message: "Server Error" });
  }
});

// Get all featured posts
router.get("/featured-posts", checkUserAuthentication, async (req, res) => {
  try {
    const userId = req.user.id;
    const filters = {};
    filters.is_Approved = true;
    filters.userId = userId;
    filters.featured = true;
    // Find all posts with feature = true for the given userId
    const posts = await Posts.findAll({
      where: filters,
      include: [
        { model: Images, as: "images" },
        { model: Brand, as: "brand" },
        { model: Size, as: "size", attributes: ["name"] },
        { model: Colors, as: "colors", attributes: ["id", "name"] },
        { model: Material, as: "material", attributes: ["id", "name"] },
        { model: Category, as: "category" },
        { model: Subcategory, as: "subcategory" },
        { model: NestedSubcategory, as: "nestedsubcategory" },
        { model: SubNestedSubcategory, as: "subnestedsubcategory" },
        {
          model: User,
          as: "user",
          attributes: ["id", "username", "profileImage"],
        },
      ],
    });

    // Map the posts to add S3 URLs to each image
    const postsWithS3Urls = posts.map((post) => {
      const postJson = post.toJSON();
      // postJson.images = postJson.images.map((image) => {
      //   return {
      //     ...image,
      //     imageUrl: `https://ropero.s3.sa-east-1.amazonaws.com/${image.imageUrl}`,
      //   };
      // });
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
    res.status(500).json({ message: "Server Error" });
  }
});

// Get all reserved posts
router.get("/reserved-posts", checkUserAuthentication, async (req, res) => {
  try {
    const userId = req.user.id;
    const filters = {};
    filters.is_Approved = true;
    filters.userId = userId;
    filters.reserved = true;
    // Find all posts with feature = true for the given userId
    const posts = await Posts.findAll({
      where: filters,
      include: [
        { model: Images, as: "images" },
        { model: Brand, as: "brand" },
        { model: Size, as: "size", attributes: ["name"] },
        { model: Colors, as: "colors", attributes: ["id", "name"] },
        { model: Material, as: "material", attributes: ["id", "name"] },
        { model: Category, as: "category" },
        { model: Subcategory, as: "subcategory" },
        { model: NestedSubcategory, as: "nestedsubcategory" },
        { model: SubNestedSubcategory, as: "subnestedsubcategory" },
        {
          model: User,
          as: "user",
          attributes: ["id", "username", "profileImage"],
        },
      ],
    });

    // Map the posts to add S3 URLs to each image
    const postsWithS3Urls = posts.map((post) => {
      const postJson = post.toJSON();
      // postJson.images = postJson.images.map((image) => {
      //   return {
      //     ...image,
      //     imageUrl: `https://ropero.s3.sa-east-1.amazonaws.com/${image.imageUrl}`,
      //   };
      // });
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
    res.status(500).json({ message: "Server Error" });
  }
});

// Delete post by ID
router.delete("/deletepost/:id", async (req, res) => {
  try {
    const postId = req.params.id;
    const post = await Posts.findByPk(postId);

    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    // Delete the post
    await post.destroy();

    return res.status(200).json({ message: "Post removed successfully." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Filter posts
router.get("/postsfilter", async (req, res) => {
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
      condition,
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
    filters.is_Approved = true;
    const includeArray = [
      { model: Images, as: "images" },
      { model: Brand, as: "brand" },
      { model: Size, as: "size", attributes: ["name"] },
      { model: Colors, as: "colors", attributes: ["id", "name"] },
      { model: Material, as: "material", attributes: ["id", "name"] },
      { model: Category, as: "category" },
      { model: Subcategory, as: "subcategory" },
      { model: NestedSubcategory, as: "nestedsubcategory" },
      { model: SubNestedSubcategory, as: "subnestedsubcategory" },
      {
        model: User,
        as: "user",
        attributes: ["id", "username", "profileImage"],
      },
    ];

    // Conditionally include the 'colors' association if 'colorId' is provided
    if (colorId) {
      includeArray.push({
        model: Colors,
        as: "colors",
        where: { id: { [Op.in]: colorId.split(",") } },
      });
    }
    if (materialId) {
      includeArray.push({
        model: Material,
        as: "material",
        where: { id: { [Op.in]: materialId.split(",") } },
      });
    }

    const filteredPosts = await Posts.findAll({
      where: filters,
      include: includeArray,
    });

    if (filteredPosts.length === 0) {
      return res
        .status(404)
        .json({ message: "No posts match the selected filters." });
    }

    const postsWithS3Urls = filteredPosts.map((post) => {
      const postJson = post.toJSON();
      // postJson.images = postJson.images.map((image) => ({
      //   ...image,
      //   imageUrl: `https://ropero.s3.sa-east-1.amazonaws.com/${image.imageUrl}`,
      // }));
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
    // console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Route to get the 5 posts with the highest views
router.get("/popular-posts", async (req, res) => {
  try {
    const { type } = req.query;
    const filters = {};

    if (type) {
      filters.type = type;
    }
    filters.is_Approved = true;
    const highestViewsPosts = await Posts.findAll({
      where: filters,
      limit: 5, // Limit the result to 5 posts
      order: [["views", "DESC"]], // Order by views in descending order
      include: [
        { model: Images, as: "images" },
        { model: Brand, as: "brand" },
        { model: Size, as: "size", attributes: ["name"] },
        { model: Colors, as: "colors", attributes: ["id", "name"] },
        { model: Material, as: "material", attributes: ["id", "name"] },
        { model: Category, as: "category" },
        { model: Subcategory, as: "subcategory" },
        { model: NestedSubcategory, as: "nestedsubcategory" },
        { model: SubNestedSubcategory, as: "subnestedsubcategory" },
        {
          model: User,
          as: "user",
          attributes: ["id", "username", "profileImage"],
        },
      ],
    });

    if (highestViewsPosts.length < 1) {
      return res.status(404).json({ error: "No posts found" });
    }

    const postsWithS3Urls = highestViewsPosts.map((post) => {
      const postJson = post.toJSON();
      // postJson.images = postJson.images.map((image) => {
      //   return {
      //     ...image,
      //     imageUrl: `https://ropero.s3.sa-east-1.amazonaws.com/${image.imageUrl}`,
      //   };
      // });
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
    res.status(500).json({ message: "Server error" });
  }
});

// Get the 10 newest posts
router.get("/newest-posts", async (req, res) => {
  try {
    const { type } = req.query;
    const filters = {};

    if (type) {
      filters.type = type;
    }
    filters.is_Approved = true;
    const newestPosts = await Posts.findAll({
      where: filters,
      limit: 10, // Limit the result to 10 posts
      order: [["createdAt", "DESC"]], // Order by creation date in descending order
      include: [
        { model: Images, as: "images" },
        { model: Brand, as: "brand" },
        { model: Size, as: "size", attributes: ["name"] },
        { model: Colors, as: "colors", attributes: ["id", "name"] },
        { model: Material, as: "material", attributes: ["id", "name"] },
        { model: Category, as: "category" },
        { model: Subcategory, as: "subcategory" },
        { model: NestedSubcategory, as: "nestedsubcategory" },
        { model: SubNestedSubcategory, as: "subnestedsubcategory" },
        {
          model: User,
          as: "user",
          attributes: ["id", "username", "profileImage"],
        },
      ],
    });

    if (newestPosts.length < 1) {
      return res.status(404).json({ error: "No posts found" });
    }

    const postsWithS3Urls = newestPosts.map((post) => {
      const postJson = post.toJSON();
      // postJson.images = postJson.images.map((image) => {
      //   return {
      //     ...image,
      //     imageUrl: `https://ropero.s3.sa-east-1.amazonaws.com/${image.imageUrl}`,
      //   };
      // });
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
    res
      .status(500)
      .json({ error: "An error occurred while fetching the newest posts." });
  }
});

// Route to Approve or DisApprove a post by ID
router.put("/aprrove-disapprove/:id", async (req, res) => {
  const postId = req.params.id;

  try {
    const post = await Posts.findByPk(postId);

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    if (post.is_Approved === false) {
      post.is_Approved = true;
      await post.save();
      res.json({ message: "Post approved successfully" });
    } else {
      post.is_Approved = false;
      await post.save();
      res.json({ message: "Post disapproved successfully" });
    }
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });
  }
});

export default router;
