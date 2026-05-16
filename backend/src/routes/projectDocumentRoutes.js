const { Router } = require('express');
const multer = require('multer');
const path = require('path');
const authenticate = require('../middleware/auth');
const { uploadMultiple, getByProject, remove } = require('../controllers/projectDocumentController');

const storage = multer.diskStorage({
  destination: path.join(__dirname, '../../uploads'),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

const uploadMiddleware = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }
});

const router = Router();

router.use(authenticate);

router.post('/project/:projectId', uploadMiddleware.array('files', 20), uploadMultiple);
router.get('/project/:projectId', getByProject);
router.delete('/:documentId', remove);

module.exports = router;
