import { useState } from "react";
import messyReports from "../fixtures/phase-0/messy-reports.json";
import { EmptyState } from "../components/EmptyState";
import { Phase0RawInfoPanel } from "../features/phase-0/Phase0RawInfoPanel";
import { Phase0Workbench } from "../features/phase-0/Phase0Workbench";
import type { Phase0MessyRecord } from "../features/phase-0/phase0-types";
import { V1FlowWorkbench } from "../features/v1/V1FlowWorkbench";

type TabKey = "raw" | "workbench";

const tabs: Array<{ key: TabKey; label: string }> = [
  { key: "raw", label: "原始資訊" },
  { key: "workbench", label: "整理工作台" },
];

const phase0Records = messyReports satisfies Phase0MessyRecord[];
const initialWorkbenchRecordIds = phase0Records
  .slice(0, 6)
  .map((record) => record.id);

export function App() {
  const basePath = import.meta.env.BASE_URL.endsWith("/")
    ? import.meta.env.BASE_URL
    : `${import.meta.env.BASE_URL}/`;
  const isV1Route =
    window.location.pathname === `${basePath}v1` ||
    window.location.pathname.startsWith(`${basePath}v1/`);
  const [activeTab, setActiveTab] = useState<TabKey>("raw");
  const [selectedRecordId, setSelectedRecordId] = useState(
    phase0Records[0]?.id ?? "",
  );
  const [workbenchRecordIds, setWorkbenchRecordIds] = useState<string[]>(
    initialWorkbenchRecordIds,
  );
  const workbenchRecords = phase0Records.filter((record) =>
    workbenchRecordIds.includes(record.id),
  );

  function selectForWorkbench(recordId: string) {
    setWorkbenchRecordIds((currentIds) =>
      currentIds.includes(recordId) ? currentIds : [...currentIds, recordId],
    );
    setSelectedRecordId(recordId);
    setActiveTab("workbench");
  }

  return (
    <main className="layout">
      <header className="hero">
        <p className="eyebrow">SITCON Camp 2026</p>
        <h1>{isV1Route ? "v1 資訊流程工作台" : "災害資訊整理工作台"}</h1>
        {isV1Route ? (
          <p>
            根據 `docs/flow.md`
            實作資訊整理者流程：先看原文與查核狀態，再檢查脈絡、風險與人工判斷紀錄。
          </p>
        ) : (
          <p>
            第一階段先用 coding agent
            做出可展示的前端原型，再從成果中看見資料品質、角色、狀態與來源的限制。
          </p>
        )}
        <div className="hero__actions">
          <a aria-current={!isV1Route ? "page" : undefined} href={basePath}>
            原始資訊
          </a>
          <a
            aria-current={isV1Route ? "page" : undefined}
            href={`${basePath}v1/`}
          >
            行動者工作台
          </a>
        </div>
      </header>

      {isV1Route ? (
        <section className="panel">
          {phase0Records.length === 0 ? (
            <EmptyState message="目前沒有資料" />
          ) : (
            <V1FlowWorkbench records={phase0Records} />
          )}
        </section>
      ) : (
        <>
          <nav className="tabs" aria-label="第一階段工作區">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                className={activeTab === tab.key ? "active" : ""}
                type="button"
                onClick={() => setActiveTab(tab.key)}
              >
                {tab.label}
              </button>
            ))}
          </nav>

          <section className="panel">
            {phase0Records.length === 0 ? (
              <EmptyState message="目前沒有資料" />
            ) : activeTab === "raw" ? (
              <Phase0RawInfoPanel
                records={phase0Records}
                selectedRecordId={selectedRecordId}
                workbenchRecordIds={workbenchRecordIds}
                onSelect={selectForWorkbench}
              />
            ) : (
              <Phase0Workbench
                records={workbenchRecords}
                selectedRecordId={selectedRecordId}
                onSelect={setSelectedRecordId}
              />
            )}
          </section>
        </>
      )}
    </main>
  );
}
