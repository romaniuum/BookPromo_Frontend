import { Alert, List, Tag } from 'antd';
import type { GostResult } from '../../Api/books';
import { GOST_PRIORITY_TABLE, NEW_GOST_CODES, GOST_CHECK_COUNT } from '../../Constants/gost';
import { mergeGostResults, type MergedGostResult } from '../../Utils/gost';
import styles from '../../Page/CreateBook/CreateBookPage.module.css';

type Props = {
  gostResults: GostResult[];
  /** Если true и все проверки пройдены — показывать только Alert "Пройдено" */
  allPassedShortcut?: boolean;
};

function renderGostItem(r: MergedGostResult) {
  const isSkipped = r.skipped;
  const color = isSkipped ? '#faad14' : r.ok ? '#52c41a' : '#ff4d4f';
  const icon = isSkipped ? '○' : r.ok ? '✓' : '✗';
  return (
    <List.Item
      className={isSkipped ? styles.gostSkipped : r.ok ? styles.gostOk : styles.gostFail}
      style={{ borderLeft: `3px solid ${color}`, paddingLeft: 12, marginBottom: 8 }}
    >
      <span style={{ marginRight: 8, fontWeight: 'bold', color }}>{icon}</span>
      <span>
        {r.priority && <span style={{ marginRight: 8, color: '#999' }}>№{r.priority} </span>}
        <strong>{r.name}</strong> ({r.code}){' '}
        {NEW_GOST_CODES.has(r.code) && (
          <Tag color="blue" style={{ marginLeft: 6, fontSize: 11 }}>Новое</Tag>
        )}
        : {r.detail}
      </span>
    </List.Item>
  );
}

export function GostResultsDisplay({ gostResults, allPassedShortcut = false }: Props) {
  const merged = mergeGostResults(gostResults);
  const passed = merged.filter((r) => r.ok);
  const failed = merged.filter((r) => !r.ok && !r.skipped);
  const skipped = merged.filter((r) => r.skipped);

  if (allPassedShortcut && passed.length === GOST_CHECK_COUNT && failed.length === 0) {
    return <Alert type="success" showIcon message="Пройдено" />;
  }

  return (
    <div className={styles.gostResults}>
      <Alert
        type={failed.length > 0 ? 'warning' : 'info'}
        showIcon
        message={`Пройдено ${passed.length} из ${GOST_CHECK_COUNT}`}
        style={{ marginBottom: 12 }}
      />
      <Alert
        type="info"
        showIcon
        message="Проверяемые ГОСТы (приоритетная таблица)"
        description={
          <table className={styles.gostTable}>
            <thead>
              <tr>
                <th>№</th>
                <th>ГОСТ</th>
                <th>Ключевая проверка</th>
              </tr>
            </thead>
            <tbody>
              {GOST_PRIORITY_TABLE.map((row) => (
                <tr key={row.priority}>
                  <td>{row.priority}</td>
                  <td>{row.code}</td>
                  <td>{row.check}</td>
                </tr>
              ))}
            </tbody>
          </table>
        }
        style={{ marginBottom: 12 }}
      />
      {failed.length > 0 && (
        <>
          <div style={{ marginBottom: 8, color: '#ff4d4f', fontWeight: 600 }}>Не пройдены ({failed.length})</div>
          <List size="small" dataSource={failed} renderItem={renderGostItem} />
        </>
      )}
      {skipped.length > 0 && (
        <>
          <div style={{ marginBottom: 8, color: '#faad14', fontWeight: 600, marginTop: failed.length > 0 ? 16 : 0 }}>
            Пропущены ({skipped.length})
          </div>
          <List size="small" dataSource={skipped} renderItem={renderGostItem} />
        </>
      )}
    </div>
  );
}
