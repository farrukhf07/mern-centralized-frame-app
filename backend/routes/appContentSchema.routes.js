const express = require('express');
const router = express.Router();
const AppContentController = require('../controller/appContentSchema.controller');
const fetchbearuser = require('../middleware/bearuser');
const adminOnly = require('../middleware/adminOnly');

const uploadCategory = require('../multer/uplaodCategory.multer');
const uploadAsset = require('../multer/uploadAsset.multer');
const processFramesMiddleware = require('../middleware/processFrames.middleware');

/**
 * GET /api/appConfig/view/:appId
 */
router.get('/view/:appId', AppContentController.getAppView);

// GET /api/appConfig/full/:appId
// router.get('/full/:appId', AppContentController.getAppConfig);

/**
 * POST /api/appConfig/createCategory/:appId
 */
router.post(
    '/createCategory/:appId',
    uploadCategory,
    AppContentController.createAppCategory
);

/**
 *   POST /api/appConfig/createAsset
 */
router.post(
    '/createAsset',
    uploadAsset,
    processFramesMiddleware,
    AppContentController.createAssetAndLinkToApp
);

/**
 *  POST /api/appConfig/addExistingCategory
 */
router.post('/addExistingCategory', AppContentController.addCategoryToConfig);

/**
 * PATCH /api/appConfig/deleteCategory
 */
router.patch('/deleteCategory', AppContentController.deleteAppCategory);

/**
 * POST /api/appConfig/removeAsset
 */
router.patch('/removeAsset', AppContentController.removeAssetFromApp);

/**
 * POST /api/appConfig/add-existing-assets
 */
router.post('/add-existing-assets', AppContentController.addExistingAssetsToApp);

/**
 * DELETE /api/appConfig/appcontents/:categoryId
 */
router.delete(
    '/appcontents/:categoryId',
    fetchbearuser,
    adminOnly,
    AppContentController.deleteAppContentByCategoryId
);

module.exports = router;