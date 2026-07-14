const prisma = require('../config/db');
const { success, error } = require('../utils/response');

// Helper: format transaction — convert BigInt to Number for JSON
function formatTransaction(tx) {
  return {
    id: tx.id,
    amount: Number(tx.amount),
    transactionDate: tx.transactionDate.toISOString(),
    notes: tx.notes,
    categoryId: tx.categoryId,
    category: tx.category
      ? {
          id: tx.category.id,
          name: tx.category.name,
          type: tx.category.type,
          isSystem: tx.category.isSystem,
        }
      : null,
    fileUrl: tx.fileUrl,
  };
}

// POST /transactions
exports.create = async (req, res, next) => {
  try {
    const { amount, transactionDate, notes, categoryId } = req.body;
    if (!amount || !transactionDate || !categoryId) {
      return error(res, 'amount, transactionDate, and categoryId are required', 400);
    }

    const fileUrl = req.file ? `/uploads/${req.file.filename}` : null;

    const transaction = await prisma.transaction.create({
      data: {
        amount: BigInt(amount),
        transactionDate: new Date(transactionDate),
        notes: notes || '',
        categoryId,
        userId: req.user.id,
        fileUrl,
      },
      include: { category: true },
    });

    return success(res, formatTransaction(transaction), 'Transaction created', 201);
  } catch (err) {
    next(err);
  }
};

// GET /transactions
exports.getAll = async (req, res, next) => {
  try {
    const { _page, _per_page, search, sortBy, sortDir } = req.query;
    const page = parseInt(_page) || 1;
    const perPage = parseInt(_per_page) || 20;
    const skip = (page - 1) * perPage;

    const where = { userId: req.user.id };
    if (search) {
      where.notes = { contains: search, mode: 'insensitive' };
    }

    const orderBy = {};
    if (sortBy) {
      orderBy[sortBy] = (sortDir || 'desc').toLowerCase();
    } else {
      orderBy.transactionDate = 'desc';
    }

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        orderBy,
        skip,
        take: perPage,
        include: { category: true },
      }),
      prisma.transaction.count({ where }),
    ]);

    return success(res, {
      items: transactions.map(formatTransaction),
      total,
      page,
      perPage,
    }, 'Transactions retrieved');
  } catch (err) {
    next(err);
  }
};

// GET /transactions/:id
exports.getById = async (req, res, next) => {
  try {
    const transaction = await prisma.transaction.findFirst({
      where: { id: req.params.id, userId: req.user.id },
      include: { category: true },
    });
    if (!transaction) return error(res, 'Transaction not found', 404);
    return success(res, formatTransaction(transaction), 'Transaction retrieved');
  } catch (err) {
    next(err);
  }
};

// PUT /transactions/:id
exports.update = async (req, res, next) => {
  try {
    const { amount, transactionDate, notes, categoryId } = req.body;

    const existing = await prisma.transaction.findFirst({
      where: { id: req.params.id, userId: req.user.id },
    });
    if (!existing) return error(res, 'Transaction not found', 404);

    const fileUrl = req.file ? `/uploads/${req.file.filename}` : existing.fileUrl;

    const transaction = await prisma.transaction.update({
      where: { id: req.params.id },
      data: {
        amount: amount ? BigInt(amount) : existing.amount,
        transactionDate: transactionDate ? new Date(transactionDate) : existing.transactionDate,
        notes: notes !== undefined ? notes : existing.notes,
        categoryId: categoryId || existing.categoryId,
        fileUrl,
      },
      include: { category: true },
    });

    return success(res, formatTransaction(transaction), 'Transaction updated');
  } catch (err) {
    next(err);
  }
};

// DELETE /transactions/:id
exports.remove = async (req, res, next) => {
  try {
    const existing = await prisma.transaction.findFirst({
      where: { id: req.params.id, userId: req.user.id },
    });
    if (!existing) return error(res, 'Transaction not found', 404);

    await prisma.transaction.delete({ where: { id: req.params.id } });
    return success(res, null, 'Transaction deleted');
  } catch (err) {
    next(err);
  }
};
