const express = require('express');
const router = express.Router();
const Controller = require('../controller/asset.controller');
const uploadAsset = require('../multer/uploadAsset.multer')
const middleware = require('../middleware/resolveCategory.middleware')
const fetchbearuser = require('../middleware/bearuser');
const adminOnly = require('../middleware/adminOnly');

// Route1: Create Asset using POST "/api/asset/createAsset"
router.post(
    '/createAsset',
    uploadAsset,
    middleware.resolveCategory,
    Controller.createAsset
);

// Route2: Get All Asset using GET "/api/asset/category/:categoryId"
router.get(
    '/category/:categoryId',
    Controller.getAllAssets
);

// Route3: Get Asset by asserId using GET "/api/asset/category/:categoryId"
router.get('/asset/:id', 
    Controller.getAssetById
);

// Route4: Edit Asset using PUT "/api/asset/editAsset/:assetId"
router.put(
    '/editAsset/:assetId',
    uploadAsset,
    Controller.editAssets
);

// Route5: Delete Asset using DELETE "/api/asset/deleteAsset/:assetId"
router.delete(
    '/deleteAsset/:assetId',
    fetchbearuser,
    adminOnly,
    Controller.deleteAssets
);

// Route6: Bulk Updating Coordinate Asset using PUT "/api/asset/updatebulkCoordinates"
router.put(
    '/updatebulkCoordinates',
    Controller.updateBulkCoordinates
);

// Route6: Get All Asset using GET "/api/asset/assetList"
router.get(
    '/assetList',
    Controller.getAssetList
);

module.exports = router;