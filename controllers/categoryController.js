const pool = require('../config/db');
const { validationResult } = require('express-validator');

const getCategories = async (req, res) => {
  const { page = 1, limit = 10, search = '', status = 'all', sort = 'name', order = 'asc' } = req.query;
  const offset = (page - 1) * limit;
  
  try {
    let query = `
      SELECT id, name, description, isActive 
      FROM Categories 
      WHERE 1=1
    `;
    let countQuery = 'SELECT COUNT(*) as total FROM Categories WHERE 1=1';
    const queryParams = [];
    
    // Search functionality
    if (search) {
      query += ' AND (name LIKE ? OR description LIKE ? OR id = ?)';
      countQuery += ' AND (name LIKE ? OR description LIKE ? OR id = ?)';
      const searchTerm = `%${search}%`;
      queryParams.push(searchTerm, searchTerm, isNaN(search) ? 0 : search);
    }
    
    // Status filter
    if (status === 'active') {
      query += ' AND isActive = ?';
      countQuery += ' AND isActive = ?';
      queryParams.push(true);
    } else if (status === 'inactive') {
      query += ' AND isActive = ?';
      countQuery += ' AND isActive = ?';
      queryParams.push(false);
    }
    
    // Sorting
    const validSortFields = ['id', 'name', 'isActive'];
    const sortField = validSortFields.includes(sort) ? sort : 'name';
    const sortOrder = order.toLowerCase() === 'desc' ? 'DESC' : 'ASC';
    query += ` ORDER BY ${sortField} ${sortOrder}`;
    
    // Pagination
    query += ' LIMIT ? OFFSET ?';
    queryParams.push(Number(limit), Number(offset));
    
    const [categories] = await pool.query(query, queryParams);
    const [countResult] = await pool.query(countQuery, queryParams.slice(0, queryParams.length - 2));
    const totalItems = countResult[0].total;
    
    const [subcategories] = await pool.query('SELECT id, name, category_id FROM Subcategories');
    
    const categoriesWithSubcategories = categories.map(category => ({
      ...category,
      subcategories: subcategories
        .filter(sub => sub.category_id === category.id)
        .map(({ id, name }) => ({ id, name }))
    }));

    res.status(200).json({
      data: categoriesWithSubcategories,
      pagination: {
        totalItems,
        totalPages: Math.ceil(totalItems / limit),
        currentPage: Number(page),
        limit: Number(limit)
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
};

const getOnlyTrueCategories = async (req, res) => {
  try {
    const [categories] = await pool.query('SELECT id, name, description, isActive FROM Categories WHERE isActive = ?', [true]);
    
    const [subcategories] = await pool.query('SELECT id, name, category_id FROM Subcategories WHERE isActive = ?', [true]);
    
    const categoriesWithSubcategories = categories.map(category => ({
      ...category,
      subcategories: subcategories
        .filter(sub => sub.category_id === category.id)
        .map(({ id, name }) => ({ id, name }))
    }));

    res.status(200).json(categoriesWithSubcategories);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
};

const createCategory = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { name, description, isActive = true } = req.body;
  try {
    const [result] = await pool.query(
      'INSERT INTO Categories (name, description, isActive) VALUES (?, ?, ?)',
      [name, description || null, isActive]
    );
    res.status(201).json({ id: result.insertId, name, description, isActive });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create category' });
  }
};

const updateCategory = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { name, description } = req.body;
  const { id } = req.params;
  try {
    const [current] = await pool.query('SELECT isActive FROM Categories WHERE id = ?', [id]);
    if (current.length === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }
    const isActive = current[0].isActive;
    const [result] = await pool.query(
      'UPDATE Categories SET name = ?, description = ?, isActive = ? WHERE id = ?',
      [name, description || null, isActive, id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }
    res.status(200).json({ id, name, description, isActive });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update category' });
  }
};

const deleteCategory = async (req, res) => {
  try {
    const [result] = await pool.query('DELETE FROM Categories WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }
    res.status(200).json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to delete category' });
  }
};

const toggleCategoryActive = async (req, res) => {
  const { id } = req.params;
  try {
    const [category] = await pool.query('SELECT isActive FROM Categories WHERE id = ?', [id]);
    if (category.length === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }
    const newIsActive = !category[0].isActive;
    await pool.query('UPDATE Categories SET isActive = ? WHERE id = ?', [newIsActive, id]);
    res.status(200).json({ id, isActive: newIsActive });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to toggle category status' });
  }
};

module.exports = {
  getCategories,
  getOnlyTrueCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  toggleCategoryActive,
};