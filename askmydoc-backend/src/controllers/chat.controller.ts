import OpenAI from "openai";
import { Request, Response } from "express";
import { ApiError, IAskQuestionRequest, IChatMessage } from "../types";
import DocumentModel from "../models/Document";
import { embedTexts } from "../services/embedding.service";
import { searchChunks } from "../services/pinecone.service";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

const CONTEXT_WINDOW = 6;
const TOP_K = 5;            // chunks retrieved from Pinecone

export const askQuestionStream = async (req: Request, res: Response): Promise<void> => {
  // Helper to write one SSE message
  const send = (event: string, data: unknown): void => {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  };

  try {
    const documentId = Array.isArray(req.params.documentId)
            ? req.params.documentId[0] ?? ''
            : req.params.documentId;
    const { question } = req.body as IAskQuestionRequest;

    // ── Everything that can fail normally happens BEFORE the stream opens ────

    if (!question || question.trim().length === 0) {
      res.status(400).json({ error: 'Question is required' } as ApiError);
      return;
    }

    const document = await DocumentModel.findById(documentId).select('chatHistory');

    if (!document) {
      res.status(404).json({ error: 'Document not found' } as ApiError);
      return;
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

    const recentHistory = document.chatHistory
      .slice(-CONTEXT_WINDOW)
      .map(msg => ({ role: msg.role, content: msg.content }));

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
      { role: 'user', content: question.trim() },
    ];

    const pages = [...new Set(chunks.map(chunk => chunk.pageNumber))].sort((a, b) => a - b);

    // ── Open the stream ──────────────────────────────────────────────────────

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');   // stop proxies from holding data back
    res.flushHeaders();

    const stream = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages,
      temperature: 0.3,
      max_tokens: 1000,
      stream: true,
    });

    // If the user closes the tab mid-answer, stop paying for tokens
    res.on('close', () => {
      if (!res.writableEnded) stream.controller.abort();
    });

    let answer = '';

    for await (const part of stream) {
      const token = part.choices[0]?.delta?.content;
      if (token) {
        answer += token;
        send('token', { token });
      }
    }

    // ── Save the finished exchange, then tell the client we're done ──────────

    const newMessages: IChatMessage[] = [
      { role: 'user', content: question.trim(), timestamp: new Date() },
      { role: 'assistant', content: answer, timestamp: new Date(), pages },
    ];

    await DocumentModel.updateOne(
      { _id: documentId },
      { $push: { chatHistory: { $each: newMessages } } }
    );

    send('done', { pages });
    res.end();
  } catch (error) {
    if (res.destroyed) return;   // client left, nothing to tell them

    if (res.headersSent) {
      // Too late for a status code, so report the failure as an event
      send('error', { error: 'Stream interrupted. Please try again.' });
      res.end();
    } else {
      const isDev = process.env.NODE_ENV === 'development';
      res.status(500).json({
        error: 'Failed to process question',
        details: isDev ? String(error) : undefined,
      } as ApiError);
    }
  }
};