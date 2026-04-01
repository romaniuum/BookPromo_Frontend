import type { CoverTemplate } from '../Constants/coverTemplates';

const CANVAS_WIDTH = 400;
const CANVAS_HEIGHT = 600;
const PADDING = 40;

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
  bookData: { title: string; authorName?: string },
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

    // Background
    ctx.fillStyle = template.colors.background;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Top decorative element
    ctx.fillStyle = template.colors.accent;
    ctx.fillRect(PADDING, PADDING, 80, 4);
    ctx.fillRect(PADDING, PADDING + 10, 40, 2);

    // Accent strip at 70% height
    const accentY = Math.round(CANVAS_HEIGHT * 0.7);
    ctx.fillStyle = template.colors.accent;
    ctx.fillRect(0, accentY, CANVAS_WIDTH, 8);

    // Title
    ctx.fillStyle = template.colors.text;
    ctx.font = 'bold 24px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const titleLines = wrapText(
      ctx,
      bookData.title || 'Без названия',
      CANVAS_WIDTH - PADDING * 2,
    );
    const lineHeight = 32;
    const titleBlockHeight = titleLines.length * lineHeight;
    const titleStartY = Math.round(CANVAS_HEIGHT * 0.4) - titleBlockHeight / 2;

    titleLines.forEach((line, i) => {
      ctx.fillText(line, CANVAS_WIDTH / 2, titleStartY + i * lineHeight);
    });

    // Author name
    if (bookData.authorName) {
      const authorY = titleStartY + titleLines.length * lineHeight + 28;
      ctx.font = '16px sans-serif';
      ctx.fillStyle = template.colors.text;
      ctx.fillText(bookData.authorName, CANVAS_WIDTH / 2, authorY);
    }

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
