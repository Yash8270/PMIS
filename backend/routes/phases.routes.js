const router = require('express').Router();
const { getPhasesByProject, createPhase, updatePhase, deletePhase } = require('../controllers/phases.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

router.get('/', authenticate, getPhasesByProject);
router.post('/', authenticate, authorize('admin', 'pm'), createPhase);
router.put('/:id', authenticate, authorize('admin', 'pm'), updatePhase);
router.delete('/:id', authenticate, authorize('admin', 'pm'), deletePhase);

module.exports = router;
