# SDD-lite：寫出元件規格

## 時間

11:10–12:00

## 你現在拿到的來源

- `docs/spec.md`
- `docs/data-contract.md`
- `docs/user-flow.md`
- `docs/phase0-observations.md`
- staff 在 10:50 釋出的 focus card / family brief
- staff 在 10:50 釋出的 baseline fixtures

## 你要做什麼

把 Phase 0 的混亂經驗收斂成一個可開發的前端資訊元件 spec。

請完成：

1. problem statement
2. users and roles
3. main user flow
4. input / output contract
5. states
6. acceptance criteria
7. out of scope
8. failure / uncertain cases
9. human confirmation points

## 你不需要做什麼

- 不繼續堆 Phase 0 UI
- 不做完整災害平台
- 不做後端
- 不做登入
- 不改 `CommonRecord`
- 不提前處理尚未釋出的 event injection

## 可以怎麼使用 Coding Agent

建議使用 `docs/prompts/sdd-lite.md`。

請 Coding Agent 先幫你整理 spec 草稿，再由小組討論哪些採用、哪些拒絕。

## 必須交付什麼

- [ ] `docs/spec.md` 完成初稿
- [ ] `docs/data-contract.md` 寫出 input / output
- [ ] `docs/user-flow.md` 有主流程
- [ ] 至少 4 條 acceptance criteria
- [ ] 至少 3 個 failure / uncertain cases
- [ ] `docs/ai-log.md` 紀錄這次 AI 協作

## 完成定義

另一位同學只看 `docs/spec.md` 與 `docs/data-contract.md`，就能知道這個元件要做什麼、不做什麼、吃什麼資料、輸出什麼資料，以及怎樣算完成。

## 停止條件

12:00 前停止討論新功能。先交出可執行的 spec 草稿，午餐後會進入 Spec 市集。
