const express = require('express');
const documentController = require('../controllers/documentController');
const { authenticate } = require('../middleware/authMiddleware');
const { upload } = require('../middleware/uploadMiddleware');

const router = express.Router();

router.use(authenticate);
router.get('/', documentController.listDocuments);
router.post('/upload', upload.single('file'), documentController.uploadDocument);
router.get('/case/:caseId', documentController.listDocumentsByCase);
router.get('/:id/download', documentController.downloadDocument);
router.get('/:id', documentController.getDocumentById);
router.delete('/:id', documentController.deleteDocument);

module.exports = router;
