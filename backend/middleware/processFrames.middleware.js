const { spawn } = require('child_process');
const path = require('path');

const processFramesMiddleware = async (req, res, next) => {
    try {
        // req.files.image contains the uploaded files from uploadAsset.multer
        if (!req.files || !req.files.image || req.files.image.length === 0) {
            return next();
        }

        // The files are uploaded to a category-specific folder.
        // We get the directory path from the first uploaded file.
        const firstFile = req.files.image[0];
        const folderPath = path.resolve(path.dirname(firstFile.path));
        
        // Path to the Python script
        const pythonScriptPath = path.join(__dirname, '..', 'python', 'process_frames.py');

        // Spawn Python process
        const pythonProcess = spawn('python', [pythonScriptPath, folderPath]);

        let stdoutData = '';
        let stderrData = '';

        pythonProcess.stdout.on('data', (data) => {
            stdoutData += data.toString();
        });

        pythonProcess.stderr.on('data', (data) => {
            stderrData += data.toString();
        });

        pythonProcess.on('close', (code) => {
            if (code !== 0) {
                console.error(`Python script exited with code ${code}: ${stderrData}`);
                // We don't necessarily want to block the whole request if Python fails, 
                // but the user requirement implies it's a mandatory step.
                return res.status(500).json({ 
                    success: false, 
                    message: "Frame processing failed",
                    error: stderrData 
                });
            }

            try {
                // Parse coordinates from Python output
                const coordinates = JSON.parse(stdoutData);
                
                // Sanitize names to match the logic in createAssetAndLinkToApp
                // (Replacing special characters with underscores)
                const sanitizedCoordinates = coordinates.map(coord => ({
                    ...coord,
                    name: coord.name.replace(/[^a-zA-Z0-9-_]/g, "_")
                }));

                // Attach results to req.body so the next controller can use them
                req.body.pythonCoordinates = sanitizedCoordinates;
                next();
            } catch (err) {
                console.error("Failed to parse Python output:", stdoutData);
                return res.status(500).json({ 
                    success: false, 
                    message: "Invalid output from frame processing script" 
                });
            }
        });

        // Error handling for spawning process
        pythonProcess.on('error', (err) => {
            console.error("Failed to start Python process:", err);
            return res.status(500).json({ 
                success: false, 
                message: "Internal server error starting frame processor" 
            });
        });

    } catch (error) {
        console.error("processFramesMiddleware error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = processFramesMiddleware;
