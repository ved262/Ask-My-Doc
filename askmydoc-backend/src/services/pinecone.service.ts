import { Pinecone } from '@pinecone-database/pinecone';
import { IChunk, ISearchResult } from '../types';

const NAMESPACE = 'documents';
const BATCH_SIZE = 100;

// Created on first use, not at import time
let pinecone: Pinecone | null = null;

const getNamespace = () => {
  if (!pinecone) {
    pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY! });
  }
  return pinecone.index(process.env.PINECONE_INDEX!).namespace(NAMESPACE);
};

export const upsertChunks = async (
  documentId: string,
  chunks: IChunk[],
  vectors: number[][]
): Promise<void> => {
  if (chunks.length !== vectors.length) {
    throw new Error('chunks and vectors must have the same length');
  }

  const documents = chunks.map((chunk, i) => ({
    _id: `${documentId}-${chunk.chunkIndex}`,
    embedding: vectors[i],
    text: chunk.text,
    documentId,
    pageNumber: chunk.pageNumber,
    chunkIndex: chunk.chunkIndex,
  }));

  const namespace = getNamespace();

  for (let i = 0; i < documents.length; i += BATCH_SIZE) {
    await namespace.documents.upsert({
      documents: documents.slice(i, i + BATCH_SIZE),
    });
  }
};

export const searchChunks = async (
  documentId: string,
  queryVector: number[],
  topK = 5
): Promise<ISearchResult[]> => {
  const results = await getNamespace().documents.search({
    scoreBy: [{ type: 'dense_vector', fields: ['embedding'], values: queryVector }],
    filter: { documentId: { $eq: documentId } },
    topK,
    includeFields: ['text', 'pageNumber'],
  });

  return results.matches.map(match => {
    // loose typing: the SDK's result type for custom fields is generic
    const m = match as unknown as { _score: number; text: string, pageNumber: number };
    return {
      text: String(m?.text ?? ''),
      pageNumber: Number(m?.pageNumber ?? 0),
      score: m._score,
    };
  });
};