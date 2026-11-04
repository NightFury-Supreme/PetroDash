const express = require('express');
const { requireAdmin } = require('../../middleware/auth');
const plansController = require('../../modules/admin/plans/plans.controller');

const router = express.Router();

router.get('/categories', requireAdmin, plansController.getCategories);
router.post('/categories', requireAdmin, plansController.createCategory);
router.put('/categories/:id', requireAdmin, plansController.updateCategory);
router.delete('/categories/:id', requireAdmin, plansController.deleteCategory);

router.get('/', requireAdmin, plansController.listPlans);
router.get('/:id', requireAdmin, plansController.getPlan);
router.post('/', requireAdmin, plansController.createPlan);
router.put('/:id', requireAdmin, plansController.updatePlan);
router.patch('/:id', requireAdmin, plansController.patchPlan);
router.delete('/:id', requireAdmin, plansController.deletePlan);

module.exports = router;
