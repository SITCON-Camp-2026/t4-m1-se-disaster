import { useMemo, useState } from "react";
import { SourceLabel } from "../../components/SourceLabel";
import { StatusBadge } from "../../components/StatusBadge";
import { formatDateTime } from "../../lib/date";
import {
  assessInformationCompleteness,
  suggestInformationStatus,
  suggestRawCategory,
} from "../phase-0/phase0-heuristics";
import type { Phase0MessyRecord } from "../phase-0/phase0-types";

type V1Disposition = "pending_draft" | "hold" | "candidate";

type V1ReviewRecord = {
  disposition: V1Disposition;
  rawEvidenceNote: string;
  aiConcern: string;
  humanJudgement: string;
  reviewOwner: string;
  nextCheck: string;
};

type V1FlowAnalysis = {
  record: Phase0MessyRecord;
  categoryLabel: string;
  statusLabel: string;
  statusReason: string;
  hasEnoughContext: boolean;
  contextReason: string;
  riskReasons: string[];
  missingSignals: string[];
  matchedSignals: string[];
  recommendedDisposition: V1Disposition;
  aiCandidateSummary: string;
};

type V1QueueFilter = "all" | "needs_review" | "blocked" | "candidate";

const dispositionLabels: Record<V1Disposition, string> = {
  pending_draft: "待確認整理草稿",
  hold: "暫時不採用",
  candidate: "候選整理結果",
};

const dispositionNotes: Record<V1Disposition, string> = {
  pending_draft: "保留線索與疑點，交給下一位協作者人工確認。",
  hold: "目前不適合使用，但保留不採用理由，避免資料消失。",
  candidate: "只能作為待確認候選結果，不代表已確認或可以行動。",
};

const queueFilters: Array<{ key: V1QueueFilter; label: string }> = [
  { key: "all", label: "全部" },
  { key: "needs_review", label: "需確認" },
  { key: "blocked", label: "暫不採用" },
  { key: "candidate", label: "候選" },
];

function detectRiskReasons(record: Phase0MessyRecord) {
  const text = record.rawText;
  const status = suggestInformationStatus(record);
  const risks: string[] = [];

  if (record.verificationStatus !== "verified") {
    risks.push("查核狀態不是已確認");
  }

  if (status.status === "conflicting") risks.push("原文有衝突或無法確認");
  if (status.status === "secondhand") risks.push("資訊可能是轉述");
  if (status.status === "action_limited") risks.push("原文限制直接行動");
  if (status.status === "time_sensitive") risks.push("資訊有時間條件");

  if (/地址|住家|藥品|長者|親友|同意|手機/.test(text)) {
    risks.push("涉及個資、照護或當事人同意");
  }

  if (/直接過去|直接|派人|封閉|不適合|不要/.test(text)) {
    risks.push("可能影響現場行動");
  }

  if (/不知道|不確定|疑似|無法確認|尚未確認/.test(text)) {
    risks.push("原文明確指出仍不確定");
  }

  return Array.from(new Set(risks));
}

function analyzeRecord(record: Phase0MessyRecord): V1FlowAnalysis {
  const category = suggestRawCategory(record);
  const status = suggestInformationStatus(record);
  const completeness = assessInformationCompleteness(record);
  const riskReasons = detectRiskReasons(record);
  const hasEnoughContext =
    completeness.level === "high" && completeness.missingSignals.length <= 1;
  const recommendedDisposition: V1Disposition = !hasEnoughContext
    ? "pending_draft"
    : riskReasons.some((reason) =>
          /個資|照護|同意|現場行動|衝突|轉述/.test(reason),
        )
      ? "hold"
      : "candidate";

  return {
    record,
    categoryLabel: category.label,
    statusLabel: status.label,
    statusReason: status.reason,
    hasEnoughContext,
    contextReason: hasEnoughContext
      ? "原文已有較完整的時間、地點、需求或限制與來源線索。"
      : "原文仍缺少足夠脈絡，不能直接進入候選結果。",
    riskReasons,
    missingSignals: completeness.missingSignals,
    matchedSignals: completeness.matchedSignals,
    recommendedDisposition,
    aiCandidateSummary: `${category.label}，${status.label}；建議先走「${dispositionLabels[recommendedDisposition]}」。`,
  };
}

function createInitialReviews(records: Phase0MessyRecord[]) {
  return records.reduce<Record<string, V1ReviewRecord>>((reviews, record) => {
    const analysis = analyzeRecord(record);

    reviews[record.id] = {
      disposition: analysis.recommendedDisposition,
      rawEvidenceNote:
        analysis.matchedSignals.length > 0
          ? `原文可見線索：${analysis.matchedSignals.join("、")}`
          : "原文可見線索不足。",
      aiConcern:
        analysis.riskReasons.length > 0
          ? `AI 判讀只能指出風險，不能替人確認：${analysis.riskReasons.slice(0, 2).join("、")}`
          : "AI 判讀仍可能漏看脈絡，候選結果不可視為已確認。",
      humanJudgement: analysis.hasEnoughContext
        ? "先保留原文與待確認狀態，不把候選整理結果當成已確認。"
        : "先補齊缺少脈絡，再決定是否建立候選整理結果。",
      reviewOwner: "資訊整理者",
      nextCheck:
        analysis.missingSignals.length > 0
          ? `補齊${analysis.missingSignals.join("、")}`
          : "檢查 AI 推測是否超出原文",
    };

    return reviews;
  }, {});
}

function getFlowStepStates(analysis: V1FlowAnalysis, review: V1ReviewRecord) {
  return [
    {
      label: "查看原文",
      status: "完成",
      note: "保留 Phase 0 原始資訊，不改寫成整理後資料。",
    },
    {
      label: "脈絡是否足夠",
      status: analysis.hasEnoughContext ? "足夠但仍待確認" : "需要人工確認",
      note: analysis.contextReason,
    },
    {
      label: "高風險或易誤導",
      status: analysis.riskReasons.length > 0 ? "不得派工" : "可做候選整理",
      note:
        analysis.riskReasons.slice(0, 2).join("、") ||
        "目前未看到額外高風險線索，但仍不是已確認。",
    },
    {
      label: "人工處理",
      status: dispositionLabels[review.disposition],
      note: dispositionNotes[review.disposition],
    },
  ];
}

export function V1FlowWorkbench({ records }: { records: Phase0MessyRecord[] }) {
  const analyses = useMemo(() => records.map(analyzeRecord), [records]);
  const [selectedRecordId, setSelectedRecordId] = useState(
    records[0]?.id ?? "",
  );
  const [reviews, setReviews] = useState(() => createInitialReviews(records));
  const [queueFilter, setQueueFilter] = useState<V1QueueFilter>("all");
  const selectedAnalysis =
    analyses.find((analysis) => analysis.record.id === selectedRecordId) ??
    analyses[0];
  const selectedReview = reviews[selectedAnalysis.record.id];
  const flowSteps = getFlowStepStates(selectedAnalysis, selectedReview);
  const needsHumanReviewCount = analyses.filter(
    (analysis) => !analysis.hasEnoughContext || analysis.riskReasons.length > 0,
  ).length;
  const blockedCount = Object.values(reviews).filter(
    (review) => review.disposition === "hold",
  ).length;
  const candidateCount = Object.values(reviews).filter(
    (review) => review.disposition === "candidate",
  ).length;
  const filteredAnalyses = analyses.filter((analysis) => {
    const review = reviews[analysis.record.id];

    if (queueFilter === "needs_review") {
      return !analysis.hasEnoughContext || analysis.riskReasons.length > 0;
    }

    if (queueFilter === "blocked") return review.disposition === "hold";
    if (queueFilter === "candidate") return review.disposition === "candidate";

    return true;
  });
  const reviewList = analyses.map((analysis) => ({
    id: analysis.record.id,
    review: reviews[analysis.record.id],
  }));

  function updateSelectedReview(patch: Partial<V1ReviewRecord>) {
    setReviews((currentReviews) => ({
      ...currentReviews,
      [selectedAnalysis.record.id]: {
        ...currentReviews[selectedAnalysis.record.id],
        ...patch,
      },
    }));
  }

  function resetReviews() {
    setReviews(createInitialReviews(records));
  }

  return (
    <div className="v1-workbench">
      <section className="v1-banner">
        <div>
          <p className="eyebrow">v1 flow prototype</p>
          <h2>資訊整理者流程工作台</h2>
          <p>
            這個畫面只使用 Phase 0
            原始資訊。候選整理結果仍是待確認輸出，不代表已確認，也不代表可以行動。
          </p>
        </div>
        <div className="v1-banner__metrics" aria-label="v1 流程統計">
          <span>
            <strong>{records.length}</strong>
            原始資訊
          </span>
          <span>
            <strong>{needsHumanReviewCount}</strong>
            需人工確認
          </span>
          <span>
            <strong>{blockedCount}</strong>
            暫不採用
          </span>
          <span>
            <strong>{candidateCount}</strong>
            待確認候選
          </span>
        </div>
      </section>

      <div className="v1-layout">
        <aside className="v1-queue" aria-label="v1 原始資訊佇列">
          <div className="v1-filter" aria-label="v1 佇列篩選">
            {queueFilters.map((filter) => (
              <button
                className={queueFilter === filter.key ? "active" : ""}
                key={filter.key}
                type="button"
                onClick={() => setQueueFilter(filter.key)}
              >
                {filter.label}
              </button>
            ))}
          </div>

          {filteredAnalyses.map((analysis) => {
            const review = reviews[analysis.record.id];

            return (
              <button
                className={
                  analysis.record.id === selectedAnalysis.record.id
                    ? "active"
                    : ""
                }
                key={analysis.record.id}
                type="button"
                onClick={() => setSelectedRecordId(analysis.record.id)}
              >
                <span>
                  <strong>{analysis.record.id}</strong>
                  <StatusBadge status={analysis.record.verificationStatus} />
                </span>
                <small>{analysis.categoryLabel}</small>
                <small>
                  {analysis.hasEnoughContext ? "脈絡較完整" : "脈絡不足"} ·{" "}
                  {analysis.riskReasons.length > 0
                    ? "不可直接行動"
                    : "低風險候選"}
                </small>
                <em>{dispositionLabels[review.disposition]}</em>
              </button>
            );
          })}

          {filteredAnalyses.length === 0 ? (
            <p className="v1-empty">這個篩選下目前沒有資料。</p>
          ) : null}
        </aside>

        <section className="v1-main" aria-label="v1 流程檢查">
          <article className="v1-record">
            <div className="v1-record__header">
              <div>
                <p className="eyebrow">Phase 0 原始資訊</p>
                <h3>{selectedAnalysis.record.id}</h3>
              </div>
              <StatusBadge
                status={selectedAnalysis.record.verificationStatus}
              />
            </div>
            <p>{selectedAnalysis.record.rawText}</p>
            <div className="record-card__meta">
              <SourceLabel sourceType={selectedAnalysis.record.sourceType} />
              <span>
                更新：{formatDateTime(selectedAnalysis.record.updatedAt)}
              </span>
            </div>
          </article>

          <section className="v1-flow-steps">
            <div className="v1-section-heading">
              <p className="eyebrow">flow.md 實作</p>
              <h3>從原始資訊到下一位協作者檢查</h3>
            </div>
            {flowSteps.map((step, index) => (
              <article key={step.label}>
                <b>{index + 1}</b>
                <div>
                  <h4>{step.label}</h4>
                  <strong>{step.status}</strong>
                  <p>{step.note}</p>
                </div>
              </article>
            ))}
          </section>

          <section className="v1-evidence-grid">
            <article>
              <h4>已看到的原文線索</h4>
              <div>
                {selectedAnalysis.matchedSignals.map((signal) => (
                  <span key={signal}>{signal}</span>
                ))}
              </div>
            </article>
            <article>
              <h4>仍待補齊的脈絡</h4>
              <div>
                {selectedAnalysis.missingSignals.map((signal) => (
                  <span key={signal}>{signal}</span>
                ))}
                {selectedAnalysis.missingSignals.length === 0 ? (
                  <span>仍需檢查是否有 AI 推測</span>
                ) : null}
              </div>
            </article>
            <article>
              <h4>不能自動處理的原因</h4>
              <ul>
                {selectedAnalysis.riskReasons.map((reason) => (
                  <li key={reason}>{reason}</li>
                ))}
                {selectedAnalysis.riskReasons.length === 0 ? (
                  <li>仍不可顯示為已確認，只能保留待確認狀態。</li>
                ) : null}
              </ul>
            </article>
          </section>

          <section className="v1-compare">
            <div className="v1-section-heading">
              <p className="eyebrow">AI 推測與人工判斷分開</p>
              <h3>候選整理仍需人檢查</h3>
            </div>
            <div className="v1-compare__grid">
              <article>
                <span>AI 候選判讀</span>
                <strong>{selectedAnalysis.aiCandidateSummary}</strong>
                <p>{selectedReview.aiConcern}</p>
              </article>
              <article>
                <span>原文依據</span>
                <strong>{selectedReview.rawEvidenceNote}</strong>
                <p>這裡只列原文可見線索，不補真實地址、電話、人物或地圖。</p>
              </article>
              <article>
                <span>人工判斷</span>
                <strong>{selectedReview.humanJudgement}</strong>
                <p>{selectedReview.nextCheck}</p>
              </article>
            </div>
          </section>
        </section>

        <aside className="v1-review" aria-label="人工判斷紀錄">
          <div className="v1-section-heading">
            <p className="eyebrow">人工判斷紀錄</p>
            <h3>輸出給下一位協作者</h3>
          </div>

          <label>
            人工處理結果
            <select
              value={selectedReview.disposition}
              onChange={(event) =>
                updateSelectedReview({
                  disposition: event.target.value as V1Disposition,
                })
              }
            >
              <option value="pending_draft">待確認整理草稿</option>
              <option value="hold">暫時不採用</option>
              <option value="candidate">候選整理結果</option>
            </select>
          </label>

          {selectedReview.disposition === "candidate" ? (
            <p className="v1-warning">
              候選整理結果仍需人工確認，不能顯示成 confirmed，也不能直接派工。
            </p>
          ) : null}

          <label>
            原文依據紀錄
            <textarea
              rows={3}
              value={selectedReview.rawEvidenceNote}
              onChange={(event) =>
                updateSelectedReview({ rawEvidenceNote: event.target.value })
              }
            />
          </label>

          <label>
            AI 推測疑慮
            <textarea
              rows={3}
              value={selectedReview.aiConcern}
              onChange={(event) =>
                updateSelectedReview({ aiConcern: event.target.value })
              }
            />
          </label>

          <label>
            人工判斷理由
            <textarea
              rows={4}
              value={selectedReview.humanJudgement}
              onChange={(event) =>
                updateSelectedReview({ humanJudgement: event.target.value })
              }
            />
          </label>

          <label>
            需要誰確認
            <input
              value={selectedReview.reviewOwner}
              onChange={(event) =>
                updateSelectedReview({ reviewOwner: event.target.value })
              }
            />
          </label>

          <label>
            下一步要確認什麼
            <textarea
              rows={3}
              value={selectedReview.nextCheck}
              onChange={(event) =>
                updateSelectedReview({ nextCheck: event.target.value })
              }
            />
          </label>

          <section className="v1-output">
            <h4>目前輸出</h4>
            <dl>
              <div>
                <dt>狀態</dt>
                <dd>{dispositionLabels[selectedReview.disposition]}</dd>
              </div>
              <div>
                <dt>查核</dt>
                <dd>仍需人工確認</dd>
              </div>
              <div>
                <dt>行動</dt>
                <dd>不能直接變成任務</dd>
              </div>
            </dl>
          </section>

          <section className="v1-review-list">
            <div className="v1-section-heading">
              <h4>判斷紀錄清單</h4>
              <button type="button" onClick={resetReviews}>
                重設
              </button>
            </div>
            <div>
              {reviewList.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelectedRecordId(item.id)}
                >
                  <strong>{item.id}</strong>
                  <span>{dispositionLabels[item.review.disposition]}</span>
                </button>
              ))}
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
