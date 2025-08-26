const express = require('express');
const router = express.Router();
const { signup, login, getDashboard } = require('../controllers/authController');
const { authenticateToken } = require('../middleware/authMiddleware');

router.post('/signup', signup);

router.post('/login', login);

router.get('/dashboard', authenticateToken, getDashboard);

module.exports = router;