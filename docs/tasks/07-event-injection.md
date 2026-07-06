# Event Injection：處理新資料與 schema mismatch

## 時間

15:35–16:20

## 你現在拿到的來源

- staff 發出的 event PR
- `events/event-1535/README.md`
- `events/event-1535/incoming-data.json`
- `events/event-1535/task.md`
- `events/event-1535/notes-for-review.md`
- `docs/spec.md`
- `docs/data-contract.md`
- `src/contracts/`

## 你要做什麼

先讀 PR diff，不要立刻寫 code。

請判斷：

1. incoming data 哪裡不符合 schema？
2. 這是資料錯誤、新需求，還是外部格式差異？
3. 要寫 adapter、擴充 family schema、標為 `needs_review`，還是 reject？
4. 這筆資料進 UI 後，會不會被誤認為已確認事實？

## 你不需要做什麼

- 不直接把 `incoming-data.json` 搬進 `src/fixtures/shared/`
- 不直接改 `CommonRecord`
- 不自動覆蓋正式狀態
- 不讓 AI 做最終判斷
- 不把 schema mismatch 靜默吞掉

## 可以怎麼使用 Coding Agent

先使用 `docs/prompts/event-injection.md` 的分析 prompt。  
等小組做出決策後，再請 Coding Agent 寫 adapter、更新 UI 或補測試。

## 必須交付什麼

- [ ] `docs/decisions.md` 記錄 event decision
- [ ] 若需要，新增 adapter
- [ ] 若需要，更新 family schema，但不改 `CommonRecord`
- [ ] UI 顯示這筆資料造成的不確定性
- [ ] 至少新增或更新 1 個測試
- [ ] `docs/data-contract.md` 更新
- [ ] 一個 commit，建議訊息：`Handle event injection`

## 完成定義

你們能說清楚：這筆新資料為什麼不能直接相信，以及你們選擇 adapter / schema extension / needs_review / reject 的理由。

## 停止條件

16:10 後停止大重構，只保留最小可展示的 event response 與文件。
