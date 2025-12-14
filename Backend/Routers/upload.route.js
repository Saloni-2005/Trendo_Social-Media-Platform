const express = require('express');
const router = express.Router();
const { upload } = require('../utils/cloudinary');

router.post('/', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }

  // Cloudinary returns the URL in req.file.path
  res.status(200).json({
    url: req.file.path,
    type: req.file.mimetype.startsWith('image/') ? 'image' : 'video',
    originalName: req.file.originalname
  });
});

module.exports = router;

module.exports = router;
