const db = require('../config/db');

// ─── Folders ──────────────────────────────────────────────────────────────────

// GET /api/documents/folders?project_id=1
const getFolders = async (req, res) => {
    try {
        const { project_id } = req.query;
        if (!project_id) return res.status(400).json({ success: false, message: 'project_id required.' });
        const [rows] = await db.query(`
            SELECT df.*, COUNT(d.document_id) AS doc_count
            FROM document_folders df
            LEFT JOIN documents d ON df.folder_id = d.folder_id
            WHERE df.project_id = ?
            GROUP BY df.folder_id
            ORDER BY df.folder_name
        `, [project_id]);
        return res.json({ success: true, data: rows });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

// POST /api/documents/folders
const createFolder = async (req, res) => {
    try {
        const { project_id, folder_name, color_hex } = req.body;
        if (!project_id || !folder_name) return res.status(400).json({ success: false, message: 'project_id and folder_name required.' });
        const [result] = await db.query(
            'INSERT INTO document_folders (project_id, folder_name, color_hex) VALUES (?, ?, ?)',
            [project_id, folder_name, color_hex]
        );
        return res.status(201).json({ success: true, message: 'Folder created.', folder_id: result.insertId });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

// DELETE /api/documents/folders/:id
const deleteFolder = async (req, res) => {
    try {
        await db.query('DELETE FROM document_folders WHERE folder_id = ?', [req.params.id]);
        return res.json({ success: true, message: 'Folder deleted.' });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

// ─── Documents ────────────────────────────────────────────────────────────────

// GET /api/documents?project_id=1&folder_id=2&status=approved
const getDocuments = async (req, res) => {
    try {
        const { project_id, folder_id, status } = req.query;
        if (!project_id) return res.status(400).json({ success: false, message: 'project_id required.' });
        let sql = `
            SELECT d.*, df.folder_name, u.name AS uploaded_by_name, u.avatar_initials,
                (SELECT version_label FROM document_versions WHERE document_id = d.document_id AND is_current = 1 LIMIT 1) AS current_version
            FROM documents d
            LEFT JOIN document_folders df ON d.folder_id = df.folder_id
            LEFT JOIN users u ON d.uploaded_by = u.user_id
            WHERE d.project_id = ?
        `;
        const params = [project_id];
        if (folder_id) { sql += ' AND d.folder_id = ?'; params.push(folder_id); }
        if (status) { sql += ' AND d.status = ?'; params.push(status); }
        sql += ' ORDER BY d.created_at DESC';
        const [rows] = await db.query(sql, params);
        return res.json({ success: true, data: rows });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

// GET /api/documents/:id
const getDocumentById = async (req, res) => {
    try {
        const [docs] = await db.query(`
            SELECT d.*, df.folder_name, u.name AS uploaded_by_name
            FROM documents d
            LEFT JOIN document_folders df ON d.folder_id = df.folder_id
            LEFT JOIN users u ON d.uploaded_by = u.user_id
            WHERE d.document_id = ?
        `, [req.params.id]);
        if (docs.length === 0) return res.status(404).json({ success: false, message: 'Document not found.' });
        const [versions] = await db.query(
            'SELECT dv.*, u.name AS uploaded_by_name FROM document_versions dv LEFT JOIN users u ON dv.uploaded_by = u.user_id WHERE dv.document_id = ? ORDER BY dv.uploaded_at DESC',
            [req.params.id]
        );
        return res.json({ success: true, data: { ...docs[0], versions } });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

// POST /api/documents
const createDocument = async (req, res) => {
    try {
        const { doc_code, project_id, folder_id, file_name, file_type, file_size_mb, description, status, version_label, file_path } = req.body;
        if (!project_id || !file_name || !file_type) {
            return res.status(400).json({ success: false, message: 'project_id, file_name, file_type required.' });
        }
        const [result] = await db.query(
            'INSERT INTO documents (doc_code, project_id, folder_id, file_name, file_type, file_size_mb, description, status, uploaded_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [doc_code, project_id, folder_id, file_name, file_type, file_size_mb, description, status || 'draft', req.user?.user_id]
        );
        const docId = result.insertId;
        // Create initial version
        if (version_label && file_path) {
            await db.query(
                'INSERT INTO document_versions (document_id, version_label, file_path, uploaded_by, is_current) VALUES (?, ?, ?, ?, 1)',
                [docId, version_label, file_path, req.user?.user_id]
            );
        }
        return res.status(201).json({ success: true, message: 'Document created.', document_id: docId });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

// PATCH /api/documents/:id/status
const updateDocumentStatus = async (req, res) => {
    try {
        const { status } = req.body;
        await db.query('UPDATE documents SET status = ? WHERE document_id = ?', [status, req.params.id]);
        return res.json({ success: true, message: `Document status updated to ${status}.` });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

// DELETE /api/documents/:id
const deleteDocument = async (req, res) => {
    try {
        await db.query('DELETE FROM document_versions WHERE document_id = ?', [req.params.id]);
        await db.query('DELETE FROM documents WHERE document_id = ?', [req.params.id]);
        return res.json({ success: true, message: 'Document deleted.' });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

// POST /api/documents/:id/versions — Add a new version
const addDocumentVersion = async (req, res) => {
    try {
        const { version_label, file_path, change_notes } = req.body;
        if (!version_label || !file_path) return res.status(400).json({ success: false, message: 'version_label and file_path required.' });
        // Mark previous versions as not current
        await db.query('UPDATE document_versions SET is_current = 0 WHERE document_id = ?', [req.params.id]);
        const [result] = await db.query(
            'INSERT INTO document_versions (document_id, version_label, file_path, uploaded_by, change_notes, is_current) VALUES (?, ?, ?, ?, ?, 1)',
            [req.params.id, version_label, file_path, req.user?.user_id, change_notes]
        );
        return res.status(201).json({ success: true, message: 'Version added.', version_id: result.insertId });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

module.exports = { getFolders, createFolder, deleteFolder, getDocuments, getDocumentById, createDocument, updateDocumentStatus, deleteDocument, addDocumentVersion };
