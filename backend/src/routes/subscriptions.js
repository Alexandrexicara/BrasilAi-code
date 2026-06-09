const router = require('express').Router();
const { authJwt } = require('../middleware/authJwt');
const subscriptionController = require('../controllers/subscriptionController');

router.post('/contratar', authJwt, subscriptionController.contratar);
router.post('/pay', authJwt, subscriptionController.pagar);
router.get('/payment/:paymentId', authJwt, subscriptionController.verificarPagamento);
router.get('/status', authJwt, subscriptionController.status);

module.exports = router;
