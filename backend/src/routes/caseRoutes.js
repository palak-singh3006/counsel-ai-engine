const express = require('express');
const caseController = require('../controllers/caseController');
const { authenticate } = require('../middleware/authMiddleware');
const validate = require('../middleware/validateMiddleware');
const { createCaseSchema, updateCaseSchema } = require('../validators/schemas');

const router = express.Router();

router.use(authenticate);
router.get('/', caseController.listCases);
router.post('/', validate(createCaseSchema), caseController.createCase);
router.get('/:id', caseController.getCaseById);
router.put('/:id', validate(updateCaseSchema), caseController.updateCase);
router.delete('/:id', caseController.deleteCase);

module.exports = router;
