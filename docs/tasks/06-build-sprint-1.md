# Build Sprint 1：完成主流程

## 時間

13:50–15:20

## 你現在拿到的來源

- `docs/spec.md`
- `docs/data-contract.md`
- `src/contracts/`
- `src/fixtures/shared/`
- staff 在 10:50 釋出的 `src/fixtures/released/1050/`

## 你要做什麼

根據已鎖定的 spec，完成一條可操作的主流程前端 demo。

最低要求：

1. 使用 normalized fixtures
2. 使用既有 schema
3. 顯示資料來源與查核狀態
4. 顯示至少 3 種狀態
5. UI 能對應 acceptance criteria
6. 至少一個測試

## 你不需要做什麼

- 不擴大 scope
- 不接外部 API
- 不做登入
- 不做後端
- 不把 `events/**` 當成內部資料
- 不隨意改 `CommonRecord`
- 不做完整地圖

## 可以怎麼使用 Coding Agent

建議使用 `docs/prompts/build-sprint.md`。

每次要求 Coding Agent 實作前，先提供：

- 相關 AC
- 相關 schema
- 相關 fixture
- 可修改檔案範圍

## 必須交付什麼

- [ ] 主流程可操作
- [ ] 至少 2 條 AC 可展示
- [ ] UI 顯示 source / status / updatedAt
- [ ] 至少 1 個測試
- [ ] 一個 commit，建議訊息：`Implement main flow`

## 完成定義

一位沒有參與你們討論的人，可以依照 UI 操作並看出這個元件解決的是哪個資訊斷點。

## 停止條件

15:10 後停止新增主要功能，只修 demo blocker、補文件或準備 event injection。
