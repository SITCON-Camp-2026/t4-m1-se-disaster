import { useMemo, useState } from "react";
import { RecordCard } from "../../components/RecordCard";
import { StatusBadge } from "../../components/StatusBadge";
import { Phase0JudgementCard } from "./Phase0JudgementCard";
import {
  assessInformationCompleteness,
  createPhase0Judgement,
  suggestInformationStatus,
  suggestRawCategory,
} from "./phase0-heuristics";
import type {
  Phase0Confidence,
  Phase0EditableDraft,
  Phase0FitAnswer,
  Phase0MessyRecord,
  Phase0PossibleKind,
  Phase0SuggestedNextStep,
} from "./phase0-types";

type QueueFilter = "all" | "needs_review" | "unsafe" | "no_draft";

const queueFilters: Array<{ key: QueueFilter; label: string }> = [
  { key: "all", label: "全部" },
  { key: "needs_review", label: "需確認" },
  { key: "unsafe", label: "不可行動" },
  { key: "no_draft", label: "無草稿" },
];

const possibleKindOptions: Array<{
  value: Phase0PossibleKind;
  label: string;
}> = [
  { value: "unknown", label: "候選類型待判斷" },
  { value: "help_request_candidate", label: "求助候選" },
  { value: "site_status_candidate", label: "地點狀態候選" },
  { value: "task_candidate", label: "任務候選" },
  { value: "assignment_candidate", label: "人員指派候選" },
  { value: "announcement_candidate", label: "公告候選" },
];

const confidenceOptions: Array<{ value: Phase0Confidence; label: string }> = [
  { value: "low", label: "低" },
  { value: "medium", label: "中" },
  { value: "high", label: "高" },
];

const nextStepOptions: Array<{
  value: Phase0SuggestedNextStep;
  label: string;
}> = [
  { value: "keep_raw", label: "先保留原始資訊" },
  { value: "ask_for_more_info", label: "補問來源或現場資訊" },
  { value: "send_to_human_review", label: "交給人工確認" },
  { value: "create_candidate_report", label: "建立候選通報" },
  { value: "create_site_update_suggestion", label: "建立地點更新建議" },
  { value: "do_not_use_yet", label: "暫時不要使用" },
];

const fitAnswerOptions: Array<{ value: Phase0FitAnswer; label: string }> = [
  { value: "yes", label: "符合" },
  { value: "partial", label: "部分符合" },
  { value: "no", label: "不符合" },
];

type ReviewAllocation = {
  record: Phase0MessyRecord;
  priority: number;
  rawScore: number;
  assignedPeople: number;
  reason: string;
};

function maxMinNormalize(values: number[]) {
  const min = Math.min(...values);
  const max = Math.max(...values);

  if (max === min) return values.map(() => 1);

  return values.map((value) => (value - min) / (max - min));
}

function formatAllocationShare(assignedPeople: number, reviewerCount: number) {
  if (reviewerCount <= 0) return "0%";

  return `${Math.round((assignedPeople / reviewerCount) * 100)}%`;
}

function scoreFitAnswer(answer: Phase0FitAnswer) {
  if (answer === "yes") return 2;
  if (answer === "partial") return 1;
  return 0;
}

function calculateFit(draft: Phase0EditableDraft) {
  const score =
    scoreFitAnswer(draft.sourceFit) +
    scoreFitAnswer(draft.timeFit) +
    scoreFitAnswer(draft.confirmationFit) +
    scoreFitAnswer(draft.boundaryFit);
  const percentage = Math.round((score / 8) * 100);

  if (percentage >= 75) {
    return {
      percentage,
      label: "適配度高",
      note: "適合接手整理與確認，但仍不可直接當成救災行動。",
    };
  }

  if (percentage >= 40) {
    return {
      percentage,
      label: "適配度中",
      note: "可以先整理一部分，並把不確定處交給更合適的人確認。",
    };
  }

  return {
    percentage,
    label: "適配度低",
    note: "建議先轉交或請人協助，不要獨自推進這筆資訊。",
  };
}

function buildReviewAllocations({
  records,
  drafts,
  reviewerCount,
}: {
  records: Phase0MessyRecord[];
  drafts: Record<string, Phase0EditableDraft>;
  reviewerCount: number;
}): ReviewAllocation[] {
  if (records.length === 0) return [];

  const metrics = records.map((record) => {
    const draft = drafts[record.id];
    const status = suggestInformationStatus(record);
    const completeness = assessInformationCompleteness(record);
    const reasons: string[] = [];
    let risk = 0;
    let effort = 0;

    if (!draft) {
      risk += 3;
      reasons.push("尚未建立草稿");
    }

    if (draft?.needsHumanReview ?? record.verificationStatus !== "verified") {
      risk += 2;
      reasons.push("需要人工確認");
    }

    if (draft?.unsafeToActDirectly) {
      risk += 1;
      reasons.push("不能直接變成任務");
    }

    if (status.status === "conflicting") {
      risk += 3;
      reasons.push("說法衝突");
    } else if (status.status === "time_sensitive") {
      risk += 2;
      reasons.push("時間敏感");
    } else if (status.status === "secondhand") {
      risk += 2;
      reasons.push("轉述資訊");
    } else if (status.status === "action_limited") {
      risk += 2;
      reasons.push("行動受限");
    } else if (status.status === "unverified") {
      risk += 1;
      reasons.push("未查核");
    }

    if (completeness.level === "low") {
      effort += 3;
      reasons.push("資訊完整度低");
    } else if (completeness.level === "medium") {
      effort += 2;
      reasons.push("資訊完整度中");
    } else {
      effort += 1;
    }

    if (draft?.humanCorrection.trim()) {
      risk += 1;
      reasons.push("已有人工修正待確認");
    }

    return { record, risk, effort, reasons };
  });

  const normalizedRisk = maxMinNormalize(metrics.map((metric) => metric.risk));
  const normalizedEffort = maxMinNormalize(
    metrics.map((metric) => metric.effort),
  );
  const allocations = metrics.map((metric, index) => ({
    record: metric.record,
    priority: Math.round(
      (normalizedRisk[index] * 0.72 + normalizedEffort[index] * 0.28) * 100,
    ),
    rawScore: metric.risk + metric.effort,
    assignedPeople: 0,
    reason: metric.reasons.slice(0, 3).join("、") || "資訊相對完整",
  }));
  const reviewerSlots = Math.max(0, Math.floor(reviewerCount));

  for (let slot = 0; slot < reviewerSlots; slot += 1) {
    const nextAllocation = allocations.reduce((best, current) => {
      const bestCoverage = (best.priority + 1) / (best.assignedPeople + 1);
      const currentCoverage =
        (current.priority + 1) / (current.assignedPeople + 1);

      return currentCoverage > bestCoverage ? current : best;
    }, allocations[0]);

    nextAllocation.assignedPeople += 1;
  }

  return allocations.sort((a, b) => b.priority - a.priority);
}

function createBlankDraft(record: Phase0MessyRecord): Phase0EditableDraft {
  const safetyBoundary = createPhase0Judgement(record);

  return {
    ...safetyBoundary,
    draftTitle: "",
    humanCorrection: "",
    humanReviewNote: "",
    allowedAction: "保留原文、標記疑點、補齊需要確認的問題。",
    disallowedAction:
      "不要直接派工、發布為已確認事實，或補上原文沒有的地址與聯絡資訊。",
    confirmationOwner: "待指定人工確認者",
    sourceFit: "partial",
    timeFit: "partial",
    confirmationFit: "partial",
    boundaryFit: "yes",
    needsHumanReview: record.verificationStatus !== "verified",
  };
}

function createInitialDrafts(records: Phase0MessyRecord[]) {
  return records.slice(0, 6).reduce<Record<string, Phase0EditableDraft>>(
    (drafts, record) => ({
      ...drafts,
      [record.id]: createBlankDraft(record),
    }),
    {},
  );
}

function splitLines(value: string) {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function buildReviewQuestions({
  record,
  draft,
}: {
  record: Phase0MessyRecord;
  draft?: Phase0EditableDraft;
}) {
  const status = suggestInformationStatus(record);
  const completeness = assessInformationCompleteness(record);
  const questions = new Set<string>();

  completeness.missingSignals.forEach((signal) => {
    questions.add(`補齊${signal}`);
  });

  if (status.status === "conflicting") {
    questions.add("釐清衝突說法哪一個較新或較可信");
  }

  if (status.status === "time_sensitive") {
    questions.add("確認時間條件是否仍有效");
  }

  if (status.status === "secondhand") {
    questions.add("確認是否能找到直接來源或當事人同意");
  }

  if (draft?.unsafeToActDirectly) {
    questions.add("寫清楚不能直接行動的原因");
  }

  if (!draft) {
    questions.add("先建立草稿並記錄人工判斷");
  }

  return Array.from(questions).slice(0, 5);
}

export function Phase0Workbench({
  records,
  selectedRecordId,
  onSelect,
}: {
  records: Phase0MessyRecord[];
  selectedRecordId: string;
  onSelect: (recordId: string) => void;
}) {
  const initialDrafts = useMemo(() => createInitialDrafts(records), [records]);
  const [drafts, setDrafts] =
    useState<Record<string, Phase0EditableDraft>>(initialDrafts);
  const [queueFilter, setQueueFilter] = useState<QueueFilter>("all");
  const [reviewerCount, setReviewerCount] = useState(4);
  const selectedRecord =
    records.find((record) => record.id === selectedRecordId) ?? records[0];
  const safetyBoundary = createPhase0Judgement(selectedRecord);
  const selectedDraft = drafts[selectedRecord.id];
  const draftCount = Object.keys(drafts).length;
  const needsReviewCount = records.filter(
    (record) => record.verificationStatus !== "verified",
  ).length;
  const unsafeDraftCount = Object.values(drafts).filter(
    (draft) => draft.unsafeToActDirectly,
  ).length;
  const humanCorrectionCount = Object.values(drafts).filter((draft) =>
    draft.humanCorrection.trim(),
  ).length;
  const reviewAllocations = useMemo(
    () =>
      buildReviewAllocations({
        records,
        drafts,
        reviewerCount,
      }),
    [records, drafts, reviewerCount],
  );
  const selectedCategory = suggestRawCategory(selectedRecord);
  const selectedInformationStatus = suggestInformationStatus(selectedRecord);
  const selectedCompleteness = assessInformationCompleteness(selectedRecord);
  const selectedAllocation = reviewAllocations.find(
    (allocation) => allocation.record.id === selectedRecord.id,
  );
  const selectedReviewQuestions = buildReviewQuestions({
    record: selectedRecord,
    draft: selectedDraft,
  });
  const filteredRecords = records.filter((record) => {
    const draft = drafts[record.id];

    if (queueFilter === "needs_review") {
      return (
        record.verificationStatus !== "verified" || draft?.needsHumanReview
      );
    }

    if (queueFilter === "unsafe") {
      return draft?.unsafeToActDirectly === true;
    }

    if (queueFilter === "no_draft") {
      return !draft;
    }

    return true;
  });
  const nextRecordWithoutDraft = records.find((record) => !drafts[record.id]);

  function upsertDraft(record: Phase0MessyRecord) {
    setDrafts((currentDrafts) => ({
      ...currentDrafts,
      [record.id]: currentDrafts[record.id] ?? createBlankDraft(record),
    }));
  }

  function deleteDraft(recordId: string) {
    setDrafts((currentDrafts) => {
      const nextDrafts = { ...currentDrafts };
      delete nextDrafts[recordId];
      return nextDrafts;
    });
  }

  function resetDrafts() {
    setDrafts(createInitialDrafts(records));
  }

  function updateSelectedDraft(
    patch: Partial<
      Omit<Phase0EditableDraft, "messyRecordId" | "evidence" | "blockers">
    >,
  ) {
    setDrafts((currentDrafts) => ({
      ...currentDrafts,
      [selectedRecord.id]: {
        ...(currentDrafts[selectedRecord.id] ??
          createBlankDraft(selectedRecord)),
        ...patch,
      },
    }));
  }

  function updateDraftLines(field: "evidence" | "blockers", value: string) {
    setDrafts((currentDrafts) => ({
      ...currentDrafts,
      [selectedRecord.id]: {
        ...(currentDrafts[selectedRecord.id] ??
          createBlankDraft(selectedRecord)),
        [field]: splitLines(value),
      },
    }));
  }

  return (
    <div className="workbench">
      <div className="workbench__intro">
        <p className="eyebrow">整理工作台</p>
        <h2>先找出高風險資訊，再把人類需要確認的判斷留下來。</h2>
        <p>
          草稿只是協作中的工作筆記，不是整理後資料。任何需要確認、來源不明或不能直接變成任務的內容，都應該在這裡被看見。
        </p>
      </div>

      <div className="workbench__layout">
        <aside className="workbench__queue" aria-label="選擇原始資訊">
          <div className="queue-filter" aria-label="資料篩選">
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

          {filteredRecords.map((record) => {
            const category = suggestRawCategory(record);
            const informationStatus = suggestInformationStatus(record);
            const completeness = assessInformationCompleteness(record);

            return (
              <button
                className={record.id === selectedRecord.id ? "active" : ""}
                key={record.id}
                type="button"
                onClick={() => onSelect(record.id)}
              >
                <span className="queue-item__top">
                  <strong>{record.id}</strong>
                  <StatusBadge status={record.verificationStatus} />
                </span>
                <small>{category.label}</small>
                <small>
                  {informationStatus.label} · 完整度 {completeness.label}
                </small>
                <small>{drafts[record.id] ? "已有草稿" : "尚未建立"}</small>
                <span className="queue-item__flags">
                  {(drafts[record.id]?.needsHumanReview ??
                  record.verificationStatus !== "verified") ? (
                    <span>需確認</span>
                  ) : null}
                  {drafts[record.id]?.unsafeToActDirectly ? (
                    <span>不可行動</span>
                  ) : null}
                  {!drafts[record.id] ? <span>待判斷</span> : null}
                </span>
              </button>
            );
          })}

          {filteredRecords.length === 0 ? (
            <p className="workbench__empty">這個篩選下目前沒有資料。</p>
          ) : null}
        </aside>

        <div className="workbench__main">
          <RecordCard record={selectedRecord} />

          <section className="analysis-card">
            <div className="analysis-card__header">
              <div>
                <p className="eyebrow">資訊剖析</p>
                <h3>{selectedRecord.id} 的整理重點</h3>
              </div>
              <strong>{selectedAllocation?.priority ?? 0}</strong>
            </div>

            <div className="analysis-grid">
              <div>
                <span>初步分類</span>
                <strong>{selectedCategory.label}</strong>
                <small>{selectedCategory.reason}</small>
              </div>
              <div>
                <span>資訊狀態</span>
                <strong>{selectedInformationStatus.label}</strong>
                <small>{selectedInformationStatus.reason}</small>
              </div>
              <div>
                <span>資訊完整度</span>
                <strong>完整度 {selectedCompleteness.label}</strong>
                <small>{selectedCompleteness.reason}</small>
              </div>
              <div>
                <span>建議審查比例</span>
                <strong>
                  {formatAllocationShare(
                    selectedAllocation?.assignedPeople ?? 0,
                    reviewerCount,
                  )}
                </strong>
                <small>依目前 max-min 優先分數分配，不代表現場派工。</small>
              </div>
            </div>

            <div className="signal-grid">
              <section>
                <h4>已看到的線索</h4>
                <div>
                  {selectedCompleteness.matchedSignals.map((signal) => (
                    <span key={signal}>{signal}</span>
                  ))}
                </div>
              </section>
              <section>
                <h4>缺少的線索</h4>
                <div>
                  {selectedCompleteness.missingSignals.map((signal) => (
                    <span key={signal}>{signal}</span>
                  ))}
                </div>
              </section>
            </div>

            <section className="review-questions">
              <h4>下一步審查問題</h4>
              <ul>
                {selectedReviewQuestions.map((question) => (
                  <li key={question}>{question}</li>
                ))}
              </ul>
            </section>
          </section>

          <Phase0JudgementCard
            judgement={selectedDraft ?? safetyBoundary}
            record={selectedRecord}
            hasDraft={Boolean(selectedDraft)}
          />

          <form className="draft-editor">
            <div className="draft-editor__header">
              <div>
                <p className="eyebrow">可編輯整理草稿</p>
                <h3>{selectedDraft ? "確認我能做什麼" : "這筆尚未建立草稿"}</h3>
              </div>
              <div className="draft-editor__actions">
                <button
                  type="button"
                  onClick={() => upsertDraft(selectedRecord)}
                >
                  {selectedDraft ? "保留草稿" : "建立草稿"}
                </button>
                <button
                  disabled={!selectedDraft}
                  type="button"
                  onClick={() => deleteDraft(selectedRecord.id)}
                >
                  刪除草稿
                </button>
              </div>
            </div>

            {selectedDraft ? (
              <>
                <section className="action-boundary">
                  <div>
                    <span>現在可以做</span>
                    <strong>{selectedDraft.allowedAction}</strong>
                  </div>
                  <div>
                    <span>現在不能做</span>
                    <strong>{selectedDraft.disallowedAction}</strong>
                  </div>
                  <div>
                    <span>需要確認者</span>
                    <strong>{selectedDraft.confirmationOwner}</strong>
                  </div>
                </section>

                <section className="fit-check">
                  <div className="fit-check__header">
                    <div>
                      <h4>我和這筆整理任務的適配度</h4>
                      <p>{calculateFit(selectedDraft).note}</p>
                    </div>
                    <strong>{calculateFit(selectedDraft).percentage}%</strong>
                  </div>
                  <div className="fit-check__result">
                    {calculateFit(selectedDraft).label}
                  </div>
                  <div className="fit-question-grid">
                    <label>
                      我看得懂這筆資訊的來源與限制嗎？
                      <select
                        value={selectedDraft.sourceFit}
                        onChange={(event) =>
                          updateSelectedDraft({
                            sourceFit: event.target.value as Phase0FitAnswer,
                          })
                        }
                      >
                        {fitAnswerOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label>
                      我有時間補齊或追蹤缺漏資訊嗎？
                      <select
                        value={selectedDraft.timeFit}
                        onChange={(event) =>
                          updateSelectedDraft({
                            timeFit: event.target.value as Phase0FitAnswer,
                          })
                        }
                      >
                        {fitAnswerOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label>
                      我知道這筆資訊應該交給誰確認嗎？
                      <select
                        value={selectedDraft.confirmationFit}
                        onChange={(event) =>
                          updateSelectedDraft({
                            confirmationFit: event.target
                              .value as Phase0FitAnswer,
                          })
                        }
                      >
                        {fitAnswerOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label>
                      我能只做整理，不直接派工或判定真實嗎？
                      <select
                        value={selectedDraft.boundaryFit}
                        onChange={(event) =>
                          updateSelectedDraft({
                            boundaryFit: event.target.value as Phase0FitAnswer,
                          })
                        }
                      >
                        {fitAnswerOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                </section>

                <label>
                  草稿標題
                  <input
                    placeholder="例如：先記錄原文中的候選需求，不補地址"
                    value={selectedDraft.draftTitle}
                    onChange={(event) =>
                      updateSelectedDraft({ draftTitle: event.target.value })
                    }
                  />
                </label>

                <div className="draft-editor__grid">
                  <label>
                    候選類型
                    <select
                      value={selectedDraft.possibleKind}
                      onChange={(event) =>
                        updateSelectedDraft({
                          possibleKind: event.target
                            .value as Phase0PossibleKind,
                        })
                      }
                    >
                      {possibleKindOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label>
                    信心程度
                    <select
                      value={selectedDraft.confidence}
                      onChange={(event) =>
                        updateSelectedDraft({
                          confidence: event.target.value as Phase0Confidence,
                        })
                      }
                    >
                      {confidenceOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label>
                    下一步
                    <select
                      value={selectedDraft.suggestedNextStep}
                      onChange={(event) =>
                        updateSelectedDraft({
                          suggestedNextStep: event.target
                            .value as Phase0SuggestedNextStep,
                        })
                      }
                    >
                      {nextStepOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <div className="draft-editor__grid">
                  <label>
                    我現在可以做什麼
                    <textarea
                      rows={3}
                      value={selectedDraft.allowedAction}
                      onChange={(event) =>
                        updateSelectedDraft({
                          allowedAction: event.target.value,
                        })
                      }
                    />
                  </label>

                  <label>
                    我現在不能做什麼
                    <textarea
                      rows={3}
                      value={selectedDraft.disallowedAction}
                      onChange={(event) =>
                        updateSelectedDraft({
                          disallowedAction: event.target.value,
                        })
                      }
                    />
                  </label>

                  <label>
                    交給誰確認
                    <textarea
                      rows={3}
                      value={selectedDraft.confirmationOwner}
                      onChange={(event) =>
                        updateSelectedDraft({
                          confirmationOwner: event.target.value,
                        })
                      }
                    />
                  </label>
                </div>

                <label className="draft-editor__toggle">
                  <input
                    checked={selectedDraft.needsHumanReview}
                    type="checkbox"
                    onChange={(event) =>
                      updateSelectedDraft({
                        needsHumanReview: event.target.checked,
                      })
                    }
                  />
                  需要人工確認
                </label>

                <label className="draft-editor__toggle">
                  <input
                    checked={selectedDraft.unsafeToActDirectly}
                    type="checkbox"
                    onChange={(event) =>
                      updateSelectedDraft({
                        unsafeToActDirectly: event.target.checked,
                      })
                    }
                  />
                  不能直接變成志工任務
                </label>

                <label>
                  原文中可看到的依據，一行一點
                  <textarea
                    rows={4}
                    value={selectedDraft.evidence.join("\n")}
                    onChange={(event) =>
                      updateDraftLines("evidence", event.target.value)
                    }
                  />
                </label>

                <label>
                  卡住原因，一行一點
                  <textarea
                    rows={4}
                    value={selectedDraft.blockers.join("\n")}
                    onChange={(event) =>
                      updateDraftLines("blockers", event.target.value)
                    }
                  />
                </label>

                <label>
                  人工質疑或修正
                  <textarea
                    placeholder="例如：agent 可能把來源說法當成現場事實，需保留疑問。"
                    rows={3}
                    value={selectedDraft.humanCorrection}
                    onChange={(event) =>
                      updateSelectedDraft({
                        humanCorrection: event.target.value,
                      })
                    }
                  />
                </label>

                <label>
                  需要誰或什麼資訊確認
                  <textarea
                    placeholder="例如：現場窗口、當事人同意、時間是否仍有效。"
                    rows={3}
                    value={selectedDraft.humanReviewNote}
                    onChange={(event) =>
                      updateSelectedDraft({
                        humanReviewNote: event.target.value,
                      })
                    }
                  />
                </label>
              </>
            ) : (
              <p className="draft-editor__empty">
                請先建立草稿；建立後只會存在目前畫面狀態，不會寫入原始資料，也不會存到瀏覽器。
              </p>
            )}
          </form>
        </div>

        <aside className="workbench__checklist">
          <h3>判斷儀表</h3>

          <div className="metric-grid">
            <div>
              <span>{records.length}</span>
              <small>原始資訊</small>
            </div>
            <div>
              <span>{draftCount}</span>
              <small>草稿</small>
            </div>
            <div>
              <span>{needsReviewCount}</span>
              <small>需確認</small>
            </div>
            <div>
              <span>{unsafeDraftCount}</span>
              <small>不可行動</small>
            </div>
          </div>

          <section className="review-focus">
            <h4>現在最該看</h4>
            {nextRecordWithoutDraft ? (
              <button
                type="button"
                onClick={() => onSelect(nextRecordWithoutDraft.id)}
              >
                前往 {nextRecordWithoutDraft.id}
              </button>
            ) : (
              <p>每筆資料都已有草稿，接著可以檢查人工修正。</p>
            )}
          </section>

          <section className="review-focus">
            <h4>人工修正</h4>
            <p>{humanCorrectionCount} 筆草稿已留下人類質疑或修正。</p>
          </section>

          <section className="allocation-panel">
            <div>
              <h4>審查人力分配</h4>
              <p>使用 max-min 正規化排序，只做整理工作量建議。</p>
            </div>

            <label>
              可用人力
              <input
                min="0"
                max="12"
                type="number"
                value={reviewerCount}
                onChange={(event) =>
                  setReviewerCount(Number(event.target.value))
                }
              />
            </label>

            <div className="allocation-list">
              {reviewAllocations.map((allocation) => (
                <button
                  key={allocation.record.id}
                  type="button"
                  onClick={() => onSelect(allocation.record.id)}
                >
                  <span>
                    <strong>{allocation.record.id}</strong>
                    <b>{allocation.priority}</b>
                  </span>
                  <small>{allocation.reason}</small>
                  <em>
                    {formatAllocationShare(
                      allocation.assignedPeople,
                      reviewerCount,
                    )}
                  </em>
                </button>
              ))}
            </div>
          </section>

          <button type="button" onClick={resetDrafts}>
            重設為 6 筆安全預設草稿
          </button>
        </aside>
      </div>
    </div>
  );
}
