# Event Injection Prompt

## 先分析，不寫 code

```text
請閱讀 events/event-1535/README.md、events/event-1535/incoming-data.json、events/event-1535/task.md、docs/spec.md、docs/data-contract.md，以及相關 src/contracts。

請先分析 incoming-data 與目前 schema 的 mismatch：
1. 欄位名稱不一致？
2. 型別不一致？
3. 狀態值不一致？
4. 語意不足？
5. 哪些資訊需要人工確認？

請先不要修改檔案。請先建議以下四種策略中哪一種最合適，並說明理由：
- adapter
- family schema extension
- mark needs_review
- reject
```

## 實作最小變更

```text
根據小組剛剛的決策，請協助實作 event injection 的最小處理。

限制：
- 不修改 CommonRecord
- 不直接把 events/event-1535/incoming-data.json 搬進 src/fixtures/shared
- 不自動覆蓋正式狀態
- 不讓 AI 做最終判斷
- 不把 schema mismatch 靜默吞掉

請完成：
1. 若需要，新增 adapter
2. 若需要，更新 family schema
3. 更新 UI，顯示這筆資料的不確定性
4. 更新 docs/decisions.md
5. 更新 docs/data-contract.md
6. 新增或更新至少一個測試

請先列出要修改的檔案，再實作。
```
