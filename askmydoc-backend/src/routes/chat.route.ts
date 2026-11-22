import {Router} from 'express'
import { askQuestion, askQuestionStream } from '../controllers/chat.controller'
const router = Router()

router.post('/:documentId', askQuestion)
router.post('/:documentId/stream', askQuestionStream);
export default router