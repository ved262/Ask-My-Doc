import {Router} from 'express'
import { askQuestionStream } from '../controllers/chat.controller'
import { requireAuth } from '../middlewares/auth.middleware';
const router = Router()

router.use(requireAuth);
router.post('/:documentId/stream', askQuestionStream);
export default router