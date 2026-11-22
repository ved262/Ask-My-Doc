import { PDFParse } from 'pdf-parse';
import { IExtractedPdf } from '../types';

export const extractPages = async (buffer: Buffer): Promise<IExtractedPdf> => {
  const parser = new PDFParse({ data: buffer });

  try {
    const result = await parser.getText();

    const pages = result.pages
      .map(page => ({ pageNumber: page.num, text: page.text }))
      .filter(page => page.text.trim().length > 0);   // drop blank pages

    return { pages, totalPages: result.total }
  } finally {
    await parser.destroy();   // always free the parser's memory
  }
};