const AppConfig = require('../models/AppContentSchema');
const Category = require('../models/Category');
const Asset = require('../models/Asset');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs/promises');
const { updateBulkCoordinates } = require('./asset.controller');

exports.getAppConfig = async (req, res) => {
    try {
        const { appId } = req.params;
        const config = await AppConfig.findOne({ appId })
            .populate({
                path: 'selections.categoryId',
                model: 'categories'
            })
            .populate({
                path: 'selections.assets',
                model: 'assets'
            });

        if (!config) {
            return res.status(404).json({ success: false, message: "No configuration found for this App" });
        }

        res.status(200).json({ success: true, config });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};


exports.addCategoryToConfig = async (req, res) => {
    try {
        const { appId, categoryId } = req.body;

        // Check if category exists in master table
        const categoryExists = await Category.exists({ _id: categoryId });
        if (!categoryExists) return res.status(404).json({ message: "Category not found in master" });

        const config = await AppConfig.findOneAndUpdate(
            { appId },
            { $addToSet: { selections: { categoryId, assets: [] } } },
            { new: true, upsert: true }
        );

        res.status(200).json({ success: true, config });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.createAppCategory = async (req, res) => {
    try {
        const { appId } = req.params;
        const { name, isEnable, isPremium, sequence, customFields } = req.body;

        if (!appId) {
            return res.status(400).json({ success: false, message: "App ID is required" });
        }
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

        // 1. Handle Image Processing
        const imageFile = req.files?.image?.[0];
        const baseUrl = `${req.protocol}://${req.get('host')}`;
        let imageUrl = "";
        let thumbnailUrl = "";

        if (imageFile) {
            const thumbnailDir = path.join(__dirname, '..', 'uploads', 'thumbnail', 'category');
            if (!fs.existsSync(thumbnailDir)) fs.mkdirSync(thumbnailDir, { recursive: true });

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

        // 2. Create the Category in the master collection
        const newMasterCategory = await Category.create({
            name: name?.trim(),
            image: imageUrl,
            thumbnail: thumbnailUrl,
            isEnable: isEnable === 'true' || isEnable === true,
            isPremium: isPremium === 'true' || isPremium === true,
            sequence: parseInt(sequence, 10) || 0,
            customFields: customFields ? (typeof customFields === 'string' ? JSON.parse(customFields) : customFields) : {}
        });

        // 3. Link to AppConfig (Mapping Table)
        const updatedConfig = await AppConfig.findOneAndUpdate(
            { appId },
            { 
                $push: { 
                    selections: { 
                        categoryId: newMasterCategory._id, 
                        assets: [],
                        isDeleted: false
                    } 
                } 
            },
            { new: true, upsert: true }
        );

        res.status(201).json({
            success: true,
            message: "Category created and linked successfully",
            category: newMasterCategory,
            config: updatedConfig
        });
    } catch (error) {
        console.error("Error in createAppCategory: ", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.deleteAppCategory = async (req, res) => {
    try {
        const { appId, categoryId } = req.body;
        
        // Soft delete: set isDeleted flag to true in the mapping table
        const result = await AppConfig.updateOne(
            { appId, "selections.categoryId": categoryId },
            { $set: { "selections.$.isDeleted": true } }
        );

        if (result.matchedCount === 0) {
            return res.status(404).json({ success: false, message: "Mapping not found" });
        }

        res.status(200).json({ success: true, message: "Category hidden from this app." });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getAppView = async (req, res) => {
    try {
        const { appId } = req.params;
        const data = await AppConfig.findOne({ appId })
            .populate('appId')
            .populate('selections.categoryId')
            .populate('selections.assets.assetId');

        if (!data) return res.status(404).json({ success: false, message: "App config not found" });

        // Filter the hierarchy to show only active (non-deleted) items
        const activeSelections = data.selections
            .filter(cat => !cat.isDeleted && cat.categoryId)
            .map(cat => ({
                ...cat.categoryId.toObject(),
                assets: cat.assets
                    .filter(a => !a.isDeleted && a.assetId)
                    .map(a => a.assetId.toObject())
            }));

        res.status(200).json({ 
            success: true, 
            app: data.appId,
            categories: activeSelections 
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.createAssetAndLinkToApp = async (req, res) => {
         try {
        const { appId, categoryId } = req.body;

        if (!appId || !categoryId) {
            return res.status(400).json({
                success: false,
                message: "appId and categoryId are required"
            });
        }
        const imageFiles = req.files?.image;
        if (!imageFiles || imageFiles.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Please upload at least one image"
            });
        }
        
        // Validate uniqueness of asset names
        const baseNames = imageFiles.map(file => {
            const originalExt = path.extname(file.originalname).toLowerCase();
            return path.basename(file.originalname, originalExt).replace(/[^a-zA-Z0-9-_]/g, "_");
        });

        const existingAssets = await Asset.find({ name: { $in: baseNames } });
        if (existingAssets.length > 0) {
            const duplicateNames = existingAssets.map(a => a.name).join(", ");
            return res.status(400).json({
                success: false,
                message: `Duplicate asset names found: ${duplicateNames}. Please rename your files and try again.`
            });
        }
        const category = await Category.findById(categoryId);
        if (!category) {
            return res.status(404).json({
                success: false,
                message: "Category not found"
            });
        }

        const baseUrl = `${req.protocol}://${req.get("host")}`;
        const catFolderName = category.name.replace(/\s+/g, "_");

        const imageDir = path.join(__dirname, "..", "uploads/images/Asset", catFolderName);
        const thumbDir = path.join(__dirname, "..", "uploads/thumbnail/Asset", catFolderName);

        await fs.mkdir(imageDir, { recursive: true });
        await fs.mkdir(thumbDir, { recursive: true });
        let coordinates = [];
        if (req.body.coordinates) {
            try {
                coordinates = JSON.parse(req.body.coordinates);
            } catch {
                return res.status(400).json({
                    success: false,
                    message: "Invalid coordinates JSON"
                });
            }
        }
        let parsedTags = [];
        if (req.body.tag) {
            try {
                const parsed = JSON.parse(req.body.tag);
                parsedTags = Array.isArray(parsed) ? parsed : [parsed];
            } catch {
                parsedTags = [req.body.tag];
            }
        }

        const assetPromises = imageFiles.map(async (imageFile) => {
            const originalExt = path.extname(imageFile.originalname).toLowerCase();

            const baseName = path
                .basename(imageFile.originalname, originalExt)
                .replace(/[^a-zA-Z0-9-_]/g, "_");

            const finalFilename = `${Date.now()}_${Math.random()
                .toString(36)
                .substring(2, 8)}_${baseName}${originalExt}`;

            const targetImagePath = path.join(imageDir, finalFilename);
            const targetThumbPath = path.join(thumbDir, finalFilename);

            await fs.rename(imageFile.path, targetImagePath);
            const metadata = await sharp(targetImagePath).metadata();
            const originalWidth = metadata.width || 0;
            const originalHeight = metadata.height || 0;
            // ✅ Thumbnail dimensions
            const thumbWidth = Math.floor(originalWidth / 3);
            const thumbHeight = Math.floor(originalHeight / 3);

            await sharp(targetImagePath)
                .resize(thumbWidth, thumbHeight)
                .toFile(targetThumbPath);
            return {
                name: baseName,
                categoryId: category._id,
                image: `${baseUrl}/uploads/images/Asset/${catFolderName}/${finalFilename}`,
                thumbnail: `${baseUrl}/uploads/thumbnail/Asset/${catFolderName}/${finalFilename}`,
                isPremium: req.body.isPremium === "true",
                isEnable: req.body.isEnable === "true",
                coordinates,
                tag:parsedTags,
                width: originalWidth,
                height: originalHeight
            };
        });

        const assetsData = await Promise.all(assetPromises);
        const createdAssets = await Asset.insertMany(assetsData);
        const assetMappings = createdAssets.map(asset => ({
            assetId: asset._id,
            isDeleted: false
        }));
        const updatedConfig = await AppConfig.findOneAndUpdate(
            {
                appId,
                "selections.categoryId": categoryId
            },
            {
                $push: {
                    "selections.$.assets": {
                        $each: assetMappings
                    }
                }
            },
            { new: true }
        );
        if (!updatedConfig) {
            return res.status(404).json({
                success: false,
                message: "AppConfig or category mapping not found"
            });
        }

        // If Python processing generated coordinates, update them in bulk
        if (req.body.pythonCoordinates && req.body.pythonCoordinates.length > 0) {
            req.body.data = req.body.pythonCoordinates;
            // Since updateBulkCoordinates sends its own response, we return its result
            return await updateBulkCoordinates(req, res);
        }

        return res.status(201).json({
            success: true,
            message: "Assets created and linked successfully",
            assets: createdAssets,
            count: createdAssets.length
        });

    } catch (error) {
        console.error("createAssetsAndLinkToApp error:", error);

        return res.status(500).json({
            success: false,
            message: error.message || "Internal Server Error"
        });
    }
};

exports.removeAssetFromApp = async (req, res) => {
    try {
        const { appId, categoryId, assetId } = req.body;

        await AppConfig.updateOne(
            { appId },
            { $set: { "selections.$[cat].assets.$[ass].isDeleted": true } },
            { 
                arrayFilters: [
                    { "cat.categoryId": categoryId },
                    { "ass.assetId": assetId }
                ] 
            }
        );

        res.status(200).json({ success: true, message: "Asset removed from app view." });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.addExistingAssetsToApp = async (req, res) => {
    try {
        const { appId, categoryId, assetIds } = req.body;

        if (!appId || !categoryId || !assetIds || !Array.isArray(assetIds)) {
            return res.status(400).json({ success: false, message: "appId, categoryId, and assetIds (array) are required" });
        }

        // Convert assetIds to the object structure required by the schema
        const assetsToAdd = assetIds.map(id => ({
            assetId: id,
            isDeleted: false
        }));

        const result = await AppConfig.updateOne(
            { appId, "selections.categoryId": categoryId },
            { 
                $addToSet: { 
                    "selections.$.assets": { $each: assetsToAdd } 
                } 
            }
        );

        if (result.matchedCount === 0) {
            return res.status(404).json({ success: false, message: "AppConfig or Category mapping not found" });
        }

        res.status(200).json({ success: true, message: `${result.modifiedCount} assets linked successfully` });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.hardDeleteAppContentByCategory = async (categoryId) => {
    if (!categoryId) return { acknowledged: true, modifiedCount: 0, matchedCount: 0 };
    return AppConfig.updateMany(
        {},
        { $pull: { selections: { categoryId } } }
    );
};

exports.deleteAppContentByCategoryId = async (req, res) => {
    try {
        const { categoryId } = req.params;
        if (!categoryId) {
            return res.status(400).json({
                success: false,
                message: "categoryId is required"
            });
        }

        const result = await hardDeleteAppContentByCategory(categoryId);
        return res.status(200).json({
            success: true,
            message: "App contents deleted for category",
            matchedCount: result.matchedCount || 0,
            modifiedCount: result.modifiedCount || 0
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message || "Internal Server Error"
        });
    }
};
