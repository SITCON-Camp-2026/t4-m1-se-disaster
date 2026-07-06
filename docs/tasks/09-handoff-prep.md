# Handoff Prep：準備交接

## 時間

18:20–18:40

## 你現在拿到的來源

- `docs/spec.md`
- `docs/data-contract.md`
- `docs/decisions.md`
- `docs/handoff.md`
- repo code
- event injection response

## 你要做什麼

整理 repo，讓另一組可以在有限時間內接手。

請寫清楚：

1. 如何啟動專案
2. 重要檔案在哪裡
3. 目前完成哪些 acceptance criteria
4. 目前還有哪些已知問題
5. 資料入口在哪裡
6. 下一位接手者可以做的一個小任務

## 你不需要做什麼

- 不新增功能
- 不重寫 README 成完整報告
- 不隱藏還沒完成的問題
- 不把已知限制包裝成設計完成

## 可以怎麼使用 Coding Agent

建議使用 `docs/prompts/handoff.md`。

可以請 Coding Agent 根據目前 repo 狀態整理 handoff，但最後必須由小組確認內容正確。

## 必須交付什麼

- [ ] `docs/handoff.md` 完成
- [ ] `README.md` 若有啟動方式變更，需要更新
- [ ] `docs/spec.md` 標記已完成與未完成 AC
- [ ] `docs/decisions.md` 至少有重要決策
- [ ] 一個 commit，建議訊息：`Prepare handoff`

## 完成定義

另一組只靠 `docs/handoff.md` 和 repo，就能啟動專案、找到主流程、理解資料入口與目前限制。

## 停止條件

18:40 停止整理，進入 Handoff Challenge。
