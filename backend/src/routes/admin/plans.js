const express = require('express');
const { requireAdmin } = require('../../middleware/auth');
const plansController = require('../../modules/admin/plans/plans.controller');
const { validateObjectId } = require('../../middleware/validateObjectId');

const router = express.Router();

router.get('/categories', requireAdmin, plansController.getCategories);
router.post('/categories', requireAdmin, plansController.createCategory);
router.put('/categories/:id', requireAdmin, plansController.updateCategory);
router.delete('/categories/:id', requireAdmin, plansController.deleteCategory);

router.get('/', requireAdmin, plansController.listPlans);
router.get('/:id', requireAdmin, validateObjectId('id'), plansController.getPlan);
router.post('/', requireAdmin, plansController.createPlan);
router.put('/:id', requireAdmin, validateObjectId('id'), plansController.updatePlan);
router.patch('/:id', requireAdmin, validateObjectId('id'), plansController.patchPlan);
router.delete('/:id', requireAdmin, validateObjectId('id'), plansController.deletePlan);

module.exports = router;
