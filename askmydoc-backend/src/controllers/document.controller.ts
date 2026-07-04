import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../types';
import pdfParse from 'pdf-parse';
import DocumentModel from '../models/Document';

export const uploadDocument = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' } as ApiError)
        }
        const pdfData = new pdfParse.PDFParse(new Uint8Array(req.file.buffer))
        const pdfText = (await pdfData.getText()).text
        const pdfPageCount = (await pdfData.getInfo()).total
        if (!pdfText || pdfText.trim().length === 0) {
            return res.status(422).json({
                error: 'Could not extract text from this PDF'
            } as ApiError)
        }
        const document = await DocumentModel.create({
            filename: req.file.originalname.replace(/\s+/g, '_'),
            originalName: req.file.originalname,
            extractedText: pdfText,
            fileSize: req.file.size,
            pageCount: pdfPageCount
        })
        const { extractedText, ...documentWithoutText } = document.toObject()
        return res.status(201).json({ message: "Document uploaded successfully", document: documentWithoutText })

    } catch (error) {
        const isDev = process.env.NODE_ENV === 'development';
        return res.status(500).json({
            error: 'Failed to process PDF',
            details: isDev ? String(error) : undefined,
        } as ApiError);
    }
}

export const listDocuments = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const documents = await DocumentModel.find().select('-extractedText').sort({ 'createdAt': -1 })
        return res.status(200).json({ message: "Documents retrieved successfully", documents })
    } catch (error) {
        const isDev = process.env.NODE_ENV === 'development';
        return res.status(500).json({
            error: 'Failed to retrieve documents',
            details: isDev ? String(error) : undefined
        } as ApiError);
    }
}

export const getDocumentById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const document = await DocumentModel.findById(req.params.id).select("-extractedText")
        if (!document) {
            return res.status(404).json({ error: " Document not found" } as ApiError)
        }
        return res.status(200).json({ message: "Document retrieved successfully", document })

    } catch (error) {
        const isDev = process.env.NODE_ENV === 'development';
        return res.status(500).json({
            error: 'Failed to retrieve document',
            details: isDev ? String(error) : undefined
        } as ApiError);
    }
}