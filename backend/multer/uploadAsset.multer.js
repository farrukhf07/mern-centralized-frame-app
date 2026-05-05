const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { fileFilter } = require('./multer.config');

const imagetypes = /jpeg|jpg|png|gif|webp/;

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        if (!req.body.categoryName || !req.body.categoryName.trim()) {
            return cb(
                new Error('categoryName (req.body.categoryName) is required for asset upload'),
                null
            );
        }

        const categoryFolder = req.body.categoryName
            .trim()
            .replace(/[^a-zA-Z0-9-_]/g, '_');

        let basePath = 'uploads/images/Asset/';

        // if (file.fieldname === 'image') {
        //     basePath = 'uploads/images/Asset/';
        // } else if (file.fieldname === 'thumbnail') {
        //     basePath = 'uploads/thumbnail/Asset/';
        // } else {
        //     return cb(new Error('Invalid file field'), null);
        // }

        const dest = path.join(basePath, categoryFolder + '/');
        fs.mkdirSync(dest, { recursive: true });
        cb(null, dest);
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname);
    }
});

const uploadAsset = multer({
    storage,
    limits: {
        fileSize: 20 * 1024 * 1024,
        files: 50
    },
    fileFilter: fileFilter(imagetypes)
}).fields([
    { name: 'image', maxCount: 25 },
    { name: 'thumbnail', maxCount: 25 }
]);

module.exports = uploadAsset;