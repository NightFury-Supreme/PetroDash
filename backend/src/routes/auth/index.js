const express = require('express');
const router = express.Router();

router.use('/', require('./me'));
router.use('/', require('./login'));
router.use('/', require('./register'));
router.use('/', require('./profile'));
router.use('/', require('./authConfig'));

module.exports = router;


