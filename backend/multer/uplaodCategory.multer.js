const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { fileFilter } = require('./multer.config');

const imagetypes = /jpeg|jpg|png|gif|webp/;

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        let dest = '';

        if (file.fieldname === 'image') {
            dest = 'uploads/images/category/';
        } else if (file.fieldname === 'thumbnail') {
            dest = 'uploads/thumbnail/category/';
        } else {
            return cb(new Error('Invalid file field'), null);
        }

        fs.mkdirSync(dest, { recursive: true });
        cb(null, dest);
    },

    filename: function (req, file, cb) {
        if (!req.body.name || !req.body.name.trim()) {
            return cb(new Error('Category name (req.body.name) is required'), false);
        }

        const safeName = req.body.name
            .trim()
            .replace(/[^a-zA-Z0-9-_]/g, '_');

        const ext = path.extname(file.originalname) || '.png';
        cb(null, safeName + ext);
    }
});

const uploadCategory = multer({
    storage,
    limits: { fileSize: 20 * 1024 * 1024 },
    fileFilter: fileFilter(imagetypes)
}).fields([
    { name: 'image', maxCount: 1 },
    { name: 'thumbnail', maxCount: 1 }
]);

module.exports = uploadCategory;