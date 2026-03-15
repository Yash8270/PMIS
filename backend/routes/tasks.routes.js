const router = require('express').Router();
const { getTasksByProject, getTaskById, createTask, updateTask, deleteTask } = require('../controllers/tasks.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

router.get('/', authenticate, getTasksByProject);
router.get('/:id', authenticate, getTaskById);
router.post('/', authenticate, createTask);
router.put('/:id', authenticate, updateTask);
router.delete('/:id', authenticate, authorize('admin', 'pm'), deleteTask);

module.exports = router;
