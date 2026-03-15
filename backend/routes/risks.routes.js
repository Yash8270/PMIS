const router = require('express').Router();
const { getRisks, getRiskById, createRisk, updateRisk, deleteRisk, getRiskTrend, logRiskTrend, getRiskMatrix } = require('../controllers/risks.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

router.get('/', authenticate, getRisks);
router.get('/trend', authenticate, getRiskTrend);
router.get('/matrix', authenticate, getRiskMatrix);
router.get('/:id', authenticate, getRiskById);
router.post('/', authenticate, createRisk);
router.post('/trend', authenticate, authorize('admin', 'pm'), logRiskTrend);
router.put('/:id', authenticate, updateRisk);
router.delete('/:id', authenticate, authorize('admin', 'pm'), deleteRisk);

module.exports = router;
