const connectToMongo = require('./db')
const express = require('express');
require('dotenv').config();
const path = require('path');
var cors = require('cors')
const multer = require('multer');
const { exec } = require('child_process');
const fs = require('fs');
const crypto = require('crypto');

connectToMongo();
const app = express()
const port = 3003

// Use api with frontend
app.use(cors())

app.use(express.json());

// For image to see in browser also
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Available Routes
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/user', require('./routes/user.routes'));
app.use('/api/app', require('./routes/app.routes'));
app.use('/api/category', require('./routes/category.routes'));
app.use('/api/asset', require('./routes/asset.routes'));
app.use('/api/appConfig', require('./routes/appContentSchema.routes'));
app.use('/api/contact', require('./routes/contactRequest.routes'));

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    if (!req.uploadId) req.uploadId = crypto.randomUUID();
    const uploadPath = path.join(__dirname, 'uploads', req.uploadId);
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  }
});
const upload = multer({ storage: storage });

app.post('/process-image', upload.array('files'), (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ error: "No image files uploaded" });
  }

  const uploadDir = req.files[0].destination;
  const pythonExecutable = process.platform === 'win32' ? 'python' : 'python3';
  const pythonScript = path.join(__dirname, 'python', 'process_frames.py');

  exec(`"${pythonExecutable}" "${pythonScript}" "${uploadDir}"`, (error, stdout, stderr) => {
    if (error) {
      console.error("Python Execution Error: ", error);
      console.error("stderr: ", stderr);
      return res.status(500).json({ error: "Failed to process image" });
    }
    try {
      const outputLines = stdout.trim().split('\n');
      const jsonResponse = JSON.parse(outputLines[outputLines.length - 1]);
      res.json(jsonResponse);
    } catch(err) {
      console.error("JSON Parsing Error: ", err);
      console.log("Raw Output: ", stdout);
      res.status(500).json({ error: "Invalid JSON response from python script" });
    }
  });
});

app.listen(port, ()=>{
    console.log(`App listening at http://localhost:${port}`)
})
