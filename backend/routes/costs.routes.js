const router = require('express').Router();
const {
    getCategories, createCategory, updateCategory, deleteCategory,
    getMonthlyBudgets, upsertMonthlyBudget,
    getExpenses, createExpense, updateExpenseStatus, deleteExpense,
} = require('../controllers/costs.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

// Budget Categories
router.get('/categories', authenticate, getCategories);
router.post('/categories', authenticate, authorize('admin', 'pm'), createCategory);
router.put('/categories/:id', authenticate, authorize('admin', 'pm'), updateCategory);
router.delete('/categories/:id', authenticate, authorize('admin', 'pm'), deleteCategory);

// Monthly Budgets
router.get('/monthly', authenticate, getMonthlyBudgets);
router.post('/monthly', authenticate, authorize('admin', 'pm'), upsertMonthlyBudget);

// Expenses
router.get('/expenses', authenticate, getExpenses);
router.post('/expenses', authenticate, createExpense);
router.patch('/expenses/:id/status', authenticate, authorize('admin', 'pm'), updateExpenseStatus);
router.delete('/expenses/:id', authenticate, authorize('admin', 'pm'), deleteExpense);

module.exports = router;
