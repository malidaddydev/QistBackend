const upload = require('../middlewares/uploadOrderFiles');
const express = require('express');
const router = express.Router();

router.post('/', upload.array('files'), createOrder);

module.exports = router;