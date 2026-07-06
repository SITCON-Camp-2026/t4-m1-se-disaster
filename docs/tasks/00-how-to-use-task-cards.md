# 如何使用任務卡

## 時間

整天都會用到。

## 你現在拿到的來源

- `docs/tasks/`：每個階段的任務卡
- `docs/prompts/`：可以複製給 Coding Agent 的 prompts
- GitHub Issue：當前階段的 active task
- staff PR：課中才會釋出的分流資料或 event injection

## 你要做什麼

每到一個新階段，先讀該階段任務卡，再開始問 Coding Agent 或修改程式。

任務卡會告訴你：

1. 現在的資料來源是什麼
2. 你要做什麼
3. 你不需要做什麼
4. 可以怎麼請 Coding Agent 幫忙
5. 要交付什麼成果
6. 什麼時候該停止加功能

## 你不需要做什麼

- 不需要自己猜接下來要做什麼
- 不需要一次讀完整份課程設計
- 不需要提前做後面階段的任務
- 不需要處理尚未釋出的 event data

## 可以怎麼使用 Coding Agent

每次請 Coding Agent 動手前，先提供：

1. 當前任務卡
2. `docs/spec.md` 的相關段落
3. `docs/data-contract.md` 的相關段落
4. 相關 schema 或 fixture
5. 明確說明哪些檔案可以改

## 必須交付什麼

每個階段都有自己的交付物。不要只交付 UI，也要交付文件、決策或測試。

## 完成定義

完成不是「寫了很多功能」，而是該階段要求的成果可被別人理解、驗證或接手。

## 停止條件

時間到就停止新增功能，改成：

- 補文件
- 補 AI log
- 補 decision
- commit
- 準備分享
