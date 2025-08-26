const { validationResult } = require("express-validator");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const getSubcategories = async (req, res) => {
  const {
    page = 1,
    limit = 10,
    search = "",
    status = "all",
    sort = "name",
    order = "asc",
  } = req.query;
  const offset = (page - 1) * limit;

  try {
    // Filters
    const where = {
      category: {}, // to allow join filtering later
    };

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { id: isNaN(search) ? undefined : Number(search) },
        { category: { name: { contains: search } } },
      ].filter(Boolean);
    }

    if (status === "active") where.isActive = true;
    if (status === "inactive") where.isActive = false;

    // Sorting
    const validSortFields = ["id", "name", "isActive", "category.name"];
    const sortField = validSortFields.includes(sort) ? sort : "name";
    const sortOrder = order.toLowerCase() === "desc" ? "desc" : "asc";

    // Prisma needs nested ordering if sorting by category name
    let orderBy = {};
    if (sortField === "category.name") {
      orderBy = { category: { name: sortOrder } };
    } else {
      orderBy = { [sortField]: sortOrder };
    }

    // Fetch with join
    const subcategories = await prisma.subcategories.findMany({
      where,
      skip: Number(offset),
      take: Number(limit),
      orderBy,
      include: {
        category: { select: { id: true, name: true } },
      },
    });

    // Count
    const totalItems = await prisma.subcategories.count({ where });

    // Format response (flat with category_name)
    const formatted = subcategories.map((s) => ({
      id: s.id,
      name: s.name,
      category_id: s.categoryId,
      category_name: s.category.name,
      isActive: s.isActive,
    }));

    res.status(200).json({
      data: formatted,
      pagination: {
        totalItems,
        totalPages: Math.ceil(totalItems / limit),
        currentPage: Number(page),
        limit: Number(limit),
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch subcategories" });
  }
};

const createSubcategory = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { name, category_id, isActive = true } = req.body;

  try {
    // Check if category exists
    const category = await prisma.category.findUnique({
      where: { id: Number(category_id) },
    });
    if (!category) {
      return res.status(400).json({ error: "Invalid category ID" });
    }

    const newSubcategory = await prisma.subcategories.create({
      data: { name, categoryId: Number(category_id), isActive },
    });

    res.status(201).json(newSubcategory);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to create subcategory" });
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
    // Validate category
    const category = await prisma.category.findUnique({
      where: { id: Number(category_id) },
    });
    if (!category) {
      return res.status(400).json({ error: "Invalid category ID" });
    }

    // Check if subcategory exists
    const current = await prisma.subcategories.findUnique({
      where: { id: Number(id) },
    });
    if (!current) {
      return res.status(404).json({ error: "Subcategory not found" });
    }

    const updated = await prisma.subcategories.update({
      where: { id: Number(id) },
      data: {
        name,
        categoryId: Number(category_id),
        isActive: current.isActive,
      },
    });

    res.status(200).json(updated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to update subcategory" });
  }
};

const deleteSubcategory = async (req, res) => {
  try {
    await prisma.subcategories.delete({ where: { id: Number(req.params.id) } });
    res.status(200).json({ message: "Subcategory deleted successfully" });
  } catch (error) {
    if (error.code === "P2025") {
      return res.status(404).json({ error: "Subcategory not found" });
    }
    console.error(error);
    res.status(500).json({ error: "Failed to delete subcategory" });
  }
};

const toggleSubcategoryActive = async (req, res) => {
  const { id } = req.params;
  try {
    const subcategory = await prisma.subcategories.findUnique({
      where: { id: Number(id) },
    });
    if (!subcategory) {
      return res.status(404).json({ error: "Subcategory not found" });
    }

    const updated = await prisma.subcategories.update({
      where: { id: Number(id) },
      data: { isActive: !subcategory.isActive },
    });

    res.status(200).json(updated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to toggle subcategory status" });
  }
};

module.exports = {
  getSubcategories,
  createSubcategory,
  updateSubcategory,
  deleteSubcategory,
  toggleSubcategoryActive,
};
