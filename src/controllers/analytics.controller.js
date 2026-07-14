const prisma = require('../config/db');
const { success, error } = require('../utils/response');

// GET /analytics/dashboard-summary
exports.getDashboardSummary = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const [incomeResult, expenseResult] = await Promise.all([
      prisma.transaction.aggregate({
        where: {
          userId,
          category: { type: 'INCOME' },
        },
        _sum: { amount: true },
      }),
      prisma.transaction.aggregate({
        where: {
          userId,
          category: { type: 'EXPENSE' },
        },
        _sum: { amount: true },
      }),
    ]);

    const totalIncome = Number(incomeResult._sum.amount || 0);
    const totalExpenses = Number(expenseResult._sum.amount || 0);
    const netBalance = totalIncome - totalExpenses;

    return success(res, {
      totalIncome,
      totalExpenses,
      netBalance,
    }, 'Dashboard summary retrieved');
  } catch (err) {
    next(err);
  }
};

// GET /analytics/category-breakdown?month=1&year=2026
exports.getCategoryBreakdown = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const month = parseInt(req.query.month);
    const year = parseInt(req.query.year);

    if (!month || !year) {
      return error(res, 'month and year are required', 400);
    }

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 1);

    const transactions = await prisma.transaction.findMany({
      where: {
        userId,
        transactionDate: { gte: startDate, lt: endDate },
      },
      include: { category: true },
    });

    // Group by category
    const categoryMap = {};
    let totalAmount = 0;

    for (const tx of transactions) {
      const catId = tx.categoryId;
      const amt = Number(tx.amount);
      totalAmount += amt;

      if (!categoryMap[catId]) {
        categoryMap[catId] = {
          categoryId: catId,
          categoryName: tx.category ? tx.category.name : 'Others',
          type: tx.category ? tx.category.type : 'EXPENSE',
          totalAmount: 0,
        };
      }
      categoryMap[catId].totalAmount += amt;
    }

    const breakdown = Object.values(categoryMap).map((item) => ({
      ...item,
      percentage: totalAmount > 0 ? parseFloat(((item.totalAmount / totalAmount) * 100).toFixed(2)) : 0,
    }));

    return success(res, breakdown, 'Category breakdown retrieved');
  } catch (err) {
    next(err);
  }
};

// GET /analytics/trends
exports.getTrends = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Get transactions from the last 12 months
    const now = new Date();
    const startDate = new Date(now.getFullYear() - 1, now.getMonth(), 1);

    const transactions = await prisma.transaction.findMany({
      where: {
        userId,
        transactionDate: { gte: startDate },
      },
      include: { category: true },
      orderBy: { transactionDate: 'asc' },
    });

    // Group by month
    const monthMap = {};
    for (const tx of transactions) {
      const date = tx.transactionDate;
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

      if (!monthMap[key]) {
        monthMap[key] = { month: key, income: 0, expense: 0 };
      }

      const amt = Number(tx.amount);
      if (tx.category && tx.category.type === 'INCOME') {
        monthMap[key].income += amt;
      } else {
        monthMap[key].expense += amt;
      }
    }

    const trends = Object.values(monthMap).sort((a, b) => a.month.localeCompare(b.month));

    return success(res, trends, 'Trends retrieved');
  } catch (err) {
    next(err);
  }
};

// GET /analytics/export
exports.exportCsv = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const transactions = await prisma.transaction.findMany({
      where: { userId },
      include: { category: true },
      orderBy: { transactionDate: 'desc' },
    });

    // Build CSV
    const header = 'Date,Category,Type,Amount,Notes\n';
    const rows = transactions
      .map((tx) => {
        const date = tx.transactionDate.toISOString().split('T')[0];
        const cat = tx.category ? tx.category.name : 'N/A';
        const type = tx.category ? tx.category.type : 'EXPENSE';
        const amount = Number(tx.amount);
        const notes = (tx.notes || '').replace(/"/g, '""');
        return `${date},"${cat}",${type},${amount},"${notes}"`;
      })
      .join('\n');

    const csv = header + rows;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=transactions.csv');
    return res.send(csv);
  } catch (err) {
    next(err);
  }
};
