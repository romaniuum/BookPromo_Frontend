import type { CoverTemplate } from '../Constants/coverTemplates';

const CANVAS_WIDTH = 400;
const CANVAS_HEIGHT = 600;
const PADDING = 40;

const BOTTOM_ZONE_H = 110;
const ACCENT_LINE_Y = Math.round(CANVAS_HEIGHT * 0.68);

export interface BookCoverData {
  title: string;
  authorName?: string;
  genre?: string;
  publisherName?: string;
  year?: number;
  isbn?: string;
  showCopyright?: boolean;
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    if (ctx.measureText(testLine).width > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  if (currentLine) lines.push(currentLine);
  return lines;
}

export function generateCoverFromTemplate(
  template: CoverTemplate,
  bookData: BookCoverData,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      reject(new Error('Не удалось получить контекст Canvas'));
      return;
    }

    const showCopyright = bookData.showCopyright !== false;

    // Background
    ctx.fillStyle = template.colors.background;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Top decorative strip
    ctx.fillStyle = template.colors.accent;
    ctx.fillRect(PADDING, PADDING, 80, 4);
    ctx.fillRect(PADDING, PADDING + 10, 40, 2);

    // Middle accent line at 68% height (boundary of bottom zone)
    ctx.fillStyle = template.colors.accent;
    ctx.fillRect(0, ACCENT_LINE_Y, CANVAS_WIDTH, 6);

    // Bottom zone overlay
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.fillRect(0, CANVAS_HEIGHT - BOTTOM_ZONE_H, CANVAS_WIDTH, BOTTOM_ZONE_H);

    // Author — 30% from top
    const authorY = Math.round(CANVAS_HEIGHT * 0.30);
    ctx.shadowColor = 'rgba(0,0,0,0.3)';
    ctx.shadowBlur = 2;
    ctx.fillStyle = template.colors.text;
    ctx.font = '15px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    if (bookData.authorName) {
      ctx.fillText(bookData.authorName, CANVAS_WIDTH / 2, authorY);
    }

    // Title — bold 24px at 42% from top
    ctx.font = 'bold 24px sans-serif';
    ctx.fillStyle = template.colors.text;
    const titleLines = wrapText(
      ctx,
      bookData.title || 'Без названия',
      CANVAS_WIDTH - PADDING * 2,
    );
    const lineHeight = 32;
    const titleStartY = Math.round(CANVAS_HEIGHT * 0.42);
    titleLines.forEach((line, i) => {
      ctx.fillText(line, CANVAS_WIDTH / 2, titleStartY + i * lineHeight);
    });

    // Genre — italic 12px just below title
    if (bookData.genre) {
      const genreY = titleStartY + titleLines.length * lineHeight + 20;
      ctx.font = 'italic 12px sans-serif';
      ctx.fillStyle = template.colors.text;
      ctx.fillText(bookData.genre, CANVAS_WIDTH / 2, genreY);
    }

    // === Bottom zone — output data ===
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = 3;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';

    const bottomBase = CANVAS_HEIGHT;

    // Row 1: publisher + year (85px from bottom)
    const publisherLine = bookData.publisherName
      ? `${bookData.publisherName}, ${bookData.year ?? ''}`
      : bookData.year
        ? String(bookData.year)
        : '';
    if (publisherLine) {
      ctx.font = '11px sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.fillText(publisherLine.trim(), CANVAS_WIDTH / 2, bottomBase - 85);
    }

    // Row 2: ISBN (65px from bottom), only if present
    if (bookData.isbn) {
      ctx.font = 'italic 10px sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.fillText(`ISBN ${bookData.isbn}`, CANVAS_WIDTH / 2, bottomBase - 65);
    }

    // Row 3: copyright (45px from bottom)
    if (showCopyright) {
      const yearStr = bookData.year ? String(bookData.year) : 'Год';
      const authorStr = bookData.authorName || 'Автор';
      ctx.font = '10px sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.fillText(`\u00A9 ${yearStr}, ${authorStr}`, CANVAS_WIDTH / 2, bottomBase - 45);
    }

    // Reset shadow
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;

    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Не удалось создать изображение обложки'));
        }
      },
      'image/jpeg',
      0.92,
    );
  });
}
