const express = require('express');
const router = express.Router();
const { body, query } = require('express-validator');
const { authenticateToken } = require('../middleware/authMiddleware');
const {
  getCategories,
  getOnlyTrueCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  toggleCategoryActive,
} = require('../controllers/categoryController');

router.get(
  '/all-categories',
  authenticateToken,
  [
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
    query('search').optional().isString().trim(),
    query('status').optional().isIn(['all', 'active', 'inactive']),
    query('sort').optional().isIn(['id', 'name', 'isActive']),
    query('order').optional().isIn(['asc', 'desc']),
  ],
  getCategories
);
router.get('/categories', getOnlyTrueCategories);

router.post(
  '/categories',
  authenticateToken,
  [
    body('name').isString().notEmpty().withMessage('Name is required'),
    body('description').isString().optional(),
    body('isActive').isBoolean().optional().withMessage('isActive must be a boolean'),
  ],
  createCategory
);

router.put(
  '/categories/:id',
  authenticateToken,
  [
    body('name').isString().notEmpty().withMessage('Name is required'),
    body('description').isString().optional(),
    body('isActive').isBoolean().optional().withMessage('isActive must be a boolean'),
  ],
  updateCategory
);

router.delete('/categories/:id', authenticateToken, deleteCategory);

router.patch('/categories/:id/toggle', authenticateToken, toggleCategoryActive);

module.exports = router;