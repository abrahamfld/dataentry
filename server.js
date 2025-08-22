// server.js
const express = require('express');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');

dotenv.config();

// Cloudinary configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Route to serve register page
app.get('/register', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'register.html'));
});

app.get('/register.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'register.html'));
});

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

// Upload endpoint
app.post('/upload', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    // Convert buffer to base64
    const b64 = Buffer.from(req.file.buffer).toString('base64');
    const dataURI = "data:" + req.file.mimetype + ";base64," + b64;

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(dataURI, {
      folder: 'uploads',
      public_id: `img_${Date.now()}`,
      resource_type: 'auto'
    });

    res.json({
      message: 'Upload successful!',
      imageUrl: result.secure_url,
      publicId: result.public_id,
      details: result
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get optimized image URL
app.get('/optimize/:publicId', async (req, res) => {
  try {
    const { publicId } = req.params;
    const { width, height, crop, quality, format } = req.query;

    const options = {
      fetch_format: format || 'auto',
      quality: quality || 'auto',
      width: width || null,
      height: height || null,
      crop: crop || 'limit'
    };

    // Remove null properties
    Object.keys(options).forEach(key => options[key] === null && delete options[key]);

    const url = cloudinary.url(publicId, options);
    res.json({ optimizedUrl: url });
  } catch (error) {
    console.error('Optimize error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});