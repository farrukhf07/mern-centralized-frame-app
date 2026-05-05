const Category = require('../models/Category');
const AppSchema = require('../models/AppSchema');
const Asset = require('../models/Asset');
const { hardDeleteAppContentByCategory } = require('./appContentSchema.controller');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

// Create a new category and attach it to an app
exports.createCategory = async (req, res) => {
    try {
        const appId = req.params.appId;
        
        if (!appId) {
            return res.status(400).json({ success: false, message: "App ID is required" });
        }

        const app = await AppSchema.findById(appId);
        if (!app) {
            return res.status(404).json({ success: false, message: "App not found" });
        }

        const { name, isEnable, isPremium, sequence, customFields } = req.body || {};

        if (!name || name.trim() === "") {
            return res.status(400).json({ success: false, message: "Category name is required" });
        }

        const existingCategory = await Category.findOne({ 
            name: { $regex: new RegExp(`^${name.trim()}$`, 'i') } 
        });

        if (existingCategory) {
            return res.status(400).json({ 
                success: false, 
                message: `Category with the name "${name}" already exists.` 
            });
        }

        const imageFile = req.files?.image?.[0];
        const baseUrl = `${req.protocol}://${req.get('host')}`;

        let imageUrl = "";
        let thumbnailUrl = "";

        if (imageFile) {
            const thumbnailDir = path.join(__dirname,'..', 'uploads', 'thumbnail', 'category');

            if (!fs.existsSync(thumbnailDir)) {
                fs.mkdirSync(thumbnailDir, { recursive: true });
            }

            imageUrl = `${baseUrl}/${imageFile.path.replace(/\\/g, '/')}`;

            const thumbFileName = `thumb_${imageFile.filename}`;
            const thumbnailPath = path.join(thumbnailDir, thumbFileName);

            const imageSharp = sharp(imageFile.path);
            const metadata = await imageSharp.metadata();

            const width = Math.floor((metadata.width || 300) / 3);
            const height = Math.floor((metadata.height || 300) / 3);

            await imageSharp.resize(width, height).toFile(thumbnailPath);

            thumbnailUrl = `${baseUrl}/uploads/thumbnail/category/${thumbFileName}`;
        }
        // ADD THIS TEMPORARY FIX BEFORE THE Category.create() LINE
        const indexes = await Category.collection.indexes();
        if (indexes.some(idx => idx.name === 'appurl_1')) {
            await Category.collection.dropIndex('appurl_1');
            console.log("Ghost index 'appurl_1' removed from Categories.");
        }

        // Create Category mapping new CategorySchema properties
        const category = await Category.create({
            name: name.trim(),
            image: imageUrl,
            thumbnail: thumbnailUrl,
            isEnable: isEnable === 'true' || isEnable === true,
            isPremium: isPremium === 'true' || isPremium === true,
            sequence: parseInt(sequence, 10) || 0,
            views: 0,
            downloads: 0,
            customFields: customFields ? (typeof customFields === 'string' ? JSON.parse(customFields) : customFields) : {}
        });

        // Push the created category _id into the App's categories array
        app.categories.push(category._id);
        await app.save();

        // Return updated App with categories efficiently
        await app.populate('categories');

        res.status(201).json({ success: true, app });

    } catch (error) {
        console.error("Error: ", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Attach an existing category to an app
exports.addExistingCategoryToApp = async (req, res) => {
    try {
        // Support appId from both params or body
        const appId = req.params.appId || req.body.appId;
        const { categoryId } = req.body;

        if (!appId || !categoryId) {
            return res.status(400).json({ success: false, message: "App ID and Category ID are required" });
        }

        // Verify that both App and Category exist in parallel for speed
        const [appExists, categoryExists] = await Promise.all([
            AppSchema.exists({ _id: appId }),
            Category.exists({ _id: categoryId })
        ]);

        if (!appExists) return res.status(404).json({ success: false, message: "App not found" });
        if (!categoryExists) return res.status(404).json({ success: false, message: "Category not found" });

        // Atomic update: Add categoryId to App's categories array
        // $addToSet automatically checks for duplicates so you don't have to
        const updatedApp = await AppSchema.findByIdAndUpdate(
            appId,
            { $addToSet: { categories: categoryId } },
            { new: true }
        ).populate('categories');

        res.status(200).json({ 
            success: true, 
            message: "Category linked successfully", 
            app: updatedApp 
        });

    } catch (error) {
        console.error("Error adding category to app: ", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.removeCategoryFromApp = async (req, res) => {
    try {
        const appId = req.params.appId || req.body.appId;
        const { categoryId } = req.body;

        if (!appId || !categoryId) {
            return res.status(400).json({ 
                success: false, 
                message: "App ID and Category ID are required" 
            });
        }

        // Check existence in parallel
        const [appExists, categoryExists] = await Promise.all([
            AppSchema.exists({ _id: appId }),
            Category.exists({ _id: categoryId })
        ]);

        if (!appExists) {
            return res.status(404).json({ success: false, message: "App not found" });
        }

        if (!categoryExists) {
            return res.status(404).json({ success: false, message: "Category not found" });
        }

        // Remove categoryId from categories array
        const updatedApp = await AppSchema.findByIdAndUpdate(
            appId,
            { $pull: { categories: categoryId } },
            { new: true }
        ).populate('categories');

        res.status(200).json({
            success: true,
            message: "Category removed successfully",
            app: updatedApp
        });

    } catch (error) {
        console.error("Error removing category from app:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getCategories = async (req, res) => {
    try {
        const appId = req.params.appId || req.body.appId;
        
        if (!appId) {
            return res.status(400).json({ success: false, message: "App ID is required" });
        }

        // 1. Fetch the app and populate the categories array
        // We sort by 'sequence' as per your .antigravityrules
        const app = await AppSchema.findById(appId)
            .populate({
                path: 'categories',
                options: { sort: { sequence: 1 } }
            })
            .lean(); // .lean() makes the query faster by returning plain JS objects

        if (!app) {
            return res.status(404).json({ success: false, message: "App not found" });
        }

        // 2. Format the response
        res.status(200).json({
            success: true,
            count: app.categories?.length || 0,
            // Ensure we return the populated objects, or an empty array if none exist
            categories: app.categories || [],
            appName: app.name
        });

    } catch (error) {
        console.error("Error fetching categories: ", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getAllCategories = async (req, res) => {
    try {
        // Fetch all categories from the collection
        const categories = await Category.find()
            .sort({ sequence: 1 })
            .lean();

        res.status(200).json({
            success: true,
            count: categories.length,
            categories
        });
    } catch (error) {
        console.error("Error fetching all categories: ", error);
        res.status(500).json({ 
            success: false, 
            message: "Failed to fetch categories", 
            error: error.message 
        });
    }
};

exports.getCategoryById = async (req, res) => {
    try {
        const { id } = req.params;
        const category = await Category.findById(id).lean();
        if (!category) {
            return res.status(404).json({ success: false, message: 'Category not found' });
        }
        res.status(200).json({ success: true, category });
    } catch (error) {
        console.error("Error fetching category by ID:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.editCategory = async (req, res) => {
    try {
        const { id } = req.params;

        const existingCategory = await Category.findById(id);
        if (!existingCategory) {
            return res.status(404).json({ message: 'Category not found' });
        }

        const baseUrl = `${req.protocol}://${req.get('host')}`;
        const { name, isEnable, isPremium, sequence, customFields } = req.body || {};

        let imageUrl = existingCategory.image;
        let thumbnailUrl = existingCategory.thumbnail;

        const imageFile = req.files?.image?.[0];
        if (imageFile) {

            // delete old image
            if (existingCategory.image) {
                const oldImagePath = path.join(__dirname, '..', existingCategory.image.replace(baseUrl + '/', ''));
                if (fs.existsSync(oldImagePath)) fs.unlinkSync(oldImagePath);
            }

            // delete old thumbnail
            if (existingCategory.thumbnail) {
                const oldThumbPath = path.join(__dirname, '..', existingCategory.thumbnail.replace(baseUrl + '/', ''));
                if (fs.existsSync(oldThumbPath)) fs.unlinkSync(oldThumbPath);
            }

            imageUrl = `${baseUrl}/${imageFile.path.replace(/\\/g, '/')}`;

            const thumbnailDir = path.join(__dirname, '..', 'uploads', 'thumbnail', 'category');
            if (!fs.existsSync(thumbnailDir)) {
                fs.mkdirSync(thumbnailDir, { recursive: true });
            }

            const thumbFileName = `thumb_${imageFile.filename}`;
            const thumbnailPath = path.join(thumbnailDir, thumbFileName);

            const imageSharp = sharp(imageFile.path);
            const metadata = await imageSharp.metadata();

            const width = Math.floor((metadata.width || 300) / 3);
            const height = Math.floor((metadata.height || 300) / 3);

            await imageSharp.resize(width, height).toFile(thumbnailPath);

            thumbnailUrl = `${baseUrl}/uploads/thumbnail/category/${thumbFileName}`;
        }

        const updatedData = {
            name: name && name.trim() !== "" ? name.trim() : existingCategory.name,
            image: imageUrl,
            thumbnail: thumbnailUrl,
            isEnable: isEnable !== undefined
                ? (isEnable === 'true' || isEnable === true)
                : existingCategory.isEnable,
            isPremium: isPremium !== undefined
                ? (isPremium === 'true' || isPremium === true)
                : existingCategory.isPremium,
            sequence: sequence !== undefined
                ? parseInt(sequence, 10) || 0
                : existingCategory.sequence,
            customFields: customFields
                ? (typeof customFields === 'string' ? JSON.parse(customFields) : customFields)
                : existingCategory.customFields
        };

        const updatedCategory = await Category.findByIdAndUpdate(
            id,
            updatedData,
            { returnDocument: 'after' }
        );

        return res.status(200).json({
            success: true,
            category: updatedCategory
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
};

exports.deleteCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const category = await Category.findById(id);
        if (!category) {
            return res.status(404).json({ success: false, message: 'Category not found' });
        }

        const baseUrl = `${req.protocol}://${req.get('host')}`;
        const assets = await Asset.find({ categoryId: id }).lean();

        // Delete original image
        if (category.image) {
            const imagePath = path.join(__dirname, '..', category.image.replace(baseUrl + '/', ''));
            if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
        }

        // Delete thumbnail (fixed field name)
        if (category.thumbnail) {
            const thumbnailPath = path.join(__dirname, '..', category.thumbnail.replace(baseUrl + '/', ''));
            if (fs.existsSync(thumbnailPath)) fs.unlinkSync(thumbnailPath);
        }

        for (const asset of assets) {
            if (asset.image) {
                const assetImagePath = path.join(__dirname, '..', asset.image.replace(baseUrl + '/', ''));
                if (fs.existsSync(assetImagePath)) fs.unlinkSync(assetImagePath);
            }
            if (asset.thumbnail) {
                const assetThumbnailPath = path.join(__dirname, '..', asset.thumbnail.replace(baseUrl + '/', ''));
                if (fs.existsSync(assetThumbnailPath)) fs.unlinkSync(assetThumbnailPath);
            }
        }

        await Promise.all([
            Asset.deleteMany({ categoryId: id }),
            Category.findByIdAndDelete(id),
            AppSchema.updateMany({}, { $pull: { categories: id } }),
            hardDeleteAppContentByCategory(id)
        ]);

        res.status(200).json({ success: true, message: 'Category deleted successfully' });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.bulkUpdateCustomField = async (req, res)=>{
    try {
        const {key, value} = req.body;
        if(!key || value === undefined){
            return res.status(400).json({message:"key and value are required"});
        }
        const updatePath = `customFields.${key}`;
        const result = await Category.updateMany(
            {},
            { $set:{ [updatePath]: value}}
        );
        res.status(200).json({
            success:true,
            matchedCount: result.matchedCount,
            modifiedCount: result.modifiedCount
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({message: error.message});
    }
};