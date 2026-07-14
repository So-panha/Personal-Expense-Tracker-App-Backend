const prisma = require('../config/db');
const { success, error } = require('../utils/response');

// Helper: format budget for response
function formatBudget(budget) {
  return {
    id: budget.id,
    categoryId: budget.categoryId,
    limitAmount: Number(budget.limitAmount),
    month: budget.month,
    year: budget.year,
    spentAmount: budget._spentAmount !== undefined ? budget._spentAmount : 0,
    warningLevel: budget._warningLevel || null,
    category: budget.category
      ? {
          id: budget.category.id,
          name: budget.category.name,
          type: budget.category.type,
          isSystem: budget.category.isSystem,
        }
      : null,
  };
}

// Compute spent amount for a budget
async function computeSpent(budget) {
  const startDate = new Date(budget.year, budget.month - 1, 1);
  const endDate = new Date(budget.year, budget.month, 1);

  const result = await prisma.transaction.aggregate({
    where: {
      userId: budget.userId,
      categoryId: budget.categoryId,
      transactionDate: { gte: startDate, lt: endDate },
    },
    _sum: { amount: true },
  });

  const spent = Number(result._sum.amount || 0);
  const limit = Number(budget.limitAmount);
  let warningLevel = null;
  if (spent >= limit) warningLevel = 'EXCEEDED';
  else if (spent >= limit * 0.8) warningLevel = 'HIGH';
  else if (spent >= limit * 0.5) warningLevel = 'MEDIUM';

  return { ...budget, _spentAmount: spent, _warningLevel: warningLevel };
}

// POST /budgets
exports.create = async (req, res, next) => {
  try {
    const { categoryId, limitAmount, month, year } = req.body;
    if (!categoryId || !limitAmount || !month || !year) {
      return error(res, 'categoryId, limitAmount, month, and year are required', 400);
    }

    const budget = await prisma.budget.create({
      data: {
        categoryId,
        limitAmount: BigInt(limitAmount),
        month: parseInt(month),
        year: parseInt(year),
        userId: req.user.id,
      },
      include: { category: true },
    });

    const enriched = await computeSpent(budget);
    return success(res, formatBudget(enriched), 'Budget created', 201);
  } catch (err) {
    if (err.code === 'P2002') {
      return error(res, 'A budget already exists for this category/month/year', 409);
    }
    next(err);
  }
};

// GET /budgets
exports.getAll = async (req, res, next) => {
  try {
    const { _page, _per_page, search, sortBy, sortDir } = req.query;
    const page = parseInt(_page) || 1;
    const perPage = parseInt(_per_page) || 50;
    const skip = (page - 1) * perPage;

    const where = { userId: req.user.id };

    const orderBy = {};
    if (sortBy) {
      orderBy[sortBy] = (sortDir || 'desc').toLowerCase();
    } else {
      orderBy.createdAt = 'desc';
    }

    const [budgets, total] = await Promise.all([
      prisma.budget.findMany({
        where,
        orderBy,
        skip,
        take: perPage,
        include: { category: true },
      }),
      prisma.budget.count({ where }),
    ]);

    const enriched = await Promise.all(budgets.map(computeSpent));

    return success(res, {
      items: enriched.map(formatBudget),
      total,
      page,
      perPage,
    }, 'Budgets retrieved');
  } catch (err) {
    next(err);
  }
};

// GET /budgets/:id
exports.getById = async (req, res, next) => {
  try {
    const budget = await prisma.budget.findFirst({
      where: { id: req.params.id, userId: req.user.id },
      include: { category: true },
    });
    if (!budget) return error(res, 'Budget not found', 404);

    const enriched = await computeSpent(budget);
    return success(res, formatBudget(enriched), 'Budget retrieved');
  } catch (err) {
    next(err);
  }
};

// PUT /budgets/:id
exports.update = async (req, res, next) => {
  try {
    const { categoryId, limitAmount, month, year } = req.body;

    const existing = await prisma.budget.findFirst({
      where: { id: req.params.id, userId: req.user.id },
    });
    if (!existing) return error(res, 'Budget not found', 404);

    const budget = await prisma.budget.update({
      where: { id: req.params.id },
      data: {
        categoryId: categoryId || existing.categoryId,
        limitAmount: limitAmount ? BigInt(limitAmount) : existing.limitAmount,
        month: month ? parseInt(month) : existing.month,
        year: year ? parseInt(year) : existing.year,
      },
      include: { category: true },
    });

    const enriched = await computeSpent(budget);
    return success(res, formatBudget(enriched), 'Budget updated');
  } catch (err) {
    next(err);
  }
};

// DELETE /budgets/:id
exports.remove = async (req, res, next) => {
  try {
    const existing = await prisma.budget.findFirst({
      where: { id: req.params.id, userId: req.user.id },
    });
    if (!existing) return error(res, 'Budget not found', 404);

    await prisma.budget.delete({ where: { id: req.params.id } });
    return success(res, null, 'Budget deleted');
  } catch (err) {
    next(err);
  }
};
