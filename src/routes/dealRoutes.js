const { createDealOfTheDay, getDealOfTheDayByDate, getAllDealOfTheDay } = require('../controllers/dealOfTheDayController');
const upload = require('../middlewares/uploadMiddleware');
const express = require('express');
const router = express.Router();


router.post('/deal-of-the-day', createDealOfTheDay);
router.get('/deal-of-the-day', getAllDealOfTheDay);
router.get('/deal-of-the-day/:date', getDealOfTheDayByDate);


module.exports = router;