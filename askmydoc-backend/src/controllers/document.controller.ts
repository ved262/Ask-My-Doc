import { Request, Response, NextFunction } from 'express';
import { Types } from 'mongoose';
import DocumentModel from '../models/Document';
import { extractPages } from '../services/pdf.service';
import { chunkPages } from '../services/chunk.service';
import { embedTexts } from '../services/embedding.service';
import { upsertChunks } from '../services/pinecone.service';
import { ApiError } from '../types';

export const uploadDocument = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'No file uploaded' } as ApiError);
      return;
    }

    const { pages, totalPages } = await extractPages(req.file.buffer);

    if (pages.length === 0) {
      res.status(422).json({
        error: 'Could not extract text from this PDF. Scanned PDFs are not supported.',
      } as ApiError);
      return;
    }

    // We create the ID ourselves so Pinecone and MongoDB can share it
    const documentId = new Types.ObjectId();

    // Risky steps first (network calls to OpenAI and Pinecone)
    const chunks = await chunkPages(pages);
    const vectors = await embedTexts(chunks.map(chunk => chunk.text));
    await upsertChunks(documentId.toString(), chunks, vectors);

    // Quick local write last
    const document = await DocumentModel.create({
      _id: documentId,
      originalName: req.file.originalname,
      fileSize: req.file.size,
      pageCount: pages.length,
    });

    res.status(201).json({
      message: 'PDF uploaded and processed successfully',
      document: {
        _id: document._id,
        originalName: document.originalName,
        fileSize: document.fileSize,
        pageCount: document.pageCount,
        createdAt: document.createdAt,
      },
    });
  } catch (error) {
    const isDev = process.env.NODE_ENV === 'development';
    res.status(500).json({
      error: 'Failed to process PDF',
      details: isDev ? String(error) : undefined,
    } as ApiError);
  }
};

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