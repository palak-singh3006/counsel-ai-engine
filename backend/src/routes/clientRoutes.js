const express = require('express');
const clientController = require('../controllers/clientController');
const { authenticate } = require('../middleware/authMiddleware');
const validate = require('../middleware/validateMiddleware');
const { createClientSchema, updateClientSchema } = require('../validators/schemas');

const router = express.Router();

router.use(authenticate);
router.get('/', clientController.listClients);
router.post('/', validate(createClientSchema), clientController.createClient);
router.get('/:id', clientController.getClientById);
router.put('/:id', validate(updateClientSchema), clientController.updateClient);
router.delete('/:id', clientController.deleteClient);

module.exports = router;
