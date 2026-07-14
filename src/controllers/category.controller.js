const prisma = require('../config/db');
const { success, error } = require('../utils/response');

// Helper: format category for response
function formatCategory(cat) {
  return {
    id: cat.id,
    name: cat.name,
    type: cat.type,
    isSystem: cat.isSystem,
  };
}

// POST /categories
exports.create = async (req, res, next) => {
  try {
    const { name, type, isSystem } = req.body;
    if (!name || !type) return error(res, 'name and type are required', 400);
    if (!['INCOME', 'EXPENSE'].includes(type)) {
      return error(res, 'type must be INCOME or EXPENSE', 400);
    }

    const category = await prisma.category.create({
      data: {
        name,
        type,
        isSystem: isSystem || false,
        userId: req.user.id,
      },
    });
    return success(res, formatCategory(category), 'Category created', 201);
  } catch (err) {
    next(err);
  }
};

// GET /categories
exports.getAll = async (req, res, next) => {
  try {
    const { _page, _per_page, search, sortBy, sortDir } = req.query;
    const page = parseInt(_page) || 1;
    const perPage = parseInt(_per_page) || 50;
    const skip = (page - 1) * perPage;

    const where = { userId: req.user.id };
    if (search) {
      where.name = { contains: search, mode: 'insensitive' };
    }

    const orderBy = {};
    if (sortBy) {
      orderBy[sortBy] = (sortDir || 'asc').toLowerCase();
    } else {
      orderBy.createdAt = 'desc';
    }

    let [categories, total] = await Promise.all([
      prisma.category.findMany({
        where,
        orderBy,
        skip,
        take: perPage,
      }),
      prisma.category.count({ where }),
    ]);

    // Seed default categories if they have none and search isn't active
    if (total === 0 && !search) {
      const defaultCategories = [
        { name: 'Salary', type: 'INCOME', isSystem: true },
        { name: 'Business', type: 'INCOME', isSystem: true },
        { name: 'Rent', type: 'EXPENSE', isSystem: true },
        { name: 'Food & Drinks', type: 'EXPENSE', isSystem: true },
        { name: 'Shopping', type: 'EXPENSE', isSystem: true },
        { name: 'Transportation', type: 'EXPENSE', isSystem: true },
        { name: 'Entertainment', type: 'EXPENSE', isSystem: true },
      ];
      // Seed them in DB
      await prisma.category.createMany({
        data: defaultCategories.map(cat => ({
          name: cat.name,
          type: cat.type,
          isSystem: cat.isSystem,
          userId: req.user.id,
        })),
      });

      // Refetch after seeding
      [categories, total] = await Promise.all([
        prisma.category.findMany({
          where,
          orderBy,
          skip,
          take: perPage,
        }),
        prisma.category.count({ where }),
      ]);
    }

    return success(res, {
      items: categories.map(formatCategory),
      total,
      page,
      perPage,
    }, 'Categories retrieved');
  } catch (err) {
    next(err);
  }
};

// GET /categories/:id
exports.getById = async (req, res, next) => {
  try {
    const category = await prisma.category.findFirst({
      where: { id: req.params.id, userId: req.user.id },
    });
    if (!category) return error(res, 'Category not found', 404);
    return success(res, formatCategory(category), 'Category retrieved');
  } catch (err) {
    next(err);
  }
};

// PUT /categories/:id
exports.update = async (req, res, next) => {
  try {
    const { name } = req.body;
    if (!name) return error(res, 'name is required', 400);

    const existing = await prisma.category.findFirst({
      where: { id: req.params.id, userId: req.user.id },
    });
    if (!existing) return error(res, 'Category not found', 404);

    const category = await prisma.category.update({
      where: { id: req.params.id },
      data: { name },
    });
    return success(res, formatCategory(category), 'Category updated');
  } catch (err) {
    next(err);
  }
};

// DELETE /categories/:id
exports.remove = async (req, res, next) => {
  try {
    const existing = await prisma.category.findFirst({
      where: { id: req.params.id, userId: req.user.id },
    });
    if (!existing) return error(res, 'Category not found', 404);

    await prisma.category.delete({ where: { id: req.params.id } });
    return success(res, null, 'Category deleted');
  } catch (err) {
    next(err);
  }
};
