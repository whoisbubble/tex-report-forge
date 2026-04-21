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
              { id: makeId("item"), label: "", text: "подготовка таблиц, рисунков и фрагментов кода" }
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
            caption: "Пример обработчика",
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

  if (series.length > 1) {
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

% ===== Код =====
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
