const router = require('express').Router();
const plansController = require('../controllers/plansController');

router.get('/', plansController.listar);

module.exports = router;
