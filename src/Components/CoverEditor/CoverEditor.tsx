import { useRef, useEffect, useState, useCallback } from 'react';
import { Modal, Input, InputNumber, Checkbox, Button, Space } from 'antd';
import styles from './CoverEditor.module.css';

interface TextBlock {
  id: string;
  label: string;
  value: string;
  required: boolean;
  x: number;
  y: number;
  fontSize: number;
  color: string;
  fontWeight: 'normal' | 'bold';
  visible: boolean;
}

interface CoverEditorProps {
  open: boolean;
  imageUrl: string;
  imageBlob: Blob | null;
  initialData: {
    title: string;
    author: string;
    genre: string;
    year: string;
    publisher: string;
    isbn: string;
  };
  onSave: (blob: Blob) => void;
  onRegenerate: () => void;
  onCancel: () => void;
}

const CANVAS_W = 800;
const CANVAS_H = 1200;

function buildInitialBlocks(data: CoverEditorProps['initialData']): TextBlock[] {
  return [
    {
      id: 'title',
      label: 'Название',
      value: data.title,
      required: true,
      x: 0.5,
      y: 0.85,
      fontSize: 28,
      color: '#ffffff',
      fontWeight: 'bold',
      visible: true,
    },
    {
      id: 'author',
      label: 'Автор',
      value: data.author,
      required: true,
      x: 0.5,
      y: 0.92,
      fontSize: 18,
      color: '#ffffff',
      fontWeight: 'normal',
      visible: true,
    },
    {
      id: 'genre',
      label: 'Жанр',
      value: data.genre,
      required: false,
      x: 0.5,
      y: 0.02,
      fontSize: 13,
      color: '#ffffff',
      fontWeight: 'normal',
      visible: Boolean(data.genre),
    },
    {
      id: 'year',
      label: 'Год',
      value: data.year,
      required: false,
      x: 0.5,
      y: 0.05,
      fontSize: 14,
      color: '#ffffff',
      fontWeight: 'normal',
      visible: Boolean(data.year),
    },
    {
      id: 'publisher',
      label: 'Издательство',
      value: data.publisher,
      required: false,
      x: 0.5,
      y: 0.10,
      fontSize: 13,
      color: '#cccccc',
      fontWeight: 'normal',
      visible: Boolean(data.publisher),
    },
    {
      id: 'isbn',
      label: 'ISBN',
      value: data.isbn,
      required: false,
      x: 0.5,
      y: 0.96,
      fontSize: 12,
      color: '#aaaaaa',
      fontWeight: 'normal',
      visible: Boolean(data.isbn),
    },
  ];
}

function drawBlocks(ctx: CanvasRenderingContext2D, blocks: TextBlock[]) {
  blocks.forEach((block) => {
    if (!block.visible || !block.value.trim()) return;
    ctx.save();
    ctx.font = `${block.fontWeight} ${block.fontSize}px Arial, sans-serif`;
    ctx.fillStyle = block.color;
    ctx.textAlign = 'center';
    ctx.shadowColor = 'rgba(0,0,0,0.7)';
    ctx.shadowBlur = 6;
    ctx.fillText(block.value, block.x * CANVAS_W, block.y * CANVAS_H);
    ctx.restore();
  });
}

export function CoverEditor({ open, imageUrl, imageBlob, initialData, onSave, onRegenerate, onCancel }: CoverEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const imgLoadedRef = useRef(false);
  // Holds the clean blob (from prop or fetched) for taint-free export
  const imageBlobRef = useRef<Blob | null>(null);

  const [blocks, setBlocks] = useState<TextBlock[]>(() => buildInitialBlocks(initialData));
  const [imageLoading, setImageLoading] = useState(false);

  // Reset state when modal opens with new data
  useEffect(() => {
    if (open) {
      setBlocks(buildInitialBlocks(initialData));
      imgLoadedRef.current = false;
      imgRef.current = null;
      imageBlobRef.current = imageBlob;
      setImageLoading(false); // blob path doesn't need a long spinner
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, imageUrl]);

  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

    if (imgLoadedRef.current && imgRef.current) {
      ctx.drawImage(imgRef.current, 0, 0, CANVAS_W, CANVAS_H);
    } else {
      const grad = ctx.createLinearGradient(0, 0, 0, CANVAS_H);
      grad.addColorStop(0, '#1a237e');
      grad.addColorStop(1, '#4a148c');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    }

    drawBlocks(ctx, blocks);
  }, [blocks]);

  // Load image: prefer imageBlob prop, fallback to fetch, then direct
  useEffect(() => {
    if (!open) return;

    let cancelled = false;
    let objectUrl: string | null = null;

    imgLoadedRef.current = false;
    imgRef.current = null;

    const loadFromBlob = (blob: Blob) => {
      imageBlobRef.current = blob;
      objectUrl = URL.createObjectURL(blob);
      const img = new Image();
      img.onload = () => {
        if (cancelled) return;
        imgRef.current = img;
        imgLoadedRef.current = true;
        setImageLoading(false);
        drawCanvas();
      };
      img.onerror = () => {
        if (cancelled) return;
        imgLoadedRef.current = false;
        setImageLoading(false);
        drawCanvas();
      };
      img.src = objectUrl;
    };

    const loadDirect = () => {
      if (!imageUrl) {
        setImageLoading(false);
        drawCanvas();
        return;
      }
      const img = new Image();
      img.onload = () => {
        if (cancelled) return;
        imgRef.current = img;
        imgLoadedRef.current = true;
        setImageLoading(false);
        drawCanvas();
      };
      img.onerror = () => {
        if (cancelled) return;
        imgLoadedRef.current = false;
        setImageLoading(false);
        drawCanvas();
      };
      img.src = imageUrl;
    };

    // Priority 1: blob passed from parent — no loading spinner needed
    if (imageBlob) {
      loadFromBlob(imageBlob);
      return () => {
        cancelled = true;
        if (objectUrl) URL.revokeObjectURL(objectUrl);
      };
    }

    // Priority 2: fetch to get a clean blob
    if (imageUrl) {
      setImageLoading(true);
      fetch(imageUrl, { mode: 'cors' })
        .then((r) => {
          if (!r.ok) throw new Error('fetch failed');
          return r.blob();
        })
        .then((blob) => {
          if (!cancelled) loadFromBlob(blob);
        })
        .catch(() => {
          if (!cancelled) loadDirect();
        });
    } else {
      drawCanvas();
    }

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, imageUrl, imageBlob]);

  // Redraw when blocks change
  useEffect(() => {
    drawCanvas();
  }, [drawCanvas]);

  const updateBlock = (id: string, patch: Partial<TextBlock>) => {
    setBlocks((prev) => prev.map((b) => (b.id === id ? { ...b, ...patch } : b)));
  };

  const handleSave = useCallback(async () => {
    console.log('handleSave blob:', imageBlobRef.current, 'prop blob:', imageBlob);
    const sourceBlob = imageBlobRef.current;

    if (sourceBlob) {
      // Draw on a fresh offscreen canvas — guaranteed not tainted
      const offscreen = document.createElement('canvas');
      offscreen.width = CANVAS_W;
      offscreen.height = CANVAS_H;
      const ctx = offscreen.getContext('2d')!;

      const objectUrl = URL.createObjectURL(sourceBlob);
      const img = new Image();
      await new Promise<void>((resolve) => {
        img.onload = () => resolve();
        img.onerror = () => resolve();
        img.src = objectUrl;
      });
      ctx.drawImage(img, 0, 0, CANVAS_W, CANVAS_H);
      URL.revokeObjectURL(objectUrl);

      drawBlocks(ctx, blocks);

      offscreen.toBlob(
        (blob) => { if (blob) onSave(blob); },
        'image/jpeg',
        0.92,
      );
      return;
    }

    // Fallback: no blob available, try main canvas
    const canvas = canvasRef.current;
    if (!canvas) return;
    try {
      canvas.toBlob(
        (blob) => { if (blob) onSave(blob); },
        'image/jpeg',
        0.92,
      );
    } catch (e) {
      console.error('Canvas tainted, cannot export:', e);
    }
  }, [blocks, onSave]);

  return (
    <Modal
      open={open}
      title="Редактор обложки"
      width={820}
      onCancel={onCancel}
      destroyOnClose
      footer={
        <Space>
          <Button onClick={onCancel}>Отмена</Button>
          <Button onClick={onRegenerate}>Перегенерировать</Button>
          <Button type="primary" onClick={handleSave} disabled={imageLoading}>
            Сохранить обложку
          </Button>
        </Space>
      }
    >
      <div className={styles.editorBody}>
        {/* Left: canvas preview */}
        <div className={styles.canvasWrap}>
          {imageLoading && (
            <div className={styles.canvasLoadingOverlay}>
              <span>Загрузка изображения...</span>
            </div>
          )}
          <canvas
            ref={canvasRef}
            width={CANVAS_W}
            height={CANVAS_H}
            className={styles.canvas}
          />
        </div>

        {/* Right: settings */}
        <div className={styles.settingsPanel}>
          {blocks.map((block) => (
            <div key={block.id} className={styles.blockSection}>
              <div className={styles.blockHeader}>
                <span className={styles.blockLabel}>{block.label}</span>
                {block.required && (
                  <span className={styles.requiredTag}>(обязательное поле)</span>
                )}
                {!block.required && (
                  <Checkbox
                    checked={block.visible}
                    onChange={(e) => updateBlock(block.id, { visible: e.target.checked })}
                  >
                    Показывать
                  </Checkbox>
                )}
              </div>

              <div className={styles.blockRow}>
                <Input
                  value={block.value}
                  placeholder={block.label}
                  onChange={(e) => updateBlock(block.id, { value: e.target.value })}
                  disabled={!block.visible && !block.required}
                  style={{ flex: 1 }}
                />
              </div>

              <div className={styles.blockRow}>
                <span style={{ fontSize: 12, color: '#595959', minWidth: 50 }}>Размер:</span>
                <InputNumber
                  min={10}
                  max={48}
                  value={block.fontSize}
                  onChange={(v) => v !== null && updateBlock(block.id, { fontSize: v })}
                  disabled={!block.visible && !block.required}
                  size="small"
                  style={{ width: 70 }}
                />
                <span style={{ fontSize: 12, color: '#595959', minWidth: 36 }}>Цвет:</span>
                <input
                  type="color"
                  value={block.color}
                  onChange={(e) => updateBlock(block.id, { color: e.target.value })}
                  disabled={!block.visible && !block.required}
                  className={styles.colorInput}
                  title="Цвет текста"
                />
                <Checkbox
                  checked={block.fontWeight === 'bold'}
                  onChange={(e) =>
                    updateBlock(block.id, { fontWeight: e.target.checked ? 'bold' : 'normal' })
                  }
                  disabled={!block.visible && !block.required}
                >
                  Жирный
                </Checkbox>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Modal>
  );
}
