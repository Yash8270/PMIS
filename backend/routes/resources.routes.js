const router = require('express').Router();
const {
    getResources, getResourceById, createResource, updateResource, deleteResource,
    getAssignments, createAssignment, deleteAssignment,
} = require('../controllers/resources.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

// Resources
router.get('/', authenticate, getResources);
router.get('/assignments', authenticate, getAssignments);
router.get('/:id', authenticate, getResourceById);
router.post('/', authenticate, createResource);
router.put('/:id', authenticate, updateResource);
router.delete('/:id', authenticate, authorize('admin', 'pm'), deleteResource);

// Assignments
router.post('/assignments', authenticate, createAssignment);
router.delete('/assignments/:id', authenticate, authorize('admin', 'pm'), deleteAssignment);

module.exports = router;
