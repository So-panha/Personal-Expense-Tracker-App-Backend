const prisma = require('../config/db');
const { success, error } = require('../utils/response');

// Helper: format goal for response
function formatGoal(goal) {
  return {
    id: goal.id,
    name: goal.name,
    targetAmount: Number(goal.targetAmount),
    currentAmount: Number(goal.currentAmount),
    deadline: goal.deadline.toISOString(),
  };
}

// POST /goals
exports.create = async (req, res, next) => {
  try {
    const { name, targetAmount, deadline } = req.body;
    if (!name || !targetAmount || !deadline) {
      return error(res, 'name, targetAmount, and deadline are required', 400);
    }

    const goal = await prisma.goal.create({
      data: {
        name,
        targetAmount: BigInt(targetAmount),
        deadline: new Date(deadline),
        userId: req.user.id,
      },
    });

    return success(res, formatGoal(goal), 'Goal created', 201);
  } catch (err) {
    next(err);
  }
};

// GET /goals
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
      orderBy[sortBy] = (sortDir || 'desc').toLowerCase();
    } else {
      orderBy.createdAt = 'desc';
    }

    const [goals, total] = await Promise.all([
      prisma.goal.findMany({ where, orderBy, skip, take: perPage }),
      prisma.goal.count({ where }),
    ]);

    return success(res, {
      items: goals.map(formatGoal),
      total,
      page,
      perPage,
    }, 'Goals retrieved');
  } catch (err) {
    next(err);
  }
};

// PUT /goals/:id
exports.update = async (req, res, next) => {
  try {
    const { name, targetAmount, deadline } = req.body;

    const existing = await prisma.goal.findFirst({
      where: { id: req.params.id, userId: req.user.id },
    });
    if (!existing) return error(res, 'Goal not found', 404);

    const goal = await prisma.goal.update({
      where: { id: req.params.id },
      data: {
        name: name || existing.name,
        targetAmount: targetAmount ? BigInt(targetAmount) : existing.targetAmount,
        deadline: deadline ? new Date(deadline) : existing.deadline,
      },
    });

    return success(res, formatGoal(goal), 'Goal updated');
  } catch (err) {
    next(err);
  }
};

// PUT /goals/:id/progress
exports.addProgress = async (req, res, next) => {
  try {
    const { amount } = req.body;
    if (!amount) return error(res, 'amount is required', 400);

    const existing = await prisma.goal.findFirst({
      where: { id: req.params.id, userId: req.user.id },
    });
    if (!existing) return error(res, 'Goal not found', 404);

    const newAmount = BigInt(existing.currentAmount) + BigInt(amount);

    const goal = await prisma.goal.update({
      where: { id: req.params.id },
      data: { currentAmount: newAmount },
    });

    return success(res, formatGoal(goal), 'Progress added');
  } catch (err) {
    next(err);
  }
};

// DELETE /goals/:id
exports.remove = async (req, res, next) => {
  try {
    const existing = await prisma.goal.findFirst({
      where: { id: req.params.id, userId: req.user.id },
    });
    if (!existing) return error(res, 'Goal not found', 404);

    await prisma.goal.delete({ where: { id: req.params.id } });
    return success(res, null, 'Goal deleted');
  } catch (err) {
    next(err);
  }
};
