import { Router } from 'express';
import multer from 'multer';
import {
  uploadFile,
  listFiles,
  getFileDetails,
  downloadFile,
  deleteFile,
  shareFile,
  revokeSharing,
} from '../controllers/file.controller.js';
import { authenticate } from '../middleware/auth.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB max file size
});

const router = Router();

router.use(authenticate);

router.post('/', upload.single('file'), uploadFile);
router.get('/', listFiles);
router.get('/:id', getFileDetails);
router.get('/:id/download', downloadFile);
router.post('/:id/share', shareFile);
router.delete('/:id/share/:userId', revokeSharing);
router.delete('/:id', deleteFile);

export default router;
