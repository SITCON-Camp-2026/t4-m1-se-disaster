# Phase 0：共同混亂 Sprint

## 時間

09:20–10:10

## 你現在拿到的來源

- `docs/course-context.md`
- `docs/brief.md`
- `src/fixtures/phase-0/messy-reports.json`
- starter UI

## 你要做什麼

你們收到一批災害現場資訊。資料來源混雜，有些來自社群貼文，有些是志工回報，有些描述不完整，有些可能過期或重複。

請在 50 分鐘內做出一個最小前端介面，讓下一位協作者能快速看懂：

1. 目前有哪些資訊
2. 這些資訊從哪裡來
3. 哪些資訊已確認，哪些需要人工確認
4. 哪些欄位你們其實不知道怎麼判斷
5. 哪些資料可能不能直接進系統

## 你不需要做什麼

- 不做完整產品
- 不設計完整角色權限
- 不新增後端
- 不新增資料庫
- 不使用 localStorage
- 不呼叫外部 API
- 不修改 `CommonRecord`
- 不把 dirty data 移進 `src/fixtures/shared/` 假裝乾淨
- 不新增地圖功能

## 可以怎麼使用 Coding Agent

建議先用 `docs/prompts/phase-0.md` 的「先分析，不寫 code」prompt。

等分析完，再請 Coding Agent 實作最小 UI。

## 必須交付什麼

- [ ] UI 顯示所有 phase-0 messy records
- [ ] 每筆至少顯示 raw text、source、verification status、updatedAt
- [ ] `needs_review` / `unverified` 有明顯標示
- [ ] 至少標示 3 個「我們不知道如何判斷」的地方
- [ ] `docs/phase0-observations.md` 有初步紀錄
- [ ] `docs/ai-log.md` 有一筆 AI 使用紀錄
- [ ] 一個 commit，建議訊息：`Phase 0 messy information triage`

## 完成定義

下一位協作者能從你的畫面看出：這批資料不是乾淨資料，且有些資訊需要人工確認。

## 停止條件

10:00 後停止新增主要功能，改填 `docs/phase0-observations.md`，準備 10:10 復盤。
