import { Router, Request, Response } from "express"
import multer from "multer"
import { getDocumentById, listDocuments, uploadDocument } from "../controllers/document.controller";

const router = Router()
const storage = multer.memoryStorage();

const upload = multer({
    storage,
    limits: {
        fileSize: 10*1024*1024
    },
    fileFilter: (req:Request, file:Express.Multer.File, cb: multer.FileFilterCallback) => {
        if(file.mimetype === 'application/pdf'){
            cb(null, true)
        } else{
            cb(new Error('Only PDF files are allowed!'))
        }
    }
})

router.post('/upload', upload.single('file'), uploadDocument)
router.get('/', listDocuments)
router.get('/:id', getDocumentById)

export default router;