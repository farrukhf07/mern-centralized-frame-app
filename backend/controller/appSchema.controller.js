const AppSchema = require('../models/AppSchema');


// create new APP
exports.createApp = async (req, res) => {
    try {
        let { name, status, bundleId } = req.body;

        // Basic validation
        if (!name || name.trim() === "") {
            return res.status(400).json({
                success: false,
                error: "Name is required"
            });
        }

        const payload = {
            name: name.trim()
        };

        // Optional fields
        if (status && status.trim() !== "") {
            payload.status = status.trim();
        }

        if (bundleId && bundleId.trim() !== "") {
            payload.bundleId = bundleId.trim();
        }

        const app = await AppSchema.create(payload);

        return res.status(201).json({
            success: true,
            app
        });

    } catch (error) {
        console.error("Error:", error);

        // Handle duplicate key errors (in case any index still exists)
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                error: "Duplicate field value detected (check indexes in DB)"
            });
        }

        return res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// Get all apps
exports.getAllApp = async (req, res) => {
    try {
        const apps = await AppSchema.find().populate('categories');
        res.status(200).json({ success: true, count: apps.length, apps });
    } catch (error) {
        console.error("Error: ", error);
        res.status(500).json({ success: false, error: error.message });
    }
};

// Update App
exports.editApp = async (req, res) => {
    try {
        const { id } = req.params;
        const existingApp = await AppSchema.findById(id);
        if (!existingApp) {
            return res.status(404).json({ success: false, message: 'App not found!' });
        }
        
        const { name, status, bundleId } = req.body;
        const finalbundle = bundleId;

        const updatedData = {
            name: name !== undefined ? name : existingApp.name,
            status: status !== undefined ? status : existingApp.status,
            bundleId: finalbundle !== undefined ? finalbundle : existingApp.bundleId
        };

        const updatedApp = await AppSchema.findByIdAndUpdate(id, updatedData, { new: true }).populate('categories');
        res.status(200).json({ success: true, app: updatedApp });
    } catch (error) {
        console.error("Error: ", error);
        res.status(500).json({ success: false, error: error.message });
    }
};

// delete App
exports.deleteApp = async (req, res) => {
    try {
        const { id } = req.params;
        const app = await AppSchema.findById(id);
        if (!app) {
            return res.status(404).json({ success: false, message: "App not found" });
        }

        await AppSchema.findByIdAndDelete(id);
        res.status(200).json({ success: true, message: "App deleted successfully" });
    } catch (error) {
        console.error("Error: ", error);
        res.status(500).json({ success: false, error: error.message });
    }
};
