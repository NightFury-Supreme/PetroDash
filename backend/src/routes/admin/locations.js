/* ==========================================================================
   Admin Locations Routes
   Compliance: ISO/IEC 25010, Separation of Concerns
========================================================================== */

const express = require('express');
const { requireAdmin } = require('../../middleware/auth');
const {
  getLocationsHandler,
  createLocationHandler,
  getLocationByIdHandler,
  updateLocationHandler,
  deleteLocationHandler,
} = require('../../modules/admin/locations');

const router = express.Router();

router.get('/', requireAdmin, getLocationsHandler);
router.post('/', requireAdmin, createLocationHandler);
router.get('/:id', requireAdmin, getLocationByIdHandler);
router.put('/:id', requireAdmin, updateLocationHandler);
router.delete('/:id', requireAdmin, deleteLocationHandler);

module.exports = router;
