import { useState } from 'react';
import { Modal, Select } from 'antd';
import type { CoverTemplate } from '../../Constants/coverTemplates';
import { coverTemplates } from '../../Constants/coverTemplates';
import styles from './CoverTemplateSelector.module.css';

interface CoverTemplateSelectorProps {
  open: boolean;
  onClose: () => void;
  onSelect: (template: CoverTemplate) => void;
}

const ALL_GENRES = '__all__';

export function CoverTemplateSelector({ open, onClose, onSelect }: CoverTemplateSelectorProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [genreFilter, setGenreFilter] = useState<string>(ALL_GENRES);

  const genres = Array.from(new Set(coverTemplates.map((t) => t.genre)));

  const filtered =
    genreFilter === ALL_GENRES
      ? coverTemplates
      : coverTemplates.filter((t) => t.genre === genreFilter);

  const handleCardClick = (template: CoverTemplate) => {
    setSelectedId(template.id);
    onSelect(template);
  };

  const handleCancel = () => {
    setSelectedId(null);
    setGenreFilter(ALL_GENRES);
    onClose();
  };

  return (
    <Modal
      title="Каталог шаблонов обложек"
      open={open}
      onCancel={handleCancel}
      footer={null}
      width={720}
      destroyOnClose
    >
      <div className={styles.modalContent}>
        <div className={styles.filterRow}>
          <Select
            value={genreFilter}
            onChange={setGenreFilter}
            style={{ width: 220 }}
            options={[
              { value: ALL_GENRES, label: 'Все жанры' },
              ...genres.map((g) => ({ value: g, label: g })),
            ]}
          />
        </div>

        <div className={styles.grid}>
          {filtered.map((template) => (
            <div
              key={template.id}
              className={`${styles.card} ${selectedId === template.id ? styles.cardSelected : ''}`}
              onClick={() => handleCardClick(template)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') handleCardClick(template);
              }}
            >
              <div
                className={styles.cardPreview}
                style={{ backgroundColor: template.colors.background }}
              >
                <div
                  className={styles.cardAccent}
                  style={{ backgroundColor: template.colors.accent }}
                />
                <div className={styles.cardInfo}>
                  <div className={styles.cardName} style={{ color: template.colors.text }}>
                    {template.name}
                  </div>
                  <div className={styles.cardGenre} style={{ color: template.colors.text }}>
                    {template.genre}
                  </div>
                  <div
                    style={{
                      display: 'inline-block',
                      marginTop: 6,
                      padding: '1px 5px',
                      fontSize: 9,
                      fontWeight: 600,
                      letterSpacing: '0.04em',
                      borderRadius: 3,
                      background: 'rgba(255,255,255,0.25)',
                      color: template.colors.text,
                      textTransform: 'uppercase',
                    }}
                  >
                    гост
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Modal>
  );
}
