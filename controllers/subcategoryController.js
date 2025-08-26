const pool = require('../config/db');
const { validationResult } = require('express-validator');

const getSubcategories = async (req, res) => {
  const { page = 1, limit = 10, search = '', status = 'all', sort = 'name', order = 'asc' } = req.query;
  const offset = (page - 1) * limit;

  try {
    let query = `
      SELECT s.id, s.name, s.category_id, c.name AS category_name, s.isActive
      FROM Subcategories s
      JOIN Categories c ON s.category_id = c.id
      WHERE 1=1
    `;
    let countQuery = `
      SELECT COUNT(*) as total
      FROM Subcategories s
      JOIN Categories c ON s.category_id = c.id
      WHERE 1=1
    `;
    const queryParams = [];

    // Search functionality
    if (search) {
      query += ' AND (s.name LIKE ? OR c.name LIKE ? OR s.id = ?)';
      countQuery += ' AND (s.name LIKE ? OR c.name LIKE ? OR s.id = ?)';
      const searchTerm = `%${search}%`;
      queryParams.push(searchTerm, searchTerm, isNaN(search) ? 0 : search);
    }

    // Status filter
    if (status === 'active') {
      query += ' AND s.isActive = ?';
      countQuery += ' AND s.isActive = ?';
      queryParams.push(true);
    } else if (status === 'inactive') {
      query += ' AND s.isActive = ?';
      countQuery += ' AND s.isActive = ?';
      queryParams.push(false);
    }

    // Sorting
    const validSortFields = ['s.id', 's.name', 'c.name', 's.isActive'];
    const sortField = validSortFields.includes(sort) ? sort : 's.name';
    const sortOrder = order.toLowerCase() === 'desc' ? 'DESC' : 'ASC';
    query += ` ORDER BY ${sortField} ${sortOrder}`;

    // Pagination
    query += ' LIMIT ? OFFSET ?';
    queryParams.push(Number(limit), Number(offset));

    const [subcategories] = await pool.query(query, queryParams);
    const [countResult] = await pool.query(countQuery, queryParams.slice(0, queryParams.length - 2));
    const totalItems = countResult[0].total;

    res.status(200).json({
      data: subcategories,
      pagination: {
        totalItems,
        totalPages: Math.ceil(totalItems / limit),
        currentPage: Number(page),
        limit: Number(limit),
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch subcategories' });
  }
};

const createSubcategory = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { name, category_id, isActive = true } = req.body;
  try {
    const [categoryCheck] = await pool.query('SELECT id FROM Categories WHERE id = ?', [category_id]);
    if (categoryCheck.length === 0) {
      return res.status(400).json({ error: 'Invalid category ID' });
    }
    const [result] = await pool.query(
      'INSERT INTO Subcategories (name, category_id, isActive) VALUES (?, ?, ?)',
      [name, category_id, isActive]
    );
    res.status(201).json({ id: result.insertId, name, category_id, isActive });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create subcategory' });
  }
};

const updateSubcategory = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { name, category_id } = req.body;
  const { id } = req.params;
  try {
    const [categoryCheck] = await pool.query('SELECT id FROM Categories WHERE id = ?', [category_id]);
    if (categoryCheck.length === 0) {
      return res.status(400).json({ error: 'Invalid category ID' });
    }
    const [current] = await pool.query('SELECT isActive FROM Subcategories WHERE id = ?', [id]);
    if (current.length === 0) {
      return res.status(404).json({ error: 'Subcategory not found' });
    }
    const isActive = current[0].isActive;
    const [result] = await pool.query(
      'UPDATE Subcategories SET name = ?, category_id = ?, isActive = ? WHERE id = ?',
      [name, category_id, isActive, id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Subcategory not found' });
    }
    res.status(200).json({ id, name, category_id, isActive });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update subcategory' });
  }
};

const deleteSubcategory = async (req, res) => {
  try {
    const [result] = await pool.query('DELETE FROM Subcategories WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Subcategory not found' });
    }
    res.status(200).json({ message: 'Subcategory deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to delete subcategory' });
  }
};

const toggleSubcategoryActive = async (req, res) => {
  const { id } = req.params;
  try {
    const [subcategory] = await pool.query('SELECT isActive FROM Subcategories WHERE id = ?', [id]);
    if (subcategory.length === 0) {
      return res.status(404).json({ error: 'Subcategory not found' });
    }
    const newIsActive = !subcategory[0].isActive;
    await pool.query('UPDATE Subcategories SET isActive = ? WHERE id = ?', [newIsActive, id]);
    res.status(200).json({ id, isActive: newIsActive });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to toggle subcategory status' });
  }
};

module.exports = {
  getSubcategories,
  createSubcategory,
  updateSubcategory,
  deleteSubcategory,
  toggleSubcategoryActive,
};