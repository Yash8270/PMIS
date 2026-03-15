const router = require('express').Router();
const { getAllProjects, getProjectById, createProject, updateProject, deleteProject, getProjectStats } = require('../controllers/projects.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

router.get('/', authenticate, getAllProjects);
router.get('/:id', authenticate, getProjectById);
router.get('/:id/stats', authenticate, getProjectStats);
router.post('/', authenticate, authorize('admin', 'pm'), createProject);
router.put('/:id', authenticate, authorize('admin', 'pm'), updateProject);
router.delete('/:id', authenticate, authorize('admin'), deleteProject);

module.exports = router;
