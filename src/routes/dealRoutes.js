const { createDealOfTheDay } = require('../controllers/dealOfTheDayController');
const upload = require('../middlewares/uploadMiddleware');
const express = require('express');
const router = express.Router();


router.post('/deal-of-the-day', createDealOfTheDay);


module.exports = router;