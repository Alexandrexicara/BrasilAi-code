const router = require('express').Router();
const { authJwt } = require('../middleware/authJwt');
const subscriptionController = require('../controllers/subscriptionController');

router.post('/contratar', authJwt, subscriptionController.contratar);
router.get('/status', authJwt, subscriptionController.status);

module.exports = router;
