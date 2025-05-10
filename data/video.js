const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs')
//const { fileTypeFromFile } = require('file-type');
const crypto = require('crypto');
const { Video } = require('./../models/index')

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'public/';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    crypto.randomBytes(16, (err, buf) => {
      if (err) return cb(err);
      const ext = path.extname(file.originalname);
      cb(null, `${buf.toString('hex')}${ext}`);
    });
  }
});

const validateFile = async(file) => {
  const allowedExtensions = new Set(['.jpg', '.jpeg', '.png', '.pdf', '.txt','.mp4']);
  const ext = path.extname(file.originalname).toLowerCase();
  if(allowedExtensions.has(ext)){
    return true
  }else {
    return false
  }
}

const upload = multer({
  storage: storage,
  limits: {
    //fileSize: 1024 * 1024 * 10, // 10MB
    files: 5
  },
  fileFilter: (req, file, cb) => {
    const allowedExtensions = new Set(['.jpg', '.jpeg', '.png', '.pdf', '.txt','.mp4'])
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedExtensions.has(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'), false);
    }
  }
});

// Single file upload
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }else{
        res.json({
          message: 'File uploaded successfully',
          url: `http://192.168.30.246:5000/public/${req.file.filename}`
          //url: `http://localhost:5000/public/${req.file.filename}`
        });
    }
  } catch (err) {
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(400).json({ error: err.message });
  }
});

// Multiple files upload
router.post('/upload-multiple', upload.array('files', 5), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    await Promise.all(req.files.map(file => validateFile(file)));

    const uploadedFiles = req.files.map(file => ({
      filename: file.filename,
      url: `https://consult-back.onrender.com/public/${file.filename}`,
      originalName: file.originalname,
      size: file.size,
      mimetype: file.mimetype
    }));

    res.json({
      message: 'Files uploaded successfully',
      files: uploadedFiles
    });
  } catch (err) {
    if (req.files) {
      req.files.forEach(file => {
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      });
    }
    res.status(400).json({ error: err.message });
  }
});
// upload video
router.post('/upload-video', async (req, res) => {
 const {name, description, url} = req.body
  try {
    if (name.trim() === "") {
      return res.status(400).json({ error: 'video name cannot be empty' });
    }else if (description.trim() === "") {
        return res.status(400).json({ error: 'video description cannot be empty' });
    }else if (url.trim() === "") {
        return res.status(400).json({ error: 'video url cannot be empty' });
    }else{
        const vid = await Video.create(req.body)
        return res.json(vid)
    }
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});
// upload video
router.get('/get_videos', async (req, res) => {
  try {
    const vid = await Video.findAll()
    return res.json(vid)
  } catch (err) {
    if (req.files) {
      req.files.forEach(file => {
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      });
    }
    res.status(400).json({ error: err.message });
  }
});

router.post('/delete_video', async (req, res) => {
  const { id, url } = req.body;
  try {
      if (id === null) {
          return res.status(400).json({ error: "id is required" });
      } else if (url.trim() === "") {
          return res.status(400).json({ error: "url is required" });
      } else {
          // Extract the relative path from the URL
          const relativePath = url.replace(/^.*\/public/, '/public');
          const filePath = path.join(__dirname, '..', relativePath);
          
          await fs.promises.unlink(filePath);
          
          const vid = await Video.findOne({
              where: { id }
          });
          
          if (vid) {
              await vid.destroy();
              res.json(vid);
          } else {
              return res.status(400).json({ "error": "video does not exist" });  
          }
      }
  } catch (err) {
      res.status(500).send({ success: false, message: err.message });
  }
});

module.exports = router;