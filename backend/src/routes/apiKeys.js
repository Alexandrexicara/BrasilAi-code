const router = require('express').Router();
const { authJwt } = require('../middleware/authJwt');
const apiKeyController = require('../controllers/apiKeyController');

router.post('/gerar', authJwt, apiKeyController.gerar);
router.get('/', authJwt, apiKeyController.listar);
router.delete('/:id', authJwt, apiKeyController.revogar);

module.exports = router;
