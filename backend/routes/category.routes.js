const express = require('express');
const router = express.Router();
const Controller = require('../controller/category.controller');
const uploadCategory = require('../multer/uplaodCategory.multer');
const fetchbearuser = require('../middleware/bearuser');
const adminOnly = require('../middleware/adminOnly');

// Route1: Create Category using: POST "api/app/createCategory"
router.post(
    '/createCategory/:appId',
    uploadCategory,
    Controller.createCategory
);

// Route2: Add Existing Categories to App using: POST "api/app/addExistingCategoryToApp"
router.post(
    '/addExistingCategoryToApp/:appId', 
    Controller.addExistingCategoryToApp
);

// Route3: GET Categories using GET "api/app/getCategories/:appId"
router.get(
    '/getCategories/:appId',
    Controller.getCategories
);

// Route4: GET All Categories using GET "api/app/getAllCategories"
router.get(
    '/getAllCategories', 
    Controller.getAllCategories
);

// Route5: Remove Category from App using: POST "api/app/removeCategoryFromApp"
router.post(
    '/removeCategoryFromApp/:appId',
    Controller.removeCategoryFromApp
);

// Route6: Update Category using: POST "api/app/editCategory"
router.post(
    '/editCategory/:id',
    uploadCategory,
    Controller.editCategory
);

// Route7: GET single category by ID
router.get(
    '/getCategoryById/:id',
    Controller.getCategoryById
);

router.delete(
    '/deleteCategory/:id',
    fetchbearuser,
    adminOnly,
    Controller.deleteCategory
);
module.exports = router;