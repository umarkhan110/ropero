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
const storage = multer.memoryStorage();
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
          const images = req.files.map((file, index) => {
            return {
              imageData: file.buffer,
              fileName: file.originalname,
            };
          });
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
          console.log(req.body.nestedsubcategoryId);
          if (!userId || !title || !price || !categoryId || !brandId) {
            return res
              .status(409)
              .json({ error: "All fields must be filled." });
          }
          if (uploadedImages.length === 0) {
            return res
              .status(409)
              .json({ error: "At least one image is required." });
          }
          const optionalFields = {
            nestedsubcategoryId: nestedsubcategoryId || null,
            subnestedsubcategoryId: subnestedsubcategoryId || null,
          };

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
            ...optionalFields,
            address,
          });
          await post.setColors(colorIds);
          await post.setMaterial(materialIds);
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
          return res.status(409).json({ message: "You do not have credit" });
        }
      } else {
        const images = req.files.map((file, index) => {
          return {
            imageData: file.buffer,
            fileName: file.originalname,
          };
        });
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
        console.log(req.body.nestedsubcategoryId);
        if (!userId || !title || !price || !categoryId || !brandId) {
          return res.status(409).json({ error: "All fields must be filled." });
        }
        if (uploadedImages.length === 0) {
          return res
            .status(409)
            .json({ error: "At least one image is required." });
        }
        const optionalFields = {
          nestedsubcategoryId: nestedsubcategoryId || null,
          subnestedsubcategoryId: subnestedsubcategoryId || null,
        };

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
          ...optionalFields,
          address,
        });
        await post.setColors(colorIds);
        await post.setMaterial(materialIds);
        for (const imageName of uploadedImages) {
          await Images.create({
            postId: post.id,
            imageUrl: imageName,
          });
        }

        const user = req.user;
        user.no_of_posts = user.no_of_posts + 1;
        await user.save();
        res.status(201).json(post);
      }
    } catch (error) {
      console.log(error);
      res.status(400).json({ error: error?.parent?.sqlMessage });
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
    const postsWithS3Urls = posts.map((post) => {
      const postJson = post.toJSON();
      const colors =
        postJson.colors.map((color) => ({
          id: color.id,
          name: color.name,
        })) || [];
      const materials =
        postJson.material.map((material) => ({
          id: material.id,
          name: material.name,
        })) || [];
      return {
        ...postJson,
        brandName: postJson.brand?.name || null,
        categoryName: postJson.category?.name || null,
        subcategoryName: postJson.subcategory?.name || null,
        nestedsubcategoryName: postJson.nestedsubcategory?.name || null,
        subnestedsubcategoryName: postJson.subnestedsubcategory?.name || null,
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
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Get post by admin
router.get("/get-all-post-by-admin", async (req, res) => {
  try {
    let { page = 1, pageSize = 10, search } = req.query;
    pageSize = parseInt(pageSize, 10);
    const offset = (page - 1) * pageSize;
    const whereClause = {
      [Op.or]: [{ title: { [Op.like]: `%${search}%` } }],
    };
    const total = await Posts.count({ where: whereClause });
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
    const postsWithS3Urls = posts.rows.map((post) => {
      const postJson = post.toJSON();
      const colors =
        postJson.colors?.map((color) => ({
          id: color.id,
          name: color.name,
        })) || [];
      const materials =
        postJson.material?.map((material) => ({
          id: material.id,
          name: material.name,
        })) || [];
      return {
        ...postJson,
        brandName: postJson.brand?.name || null,
        categoryName: postJson.category?.name || null,
        subcategoryName: postJson.subcategory?.name || null,
        nestedsubcategoryName: postJson.nestedsubcategory?.name || null,
        subnestedsubcategoryName: postJson.subnestedsubcategory?.name || null,
        brand: undefined,
        colors,
        material: materials,
        category: undefined,
        subcategory: undefined,
        nestedsubcategory: undefined,
        subnestedsubcategory: undefined,
      };
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
          [Op.not]: post.id,
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
      const colors =
        postJson.colors.map((color) => ({
          id: color.id,
          name: color.name,
        })) || [];
      const materials =
        postJson.material.map((material) => ({
          id: material.id,
          name: material.name,
        })) || [];
      return {
        ...postJson,
        brandName: postJson.brand?.name || null,
        categoryName: postJson.category?.name || null,
        subcategoryName: postJson.subcategory?.name || null,
        nestedsubcategoryName: postJson.nestedsubcategory?.name || null,
        subnestedsubcategoryName: postJson.subnestedsubcategory?.name || null,
        brand: undefined,
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
      brandName: postJson.brand?.name || null,
      categoryName: postJson.category?.name || null,
      subcategoryName: postJson.subcategory?.name || null,
      nestedsubcategoryName: postJson.nestedsubcategory?.name || null,
      subnestedsubcategoryName: postJson.subnestedsubcategory?.name || null,
      brand: undefined,
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
    const postId = req.params.id;
    const postExist = await Posts.findByPk(postId, {
      include: [
        { model: Colors, as: "colors", attributes: ["id", "name"] },
        { model: Material, as: "material", attributes: ["id", "name"] },
      ],
    });
    const colors = postExist?.colors.map((color) => [color.id]);
    const materials = postExist?.material.map((material) => [material.id]);
    console.log(materials);
    if (!postExist) {
      return res.status(404).json({ error: "Post not found" });
    }

    const images =
      req.files?.map((file) => ({
        imageData: file.buffer,
        fileName: file.originalname,
      })) || [];

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

    const colorIds = colorId ? colorId.split(",").map(Number) : colors || [];
    const materialIds = materialId
      ? materialId.split(",").map(Number)
      : materials || [];

    postExist.title = title || postExist.title;
    postExist.address = address || postExist.address;
    postExist.description = description || postExist.description;
    postExist.price = price || postExist.price;
    postExist.discount_price = discount_price || postExist.discount_price;
    postExist.colorId = colorIds || [];
    postExist.sizeId = sizeId || postExist.sizeId;
    postExist.materialId = materialIds || [];
    postExist.parcel_size = parcel_size || postExist.parcel_size;
    postExist.brandId = brandId || postExist.brandId;
    postExist.condition = condition || postExist.condition;
    postExist.delivery_type = delivery_type || postExist.delivery_type;
    postExist.shipping = shipping || postExist.shipping;
    postExist.type = type || postExist.type;
    postExist.lat = lat || postExist.lat;
    postExist.lng = lng || postExist.lng;
    postExist.city = city || postExist.city;
    postExist.street = street || postExist.street;
    postExist.floor = floor || postExist.floor;
    postExist.state = state || postExist.state;
    postExist.categoryId = categoryId || postExist.categoryId;
    postExist.subcategoryId = subcategoryId || postExist.subcategoryId;
    postExist.nestedsubcategoryId =
      nestedsubcategoryId || postExist.nestedsubcategoryId;
    postExist.subnestedsubcategoryId =
      subnestedsubcategoryId || postExist.subnestedsubcategoryId;

    await postExist.save();
    await postExist.setColors(colorIds);
    await postExist.setMaterial(materialIds);

    const deletedImagesArray = deletedImages
      ? deletedImages.split(",").map(Number)
      : [];
    if (Array.isArray(deletedImagesArray) && deletedImagesArray.length > 0) {
      await Images.destroy({
        where: {
          postId: postExist.id,
          id: { [Sequelize.Op.in]: deletedImagesArray },
        },
      });
    }

    for (const imageName of uploadedImages) {
      await Images.create({
        postId: postId,
        imageUrl: imageName,
      });
    }

    return res.json({ postExist, message: "Post updated successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
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
    // filters.is_Approved = true;
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

    const postsWithS3Urls = posts.map((post) => {
      const postJson = post.toJSON();
      const colors =
        postJson.colors.map((color) => ({
          id: color.id,
          name: color.name,
        })) || [];
      const materials =
        postJson.material.map((material) => ({
          id: material.id,
          name: material.name,
        })) || [];
      return {
        ...postJson,
        brandName: postJson.brand?.name || null,
        categoryName: postJson.category?.name || null,
        subcategoryName: postJson.subcategory?.name || null,
        nestedsubcategoryName: postJson.nestedsubcategory?.name || null,
        subnestedsubcategoryName: postJson.subnestedsubcategory?.name || null,
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

    const postsWithS3Urls = posts.map((post) => {
      const postJson = post.toJSON();
      const colors =
        postJson.colors.map((color) => ({
          id: color.id,
          name: color.name,
        })) || [];
      const materials =
        postJson.material.map((material) => ({
          id: material.id,
          name: material.name,
        })) || [];
      return {
        ...postJson,
        brandName: postJson.brand?.name || null,
        categoryName: postJson.category?.name || null,
        subcategoryName: postJson.subcategory?.name || null,
        nestedsubcategoryName: postJson.nestedsubcategory?.name || null,
        subnestedsubcategoryName: postJson.subnestedsubcategory?.name || null,
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

    const postsWithS3Urls = posts.map((post) => {
      const postJson = post.toJSON();
      const colors =
        postJson.colors.map((color) => ({
          id: color.id,
          name: color.name,
        })) || [];
      const materials =
        postJson.material.map((material) => ({
          id: material.id,
          name: material.name,
        })) || [];
      return {
        ...postJson,
        brandName: postJson.brand?.name || null,
        categoryName: postJson.category?.name || null,
        subcategoryName: postJson.subcategory?.name || null,
        nestedsubcategoryName: postJson.nestedsubcategory?.name || null,
        subnestedsubcategoryName: postJson.subnestedsubcategory?.name || null,
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
      const colors =
        postJson.colors.map((color) => ({
          id: color.id,
          name: color.name,
        })) || [];
      const materials =
        postJson.material.map((material) => ({
          id: material.id,
          name: material.name,
        })) || [];
      return {
        ...postJson,
        brandName: postJson.brand?.name || null,
        categoryName: postJson.category?.name || null,
        subcategoryName: postJson.subcategory?.name || null,
        nestedsubcategoryName: postJson.nestedsubcategory?.name || null,
        subnestedsubcategoryName: postJson.subnestedsubcategory?.name || null,
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
      limit: 5,
      order: [["views", "DESC"]],
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
      const colors =
        postJson.colors.map((color) => ({
          id: color.id,
          name: color.name,
        })) || [];
      const materials =
        postJson.material.map((material) => ({
          id: material.id,
          name: material.name,
        })) || [];
      return {
        ...postJson,
        brandName: postJson.brand?.name || null,
        categoryName: postJson.category?.name || null,
        subcategoryName: postJson.subcategory?.name || null,
        nestedsubcategoryName: postJson.nestedsubcategory?.name || null,
        subnestedsubcategoryName: postJson.subnestedsubcategory?.name || null,
        brand: undefined,
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
      limit: 10,
      order: [["createdAt", "DESC"]],
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
      const colors =
        postJson.colors.map((color) => ({
          id: color.id,
          name: color.name,
        })) || [];
      const materials =
        postJson.material.map((material) => ({
          id: material.id,
          name: material.name,
        })) || [];
      return {
        ...postJson,
        brandName: postJson.brand?.name || null,
        categoryName: postJson.category?.name || null,
        subcategoryName: postJson.subcategory?.name || null,
        nestedsubcategoryName: postJson.nestedsubcategory?.name || null,
        subnestedsubcategoryName: postJson.subnestedsubcategory?.name || null,
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
