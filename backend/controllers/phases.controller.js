const db = require('../config/db');

// GET /api/phases?project_id=1
const getPhasesByProject = async (req, res) => {
    try {
        const { project_id } = req.query;
        if (!project_id) return res.status(400).json({ success: false, message: 'project_id is required.' });
        const [rows] = await db.query(
            'SELECT * FROM project_phases WHERE project_id = ? ORDER BY phase_order',
            [project_id]
        );
        return res.json({ success: true, data: rows });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

// POST /api/phases
const createPhase = async (req, res) => {
    try {
        const { project_id, phase_name, phase_order, color_hex } = req.body;
        if (!project_id || !phase_name) {
            return res.status(400).json({ success: false, message: 'project_id and phase_name are required.' });
        }
        const [result] = await db.query(
            'INSERT INTO project_phases (project_id, phase_name, phase_order, color_hex) VALUES (?, ?, ?, ?)',
            [project_id, phase_name, phase_order, color_hex]
        );
        return res.status(201).json({ success: true, message: 'Phase created.', phase_id: result.insertId });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

// PUT /api/phases/:id
const updatePhase = async (req, res) => {
    try {
        const { phase_name, phase_order, color_hex } = req.body;
        await db.query(
            'UPDATE project_phases SET phase_name = COALESCE(?, phase_name), phase_order = COALESCE(?, phase_order), color_hex = COALESCE(?, color_hex) WHERE phase_id = ?',
            [phase_name, phase_order, color_hex, req.params.id]
        );
        return res.json({ success: true, message: 'Phase updated.' });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

// DELETE /api/phases/:id
const deletePhase = async (req, res) => {
    try {
        await db.query('DELETE FROM project_phases WHERE phase_id = ?', [req.params.id]);
        return res.json({ success: true, message: 'Phase deleted.' });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

module.exports = { getPhasesByProject, createPhase, updatePhase, deletePhase };
