import {Router} from 'express'
import { askQuestion } from '../controllers/chat.controller'
const router = Router()

router.post('/:documentId', askQuestion)
export default router