const Category = require('../models/Category');
const Asset = require('../models/Asset');
const AppConfig = require('../models/AppContentSchema');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

exports.createAsset = async (req, res) => {
  try {
    const imageFiles = req.files?.image;
    
    if (!imageFiles.length) {
        return res.status(400).json({ message: "Please upload at least one image" });
    }
    if (imageFiles.length > 25) {
        return res.status(400).json({ message: "Maximum 25 images allowed" });
    }

    // Parse common fields (safe now after Multer)
    const parsedIsPremium = req.body.isPremium !== undefined ? JSON.parse(req.body.isPremium) : false;
    const parsedIsEnable = req.body.isEnable !== undefined ? JSON.parse(req.body.isEnable) : false;

    let parsedTags = [];
    if (req.body.tag) {
        try {
            const parsed = JSON.parse(req.body.tag);
            parsedTags = Array.isArray(parsed) ? parsed : [parsed];
        } catch {
            parsedTags = [req.body.tag]; // fallback if single string
        }
    }

    // Coordinates (same for all)
    let coordinatesArray = [];
    if (req.body.coordinates) {
        try {
            const parsed = JSON.parse(req.body.coordinates);
            if (!Array.isArray(parsed)) throw new Error();
            coordinatesArray = parsed.map(coord => ({
                name: coord.name || '',
                x: Number(coord.x) || 0,
                y: Number(coord.y) || 0,
                width: Number(coord.width) || 0,
                height: Number(coord.height) || 0,
                rotation: parseFloat(coord.rotation) || 0,
                elevation: Number(coord.elevation) || 0
            }));
        } catch {
            return res.status(400).json({ message: 'Invalid coordinates JSON format' });
        }
    }

    // Auto sequence
    const lastAsset = await Asset.findOne({ categoryId: req.category._id }).sort({ sequence: -1 });
    let nextSequence = lastAsset ? lastAsset.sequence + 1 : 0;

    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const createdAssets = [];

    console.log(imageFiles);
    for (const file of imageFiles) {
        const originalExt = path.extname(file.originalname).toLowerCase();
        let baseName = path.basename(file.originalname, originalExt).replace(/[^a-zA-Z0-9-_]/g, '_');
        if (!baseName) baseName = 'asset';

        let desiredFilename = baseName + originalExt;

        // Target directories
        const imageDir = path.join(__dirname, '..', 'uploads/images/Asset', req.catFolder);
        const thumbDir = path.join(__dirname, '..', 'uploads/thumbnail/Asset', req.catFolder);
        fs.mkdirSync(imageDir, { recursive: true });
        fs.mkdirSync(thumbDir, { recursive: true });

        // Conflict handling for image
        let targetImagePath = path.join(imageDir, desiredFilename);

        // Move image from temp to final location
        fs.renameSync(file.path, targetImagePath);

        // Generate thumbnail (same filename)
        const metadata = await sharp(targetImagePath).metadata();
        // Original dimensions (store in DB)
        const originalWidth = metadata.width || 0;
        const originalHeight = metadata.height || 0;

        // Thumbnail dimensions (for resize only)
        const thumbWidth = Math.floor(originalWidth / 3);
        const thumbHeight = Math.floor(originalHeight / 3);

        const targetThumbPath = path.join(thumbDir, desiredFilename);
        await sharp(targetImagePath)
            .resize(thumbWidth, thumbHeight)
            .toFile(targetThumbPath);

        // Relative paths for DB
        const imageRelative = `${baseUrl}/uploads/images/Asset/${req.catFolder}/${desiredFilename}`;
        const thumbRelative = `${baseUrl}/uploads/thumbnail/Asset/${req.catFolder}/${desiredFilename}`;

        const assetName = path.basename(desiredFilename, originalExt);

        const assetData = {
            name: assetName,
            categoryId: req.category._id,
            tag: parsedTags,
            image: imageRelative,
            thumbnail: thumbRelative,
            isPremium: parsedIsPremium,
            isEnable: parsedIsEnable,
            sequence: nextSequence++,
            coordinates: coordinatesArray,
            width: originalWidth,
            height: originalHeight
        };

        const newAsset = await Asset.create(assetData);
        createdAssets.push(newAsset);
    }

    return res.status(201).json({
        success: true,
        message: 'Assets created successfully',
        count: createdAssets.length,
        assets: createdAssets
    });

} catch (error) {
    console.error(error);
    // Optional: clean up moved files on error if needed
    return res.status(500).json({ message: error.message });
}
};

exports.getAllAssets = async (req,res)=>{
    try {
        const categoryId = req.params.categoryId;

        const category = await Category.findById(categoryId);
        if (!category) {
          return res.status(404).json({ message: "Category not found" });
        }
    
        const assets = await Asset.find({ categoryId }).sort({ sequence: 1 });
    
        res.status(200).json({ success: true, assets, categoryName: category.name });
    
    } catch (error) {
        console.error("Error in getAssetsByCategory:", error);
        res.status(500).json({ message: error.message });
    }
};

exports.getAssetList = async (req, res) => {
  try {
    const assets = await Asset.find().sort({ sequence: 1 });

    return res.status(200).json({
      success: true,
      assets,
    });
  } catch (error) {
    console.error("Error in getAssetList:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.getAssetById = async (req, res) => {
    try {
      const asset = await Asset.findById(req.params.id);
      if (!asset) return res.status(404).json({ success: false, message: 'Asset not found' });
      res.json({ success: true, asset });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
};

exports.editAssets = async (req, res) => {
    try {
        const { assetId } = req.params;

        const existingAsset = await Asset.findById(assetId);
        if (!existingAsset) {
            return res.status(404).json({ message: 'Asset not found' });
        }

        const baseUrl = `${req.protocol}://${req.get('host')}`;

        let imageUrl = existingAsset.image;
        let thumbnailUrl = existingAsset.thumbnail;

        let parsedTags = existingAsset.tag || [];
        if (req.body.tag !== undefined) {
            try {
                const parsed = JSON.parse(req.body.tag);
                parsedTags = Array.isArray(parsed) ? parsed : [parsed];
            } catch {
                parsedTags = [req.body.tag];
            }
        }
        
        let assetWidth = req.body.width !== undefined && req.body.width !== "" ? Number(req.body.width) : existingAsset.width;
        let assetHeight = req.body.height !== undefined && req.body.height !== "" ? Number(req.body.height) : existingAsset.height;

        // 🔹 Parse booleans (same as create)
        const parsedIsPremium = req.body.isPremium !== undefined 
            ? JSON.parse(req.body.isPremium) 
            : existingAsset.isPremium;

        const parsedIsEnable = req.body.isEnable !== undefined 
            ? JSON.parse(req.body.isEnable) 
            : existingAsset.isEnable;

        // 🔹 Parse coordinates (same as create)
        let coordinatesArray = existingAsset.coordinates;

        if (req.body.coordinates !== undefined) {
            try {
                const parsed = JSON.parse(req.body.coordinates);

                if (!Array.isArray(parsed)) {
                    return res.status(400).json({ message: 'Coordinates must be an array' });
                }

                coordinatesArray = parsed.map(coord => ({
                    ...(coord._id && { _id: coord._id }),
                    name: coord.name || '',
                    x: Number(coord.x) || 0,
                    y: Number(coord.y) || 0,
                    width: Number(coord.width) || 0,
                    height: Number(coord.height) || 0,
                    rotation: parseFloat(coord.rotation) || 0,
                    elevation: Number(coord.elevation) || 0,
                }));

            } catch {
                return res.status(400).json({ message: 'Invalid coordinates JSON format' });
            }
        }

        // 🔹 Handle image update (MATCH CREATE LOGIC)
        const imageFile = req.files?.image?.[0];

        if (imageFile) {
            const originalExt = path.extname(imageFile.originalname).toLowerCase();
            let baseName = path.basename(imageFile.originalname, originalExt).replace(/[^a-zA-Z0-9-_]/g, '_');
            if (!baseName) baseName = 'asset';

            const desiredFilename = baseName + originalExt;

            // 🔥 SAME PATHS AS CREATE
            const imageDir = path.join(__dirname, '..', 'uploads/images/Asset', req.catFolder);
            const thumbDir = path.join(__dirname, '..', 'uploads/thumbnail/Asset', req.catFolder);

            fs.mkdirSync(imageDir, { recursive: true });
            fs.mkdirSync(thumbDir, { recursive: true });

            const targetImagePath = path.join(imageDir, desiredFilename);
            const targetThumbPath = path.join(thumbDir, desiredFilename);

            // 🔥 Delete old files
            if (existingAsset.image) {
                const oldImagePath = path.join(__dirname, '..', existingAsset.image.replace(baseUrl + '/', ''));
                if (fs.existsSync(oldImagePath)) fs.unlinkSync(oldImagePath);
            }

            if (existingAsset.thumbnail) {
                const oldThumbPath = path.join(__dirname, '..', existingAsset.thumbnail.replace(baseUrl + '/', ''));
                if (fs.existsSync(oldThumbPath)) fs.unlinkSync(oldThumbPath);
            }

            // Move new image
            fs.renameSync(imageFile.path, targetImagePath);

            // Generate thumbnail
            const metadata = await sharp(targetImagePath).metadata();
            const originalWidth = metadata.width || 0;
            const originalHeight = metadata.height || 0;
            
            // Override with new image metadata if user didn't provide explicit width/height
            if (req.body.width === undefined || req.body.width === "") assetWidth = originalWidth;
            if (req.body.height === undefined || req.body.height === "") assetHeight = originalHeight;
            
            // ✅ Thumbnail dimensions
            const thumbWidth = Math.floor(originalWidth / 3);
            const thumbHeight = Math.floor(originalHeight / 3);

            await sharp(targetImagePath)
                .resize(thumbWidth, thumbHeight)
                .toFile(targetThumbPath);

            // Save URLs
            imageUrl = `${baseUrl}/uploads/images/Asset/${req.catFolder}/${desiredFilename}`;
            thumbnailUrl = `${baseUrl}/uploads/thumbnail/Asset/${req.catFolder}/${desiredFilename}`;
        }

        // 🔹 Parse customFields
        let parsedCustomFields = existingAsset.customFields;
        if (req.body.customFields !== undefined) {
            if (typeof req.body.customFields === 'string') {
                try {
                    parsedCustomFields = JSON.parse(req.body.customFields);
                } catch {
                    return res.status(400).json({ message: "Invalid customFields JSON" });
                }
            } else {
                parsedCustomFields = req.body.customFields;
            }
        }

        // 🔹 Final update object (SAFE LIKE CREATE)
        const updatedData = {
            name: req.body.name && req.body.name.trim() !== ""
                ? req.body.name.trim()
                : existingAsset.name,

            image: imageUrl,
            thumbnail: thumbnailUrl,

            isPremium: parsedIsPremium,
            isEnable: parsedIsEnable,

            sequence: req.body.sequence !== undefined
                ? parseInt(req.body.sequence, 10) || 0
                : existingAsset.sequence,

            coordinates: coordinatesArray,
            customFields: parsedCustomFields,
            tag: parsedTags,
            width: assetWidth,
            height: assetHeight
        };

        // 🔥 FIXED MONGOOSE WARNING
        const updatedAsset = await Asset.findByIdAndUpdate(
            assetId,
            updatedData,
            { returnDocument: 'after' }
        );

        return res.status(200).json({
            success: true,
            asset: updatedAsset
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: error.message });
    }
};

exports.deleteAssets = async(req, res)=>{
    try {
        const { assetId } = req.params;
        const asset = await Asset.findById(assetId);
        if (!asset) {
            return res.status(404).json({ message: 'Asset not found' });
        }

        const baseUrl = `${req.protocol}://${req.get('host')}`;

        // Delete original image
        if (asset.image) {
            const imagePath = path.join(__dirname, '..', asset.image.replace(baseUrl + '/', '', ''));
            if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
        }

        // Delete thumbnail (fixed field name)
        if (asset.thumbnail) {
            const thumbnailPath = path.join(__dirname, '..', asset.thumbnail.replace(baseUrl + '/', '', ''));
            if (fs.existsSync(thumbnailPath)) fs.unlinkSync(thumbnailPath);
        }

        await Promise.all([
            Asset.findByIdAndDelete(assetId),
            AppConfig.updateMany(
                {},
                { $pull: { "selections.$[].assets": { assetId: asset._id } } }
            )
        ]);

        res.status(200).json({ success: true, message: 'Asset deleted successfully' });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// bulk update Coordinates
exports.updateBulkCoordinates = async (req, res) => {
  try {
    const { categoryId, data } = req.body;
    let coordinatesArray = [];

    // Detect input type: JSON array or plain text
    if (Array.isArray(data) && data.length > 0) {
      // JSON input
      // .map() to match each value to each variable
      coordinatesArray = data.map(item => ({
        // Number(itme.x) if we are getting string it convert it in number
        name: item.name,
        x: Math.ceil(Number(item.x)) || 0,
        y: Math.ceil(Number(item.y)) || 0,
        width: Math.ceil(Number(item.width)) || 0,
        height: Math.ceil(Number(item.height)) || 0,
        rotation: Number(item.rotation) || 0,
        elevation: Math.ceil(Number(item.elevation)) || 0
      }));
    } else if (typeof data === "string") {
      // Plain text input
      const frameBlocks = data.split("-");
      // Loop for each frame
      for (const block of frameBlocks) {
        if (!block) continue;

        // split by + --> "1+x:10,y:20"
        const [frameName, values] = block.trim().split("+");
        if (!frameName || !values) continue;

        const coordinateSets = values.split("|");

        for (const coordSet of coordinateSets) {

          const obj = {
            name: frameName,
            x: 0,
            y: 0,
            width: 0,
            height: 0,
            rotation: 0,
            elevation: 0
          };

          coordSet.split(",").forEach(pair => {
            const [key, val] = pair.split(":");
            if (!key || !val) return;

            switch (key.trim().toLowerCase()) {
              case "x": obj.x = Number(val); break;
              case "y": obj.y = Number(val); break;
              case "width": obj.width = Number(val); break;
              case "height": obj.height = Number(val); break;
              case "rotation": obj.rotation = Number(val); break;
              case "elevation": obj.elevation = Number(val); break;
            }
          });

          coordinatesArray.push(obj);
        }
      }
    }

    if (!coordinatesArray.length) {
      return res.status(400).json({
        success: false,
        message: "No valid coordinate data found"
      });
    }

    // Group by asset name
    const groupedByName = {};
    coordinatesArray.forEach(coord => {
      if (!coord.name) return;
      if (!groupedByName[coord.name]) groupedByName[coord.name] = [];
      groupedByName[coord.name].push(coord);
    });

    // Build bulk operations: filter by name + categoryId
    const bulkOps = Object.keys(groupedByName).map(name => ({
      updateOne: {
        filter: { name, categoryId },
        update: { $push: { coordinates: {$each: groupedByName[name] } } }
      }
    }));

    const result = await Asset.bulkWrite(bulkOps, { ordered: false });

    res.status(200).json({
      success: true,
      message: "Coordinates updated successfully",
      matchedCount: result.matchedCount,
      modifiedCount: result.modifiedCount
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};
