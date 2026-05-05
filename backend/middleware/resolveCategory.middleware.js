const Category = require('../models/Category');

exports.resolveCategory = async (req, res, next) => {
    try {
        if (!req.body.categoryId) {
            return res.status(400).json({ 
                success: false, 
                message: 'categoryId is required' 
            });
        }

        const category = await Category.findById(req.body.categoryId);
        if (!category) {
            return res.status(404).json({ 
                success: false, 
                message: 'Category not found' 
            });
        }

        const sanitizedFolder = category.name.trim().replace(/[^a-zA-Z0-9-_]/g, '_');
        req.catFolder = sanitizedFolder;   // For folder structure
        req.category = category;          // For easy access in controller

        next();
    } catch (err) {
        return res.status(500).json({ 
            success: false, 
            message: err.message 
        });
    }
};