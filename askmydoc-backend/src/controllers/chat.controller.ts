import OpenAI from "openai";
import { Request, Response } from "express";
import { ApiError, IAskQuestionRequest, IChatMessage, MessageRole, IAskQuestionResponse } from "../types";
import DocumentModel from "../models/Document";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

const CONTEXT_WINDOW = 6;

export const askQuestion = async (req: Request, res: Response) => {
    try {
        const { documentId } = req.params;
        const { question } = req.body as IAskQuestionRequest;

        if (!question || question.trim() === '') {
            return res.status(400).json({ error: 'Question is required' } as ApiError);
        }

        const document = await DocumentModel.findById(documentId);
        if (!document) {
            return res.status(404).json({ error: 'Document not found' } as ApiError);
        }

        const recentHistory = document.chatHistory.slice(-CONTEXT_WINDOW).map(msg => ({
            role: msg.role as MessageRole,
            content: msg.content
        }));

        const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
            {
                role: 'system',
                content: `You are a helpful assistant that answers questions based strictly on the document provided below. 
If the answer is not found in the document, say so clearly — do not make up information.
Document Content:
---
${document.extractedText}
---`
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

        const newMessages: IChatMessage[] = [
            {
                role: 'user',
                content: question.trim(),
                timestamp: new Date()
            },
            {
                role: 'assistant',
                content: answer,
                timestamp: new Date()
            }
        ]

        document.chatHistory.push(...newMessages);
        await document.save();

        return res.status(200).json({
            answer,
            question: question.trim(),
            documentId
        } as IAskQuestionResponse);
    } catch (error) {
        const isDev = process.env.NODE_ENV === 'development';
        return res.status(500).json({
            error: 'Failed to process question',
            details: isDev ? String(error) : undefined
        } as ApiError)
    }
}