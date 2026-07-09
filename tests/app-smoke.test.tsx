import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { App } from "../src/app/App";

describe("App", () => {
  it("renders starter title", () => {
    render(<App />);
    expect(screen.getByText("災害資訊整理工作台")).toBeInTheDocument();
  });

  it("keeps the home page focused on phase 0 tabs", () => {
    render(<App />);

    expect(
      screen.getByRole("button", { name: "原始資訊" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "整理工作台" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "通報" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "地點" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "志工任務" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "人員指派" }),
    ).not.toBeInTheDocument();
  });

  it("shows lightweight categories on raw records", () => {
    render(<App />);

    expect(screen.getByText(/已放入工作台 6 筆/)).toBeInTheDocument();
    expect(
      screen.getAllByText(/物資狀態|求助需求|地點狀態/).length,
    ).toBeGreaterThan(0);
    expect(screen.getAllByText(/初步分類：/).length).toBeGreaterThan(0);
    expect(screen.getAllByText("資訊狀態").length).toBeGreaterThan(0);
    expect(screen.getAllByText("整理難度").length).toBeGreaterThan(0);
    expect(screen.getAllByText(/難度高|難度中|難度低/).length).toBeGreaterThan(
      0,
    );
  });

  it("moves selected raw information into the workbench", () => {
    render(<App />);

    fireEvent.click(
      screen.getAllByRole("button", { name: "放入整理工作台" })[0],
    );

    expect(screen.getByText("判斷儀表")).toBeInTheDocument();
    expect(screen.getAllByText("M-007").length).toBeGreaterThan(0);
  });

  it("shows review states in the phase 0 workbench", () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: "整理工作台" }));

    expect(
      screen.getByText("先找出高風險資訊，再把人類需要確認的判斷留下來。"),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "無草稿" })).toBeInTheDocument();
    expect(screen.getAllByText("待人工確認").length).toBeGreaterThan(0);
    expect(screen.getAllByText("未查核").length).toBeGreaterThan(0);
  });

  it("shows deeper analysis in the workbench than the raw list", () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: "整理工作台" }));

    expect(screen.getByText("資訊剖析")).toBeInTheDocument();
    expect(screen.getByText(/的整理重點/)).toBeInTheDocument();
    expect(screen.getByText("已看到的線索")).toBeInTheDocument();
    expect(screen.getByText("缺少的線索")).toBeInTheDocument();
    expect(screen.getByText("下一步審查問題")).toBeInTheDocument();
    expect(screen.getByText("建議審查比例")).toBeInTheDocument();
    expect(screen.getAllByText(/\d+%/).length).toBeGreaterThan(0);
  });

  it("shows review staffing allocation in the workbench", () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: "整理工作台" }));

    expect(screen.getByText("審查人力分配")).toBeInTheDocument();
    expect(screen.getByText(/max-min 正規化排序/)).toBeInTheDocument();
    expect(screen.getByLabelText("可用人力")).toHaveValue(4);

    fireEvent.change(screen.getByLabelText("可用人力"), {
      target: { value: "2" },
    });

    expect(screen.getByLabelText("可用人力")).toHaveValue(2);
  });

  it("lets learners edit, delete, create, and reset phase 0 drafts", () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: "整理工作台" }));

    expect(screen.getByText("判斷儀表")).toBeInTheDocument();
    expect(screen.getByText("草稿")).toBeInTheDocument();
    expect(screen.getByText("先確認適配度，再整理草稿")).toBeInTheDocument();
    expect(screen.getByLabelText("我現在可以做什麼")).toBeInTheDocument();
    expect(screen.getByLabelText("我現在不能做什麼")).toBeInTheDocument();
    expect(screen.getByLabelText("交給誰確認")).toBeInTheDocument();
    expect(screen.getByText("我和這筆整理任務的適配度")).toBeInTheDocument();
    expect(
      screen.getByLabelText("我看得懂這筆資訊的來源與限制嗎？"),
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText("我有時間補齊或追蹤缺漏資訊嗎？"),
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText("我知道這筆資訊應該交給誰確認嗎？"),
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText("我能只做整理，不直接派工或判定真實嗎？"),
    ).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("草稿標題"), {
      target: { value: "先確認時間與來源" },
    });
    expect(screen.getByText("先確認時間與來源")).toBeInTheDocument();

    fireEvent.change(
      screen.getByLabelText("我看得懂這筆資訊的來源與限制嗎？"),
      {
        target: { value: "yes" },
      },
    );
    expect(screen.getByText("75%")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "刪除草稿" }));
    expect(screen.getByText("這筆尚未建立草稿")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "建立草稿" }));
    expect(screen.getByText("未命名草稿")).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", { name: "重設為 6 筆安全預設草稿" }),
    );
    expect(screen.getByText("判斷儀表")).toBeInTheDocument();
  });
});
