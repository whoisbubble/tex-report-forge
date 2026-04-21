export type SectionLevel = 0 | 1 | 2;

export type TextBlock = {
  id: string;
  type: "text";
  content: string;
};

export type FigureBlock = {
  id: string;
  type: "figure";
  filename: string;
  caption: string;
};

export type CodeBlock = {
  id: string;
  type: "code";
  caption: string;
  code: string;
};

export type CalculationBlock = {
  id: string;
  type: "calculation";
  caption: string;
  environment: CalculationEnvironment;
  formula: string;
};

export type CalculationEnvironment = "equation*" | "equation" | "align*" | "align" | "gather*" | "gather";

export type TableBlock = {
  id: string;
  type: "table";
  caption: string;
  cols: string;
  data: string;
};

export type GraphBlock = {
  id: string;
  type: "graph";
  caption: string;
  title: string;
  xLabel: string;
  yLabel: string;
  mode: "line" | "bar";
  startAtZero: boolean;
  series: GraphSeries[];
};

export type GraphSeries = {
  id: string;
  label: string;
  color: string;
  points: string;
};

export type ListBlock = {
  id: string;
  type: "list";
  ordered: boolean;
  items: ListItem[];
};

export type PageBreakBlock = {
  id: string;
  type: "pagebreak";
};

export type ReportBlock =
  | TextBlock
  | FigureBlock
  | CodeBlock
  | CalculationBlock
  | TableBlock
  | GraphBlock
  | ListBlock
  | PageBreakBlock;

export type ListItem = {
  id: string;
  label: string;
  text: string;
};

export type ReportSection = {
  id: string;
  title: string;
  level: SectionLevel;
  isNumbered: boolean;
  blocks: ReportBlock[];
};

export type ReportMeta = {
  kafedra: string;
  tema: string;
  vidRaboty: string;
  disciplina: string;
  shapkaStroka: string;
  studentLabel: string;
  rukovoditelLabel: string;
  rukovoditelDolzhnost: string;
  student: string;
  rukovoditel: string;
  city: string;
  year: string;
  includeToc: boolean;
};

export type ReportDraft = {
  meta: ReportMeta;
  sections: ReportSection[];
};

export type SectionDisplayInfo = {
  fullTitle: string;
  numberingLabel: string | null;
  rawNumber: string | null;
};

export const defaultMeta: ReportMeta = {
  kafedra: "Информационные технологии и системы",
  tema: "Анализ ИС",
  vidRaboty: "Практическая работа №2",
  disciplina: "Теория информационных процессов и систем",
  shapkaStroka: "ПР 09.03.02. 17.02.БО231ИСТ",
  studentLabel: "Студент",
  rukovoditelLabel: "Проверил",
  rukovoditelDolzhnost: "",
  student: "Т.П.~Чигирёв",
  rukovoditel: "О.В.~Рыбкина",
  city: "Хабаровск",
  year: "2025",
  includeToc: false
};

export function makeId(prefix: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function createBlock(type: ReportBlock["type"], figureIndex = 1): ReportBlock {
  if (type === "text") {
    return { id: makeId("block"), type, content: "" };
  }

  if (type === "figure") {
    return {
      id: makeId("block"),
      type,
      filename: `ris${figureIndex}.png`,
      caption: ""
    };
  }

  if (type === "code") {
    return { id: makeId("block"), type, caption: "", code: "" };
  }

  if (type === "calculation") {
    return {
      id: makeId("block"),
      type,
      caption: "",
      environment: "equation*",
      formula: ""
    };
  }

  if (type === "table") {
    return { id: makeId("block"), type, caption: "", cols: "", data: "" };
  }

  if (type === "graph") {
    return {
      id: makeId("block"),
      type,
      caption: "",
      title: "",
      xLabel: "X",
      yLabel: "Y",
      mode: "line",
      startAtZero: true,
      series: [
        {
          id: makeId("series"),
          label: "Серия 1",
          color: "teal",
          points: "1;10\n2;15\n3;12"
        }
      ]
    };
  }

  if (type === "list") {
    return {
      id: makeId("block"),
      type,
      ordered: true,
      items: [{ id: makeId("item"), label: "", text: "" }]
    };
  }

  return { id: makeId("block"), type: "pagebreak" };
}

export function createSection(level: SectionLevel, title = "Новый раздел", isNumbered = true): ReportSection {
  return {
    id: makeId("section"),
    title,
    level,
    isNumbered,
    blocks: []
  };
}

export function cloneBlock(block: ReportBlock): ReportBlock {
  if (block.type === "list") {
    return {
      ...block,
      id: makeId("block"),
      items: block.items.map((item) => ({
        ...item,
        id: makeId("item")
      }))
    };
  }

  if (block.type === "graph") {
    return {
      ...block,
      id: makeId("block"),
      series: block.series.map((series) => ({
        ...series,
        id: makeId("series")
      }))
    };
  }

  return {
    ...block,
    id: makeId("block")
  };
}

export function cloneSection(section: ReportSection): ReportSection {
  return {
    ...section,
    id: makeId("section"),
    title: section.title ? `${section.title} (копия)` : "Новый раздел (копия)",
    blocks: section.blocks.map((block) => cloneBlock(block))
  };
}

export function createInitialDraft(): ReportDraft {
  return {
    meta: { ...defaultMeta },
    sections: [
      {
        id: "section-task",
        title: "Задание",
        level: 0,
        isNumbered: false,
        blocks: [
          {
            id: "block-task-text",
            type: "text",
            content: "здесь вписать задание"
          }
        ]
      },
      {
        id: "section-work",
        title: "Ход работы",
        level: 0,
        isNumbered: true,
        blocks: [
          {
            id: "block-work-text",
            type: "text",
            content: "Опишите ход выполнения работы."
          }
        ]
      }
    ]
  };
}

export function createExampleDraft(): ReportDraft {
  return {
    meta: {
      ...defaultMeta,
      tema: "ОРГАНИЗАЦИЯ IP-ТЕЛЕФОНИИ НА ОСНОВЕ ОТЕЧЕСТВЕННЫХ РЕШЕНИЙ",
      vidRaboty: "Расчётно-графическая работа №1",
      disciplina: "Проектирование графических интерфейсов информационных систем",
      shapkaStroka: "ЛР 09.03.02. 17.02.БО231ИСТ",
      student: "Т.\\,П.~Чигирёв",
      rukovoditel: "О.\\,В.~Рыбкина",
      includeToc: true
    },
    sections: [
      {
        ...createSection(0, "Введение", false),
        blocks: [
          {
            id: makeId("block"),
            type: "text",
            content:
              "В работе рассматривается структура информационной системы, её основные компоненты и сценарии использования. Цель отчёта — зафиксировать ход выполнения задания и оформить результаты в едином шаблоне."
          },
          createBlock("pagebreak")
        ]
      },
      {
        ...createSection(0, "Ход работы"),
        blocks: [
          {
            id: makeId("block"),
            type: "text",
            content: "Для выполнения работы были выделены следующие этапы:"
          },
          {
            id: makeId("block"),
            type: "list",
            ordered: true,
            items: [
              { id: makeId("item"), label: "", text: "анализ предметной области" },
              { id: makeId("item"), label: "", text: "описание ключевых сущностей" },
              { id: makeId("item"), label: "", text: "подготовка таблиц, рисунков и расчётов" }
            ]
          }
        ]
      },
      {
        ...createSection(1, "Описание модели"),
        blocks: [
          {
            id: makeId("block"),
            type: "text",
            content: "Ниже приведён пример программного фрагмента, который можно вставлять без ручной экранизации символов."
          },
          {
            id: makeId("block"),
            type: "code",
            caption: "Пример расчёта",
            code: `public void SaveReport(Report report)
{
    if (report == null)
    {
        throw new ArgumentNullException(nameof(report));
    }

    repository.Save(report);
}`
          },
          {
            id: makeId("block"),
            type: "table",
            caption: "План проверки",
            cols: "3",
            data: "Этап;Действие;Результат\n1;Заполнение титульного листа;Данные сохранены\n2;Добавление разделов;Структура отчёта готова\n3;Генерация .tex;Файл можно компилировать"
          },
          {
            id: makeId("block"),
            type: "graph",
            caption: "Скорость обработки запросов",
            title: "Нагрузка по этапам",
            xLabel: "Этап",
            yLabel: "мс",
            mode: "line",
            startAtZero: true,
            series: [
              {
                id: makeId("series"),
                label: "API",
                color: "blue",
                points: "1;120\n2;95\n3;140\n4;110"
              },
              {
                id: makeId("series"),
                label: "SQL",
                color: "red",
                points: "1;80\n2;85\n3;100\n4;90"
              }
            ]
          }
        ]
      },
      {
        ...createSection(0, "Заключение", false),
        blocks: [
          {
            id: makeId("block"),
            type: "text",
            content:
              "В результате работы был подготовлен отчёт в формате LaTeX. Полученный файл можно перенести в Overleaf или скомпилировать локально."
          }
        ]
      }
    ]
  };
}

export function createCapabilitiesDraft(): ReportDraft {
  return {
    meta: {
      ...defaultMeta,
      tema: "Capabilities Template For AI-Generated Report Projects",
      vidRaboty: "Reusable project schema example",
      disciplina: "Automatic report generation",
      shapkaStroka: "JSON template / importable draft / schema example",
      student: "AI generated content",
      rukovoditel: "Human review",
      includeToc: true
    },
    sections: [
      {
        id: "section-cap-overview",
        title: "Template Overview",
        level: 0,
        isNumbered: false,
        blocks: [
          {
            id: "block-cap-overview-text",
            type: "text",
            content:
              "This importable project demonstrates the JSON structure expected by the editor. A neural model can clone this shape, replace the content, and generate a new valid project file for the application."
          },
          {
            id: "block-cap-overview-list",
            type: "list",
            ordered: true,
            items: [
              {
                id: "item-cap-overview-1",
                label: "meta",
                text: "Title page fields used by the report and LaTeX export"
              },
              {
                id: "item-cap-overview-2",
                label: "sections",
                text: "Top-level and nested headings with optional numbering"
              },
              {
                id: "item-cap-overview-3",
                label: "blocks",
                text: "Text, figure, code, calculation, table, graph, list and page break"
              }
            ]
          }
        ]
      },
      {
        id: "section-cap-structure",
        title: "Project Structure",
        level: 0,
        isNumbered: true,
        blocks: [
          {
            id: "block-cap-structure-text",
            type: "text",
            content:
              "A valid project contains meta information and an ordered array of sections. Every section has id, title, level, isNumbered and blocks."
          }
        ]
      },
      {
        id: "section-cap-text-list",
        title: "Text And Lists",
        level: 1,
        isNumbered: true,
        blocks: [
          {
            id: "block-cap-text-list-text",
            type: "text",
            content:
              "This subsection shows plain text blocks and list blocks. Lists may be ordered or unordered and each item stores label and text separately."
          },
          {
            id: "block-cap-text-list-list",
            type: "list",
            ordered: false,
            items: [
              {
                id: "item-cap-text-list-1",
                label: "ordered",
                text: "Boolean toggle for numbered or bullet list output"
              },
              {
                id: "item-cap-text-list-2",
                label: "items",
                text: "Array of objects with id, label and text"
              }
            ]
          }
        ]
      },
      {
        id: "section-cap-figure",
        title: "Figure Block",
        level: 1,
        isNumbered: true,
        blocks: [
          {
            id: "block-cap-figure-text",
            type: "text",
            content:
              "Figure blocks reference an external file from the images directory and provide a caption for LaTeX."
          },
          {
            id: "block-cap-figure",
            type: "figure",
            filename: "images/architecture-example.png",
            caption: "Example architecture diagram used by the figure block"
          }
        ]
      },
      {
        id: "section-cap-code-table",
        title: "Code, Calculations And Tables",
        level: 1,
        isNumbered: true,
        blocks: [
          {
            id: "block-cap-code",
            type: "code",
            caption: "Example code block",
            code: `function buildProjectDraft() {
  return {
    meta: { tema: "Generated report" },
    sections: []
  };
}`
          },
          {
            id: "block-cap-calculation",
            type: "calculation",
            caption: "Example calculation block",
            environment: "align*",
            formula: String.raw`\sqrt{a^2+b^2} = c \\
P = U \cdot I \\
A \cap B \subseteq C`
          },
          {
            id: "block-cap-table",
            type: "table",
            caption: "Example table block",
            cols: "3",
            data: "Field;Type;Purpose\nmeta;object;Title page data\nsections;array;Document structure\nblocks;array;Section content"
          }
        ]
      },
      {
        id: "section-cap-graphs",
        title: "Graphs",
        level: 1,
        isNumbered: true,
        blocks: [
          {
            id: "block-cap-graphs-text",
            type: "text",
            content:
              "Graph blocks support multiple series, line and bar modes, labels, colors and preview inside the editor."
          },
          {
            id: "block-cap-graph-line",
            type: "graph",
            caption: "Line graph with multiple series",
            title: "Request latency by stage",
            xLabel: "Stage",
            yLabel: "ms",
            mode: "line",
            startAtZero: true,
            series: [
              {
                id: "series-cap-line-api",
                label: "API",
                color: "blue",
                points: "1;120\n2;96\n3;140\n4;110"
              },
              {
                id: "series-cap-line-sql",
                label: "SQL",
                color: "red",
                points: "1;80\n2;88\n3;101\n4;92"
              }
            ]
          },
          {
            id: "block-cap-graph-bar",
            type: "graph",
            caption: "Bar graph with named categories",
            title: "Coverage by module",
            xLabel: "Module",
            yLabel: "%",
            mode: "bar",
            startAtZero: true,
            series: [
              {
                id: "series-cap-bar-before",
                label: "Before",
                color: "orange",
                points: "Auth;55\nReports;48\nGraphs;62"
              },
              {
                id: "series-cap-bar-after",
                label: "After",
                color: "green!60!black",
                points: "Auth;84\nReports;78\nGraphs;90"
              }
            ]
          }
        ]
      },
      {
        id: "section-cap-subsub",
        title: "Nested Heading Example",
        level: 2,
        isNumbered: true,
        blocks: [
          {
            id: "block-cap-subsub-text",
            type: "text",
            content:
              "This subsubsection exists to demonstrate heading levels such as 2.1.1 in the editor and exported LaTeX."
          },
          {
            id: "block-cap-pagebreak",
            type: "pagebreak"
          }
        ]
      },
      {
        id: "section-cap-conclusion",
        title: "Conclusion",
        level: 0,
        isNumbered: false,
        blocks: [
          {
            id: "block-cap-conclusion-text",
            type: "text",
            content:
              "This file is both a valid importable project and a schema example for AI generation. Replace the meta fields, section titles and block contents while preserving the overall JSON shape."
          }
        ]
      }
    ]
  };
}

function latexEscape(text: string) {
  if (!text) return "";

  return text
    .replace(/%/g, "\\%")
    .replace(/_/g, "\\_")
    .replace(/\$/g, "\\$")
    .replace(/#/g, "\\#")
    .replace(/&/g, "\\&");
}

function normalizeCodeForLatex(code: string) {
  return code
    .replace(/\r\n?/g, "\n")
    .replace(/[\u00A0\u202F]/g, " ")
    .replace(/[\u200B-\u200F\u202A-\u202E\u2066-\u2069\uFEFF]/g, "");
}

const unicodeMathReplacements: Array<[RegExp, string]> = [
  [/≤/g, String.raw`\leq `],
  [/≥/g, String.raw`\geq `],
  [/≠/g, String.raw`\neq `],
  [/≈/g, String.raw`\approx `],
  [/≃/g, String.raw`\simeq `],
  [/≅/g, String.raw`\cong `],
  [/≡/g, String.raw`\equiv `],
  [/±/g, String.raw`\pm `],
  [/∓/g, String.raw`\mp `],
  [/×/g, String.raw`\times `],
  [/÷/g, String.raw`\div `],
  [/·/g, String.raw`\cdot `],
  [/√/g, String.raw`\sqrt{}`],
  [/∞/g, String.raw`\infty `],
  [/∑/g, String.raw`\sum `],
  [/∏/g, String.raw`\prod `],
  [/∫/g, String.raw`\int `],
  [/∂/g, String.raw`\partial `],
  [/∇/g, String.raw`\nabla `],
  [/∈/g, String.raw`\in `],
  [/∉/g, String.raw`\notin `],
  [/∋/g, String.raw`\ni `],
  [/∩/g, String.raw`\cap `],
  [/∪/g, String.raw`\cup `],
  [/⊂/g, String.raw`\subset `],
  [/⊆/g, String.raw`\subseteq `],
  [/⊃/g, String.raw`\supset `],
  [/⊇/g, String.raw`\supseteq `],
  [/∅/g, String.raw`\varnothing `],
  [/∀/g, String.raw`\forall `],
  [/∃/g, String.raw`\exists `],
  [/¬/g, String.raw`\neg `],
  [/∧/g, String.raw`\land `],
  [/∨/g, String.raw`\lor `],
  [/→/g, String.raw`\to `],
  [/←/g, String.raw`\leftarrow `],
  [/↔/g, String.raw`\leftrightarrow `],
  [/⇒/g, String.raw`\Rightarrow `],
  [/⇐/g, String.raw`\Leftarrow `],
  [/⇔/g, String.raw`\Leftrightarrow `],
  [/∝/g, String.raw`\propto `],
  [/∴/g, String.raw`\therefore `],
  [/∵/g, String.raw`\because `],
  [/∠/g, String.raw`\angle `],
  [/⊥/g, String.raw`\perp `],
  [/∥/g, String.raw`\parallel `],
  [/≪/g, String.raw`\ll `],
  [/≫/g, String.raw`\gg `],
  [/α/g, String.raw`\alpha `],
  [/β/g, String.raw`\beta `],
  [/γ/g, String.raw`\gamma `],
  [/δ/g, String.raw`\delta `],
  [/ε/g, String.raw`\varepsilon `],
  [/ζ/g, String.raw`\zeta `],
  [/η/g, String.raw`\eta `],
  [/θ/g, String.raw`\theta `],
  [/ι/g, String.raw`\iota `],
  [/κ/g, String.raw`\kappa `],
  [/λ/g, String.raw`\lambda `],
  [/μ/g, String.raw`\mu `],
  [/ν/g, String.raw`\nu `],
  [/ξ/g, String.raw`\xi `],
  [/π/g, String.raw`\pi `],
  [/ρ/g, String.raw`\rho `],
  [/σ/g, String.raw`\sigma `],
  [/τ/g, String.raw`\tau `],
  [/φ/g, String.raw`\varphi `],
  [/χ/g, String.raw`\chi `],
  [/ψ/g, String.raw`\psi `],
  [/ω/g, String.raw`\omega `],
  [/Γ/g, String.raw`\Gamma `],
  [/Δ/g, String.raw`\Delta `],
  [/Θ/g, String.raw`\Theta `],
  [/Λ/g, String.raw`\Lambda `],
  [/Ξ/g, String.raw`\Xi `],
  [/Π/g, String.raw`\Pi `],
  [/Σ/g, String.raw`\Sigma `],
  [/Φ/g, String.raw`\Phi `],
  [/Ψ/g, String.raw`\Psi `],
  [/Ω/g, String.raw`\Omega `]
];

function normalizeFormulaForLatex(formula: string) {
  let normalized = formula
    .replace(/\r\n?/g, "\n")
    .replace(/[\u00A0\u202F]/g, " ")
    .replace(/[\u200B-\u200F\u202A-\u202E\u2066-\u2069\uFEFF]/g, "");

  unicodeMathReplacements.forEach(([pattern, replacement]) => {
    normalized = normalized.replace(pattern, replacement);
  });

  return normalized;
}

function latexGraphicPath(filename: string) {
  return filename
    .replace(/\r\n?/g, "")
    .replace(/\\/g, "/")
    .replace(/[\u200B-\u200F\u202A-\u202E\u2066-\u2069\uFEFF]/g, "")
    .trim();
}

function latexOptionEscape(text: string) {
  if (!text) return "";

  return text
    .replace(/\\/g, "")
    .replace(/[{}]/g, "")
    .replace(/%/g, "")
    .replace(/\r\n?/g, " ")
    .trim();
}

function escapePgfplotsCoordinate(value: string) {
  return value
    .replace(/\\/g, "\\textbackslash{}")
    .replace(/[{}]/g, "")
    .replace(/%/g, "\\%")
    .replace(/#/g, "\\#")
    .replace(/&/g, "\\&")
    .trim();
}

function parseGraphPoints(points: string) {
  return points
    .split("\n")
    .map((row) => row.trim())
    .filter(Boolean)
    .map((row) => {
      const [x = "", y = ""] = row.split(";");
      return {
        x: x.trim(),
        y: y.trim()
      };
    })
    .filter((point) => point.x && point.y);
}

function buildGraphBlock(block: GraphBlock) {
  const series = block.series
    .map((item) => ({
      ...item,
      points: parseGraphPoints(item.points)
    }))
    .filter((item) => item.points.length > 0);

  if (series.length === 0) {
    return "";
  }

  const allPoints = series.flatMap((item) => item.points);
  const isNumericX = allPoints.every((point) => /^-?\d+(?:[.,]\d+)?$/.test(point.x));
  const axisOptions = [
    "width=0.92\\textwidth",
    "height=0.42\\textwidth",
    "grid=both",
    "major grid style={draw=gray!35}",
    "minor grid style={draw=gray!20}",
    `xlabel={${latexEscape(block.xLabel)}}`,
    `ylabel={${latexEscape(block.yLabel)}}`,
    `title={${latexEscape(block.title)}}`
  ];

  if (block.startAtZero) {
    axisOptions.push("ymin=0");
    axisOptions.push("enlarge y limits={lower=0}");
    if (isNumericX) {
      axisOptions.push("xmin=0");
    }
  }

  if (block.mode === "bar") {
    axisOptions.push("bar width=14pt");
  }

  if (!isNumericX) {
    axisOptions.push(
      `symbolic x coords={${Array.from(new Set(allPoints.map((point) => escapePgfplotsCoordinate(point.x)))).join(",")}}`
    );
    axisOptions.push("xtick=data");
    axisOptions.push("x tick label style={rotate=20, anchor=east}");
  }

  if (series.some((item) => item.label.trim())) {
    axisOptions.push("legend cell align={left}");
    axisOptions.push("legend pos=north west");
  }

  const plots = series
    .map((item) => {
      const coordinates = item.points
        .map((point) => {
          const x = isNumericX ? point.x.replace(",", ".") : escapePgfplotsCoordinate(point.x);
          const y = point.y.replace(",", ".");

          return `(${x},${y})`;
        })
        .join(" ");

      const plotOptions =
        block.mode === "bar"
          ? `ybar, fill=${latexOptionEscape(item.color)}!55, draw=${latexOptionEscape(item.color)}`
          : `thick, mark=*, color=${latexOptionEscape(item.color)}`;

      const legend = item.label.trim() ? `\n        \\addlegendentry{${latexEscape(item.label)}}` : "";

      return `        \\addplot+[${plotOptions}] coordinates { ${coordinates} };${legend}`;
    })
    .join("\n");

  return String.raw`
\begin{figure}[H]
    \centering
    \begin{tikzpicture}
      \begin{axis}[${axisOptions.join(", ")}]
${plots}
      \end{axis}
    \end{tikzpicture}
    \caption{- ${latexEscape(block.caption)}}
\end{figure}

`;
}

function buildPreamble() {
  return String.raw`\documentclass[14pt]{extarticle}

% ===== Русский язык и шрифты (pdfLaTeX) =====
\usepackage[T2A]{fontenc}
\usepackage[utf8]{inputenc}
\usepackage[russian]{babel}
\addto\captionsrussian{\renewcommand{\contentsname}{Оглавление}}
\usepackage{mathptmx} % шрифт в стиле Times
\usepackage{caption}
\usepackage{xcolor}

\usepackage{fancyhdr}
\pagestyle{fancy}
\fancyhf{}
\fancyfoot[R]{\thepage}
\renewcommand{\headrulewidth}{0pt}
\fancypagestyle{plain}{%
  \fancyhf{}%
  \fancyfoot[R]{\thepage}%
  \renewcommand{\headrulewidth}{0pt}%
}

\usepackage{float}

\captionsetup[figure]{
    name={Рисунок},
    labelsep={space},
    justification=centering,
    singlelinecheck=false
}

% ===== Поля, интервалы, абзацы =====
\usepackage{geometry}
\geometry{
  a4paper,
  left=3cm,
  right=1.5cm,
  top=2cm,
  bottom=2cm
}

\usepackage{setspace}
\onehalfspacing

\usepackage{indentfirst}
\setlength{\parindent}{1.25cm}

% ===== Картинки =====
\usepackage{tikz}
\usepackage{pgfplots}
\pgfplotsset{compat=1.18}
\usepackage{graphicx}
\graphicspath{{images/}} % папка для скринов

\usepackage{caption}

% ===== Оглавление =====
\usepackage{tocloft}
\renewcommand{\cftsecleader}{\cftdotfill{\cftdotsep}}
\renewcommand{\cftsecfont}{\normalsize}
\renewcommand{\cftsecpagefont}{\normalsize}
\renewcommand{\cftsubsecfont}{\normalsize}
\renewcommand{\cftsubsecpagefont}{\normalsize}
\renewcommand{\cftsubsubsecfont}{\normalsize}
\renewcommand{\cftsubsubsecpagefont}{\normalsize}
\renewcommand{\cfttoctitlefont}{\hfill\large\bfseries}
\renewcommand{\cftaftertoctitle}{\hfill}
\setlength{\cftbeforesecskip}{4pt}
\setlength{\cftbeforesubsecskip}{2pt}
\setlength{\cftbeforesubsubsecskip}{1pt}

% ===== Математика, код и расчёты =====
\usepackage{amsmath}
\usepackage{amssymb}
\usepackage{amsfonts}
\usepackage{mathtools}
\usepackage{amsthm}
\usepackage{mathrsfs}
\usepackage{bm}
\usepackage{cancel}
\usepackage{siunitx}
\usepackage{esint}
\usepackage{icomma}

\usepackage{fvextra}
\DefineVerbatimEnvironment{CodeBlock}{Verbatim}{
  breaklines=true,
  breakanywhere=true,
  fontsize=\footnotesize,
  baselinestretch=1,
  formatcom=\color{black}
}

% ===== Настройка размеров заголовков =====
\usepackage{titlesec}

\titleformat{\section}
  {\normalfont\normalsize\bfseries}
  {\thesection}{1em}{}

\titleformat{\subsection}
  {\normalfont\normalsize\bfseries}
  {\thesubsection}{1em}{}

\titleformat{\subsubsection}
  {\normalfont\normalsize\bfseries}
  {\thesubsubsection}{1em}{}

\titlespacing*{\section}{0.8cm}{12pt}{1.5cm}
\titlespacing*{\subsection}{0.8cm}{12pt}{12pt}
\titlespacing*{\subsubsection}{0.8cm}{12pt}{6pt}

\setlength{\parindent}{0.8cm}

\begin{document}

`;
}

function buildTitlePage(meta: ReportMeta) {
  const rukFullLabel = meta.rukovoditelDolzhnost
    ? `${meta.rukovoditelLabel} ${meta.rukovoditelDolzhnost}`
    : meta.rukovoditelLabel;

  return String.raw`
\begin{titlepage}
\thispagestyle{empty}
\begin{center}
Министерство транспорта Российской Федерации\\
Федеральное агентство железнодорожного транспорта\\[0.2em]

Федеральное государственное бюджетное образовательное учреждение\\
высшего образования\\
«Дальневосточный государственный университет путей сообщения»\\[0.2em]

Кафедра «${latexEscape(meta.kafedra)}»
\vfill

{\bfseries
\large ${latexEscape(meta.tema)}\\[0.3em]
\large ${latexEscape(meta.vidRaboty)}
}\\[0.3em]

\large дисциплина «${latexEscape(meta.disciplina)}»\\
\Large ${latexEscape(meta.shapkaStroka)}
\large
\vfill

\begin{center}
\begin{minipage}{\textwidth}
  \setlength{\tabcolsep}{0pt}
  \begin{tabular}{@{}p{4cm}p{9cm}p{4cm}@{}}
    ${latexEscape(meta.studentLabel)}
      & \centering\hrulefill
      & \centering ${meta.student} \\[0em]
  \end{tabular}
\end{minipage}
\end{center}

\vspace{-25pt}
\small\textit{(подпись, дата)}
\large

\begin{center}
\begin{minipage}{\textwidth}
  \setlength{\tabcolsep}{0pt}
  \begin{tabular}{@{}p{4cm}p{9cm}p{4cm}@{}}
    ${latexEscape(rukFullLabel)}
      & \centering\hrulefill
      & \centering ${meta.rukovoditel} \\[0em]
  \end{tabular}
\end{minipage}
\end{center}

\vspace{-20pt}
\small\textit{(подпись, дата)}
\normalsize

\vfill
\normalsize ${latexEscape(meta.city)} ${latexEscape(String(meta.year))}
\end{center}
\end{titlepage}

\setcounter{page}{2}
`;
}

function buildTOC(meta: ReportMeta) {
  if (!meta.includeToc) return "";

  return String.raw`
\tableofcontents
\clearpage

`;
}

function buildBlocks(
  blocks: ReportBlock[],
  counters: {
    code: number;
    calculation: number;
    table: number;
  }
) {
  let out = "";

  blocks.forEach((block) => {
    if (block.type === "text") {
      out += `\n${latexEscape(block.content)}\n\n`;
      return;
    }

    if (block.type === "figure") {
      const graphicPath = latexGraphicPath(block.filename);
      out += String.raw`
\begin{figure}[H]
    \centering
    \includegraphics[width=0.7\textwidth]{\detokenize{${graphicPath}}}
    \caption{- ${latexEscape(block.caption)}}
\end{figure}

`;
      return;
    }

    if (block.type === "code") {
      const currentCodeIndex = counters.code++;
      const normalizedCode = normalizeCodeForLatex(block.code);
      out += String.raw`
\noindent\textbf{Код ${currentCodeIndex} - ${latexEscape(block.caption)}}\par
\smallskip
\begin{CodeBlock}
` + normalizedCode + String.raw`
\end{CodeBlock}

`;
      return;
    }

    if (block.type === "calculation") {
      const currentCalculationIndex = counters.calculation++;
      const normalizedFormula = normalizeFormulaForLatex(block.formula);
      out += String.raw`
\noindent\textbf{Расчёт ${currentCalculationIndex} - ${latexEscape(block.caption)}}\par
\smallskip
\begin{${block.environment}}
` + normalizedFormula + String.raw`
\end{${block.environment}}

`;
      return;
    }

    if (block.type === "table") {
      const currentTableIndex = counters.table++;
      const rows = block.data
        .split("\n")
        .map((row) => row.trim())
        .filter(Boolean);

      let colCount = 0;

      if (rows.length > 0) {
        const requestedCols = Number.parseInt(block.cols, 10);
        colCount = Number.isNaN(requestedCols)
          ? Math.max(...rows.map((row) => row.split(";").length))
          : requestedCols;
      }

      if (colCount <= 0) colCount = 1;

      const colSpec = `|${Array.from({ length: colCount }, () => "c|").join("")}`;

      out += String.raw`
\begin{table}[H]
\caption*{\hfill \textbf{Таблица ${currentTableIndex} - ${latexEscape(block.caption)}}}
\centering
\begin{tabular}{${colSpec}}
\hline
`;

      rows.forEach((row) => {
        const cells = row.split(";").map((cell) => latexEscape(cell.trim()));
        const padded = Array.from({ length: colCount }, (_, index) => cells[index] || "");

        out += padded.join(" & ") + String.raw` \\` + "\n";
        out += "\\hline\n";
      });

      out += String.raw`\end{tabular}
\end{table}

`;
      return;
    }

    if (block.type === "graph") {
      out += buildGraphBlock(block);
      return;
    }

    if (block.type === "list") {
      const tag = block.ordered ? "enumerate" : "itemize";

      out += `\n\\begin{${tag}}\n`;

      block.items.forEach((item) => {
        const label = item.label.trim();
        const description = item.text.trim();

        if (!label && !description) return;

        if (label && description) {
          out += `\\item ${latexEscape(label)}${String.raw`\\`}\n${latexEscape(description)}\n`;
          return;
        }

        out += `\\item ${latexEscape(label || description)}\n`;
      });

      out += `\\end{${tag}}\n\n`;
      return;
    }

    out += "\n\\clearpage\n\n";
  });

  return out;
}

function buildBody(sections: ReportSection[]) {
  let out = "\n% ================== ОСНОВНАЯ ЧАСТЬ ==================\n\n";
  const counters = {
    code: 1,
    calculation: 1,
    table: 1
  };
  const sectionDisplayInfo = buildSectionDisplayInfo(sections);

  sections.forEach((section) => {
    const title = sectionDisplayInfo[section.id]?.fullTitle ?? section.title.trim();
    if (!title) return;

    const cmd = section.level === 0 ? "section" : section.level === 1 ? "subsection" : "subsubsection";

    out += `\\${cmd}*{${latexEscape(title)}}\n`;
    out += `\\addcontentsline{toc}{${cmd}}{${latexEscape(title)}}\n\n`;
    out += buildBlocks(section.blocks, counters);
  });

  return out;
}

export function buildFullTex(draft: ReportDraft) {
  return [
    buildPreamble(),
    buildTitlePage(draft.meta),
    buildTOC(draft.meta),
    buildBody(draft.sections),
    "\n\\end{document}\n"
  ].join("");
}

export function normalizeDraft(draft: ReportDraft): ReportDraft {
  return {
    ...draft,
    meta: {
      ...defaultMeta,
      ...draft.meta
    },
    sections: draft.sections.map((section) => ({
      ...section,
      isNumbered: section.isNumbered ?? true,
      blocks: section.blocks.map((block) => normalizeBlock(block))
    }))
  };
}

function normalizeBlock(block: ReportBlock): ReportBlock {
  if (block.type === "calculation") {
    const legacyBlock = block as CalculationBlock & {
      code?: string;
      formula?: string;
      environment?: CalculationEnvironment;
    };

    return {
      ...legacyBlock,
      environment: legacyBlock.environment ?? "equation*",
      formula: legacyBlock.formula ?? legacyBlock.code ?? ""
    };
  }

  if (block.type !== "graph") {
    return block;
  }

  const legacyBlock = block as GraphBlock & {
    color?: string;
    points?: string;
  };

  const series =
    legacyBlock.series && legacyBlock.series.length > 0
      ? legacyBlock.series.map((item, index) => ({
          id: item.id || makeId("series"),
          label: item.label || `Серия ${index + 1}`,
          color: item.color || "teal",
          points: item.points || ""
        }))
      : [
          {
            id: makeId("series"),
            label: "Серия 1",
            color: legacyBlock.color || "teal",
            points: legacyBlock.points || ""
          }
        ];

  return {
    ...legacyBlock,
    startAtZero: legacyBlock.startAtZero ?? true,
    series
  };
}

export function buildSectionDisplayInfo(sections: ReportSection[]) {
  const counters = [0, 0, 0];
  const displayInfo: Record<string, SectionDisplayInfo> = {};

  sections.forEach((section) => {
    let rawNumber: string | null = null;

    if (section.isNumbered) {
      if (section.level === 0) {
        counters[0] += 1;
        counters[1] = 0;
        counters[2] = 0;
        rawNumber = `${counters[0]}`;
      } else if (section.level === 1) {
        if (counters[0] === 0) counters[0] = 1;
        counters[1] += 1;
        counters[2] = 0;
        rawNumber = `${counters[0]}.${counters[1]}`;
      } else {
        if (counters[0] === 0) counters[0] = 1;
        if (counters[1] === 0) counters[1] = 1;
        counters[2] += 1;
        rawNumber = `${counters[0]}.${counters[1]}.${counters[2]}`;
      }
    }

    const numberingLabel = rawNumber ? (section.level === 0 ? `${rawNumber}.` : rawNumber) : null;
    const trimmedTitle = section.title.trim();

    displayInfo[section.id] = {
      rawNumber,
      numberingLabel,
      fullTitle: numberingLabel ? `${numberingLabel} ${trimmedTitle}`.trim() : trimmedTitle
    };
  });

  return displayInfo;
}
