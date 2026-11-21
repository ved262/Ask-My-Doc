import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import { IPageText, IChunk } from '../types';

const splitter = new RecursiveCharacterTextSplitter({
  chunkSize: 1000,
  chunkOverlap: 200,
});

export const chunkPages = async (pages: IPageText[]): Promise<IChunk[]> => {
  const chunks: IChunk[] = [];

  for (const page of pages) {
    const pieces = await splitter.splitText(page.text);

    for (const piece of pieces) {
      chunks.push({
        text: piece,
        pageNumber: page.pageNumber,
        chunkIndex: chunks.length,   // running counter across the whole doc
      });
    }
  }

  return chunks;
};