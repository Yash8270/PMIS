const db = require('../config/db');

// ─── Budget Categories ───────────────────────────────────────────────────────

// GET /api/costs/categories?project_id=1
const getCategories = async (req, res) => {
    try {
        const { project_id } = req.query;
        if (!project_id) return res.status(400).json({ success: false, message: 'project_id required.' });
        const [rows] = await db.query(`
            SELECT bc.*,
                COALESCE(SUM(CASE WHEN e.status = 'approved' THEN e.amount ELSE 0 END), 0) AS actual_spent,
                bc.total_budget - COALESCE(SUM(CASE WHEN e.status = 'approved' THEN e.amount ELSE 0 END), 0) AS variance
            FROM budget_categories bc
            LEFT JOIN expenses e ON bc.category_id = e.category_id
            WHERE bc.project_id = ?
            GROUP BY bc.category_id
        `, [project_id]);
        return res.json({ success: true, data: rows });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

// POST /api/costs/categories
const createCategory = async (req, res) => {
    try {
        const { project_id, category_name, total_budget } = req.body;
        if (!project_id || !category_name || total_budget === undefined) {
            return res.status(400).json({ success: false, message: 'project_id, category_name, total_budget required.' });
        }
        const [result] = await db.query(
            'INSERT INTO budget_categories (project_id, category_name, total_budget) VALUES (?, ?, ?)',
            [project_id, category_name, total_budget]
        );
        return res.status(201).json({ success: true, message: 'Category created.', category_id: result.insertId });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

// PUT /api/costs/categories/:id
const updateCategory = async (req, res) => {
    try {
        const { category_name, total_budget } = req.body;
        await db.query(
            'UPDATE budget_categories SET category_name = COALESCE(?, category_name), total_budget = COALESCE(?, total_budget) WHERE category_id = ?',
            [category_name, total_budget, req.params.id]
        );
        return res.json({ success: true, message: 'Category updated.' });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

// DELETE /api/costs/categories/:id
const deleteCategory = async (req, res) => {
    try {
        await db.query('DELETE FROM budget_categories WHERE category_id = ?', [req.params.id]);
        return res.json({ success: true, message: 'Category deleted.' });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

// ─── Monthly Budgets ─────────────────────────────────────────────────────────

// GET /api/costs/monthly?project_id=1
const getMonthlyBudgets = async (req, res) => {
    try {
        const { project_id } = req.query;
        if (!project_id) return res.status(400).json({ success: false, message: 'project_id required.' });
        const [rows] = await db.query(
            'SELECT * FROM monthly_budgets WHERE project_id = ? ORDER BY month_year',
            [project_id]
        );
        return res.json({ success: true, data: rows });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

// POST /api/costs/monthly
const upsertMonthlyBudget = async (req, res) => {
    try {
        const { project_id, month_label, month_year, budget_amount, actual_amount, forecast_amount } = req.body;
        if (!project_id || !month_label || !month_year) {
            return res.status(400).json({ success: false, message: 'project_id, month_label, month_year required.' });
        }
        await db.query(
            `INSERT INTO monthly_budgets (project_id, month_label, month_year, budget_amount, actual_amount, forecast_amount)
             VALUES (?, ?, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE budget_amount = VALUES(budget_amount), actual_amount = VALUES(actual_amount), forecast_amount = VALUES(forecast_amount)`,
            [project_id, month_label, month_year, budget_amount, actual_amount, forecast_amount]
        );
        return res.json({ success: true, message: 'Monthly budget saved.' });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

// ─── Expenses ────────────────────────────────────────────────────────────────

// GET /api/costs/expenses?project_id=1&category_id=2&status=pending
const getExpenses = async (req, res) => {
    try {
        const { project_id, category_id, status } = req.query;
        if (!project_id) return res.status(400).json({ success: false, message: 'project_id required.' });
        let sql = `
            SELECT e.*, bc.category_name,
                u1.name AS submitted_by_name, u2.name AS approved_by_name
            FROM expenses e
            LEFT JOIN budget_categories bc ON e.category_id = bc.category_id
            LEFT JOIN users u1 ON e.submitted_by = u1.user_id
            LEFT JOIN users u2 ON e.approved_by = u2.user_id
            WHERE e.project_id = ?
        `;
        const params = [project_id];
        if (category_id) { sql += ' AND e.category_id = ?'; params.push(category_id); }
        if (status) { sql += ' AND e.status = ?'; params.push(status); }
        sql += ' ORDER BY e.expense_date DESC';
        const [rows] = await db.query(sql, params);
        return res.json({ success: true, data: rows });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

// POST /api/costs/expenses
const createExpense = async (req, res) => {
    try {
        const { expense_code, project_id, category_id, description, amount, expense_date, status, submitted_by } = req.body;
        if (!project_id || !description || !amount || !expense_date) {
            return res.status(400).json({ success: false, message: 'project_id, description, amount, expense_date required.' });
        }
        const [result] = await db.query(
            'INSERT INTO expenses (expense_code, project_id, category_id, description, amount, expense_date, status, submitted_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [expense_code, project_id, category_id, description, amount, expense_date, status || 'pending', submitted_by || req.user?.user_id]
        );
        return res.status(201).json({ success: true, message: 'Expense logged.', expense_id: result.insertId });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

// PATCH /api/costs/expenses/:id/status
const updateExpenseStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const approved_by = status === 'approved' ? (req.user?.user_id || null) : null;
        await db.query(
            'UPDATE expenses SET status = ?, approved_by = ? WHERE expense_id = ?',
            [status, approved_by, req.params.id]
        );
        return res.json({ success: true, message: `Expense ${status}.` });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

// DELETE /api/costs/expenses/:id
const deleteExpense = async (req, res) => {
    try {
        await db.query('DELETE FROM expenses WHERE expense_id = ?', [req.params.id]);
        return res.json({ success: true, message: 'Expense deleted.' });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

module.exports = {
    getCategories, createCategory, updateCategory, deleteCategory,
    getMonthlyBudgets, upsertMonthlyBudget,
    getExpenses, createExpense, updateExpenseStatus, deleteExpense,
};
