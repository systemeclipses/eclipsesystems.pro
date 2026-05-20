type PreviewKind = "timekeeping" | "mission" | "eclipse" | "suite" | "legal";

type SoftwarePreviewProps = {
  kind: PreviewKind;
  title: string;
};

const previewData: Record<
  PreviewKind,
  {
    metric: string;
    label: string;
    rows: Array<[string, string, string]>;
    bars: number[];
  }
> = {
  timekeeping: {
    metric: "38.4h",
    label: "approved this week",
    rows: [
      ["Timer", "Client discovery", "01:24"],
      ["Review", "Design QA", "03:10"],
      ["Ready", "Payroll export", "08:00"]
    ],
    bars: [62, 88, 42, 74]
  },
  mission: {
    metric: "12",
    label: "open shifts covered",
    rows: [
      ["Drop", "Friday close", "Claimed"],
      ["Swap", "Kitchen lead", "Pending"],
      ["Chat", "Ops channel", "Live"]
    ],
    bars: [44, 78, 58, 90]
  },
  eclipse: {
    metric: "$18.2k",
    label: "ready to invoice",
    rows: [
      ["Client", "Ridgeline Co.", "$4,280"],
      ["Project", "Retainer work", "$8,940"],
      ["Invoice", "Draft 0042", "$5,020"]
    ],
    bars: [82, 52, 68, 38]
  },
  suite: {
    metric: "94%",
    label: "ops visibility",
    rows: [
      ["Time", "Approved", "38.4h"],
      ["Shifts", "Covered", "12"],
      ["Billing", "Drafted", "$18.2k"]
    ],
    bars: [86, 76, 66, 92]
  },
  legal: {
    metric: "LEDES",
    label: "matter billing ready",
    rows: [
      ["Matter", "A1023", "Open"],
      ["UTBMS", "L120 / A104", "Valid"],
      ["Trust", "Retainer", "$7,500"]
    ],
    bars: [50, 70, 46, 84]
  }
};

export function SoftwarePreview({ kind, title }: SoftwarePreviewProps) {
  const data = previewData[kind];

  return (
    <figure className={`software-preview preview-${kind}`} aria-label={`${title} software preview`}>
      <div className="preview-window">
        <div className="preview-chrome">
          <span />
          <span />
          <span />
        </div>
        <div className="preview-grid">
          <div className="preview-sidebar">
            <span className="active" />
            <span />
            <span />
            <span />
          </div>
          <div className="preview-main">
            <div className="preview-metric">
              <strong>{data.metric}</strong>
              <span>{data.label}</span>
            </div>
            <div className="preview-bars">
              {data.bars.map((bar, index) => (
                <span key={`${kind}-${bar}-${index}`} style={{ "--bar": `${bar}%` } as CSSProperties} />
              ))}
            </div>
            <div className="preview-table">
              {data.rows.map(([type, name, value]) => (
                <div key={`${type}-${name}`}>
                  <span>{type}</span>
                  <strong>{name}</strong>
                  <em>{value}</em>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </figure>
  );
}
import type { CSSProperties } from "react";
