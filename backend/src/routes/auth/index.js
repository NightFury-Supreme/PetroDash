const express = require('express');
const router = express.Router();

router.use('/', require('./me'));
router.use('/', require('./login'));
router.use('/', require('./register'));
router.use('/', require('./profile'));

module.exports = router;


