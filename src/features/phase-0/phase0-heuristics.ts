import type {
  Phase0Difficulty,
  Phase0InformationCompleteness,
  Phase0InformationStatus,
  Phase0JudgementDraft,
  Phase0MessyRecord,
  Phase0RawCategory,
} from "./phase0-types";

type RawCategorySuggestion = {
  category: Phase0RawCategory;
  label: string;
  reason: string;
};

type InformationStatusSuggestion = {
  status: Phase0InformationStatus;
  label: string;
  reason: string;
};

type CompletenessAssessment = {
  level: Phase0InformationCompleteness;
  label: string;
  reason: string;
  matchedSignals: string[];
  missingSignals: string[];
};

type DifficultyAssessment = {
  level: Phase0Difficulty;
  label: string;
  reason: string;
};

const rawCategoryLabels: Record<Phase0RawCategory, string> = {
  help: "求助需求",
  supplies: "物資狀態",
  site_status: "地點狀態",
  access_notice: "通行或公告",
  coordination: "協調限制",
  needs_triage: "待分流",
};

const informationStatusLabels: Record<Phase0InformationStatus, string> = {
  unverified: "未查核",
  needs_review: "需人工確認",
  conflicting: "說法衝突",
  time_sensitive: "時間敏感",
  secondhand: "轉述資訊",
  action_limited: "行動受限",
};

const completenessLabels: Record<Phase0InformationCompleteness, string> = {
  low: "低",
  medium: "中",
  high: "高",
};

const difficultyLabels: Record<Phase0Difficulty, string> = {
  hard: "難度高",
  medium: "難度中",
  easy: "難度低",
};

export function suggestRawCategory(
  record: Phase0MessyRecord,
): RawCategorySuggestion {
  const text = record.rawText;

  if (/雨鞋|飲用水|二手衣物|鏟子/.test(text)) {
    return {
      category: "supplies",
      label: rawCategoryLabels.supplies,
      reason: "原文提到物資品項或庫存變化。",
    };
  }

  if (/道路封閉|公告|截圖/.test(text)) {
    return {
      category: "access_notice",
      label: rawCategoryLabels.access_notice,
      reason: "原文提到公告、截圖或通行限制。",
    };
  }

  if (/集合點|開放|入口|停留|A 區/.test(text)) {
    return {
      category: "site_status",
      label: rawCategoryLabels.site_status,
      reason: "原文描述地點是否可用或現場狀態。",
    };
  }

  if (/派人|報到|直接過去|不要再派|不要送/.test(text)) {
    return {
      category: "coordination",
      label: rawCategoryLabels.coordination,
      reason: "原文涉及人員或物資流向限制。",
    };
  }

  if (/需要|協助|支援|藥品|搬動/.test(text)) {
    return {
      category: "help",
      label: rawCategoryLabels.help,
      reason: "原文包含需求或協助請求。",
    };
  }

  return {
    category: "needs_triage",
    label: rawCategoryLabels.needs_triage,
    reason: "原文線索不足，需先分流判斷。",
  };
}

export function suggestInformationStatus(
  record: Phase0MessyRecord,
): InformationStatusSuggestion {
  const text = record.rawText;

  if (/另一位|留言有人說|但不知道|無法確認|不確定/.test(text)) {
    return {
      status: "conflicting",
      label: informationStatusLabels.conflicting,
      reason: "原文包含互相衝突或無法確認的說法。",
    };
  }

  if (/昨天|下午|中午前|下一次|預計|目前仍|14:\d{2}/.test(text)) {
    return {
      status: "time_sensitive",
      label: informationStatusLabels.time_sensitive,
      reason: "原文含時間條件，狀態可能很快變動。",
    };
  }

  if (/有人說|群組說|社群貼文|代一位|家屬來電|轉述/.test(text)) {
    return {
      status: "secondhand",
      label: informationStatusLabels.secondhand,
      reason: "資訊不是直接來自當事人或可確認窗口。",
    };
  }

  if (/不要|只接受|不再收|封閉|不適合|先不要/.test(text)) {
    return {
      status: "action_limited",
      label: informationStatusLabels.action_limited,
      reason: "原文包含限制或禁止條件。",
    };
  }

  if (record.verificationStatus === "unverified") {
    return {
      status: "unverified",
      label: informationStatusLabels.unverified,
      reason: "查核狀態仍是未查核。",
    };
  }

  return {
    status: "needs_review",
    label: informationStatusLabels.needs_review,
    reason: "查核狀態仍需要人類確認。",
  };
}

export function assessInformationCompleteness(
  record: Phase0MessyRecord,
): CompletenessAssessment {
  const text = record.rawText;
  const signalChecks = [
    {
      label: "時間",
      matched: /\d{1,2}:\d{2}|早上|下午|中午|今天|昨天|預計|目前/.test(text),
    },
    {
      label: "地點",
      matched: /車站|活動中心|老街|學校|集合點|路口|A 區|住家|出口|入口/.test(
        text,
      ),
    },
    {
      label: "需求或限制",
      matched: /需要|不缺|不再|不要|只接受|封閉|支援|協助|開放/.test(text),
    },
    {
      label: "數量或範圍",
      matched: /十幾個|約|雙|多為|A 區|第二排|一般物資/.test(text),
    },
    {
      label: "來源角色",
      matched: /志工|家屬|現場|回報者|值守|官方|群組|社群/.test(text),
    },
  ];
  const matchedSignals = signalChecks
    .filter((signal) => signal.matched)
    .map((signal) => signal.label);
  const missingSignals = signalChecks
    .filter((signal) => !signal.matched)
    .map((signal) => signal.label);
  const level: Phase0InformationCompleteness =
    matchedSignals.length >= 4
      ? "high"
      : matchedSignals.length >= 2
        ? "medium"
        : "low";

  return {
    level,
    label: completenessLabels[level],
    reason:
      matchedSignals.length > 0
        ? `已看到：${matchedSignals.join("、")}。`
        : "目前缺少可用線索。",
    matchedSignals,
    missingSignals,
  };
}

export function assessRawDifficulty(
  record: Phase0MessyRecord,
): DifficultyAssessment {
  const status = suggestInformationStatus(record);
  const completeness = assessInformationCompleteness(record);
  let score = 0;

  if (record.verificationStatus !== "verified") score += 1;
  if (status.status === "conflicting") score += 3;
  if (status.status === "secondhand") score += 2;
  if (status.status === "unverified") score += 2;
  if (status.status === "time_sensitive") score += 1;
  if (status.status === "action_limited") score += 1;
  if (completeness.level === "low") score += 3;
  if (completeness.level === "medium") score += 1;

  if (score >= 5) {
    return {
      level: "hard",
      label: difficultyLabels.hard,
      reason: "需要先釐清來源、衝突或缺漏資訊。",
    };
  }

  if (score >= 3) {
    return {
      level: "medium",
      label: difficultyLabels.medium,
      reason: "已有部分線索，但仍需要人工確認。",
    };
  }

  return {
    level: "easy",
    label: difficultyLabels.easy,
    reason: "線索較完整，較容易進一步整理。",
  };
}

// ponytail: this is a safety-boundary scaffold, not an answer engine.
export function createPhase0Judgement(
  record: Phase0MessyRecord,
): Phase0JudgementDraft {
  const isVerified = record.verificationStatus === "verified";

  return {
    messyRecordId: record.id,
    possibleKind: "unknown",
    confidence: "low",
    evidence: ["目前沒有可採用的判斷依據。"],
    blockers: isVerified
      ? ["仍需確認這筆資訊適合進入哪個後續流程。"]
      : ["目前不是已確認資訊，不能直接行動或當成事實發布。"],
    suggestedNextStep: isVerified ? "keep_raw" : "send_to_human_review",
    unsafeToActDirectly: true,
  };
}
