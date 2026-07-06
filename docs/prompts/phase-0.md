# Phase 0 Prompts

## 先分析，不寫 code

```text
請先閱讀 AGENTS.md、docs/course-context.md、docs/brief.md，以及 src/fixtures/phase-0/messy-reports.json。

目前是 Phase 0 混亂 Sprint。請不要設計完整災害系統，也不要修改 CommonRecord，不要把 dirty data 移到 shared fixtures。

請幫我們分析 phase-0 messy data：
1. 每筆資料可能代表什麼類型的資訊？
2. 哪些資訊來源不明或需要人工確認？
3. 哪些欄位可能缺失？
4. 哪些地方不能自動判斷？
5. 如果要做一個 30 分鐘內完成的最小 UI，建議顯示哪些欄位？

請先只輸出分析與建議，不要修改檔案。
```

## 做最小 UI

```text
請根據剛才的分析，幫我們實作 Phase 0 最小前端介面。

限制：
- 只處理 src/fixtures/phase-0/messy-reports.json
- 不新增後端
- 不使用 localStorage
- 不呼叫外部 API
- 不修改 CommonRecord
- 不把 dirty data 放進 src/fixtures/shared
- 保持 UI 簡單，以列表或卡片為主

目標：
1. 顯示所有 messy records
2. 每筆顯示 rawText、sourceType、verificationStatus、updatedAt
3. 對 needs_review / unverified 顯示明顯標示
4. 加上一個區塊列出「這筆資料仍不確定的地方」
5. 若資料欄位不足，不要自動補成確定值

請先提出要修改哪些檔案，再實作。
```

## 補 observation 與 AI log

```text
請根據我們目前完成的 Phase 0 UI，協助補充文件。

請更新：
- docs/phase0-observations.md
- docs/ai-log.md

內容要包含：
1. 我們一開始做出的假設
2. 哪些資訊讓我們不知道如何判斷
3. 哪些欄位可能需要後續 schema 設計
4. AI 在這次協作中幫助了什麼
5. AI 有可能誤導我們什麼

請不要把觀察寫成已確認事實，語氣要保留不確定性。
```
