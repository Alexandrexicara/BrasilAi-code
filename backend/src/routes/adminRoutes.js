const express = require('express');
const router = express.Router();
const adminAuth = require('../middleware/adminAuth');
const adminController = require('../controllers/adminController');

router.use(adminAuth);

router.get('/dashboard', adminController.dashboard);
router.get('/usuarios', adminController.usuarios);
router.get('/assinaturas', adminController.assinaturas);
router.get('/api-keys', adminController.listarApiKeys);
router.get('/logs', adminController.logs);
router.post('/role', adminController.atualizarRole);
router.post('/desativar', adminController.desativarUsuario);
router.post('/gerar-key', adminController.gerarApiKey);

module.exports = router;
