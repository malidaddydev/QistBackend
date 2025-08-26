const express = require('express');
const router = express.Router();
const { body, query } = require('express-validator');
const { authenticateToken } = require('../middleware/authMiddleware');
const {
  getSubcategories,
  createSubcategory,
  updateSubcategory,
  deleteSubcategory,
  toggleSubcategoryActive,
} = require('../controllers/subcategoryController');

router.get(
  '/subcategories',
  authenticateToken,
  [
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
    query('search').optional().isString().trim(),
    query('status').optional().isIn(['all', 'active', 'inactive']),
    query('sort').optional().isIn(['s.id', 's.name', 'c.name', 's.isActive']),
    query('order').optional().isIn(['asc', 'desc']),
  ],
  getSubcategories
);

router.post(
  '/subcategories',
  authenticateToken,
  [
    body('name').isString().notEmpty().withMessage('Name is required'),
    body('category_id').isInt().withMessage('Valid category ID is required'),
    body('isActive').isBoolean().optional().withMessage('isActive must be a boolean'),
  ],
  createSubcategory
);

router.put(
  '/subcategories/:id',
  authenticateToken,
  [
    body('name').isString().notEmpty().withMessage('Name is required'),
    body('category_id').isInt().withMessage('Valid category ID is required'),
  ],
  updateSubcategory
);

router.patch('/subcategories/:id/toggle', authenticateToken, toggleSubcategoryActive);

router.delete('/subcategories/:id', authenticateToken, deleteSubcategory);

module.exports = router;