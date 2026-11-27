const express = require('express');
const paymentController = require('../controllers/paymentController');
const { authenticate } = require('../middleware/authMiddleware');
const validate = require('../middleware/validateMiddleware');
const { createPaymentSchema, updatePaymentSchema } = require('../validators/schemas');

const router = express.Router();

router.use(authenticate);
router.get('/', paymentController.listPayments);
router.post('/', validate(createPaymentSchema), paymentController.createPayment);
router.get('/case/:caseId', paymentController.getPaymentsByCase);
router.put('/:id', validate(updatePaymentSchema), paymentController.updatePayment);
router.delete('/:id', paymentController.deletePayment);

module.exports = router;
