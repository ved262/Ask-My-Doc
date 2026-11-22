import {Router} from 'express'
import { askQuestionStream } from '../controllers/chat.controller'
const router = Router()

router.post('/:documentId/stream', askQuestionStream);
export default router