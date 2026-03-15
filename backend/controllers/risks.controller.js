const db = require('../config/db');

// GET /api/risks?project_id=1&status=open&category=Financial
const getRisks = async (req, res) => {
    try {
        const { project_id, status, category } = req.query;
        if (!project_id) return res.status(400).json({ success: false, message: 'project_id required.' });
        let sql = `
            SELECT r.*, u.name AS owner_name, u.avatar_initials
            FROM risks r
            LEFT JOIN users u ON r.owner_id = u.user_id
            WHERE r.project_id = ?
        `;
        const params = [project_id];
        if (status) { sql += ' AND r.status = ?'; params.push(status); }
        if (category) { sql += ' AND r.category = ?'; params.push(category); }
        sql += ' ORDER BY r.risk_score DESC';
        const [rows] = await db.query(sql, params);
        return res.json({ success: true, data: rows });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

// GET /api/risks/:id
const getRiskById = async (req, res) => {
    try {
        const [rows] = await db.query(
            'SELECT r.*, u.name AS owner_name FROM risks r LEFT JOIN users u ON r.owner_id = u.user_id WHERE r.risk_id = ?',
            [req.params.id]
        );
        if (rows.length === 0) return res.status(404).json({ success: false, message: 'Risk not found.' });
        return res.json({ success: true, data: rows[0] });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

// POST /api/risks
const createRisk = async (req, res) => {
    try {
        const { risk_code, project_id, title, category, probability, impact, owner_id, status, trend, mitigation } = req.body;
        if (!project_id || !title || !category || !probability || !impact) {
            return res.status(400).json({ success: false, message: 'project_id, title, category, probability, impact required.' });
        }
        const [result] = await db.query(
            'INSERT INTO risks (risk_code, project_id, title, category, probability, impact, owner_id, status, trend, mitigation) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [risk_code, project_id, title, category, probability, impact, owner_id, status || 'open', trend || 'stable', mitigation]
        );
        return res.status(201).json({ success: true, message: 'Risk created.', risk_id: result.insertId });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

// PUT /api/risks/:id
const updateRisk = async (req, res) => {
    try {
        const { title, category, probability, impact, owner_id, status, trend, mitigation } = req.body;
        await db.query(
            `UPDATE risks SET
                title = COALESCE(?, title),
                category = COALESCE(?, category),
                probability = COALESCE(?, probability),
                impact = COALESCE(?, impact),
                owner_id = COALESCE(?, owner_id),
                status = COALESCE(?, status),
                trend = COALESCE(?, trend),
                mitigation = COALESCE(?, mitigation)
            WHERE risk_id = ?`,
            [title, category, probability, impact, owner_id, status, trend, mitigation, req.params.id]
        );
        return res.json({ success: true, message: 'Risk updated.' });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

// DELETE /api/risks/:id
const deleteRisk = async (req, res) => {
    try {
        await db.query('DELETE FROM risks WHERE risk_id = ?', [req.params.id]);
        return res.json({ success: true, message: 'Risk deleted.' });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

// GET /api/risks/trend?project_id=1
const getRiskTrend = async (req, res) => {
    try {
        const { project_id } = req.query;
        if (!project_id) return res.status(400).json({ success: false, message: 'project_id required.' });
        const [rows] = await db.query(
            'SELECT * FROM risk_trend_log WHERE project_id = ? ORDER BY month_year',
            [project_id]
        );
        return res.json({ success: true, data: rows });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

// POST /api/risks/trend — Log a monthly snapshot
const logRiskTrend = async (req, res) => {
    try {
        const { project_id, month_label, month_year } = req.body;
        if (!project_id || !month_label || !month_year) {
            return res.status(400).json({ success: false, message: 'project_id, month_label, month_year required.' });
        }
        // Auto-calculate counts from current risks
        const [[{ high }]] = await db.query('SELECT COUNT(*) AS high FROM risks WHERE project_id = ? AND risk_score >= 15', [project_id]);
        const [[{ medium }]] = await db.query('SELECT COUNT(*) AS medium FROM risks WHERE project_id = ? AND risk_score >= 8 AND risk_score < 15', [project_id]);
        const [[{ low }]] = await db.query('SELECT COUNT(*) AS low FROM risks WHERE project_id = ? AND risk_score < 8', [project_id]);

        await db.query(
            'INSERT INTO risk_trend_log (project_id, month_label, month_year, high_count, medium_count, low_count) VALUES (?, ?, ?, ?, ?, ?)',
            [project_id, month_label, month_year, high, medium, low]
        );
        return res.status(201).json({ success: true, message: 'Trend snapshot logged.' });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

// GET /api/risks/matrix?project_id=1 — For risk probability-impact matrix
const getRiskMatrix = async (req, res) => {
    try {
        const { project_id } = req.query;
        if (!project_id) return res.status(400).json({ success: false, message: 'project_id required.' });
        const [rows] = await db.query(
            'SELECT risk_id, risk_code, title, probability, impact, risk_score, status FROM risks WHERE project_id = ? AND status != "closed"',
            [project_id]
        );
        return res.json({ success: true, data: rows });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

module.exports = { getRisks, getRiskById, createRisk, updateRisk, deleteRisk, getRiskTrend, logRiskTrend, getRiskMatrix };
