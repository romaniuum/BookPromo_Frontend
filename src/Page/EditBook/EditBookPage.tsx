import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  Form,
  Input,
  Button,
  Typography,
  Upload,
  Radio,
  Card,
  message,
  Space,
  Spin,
  Alert,
  Modal,
} from 'antd';
import type { UploadFile } from 'antd';
import { ROUTES, getImageUrl } from '../../Constants';
import { useAuth } from '../../Contexts/AuthContext';
import {
  getBookByID,
  updateBook,
  uploadCover,
  uploadPdf,
  generateCover,
  GostValidationError,
  type UpdateBookPayload,
  type Book,
  type GenerateCoverPayload,
  type GostResult,
} from '../../Api/books';
import { GostResultsDisplay } from '../../Components/GostResults/GostResultsDisplay';
import { CoverTemplateSelector } from '../../Components/CoverTemplates/CoverTemplateSelector';
import { CoverEditor } from '../../Components/CoverEditor/CoverEditor';
import { generateCoverFromTemplate } from '../../Utils/coverGenerator';
import type { CoverTemplate } from '../../Constants/coverTemplates';
import { parsePublicationYear } from '../../Utils/form';
import styles from '../CreateBook/CreateBookPage.module.css';

const { Title } = Typography;
const { TextArea } = Input;

type CoverSource = 'upload' | 'ai' | 'keep' | 'template';
type PdfSource = 'keep' | 'upload' | 'remove';

export function EditBookPage() {
  const { token, user } = useAuth();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [book, setBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [coverSource, setCoverSource] = useState<CoverSource>('keep');
  const [coverFileList, setCoverFileList] = useState<UploadFile[]>([]);
  const [aiCoverUrl, setAiCoverUrl] = useState<string | null>(null);
  const [aiCoverBlob, setAiCoverBlob] = useState<Blob | null>(null);
  const [aiCoverEditorOpen, setAiCoverEditorOpen] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [templateSelectorOpen, setTemplateSelectorOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<CoverTemplate | null>(null);
  const [templateCoverBlob, setTemplateCoverBlob] = useState<Blob | null>(null);
  const [templateCoverPreviewUrl, setTemplateCoverPreviewUrl] = useState<string | null>(null);
  const [templateGenerating, setTemplateGenerating] = useState(false);
  const [pdfSource, setPdfSource] = useState<PdfSource>('keep');
  const [pdfFileList, setPdfFileList] = useState<UploadFile[]>([]);
  const [gostErrors, setGostErrors] = useState<{ code: string; name: string; detail: string }[] | null>(null);
  const [gostModalOpen, setGostModalOpen] = useState(false);
  const [gostResults, setGostResults] = useState<GostResult[] | null>(null);
  const [pendingPayload, setPendingPayload] = useState<UpdateBookPayload | null>(null);
  const [publishing, setPublishing] = useState(false);

  useEffect(() => {
    if (!token || !id) {
      setLoading(false);
      return;
    }
    getBookByID(id, token)
      .then((b) => {
        setBook(b);
        form.setFieldsValue({
          title: b.title,
          genre: b.genre || undefined,
          description: b.description || undefined,
          publication_year: b.publication_year ?? undefined,
          content: b.content || undefined,
        });
      })
      .catch((e) => {
        message.error(e instanceof Error ? e.message : 'Книга не найдена');
        navigate(ROUTES.AUTHOR);
      })
      .finally(() => setLoading(false));
  }, [id, token, form, navigate]);

  const handleFinish = async (values: Record<string, unknown>) => {
    if (!token || !id) return;

    setSubmitting(true);
    try {
      let coverImageUrl: string | undefined;
      if (coverSource === 'upload' && coverFileList.length > 0 && coverFileList[0].originFileObj) {
        coverImageUrl = await uploadCover(coverFileList[0].originFileObj, token);
      } else if (coverSource === 'ai' && aiCoverUrl) {
        coverImageUrl = aiCoverUrl;
      } else if (coverSource === 'template' && templateCoverBlob) {
        const file = new File([templateCoverBlob], 'template-cover.jpg', { type: 'image/jpeg' });
        coverImageUrl = await uploadCover(file, token);
      } else if (coverSource === 'keep' && book?.cover_image) {
        coverImageUrl = book.cover_image;
      }

      let pdfUrl: string | undefined;
      let clearPdf: boolean | undefined;
      let pdfGostResults: GostResult[] | undefined;
      if (pdfSource === 'upload' && pdfFileList.length > 0 && pdfFileList[0].originFileObj) {
        const res = await uploadPdf(pdfFileList[0].originFileObj, token);
        pdfUrl = res.url;
        pdfGostResults = res.gost_results;
        if (res.warning) message.warning(res.warning);
      } else if (pdfSource === 'remove') {
        clearPdf = true;
      }

      const publication_year = parsePublicationYear(values.publication_year);

      const payload: UpdateBookPayload = {
        title: (values.title as string)?.trim() || undefined,
        description: (values.description as string)?.trim() || undefined,
        genre: (values.genre as string)?.trim() || undefined,
        content: (values.content as string)?.trim() || undefined,
        cover_image: coverImageUrl,
        pdf_url: pdfUrl,
        clear_pdf: clearPdf,
        publication_year,
      };

      // Если загружен новый PDF и есть результаты ГОСТ — показываем модалку
      if (pdfUrl && pdfGostResults && pdfGostResults.length > 0) {
        setGostResults(pdfGostResults);
        setPendingPayload(payload);
        setGostModalOpen(true);
        setSubmitting(false);
        return;
      }

      await updateBook(id, payload, token);
      message.success('Изменения сохранены');
      navigate(ROUTES.AUTHOR);
    } catch (e) {
      if (e instanceof GostValidationError && e.gostErrors.length > 0) {
        setGostErrors(e.gostErrors.map((x) => ({ code: x.code, name: x.name, detail: x.detail })));
      } else {
        message.error(e instanceof Error ? e.message : 'Ошибка сохранения');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handlePublish = async () => {
    if (!token || !id || !pendingPayload) return;
    setPublishing(true);
    try {
      await updateBook(id, pendingPayload, token);
      message.success('Изменения сохранены');
      setGostModalOpen(false);
      setGostResults(null);
      setPendingPayload(null);
      navigate(ROUTES.AUTHOR);
    } catch (e) {
      message.error(e instanceof Error ? e.message : 'Ошибка сохранения');
    } finally {
      setPublishing(false);
    }
  };

  const handleTemplateSelect = async (template: CoverTemplate) => {
    setSelectedTemplate(template);
    setTemplateSelectorOpen(false);
    setTemplateGenerating(true);
    try {
      const vals = form.getFieldsValue();
      const blob = await generateCoverFromTemplate(template, {
        title: (vals.title as string)?.trim() || 'Без названия',
        authorName: user?.name || undefined,
        genre: (vals.genre as string)?.trim() || undefined,
        publisherName: (vals.publisherName as string)?.trim() || undefined,
        year: parsePublicationYear(vals.publication_year),
        isbn: (vals.isbn as string)?.trim() || undefined,
        showCopyright: true,
      });
      if (templateCoverPreviewUrl) URL.revokeObjectURL(templateCoverPreviewUrl);
      setTemplateCoverBlob(blob);
      setTemplateCoverPreviewUrl(URL.createObjectURL(blob));
    } catch (e) {
      message.error(e instanceof Error ? e.message : 'Ошибка генерации обложки');
    } finally {
      setTemplateGenerating(false);
    }
  };

  const handleGenerateCover = async () => {
    if (!token) return;
    const vals = form.getFieldsValue();
    const payload: GenerateCoverPayload = {
      title: (vals.title as string)?.trim() || undefined,
      genre: (vals.genre as string)?.trim() || undefined,
      description: (vals.description as string)?.trim() || undefined,
      publication_year: parsePublicationYear(vals.publication_year),
    };

    setAiGenerating(true);
    try {
      const { url, base64 } = await generateCover(payload, token);

      let blob: Blob | null = null;
      if (base64) {
        try {
          const byteString = atob(base64);
          const ab = new ArrayBuffer(byteString.length);
          const ia = new Uint8Array(ab);
          for (let i = 0; i < byteString.length; i++) {
            ia[i] = byteString.charCodeAt(i);
          }
          blob = new Blob([ab], { type: 'image/jpeg' });
        } catch {
          blob = null;
        }
      }

      setAiCoverUrl(url);
      setAiCoverBlob(blob);
      setAiCoverEditorOpen(true);
    } catch (e) {
      message.error(e instanceof Error ? e.message : 'Ошибка генерации обложки');
    } finally {
      setAiGenerating(false);
    }
  };

  if (!token) {
    return (
      <div className={styles.page}>
        <Title level={3} className={styles.title}>
          Редактирование книги
        </Title>
        <Card>
          <p>Войдите в аккаунт.</p>
          <Link to={ROUTES.AUTH}>
            <Button type="primary">Войти</Button>
          </Link>
        </Card>
      </div>
    );
  }

  if (loading || !book) {
    return (
      <div className={styles.page}>
        <div className={styles.actions} style={{ justifyContent: 'center', padding: 48 }}>
          <Spin size="large" />
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <Title level={3} className={styles.title}>
        Редактирование книги
      </Title>
      <Form form={form} layout="vertical" onFinish={handleFinish} className={styles.form}>
        <Form.Item
          name="title"
          label="Название"
          rules={[{ required: true, message: 'Укажите название книги' }]}
        >
          <Input placeholder="Название книги" maxLength={200} showCount />
        </Form.Item>

        <Form.Item name="genre" label="Жанр">
          <Input placeholder="Например: роман, фантастика, детектив" />
        </Form.Item>

        <Form.Item name="description" label="Аннотация">
          <TextArea rows={4} placeholder="Краткое описание (аннотация) книги" />
        </Form.Item>

        <Form.Item name="publication_year" label="Год издания">
          <Input type="number" placeholder="Например: 2024" min={1000} max={2100} />
        </Form.Item>

        <Form.Item name="publisherName" label="Издательство">
          <Input placeholder="Название издательства (необязательно)" />
        </Form.Item>

        <Form.Item name="isbn" label="ISBN">
          <Input placeholder="Например: 978-5-00-000000-0 (необязательно)" />
        </Form.Item>

        <Form.Item label="Обложка">
          <div className={styles.coverSource}>
            <Radio.Group
              value={coverSource}
              onChange={(e) => setCoverSource((e?.target?.value ?? e) as CoverSource)}
            >
              <Space direction="vertical" size="small">
                <Radio value="keep">Оставить текущую</Radio>
                <Radio value="upload">Загрузить новое изображение (JPG)</Radio>
                <Radio value="ai">Сгенерировать нейросетью</Radio>
                <Radio value="template">Выбрать из шаблонов</Radio>
              </Space>
            </Radio.Group>
            {coverSource === 'keep' && book.cover_image && (
              <img
                src={getImageUrl(book.cover_image)}
                alt=""
                style={{ maxWidth: 120, borderRadius: 4, marginTop: 8 }}
              />
            )}
            {coverSource === 'upload' && (
              <div className={styles.coverUpload} onClick={(e) => e.stopPropagation()}>
                <Upload
                  accept=".jpg,.jpeg"
                  fileList={coverFileList}
                  onChange={({ fileList }) => setCoverFileList(fileList)}
                  beforeUpload={() => false}
                  maxCount={1}
                  showUploadList={{ showPreviewIcon: false }}
                >
                  <Button htmlType="button">Выберите файл JPG</Button>
                </Upload>
                {coverFileList.length > 0 && (
                  <span className={styles.coverFileName}>{coverFileList[0].name}</span>
                )}
              </div>
            )}
            {coverSource === 'ai' && (
              <div className={styles.aiBlock}>
                <Space direction="vertical" size="small">
                  <Button
                    type="primary"
                    loading={aiGenerating}
                    onClick={handleGenerateCover}
                    disabled={!form.getFieldValue('title')?.trim()}
                  >
                    {aiGenerating
                      ? 'Генерация…'
                      : aiCoverUrl
                        ? 'Перегенерировать'
                        : 'Сгенерировать обложку'}
                  </Button>
                  <span className={styles.aiHint}>
                    Используются название, жанр и аннотация из формы
                  </span>
                </Space>
                {aiCoverUrl && !aiGenerating && (
                  <>
                    <img
                      src={getImageUrl(aiCoverUrl)}
                      alt="Сгенерированная обложка"
                      className={styles.aiPreview}
                    />
                    <Button
                      htmlType="button"
                      style={{ marginTop: 8 }}
                      onClick={() => setAiCoverEditorOpen(true)}
                    >
                      Открыть редактор обложки
                    </Button>
                  </>
                )}
              </div>
            )}
            {coverSource === 'template' && (
              <div className={styles.aiBlock}>
                <Space direction="vertical" size="small">
                  <Button
                    htmlType="button"
                    loading={templateGenerating}
                    onClick={() => setTemplateSelectorOpen(true)}
                  >
                    {selectedTemplate
                      ? `Шаблон: ${selectedTemplate.name} — изменить`
                      : 'Открыть каталог шаблонов'}
                  </Button>
                  {templateGenerating && (
                    <span className={styles.aiHint}>Генерация обложки…</span>
                  )}
                </Space>
                {templateCoverPreviewUrl && !templateGenerating && (
                  <>
                    <img
                      src={templateCoverPreviewUrl}
                      alt="Предпросмотр обложки по шаблону"
                      className={styles.aiPreview}
                    />
                    <div style={{ fontSize: 11, color: '#8c8c8c', marginTop: 8, lineHeight: 1.4 }}>
                      На обложку будут добавлены: автор, название, жанр, год,
                      издательство, ISBN и знак © согласно ГОСТ 7.84–2002
                    </div>
                  </>
                )}
                <CoverTemplateSelector
                  open={templateSelectorOpen}
                  onClose={() => setTemplateSelectorOpen(false)}
                  onSelect={handleTemplateSelect}
                />
              </div>
            )}
          </div>
        </Form.Item>

        <Form.Item label="PDF книги">
          <div className={styles.coverSource}>
            <Radio.Group
              value={pdfSource}
              onChange={(e) => setPdfSource((e?.target?.value ?? e) as PdfSource)}
            >
              <Space direction="vertical" size="small">
                <Radio value="keep">Оставить текущий</Radio>
                <Radio value="upload">Загрузить новый PDF</Radio>
                <Radio value="remove">Удалить PDF</Radio>
              </Space>
            </Radio.Group>
            {pdfSource === 'keep' && book?.pdf_url && (
              <a
                href={getImageUrl(book.pdf_url)}
                target="_blank"
                rel="noopener noreferrer"
                style={{ display: 'block', marginTop: 8 }}
              >
                Открыть PDF
              </a>
            )}
            {pdfSource === 'upload' && (
              <div className={styles.coverUpload} onClick={(e) => e.stopPropagation()}>
                <Upload
                  accept=".pdf"
                  fileList={pdfFileList}
                  onChange={({ fileList }) => setPdfFileList(fileList)}
                  beforeUpload={() => false}
                  maxCount={1}
                >
                  <Button htmlType="button">Выберите файл PDF</Button>
                </Upload>
                {pdfFileList.length > 0 && (
                  <span className={styles.coverFileName}>{pdfFileList[0].name}</span>
                )}
              </div>
            )}
          </div>
        </Form.Item>

        {gostErrors && gostErrors.length > 0 && (
          <Alert
            type="error"
            showIcon
            message="PDF не соответствует ГОСТ"
            description={
              <ul style={{ margin: 0, paddingLeft: 20 }}>
                {gostErrors.map((e, i) => (
                  <li key={i}>
                    <strong>{e.name}</strong> (ГОСТ {e.code}): {e.detail}
                  </li>
                ))}
              </ul>
            }
            closable
            onClose={() => setGostErrors(null)}
            style={{ marginBottom: 16 }}
          />
        )}

        <Form.Item className={styles.actions}>
          <Space>
            <Button type="primary" htmlType="submit" loading={submitting}>
              Сохранить
            </Button>
            <Link to={ROUTES.AUTHOR}>
              <Button>Отмена</Button>
            </Link>
          </Space>
        </Form.Item>
      </Form>

      {aiCoverEditorOpen && aiCoverUrl && (
        <CoverEditor
          open={aiCoverEditorOpen}
          imageUrl={getImageUrl(aiCoverUrl)}
          imageBlob={aiCoverBlob}
          initialData={{
            title: form.getFieldValue('title') || '',
            author: user?.name || '',
            genre: form.getFieldValue('genre') || '',
            year: String(form.getFieldValue('publication_year') || ''),
            publisher: form.getFieldValue('publisherName') || '',
            isbn: form.getFieldValue('isbn') || '',
          }}
          onSave={(blob: Blob) => {
            const file = new File([blob], 'ai-cover.jpg', { type: 'image/jpeg' });
            const objectUrl = URL.createObjectURL(blob);
            setCoverFileList([
              {
                uid: '-ai',
                name: 'ai-cover.jpg',
                status: 'done',
                originFileObj: file as File & { uid: string },
              } as UploadFile,
            ]);
            setCoverSource('upload');
            setAiCoverUrl(objectUrl);
            setAiCoverEditorOpen(false);
            message.success('Обложка сохранена');
          }}
          onRegenerate={() => {
            setAiCoverEditorOpen(false);
            setAiCoverUrl(null);
            setAiCoverBlob(null);
            handleGenerateCover();
          }}
          onCancel={() => {
            setAiCoverEditorOpen(false);
          }}
        />
      )}

      <Modal
        title="Результаты проверки по ГОСТ"
        open={gostModalOpen}
        onCancel={() => {
          setGostModalOpen(false);
          setGostResults(null);
          setPendingPayload(null);
        }}
        footer={[
          <Button key="cancel" onClick={() => setGostModalOpen(false)}>
            Отмена
          </Button>,
          <Button key="publish" type="primary" loading={publishing} onClick={handlePublish}>
            Сохранить
          </Button>,
        ]}
        width={600}
      >
        {gostResults?.length ? <GostResultsDisplay gostResults={gostResults} /> : null}
      </Modal>
    </div>
  );
}
