const router = require('express').Router();
const {
    getFolders, createFolder, deleteFolder,
    getDocuments, getDocumentById, createDocument, updateDocumentStatus, deleteDocument, addDocumentVersion,
} = require('../controllers/documents.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

// Folders
router.get('/folders', authenticate, getFolders);
router.post('/folders', authenticate, createFolder);
router.delete('/folders/:id', authenticate, authorize('admin', 'pm'), deleteFolder);

// Documents
router.get('/', authenticate, getDocuments);
router.get('/:id', authenticate, getDocumentById);
router.post('/', authenticate, createDocument);
router.patch('/:id/status', authenticate, authorize('admin', 'pm', 'coordinator'), updateDocumentStatus);
router.delete('/:id', authenticate, authorize('admin', 'pm'), deleteDocument);

// Versions
router.post('/:id/versions', authenticate, addDocumentVersion);

module.exports = router;
