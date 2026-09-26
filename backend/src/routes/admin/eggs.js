const express = require('express');
const { requireAdmin } = require('../../middleware/auth');
const eggsController = require('../../modules/admin/eggs/eggs.controller');

const router = express.Router();

router.get('/', requireAdmin, eggsController.getEggsList);
router.post('/', requireAdmin, eggsController.createEgg);

router.get('/categories', requireAdmin, eggsController.getEggCategories);
router.post('/categories', requireAdmin, eggsController.createEggCategory);
router.put('/categories/:id', requireAdmin, eggsController.updateEggCategory);
router.delete('/categories/:id', requireAdmin, eggsController.deleteEggCategory);

router.get('/:id', requireAdmin, eggsController.getEggById);
router.put('/:id', requireAdmin, eggsController.updateEgg);
router.delete('/:id', requireAdmin, eggsController.deleteEgg);

module.exports = router;
