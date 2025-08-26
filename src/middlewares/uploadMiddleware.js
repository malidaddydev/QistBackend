// middlewares/upload.js (replacing your current file)
const multer = require('multer');
const { storage } = require('../Config/cloudinary'); // adjust path as needed

const upload = multer({ storage });

module.exports = upload;
