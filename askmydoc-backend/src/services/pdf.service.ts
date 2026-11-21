import { PDFParse } from 'pdf-parse';
import { IPageText } from '../types';

export const extractPages = async (buffer: Buffer): Promise<IPageText[]> => {
  const parser = new PDFParse({ data: buffer });

  try {
    const result = await parser.getText();

    return result.pages
      .map(page => ({ pageNumber: page.num, text: page.text }))
      .filter(page => page.text.trim().length > 0);   // drop blank pages
  } finally {
    await parser.destroy();   // always free the parser's memory
  }
};