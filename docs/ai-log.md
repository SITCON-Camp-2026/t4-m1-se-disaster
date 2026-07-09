# AI Log

這份紀錄用來留下使用者如何使用 AI / Coding Agent 的操作脈絡。重點不是逐字保存所有對話，而是記錄重要協作、取捨與人類判斷。

## 什麼時候要記錄

請在以下情況更新本檔案：

- AI 協助分析原始資訊。
- AI 協助找出不能判斷處。
- AI 協助判斷哪些資訊不能直接相信。
- AI 協助判斷哪些資訊不能直接變成任務。
- AI 協助修改畫面標示或前端工作台。
- AI 可能補了原文沒有的資訊。
- AI 建議被使用者拒絕，且拒絕原因和安全 / 正確性 / scope 有關
- AI 輸出可能造成誤導，例如把未確認資料寫成已確認事實

## 不需要記錄

- 不需要逐字貼完整對話
- 不需要記錄每一次小型 autocomplete
- 不需要記錄單純修 typo 或格式化

## 紀錄格式

| 時間       | 階段       | 任務                                 | AI / Agent 建議                                                                                                                 | 採用 / 拒絕      | 人類判斷理由                                                                                                          | 相關檔案 / commit                                                                          |
| ---------- | ---------- | ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------- | ---------------- | --------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| 2026-07-09 | Phase 0    | 檢查 docs 目錄要求並補最小工作台     | 依照 Phase 0 task card，把首頁工作台從安全預設擴充成可建立、編輯、刪除、重設的前端草稿區                                        | 採用             | 這符合第一階段「可操作但粗糙」的要求，而且草稿只存在前端記憶體，不改寫原始資訊                                        | `src/features/phase-0/Phase0Workbench.tsx`, `src/features/phase-0/Phase0JudgementCard.tsx` |
| 2026-07-09 | Phase 0    | 補資料品質觀察                       | Agent 依據 mock 原文列出缺地點、缺時間、來源未查核、操作者不是當事人、不能直接變任務等問題                                      | 採用但需人類複核 | 這些是協助復盤的觀察，不是標準答案；仍應由人類審查者確認與修正                                                        | `docs/phase0-observations.md`                                                              |
| 2026-07-09 | Phase 0    | 避免 AI 補真實資料                   | 不查外部資料，不補真實地址、電話、人物或地圖，也不把 `needs_review` / `unverified` 顯示成已確認                                 | 採用             | public starter 只能使用 `src/fixtures/phase-0/` 的 mock 原始資訊，且不能做真實救災判斷                                | `src/fixtures/phase-0/messy-reports.json`, `docs/course-context.md`                        |
| 2026-07-09 | Phase 0    | 處理可能誤導的候選判斷               | 原本可以讓 agent 自動替 M-001 到 M-012 分類，但這會像標準答案表                                                                 | 拒絕             | task card 明確要求不要把 M-001 到 M-012 的分析寫死成標準答案；畫面只提供可編輯草稿與保守預設                          | `docs/tasks/01-phase-0-messy-sprint.md`                                                    |
| 2026-07-09 | Phase 0    | 自由優化工作台操作                   | 將左側資料佇列加入篩選，右側改成判斷儀表，讓使用者優先處理需確認、不可行動、尚未建立草稿的資料                                  | 採用             | 這能讓工作台更接近實際整理流程；仍保留未確認資訊不得被說成已確認的安全邊界                                            | `src/features/phase-0/Phase0Workbench.tsx`, `src/styles/global.css`                        |
| 2026-07-09 | Phase 0    | 將部分原始資訊放入工作台             | 讓原始資訊頁顯示已放入工作台數量，並由使用者選擇哪些原始資訊要送進整理工作台                                                    | 採用             | 工作台不必一次處理全部原始資訊；讓使用者先挑需要整理的資料，能降低畫面雜訊                                            | `src/app/App.tsx`, `src/features/phase-0/Phase0RawInfoPanel.tsx`                           |
| 2026-07-09 | Phase 0    | 加入審查比例與優先順序               | 使用 max-min 正規化將資訊風險、完整度與草稿狀態轉成優先分數，再顯示建議審查比例                                                 | 採用             | 這只用於整理與審查工作量建議，不作為現場派工或真實救災決策                                                            | `src/features/phase-0/Phase0Workbench.tsx`, `src/styles/global.css`                        |
| 2026-07-09 | Phase 0    | 加深整理工作台資訊剖析               | 在工作台加入分類理由、資訊狀態、完整度線索、缺漏線索、審查問題與人力建議                                                        | 採用             | 原始資訊頁負責快速掃描，整理工作台應提供更完整的判讀與整理脈絡                                                        | `src/features/phase-0/Phase0Workbench.tsx`, `tests/app-smoke.test.tsx`                     |
| 2026-07-09 | Phase 0    | 調整原始資訊難度視覺                 | 原始資訊頁移除完整度欄位，改用整理難度與紅黃綠卡片顏色協助快速掃描                                                              | 採用             | 完整度細節留在整理工作台；原始資訊頁用難度與顏色提供更直覺的入口                                                      | `src/features/phase-0/Phase0RawInfoPanel.tsx`, `src/styles/global.css`                     |
| 2026-07-09 | Phase 0    | 改善草稿編輯行動邊界                 | 在草稿中加入「可以做」「不能做」「交給誰確認」欄位與摘要，協助使用者辨識自己能採取的整理行動                                    | 採用             | 避免使用者把未確認資訊直接當成任務；讓草稿先釐清行動邊界與確認責任                                                    | `src/features/phase-0/Phase0Workbench.tsx`, `src/features/phase-0/Phase0JudgementCard.tsx` |
| 2026-07-09 | Phase 0    | 加入使用者適配度自評                 | 在草稿中加入四個自評問題，依使用者回答計算與這筆資訊整理任務的適配度百分比                                                      | 採用             | 讓使用者先判斷自己是否適合接手整理與確認；自評結果不代表可以做現場派工或真實救災判斷                                  | `src/features/phase-0/Phase0Workbench.tsx`, `tests/app-smoke.test.tsx`                     |
| 2026-07-09 | Phase 0    | 重新排版草稿編輯區                   | 將草稿區改成先看適配度自評，再看行動邊界，最後填寫草稿內容的流程                                                                | 採用             | 使用者應先知道自己是否適合接手這筆整理任務，再進行分類、證據與疑點紀錄                                                | `src/features/phase-0/Phase0Workbench.tsx`, `src/styles/global.css`                        |
| 2026-07-09 | Phase 0    | 合併上游並檢查 public starter 邊界   | 上游包含後續課程 release pack 與對應 AGENTS 說明；合併時保留 Phase 0 程式狀態，但不保留後續教材                                 | 部分採用         | public starter 明確不得預先放入訪談、persona、流程設計或 release 材料，需維持 Phase 0 邊界                            | `AGENTS.md`, `release-packs/**`, `docs/ai-log.md`                                          |
| 2026-07-09 | Release 01 | 使用 sub-agent 進行 persona 訪談     | 三個 sub-agent 分別依回報者、資訊整理者、行動者 persona 產生固定格式回饋，main agent 彙整為訪談紀錄、訪談摘要與需求取捨草稿     | 採用但需人類複核 | 這些是 AI 模擬 persona 回饋，不代表真實使用者結論；Release 01 是需求分析階段，因此不修改 `src/`，並保留待學員確認痕跡 | `docs/interview-notes.md`, `docs/interview-summary.md`, `docs/decisions.md`                |
| 2026-07-09 | Release 01 | 補需求取捨原因                       | Agent 依訪談紀錄與 main agent 彙整，補上為什麼 v1 先服務資訊整理者，而不是回報者或行動者的理由                                  | 採用但需人類複核 | 理由符合三個 persona 共同指出的誤判風險，但這仍是 AI 協助整理的草稿，需學員小隊討論後確認或修改                       | `docs/decisions.md`, `docs/ai-log.md`                                                      |
| 2026-07-09 | Release 02 | 依 Flow Design Kit 繪製 v1 流程圖    | Agent 依 `02-flow-design-kit`、訪談摘要與需求取捨，產生自然語言流程、Mermaid 流程圖、人工確認點、不能自動處理分支與檢查修正紀錄 | 採用但需人類複核 | 這一階段是流程設計，不修改 `src/`；Mermaid 與流程合理性仍需學員用 VS Code 預覽並依小隊共識確認                        | `docs/flow.md`, `docs/decisions.md`, `docs/ai-log.md`                                      |
| 2026-07-09 | v1 實作    | 依 `docs/flow.md` 開始實作流程工作台 | Agent 將流程圖轉成 `/v1/` 前端工作台，顯示原始資訊、脈絡檢查、高風險分支、人工處理結果與判斷紀錄                                | 採用但需人類複核 | v1 仍只讀 Phase 0 原始資訊；候選結果維持待確認，不顯示為已確認，也不做派工、地圖、後端或外部 API                      | `src/app/App.tsx`, `src/features/v1/V1FlowWorkbench.tsx`, `tests/app-smoke.test.tsx`       |

## 範例

| 時間  | 階段    | 任務         | AI / Agent 建議                        | 採用 / 拒絕 | 人類判斷理由                              | 相關檔案 / commit             |
| ----- | ------- | ------------ | -------------------------------------- | ----------- | ----------------------------------------- | ----------------------------- |
| 09:45 | Phase 0 | 分析原始資訊 | 建議把社群貼文直接轉成 verified report | 拒絕        | 社群貼文來源未確認，應保持 `needs_review` | `docs/phase0-observations.md` |

## 課後反思

### AI 幫助最大的地方

- 快速對照 docs 的完成條件，找出目前 starter 還缺可編輯草稿與復盤紀錄。
- 把「不能直接相信」和「不能直接變成任務」拆成畫面與文件都能看見的欄位。

### AI 最容易誤導的地方

- 看到 M-010 這類資訊比較完整時，容易把候選結果寫得像已確認事實。
- 看到模糊地點或轉述時，容易補出原文沒有的地址、角色或任務。
- 看到 `sourceType` 像官方公告時，容易忽略 `verificationStatus` 仍是 `needs_review`。

### 下次使用 AI 開發前，我們會先準備

- 先說清楚哪些資料只能保留為原文，哪些欄位只能標成需要人工確認。
- 先要求 agent 分開列出「原文看得到」與「agent 推測」。
- 先確認畫面成果一定要從 `src/app/App.tsx` 進入，避免只產生沒接上的檔案。
