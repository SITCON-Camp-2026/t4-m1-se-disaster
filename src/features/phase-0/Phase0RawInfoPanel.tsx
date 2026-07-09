import { SourceLabel } from "../../components/SourceLabel";
import { StatusBadge } from "../../components/StatusBadge";
import { formatDateTime } from "../../lib/date";
import {
  assessRawDifficulty,
  suggestInformationStatus,
  suggestRawCategory,
} from "./phase0-heuristics";
import type { Phase0MessyRecord } from "./phase0-types";

export function Phase0RawInfoPanel({
  records,
  selectedRecordId,
  workbenchRecordIds,
  onSelect,
}: {
  records: Phase0MessyRecord[];
  selectedRecordId: string;
  workbenchRecordIds: string[];
  onSelect: (recordId: string) => void;
}) {
  return (
    <div className="phase0-raw">
      <div className="panel__header">
        <div>
          <h2>原始資訊</h2>
          <p>這些還不是整理後資料，不能直接當成行動依據。</p>
        </div>
        <p>
          {records.length} 筆資料 · 已放入工作台 {workbenchRecordIds.length} 筆
        </p>
      </div>

      <div className="grid">
        {records.map((record) => {
          const category = suggestRawCategory(record);
          const informationStatus = suggestInformationStatus(record);
          const difficulty = assessRawDifficulty(record);
          const isInWorkbench = workbenchRecordIds.includes(record.id);

          return (
            <article
              className={`record-card record-card--${difficulty.level} ${record.id === selectedRecordId ? "record-card--selected" : ""}`}
              key={record.id}
            >
              <div className="record-card__header">
                <h3>{record.id}</h3>
                <StatusBadge status={record.verificationStatus} />
              </div>
              <div className="raw-category">
                <span>初步分類：{category.label}</span>
                <small>{category.reason}</small>
              </div>
              <div className="info-classification">
                <div>
                  <span>資訊狀態</span>
                  <strong>{informationStatus.label}</strong>
                  <small>{informationStatus.reason}</small>
                </div>
                <div>
                  <span>整理難度</span>
                  <strong>{difficulty.label}</strong>
                  <small>{difficulty.reason}</small>
                </div>
              </div>
              <p>{record.rawText}</p>
              <div className="record-card__meta">
                <SourceLabel sourceType={record.sourceType} />
                <span>更新：{formatDateTime(record.updatedAt)}</span>
              </div>
              <button type="button" onClick={() => onSelect(record.id)}>
                {isInWorkbench ? "查看整理工作台" : "放入整理工作台"}
              </button>
            </article>
          );
        })}
      </div>
    </div>
  );
}
