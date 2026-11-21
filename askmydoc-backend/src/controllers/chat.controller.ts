import OpenAI from "openai";
import { Request, Response } from "express";
import { ApiError, IAskQuestionRequest, IChatMessage, MessageRole, IAskQuestionResponse } from "../types";
import DocumentModel from "../models/Document";
import { embedTexts } from "../services/embedding.service";
import { searchChunks } from "../services/pinecone.service";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

const CONTEXT_WINDOW = 6;
const TOP_K = 5;            // chunks retrieved from Pinecone

export const askQuestion = async (req: Request, res: Response) => {
    try {
        const documentId = Array.isArray(req.params.documentId)
            ? req.params.documentId[0] ?? ''
            : req.params.documentId;
        const { question } = req.body as IAskQuestionRequest;

        if (!question || question.trim() === '') {
            return res.status(400).json({ error: 'Question is required' } as ApiError);
        }

        const document = await DocumentModel.findById(documentId).select('chatHistory');
        if (!document) {
            return res.status(404).json({ error: 'Document not found' } as ApiError);
        }

        const [queryVector] = await embedTexts([question.trim()]);
        const chunks = await searchChunks(documentId, queryVector, TOP_K);
        if (chunks.length === 0) {
            res.status(422).json({
                error: 'This document has no searchable content. Please upload it again.',
            } as ApiError);
            return;
        }

        const context = chunks
            .map(chunk => `[Page ${chunk.pageNumber}]\n${chunk.text}`)
            .join('\n\n---\n\n');

        const recentHistory = document.chatHistory.slice(-CONTEXT_WINDOW).map(msg => ({
            role: msg.role as MessageRole,
            content: msg.content
        }));

        const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
            {
                role: 'system',
                content: `You answer questions using only the document excerpts below.
If the answer is not in the excerpts, say you could not find it in the document. Do not make things up.
When useful, mention the page number the information came from.

Document excerpts:
${context}`,
            },
            ...recentHistory,
            {
                role: 'user',
                content: question.trim()
            }
        ];

        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages,
            max_tokens: 500,
            temperature: 0.3
        });

        const answer = completion.choices[0].message?.content?.trim();
        if (!answer) {
            return res.status(500).json({ error: 'No response from AI' } as ApiError);
        }

        const pages = [...new Set(chunks.map(chunk => chunk.pageNumber))].sort((a, b) => a - b);

        const newMessages: IChatMessage[] = [
            {
                role: 'user',
                content: question.trim(),
                timestamp: new Date()
            },
            {
                role: 'assistant',
                content: answer,
                timestamp: new Date(),
                pages
            }
        ]

        await DocumentModel.updateOne(
            { _id: documentId },
            { $push: { chatHistory: { $each: newMessages } } }
        );

        return res.status(200).json({
            answer,
            question: question.trim(),
            documentId,
            pages
        } as IAskQuestionResponse);
    } catch (error) {
        const isDev = process.env.NODE_ENV === 'development';
        return res.status(500).json({
            error: 'Failed to process question',
            details: isDev ? String(error) : undefined
        } as ApiError)
    }
}