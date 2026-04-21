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
  kafedra: "РРЅС„РѕСЂРјР°С†РёРѕРЅРЅС‹Рµ С‚РµС…РЅРѕР»РѕРіРёРё Рё СЃРёСЃС‚РµРјС‹",
  tema: "РђРЅР°Р»РёР· РРЎ",
  vidRaboty: "РџСЂР°РєС‚РёС‡РµСЃРєР°СЏ СЂР°Р±РѕС‚Р° в„–2",
  disciplina: "РўРµРѕСЂРёСЏ РёРЅС„РѕСЂРјР°С†РёРѕРЅРЅС‹С… РїСЂРѕС†РµСЃСЃРѕРІ Рё СЃРёСЃС‚РµРј",
  shapkaStroka: "РџР  09.03.02. 17.02.Р‘Рћ231РРЎРў",
  studentLabel: "РЎС‚СѓРґРµРЅС‚",
  rukovoditelLabel: "РџСЂРѕРІРµСЂРёР»",
  rukovoditelDolzhnost: "",
  student: "Рў.Рџ.~Р§РёРіРёСЂС‘РІ",
  rukovoditel: "Рћ.Р’.~Р С‹Р±РєРёРЅР°",
  city: "РҐР°Р±Р°СЂРѕРІСЃРє",
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
          label: "РЎРµСЂРёСЏ 1",
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

export function createSection(level: SectionLevel, title = "РќРѕРІС‹Р№ СЂР°Р·РґРµР»", isNumbered = true): ReportSection {
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
    title: section.title ? `${section.title} (РєРѕРїРёСЏ)` : "РќРѕРІС‹Р№ СЂР°Р·РґРµР» (РєРѕРїРёСЏ)",
    blocks: section.blocks.map((block) => cloneBlock(block))
  };
}

export function createInitialDraft(): ReportDraft {
  return {
    meta: { ...defaultMeta },
    sections: [
      {
        id: "section-task",
        title: "Р—Р°РґР°РЅРёРµ",
        level: 0,
        isNumbered: false,
        blocks: [
          {
            id: "block-task-text",
            type: "text",
            content: "Р·РґРµСЃСЊ РІРїРёСЃР°С‚СЊ Р·Р°РґР°РЅРёРµ"
          }
        ]
      },
      {
        id: "section-work",
        title: "РҐРѕРґ СЂР°Р±РѕС‚С‹",
        level: 0,
        isNumbered: true,
        blocks: [
          {
            id: "block-work-text",
            type: "text",
            content: "РћРїРёС€РёС‚Рµ С…РѕРґ РІС‹РїРѕР»РЅРµРЅРёСЏ СЂР°Р±РѕС‚С‹."
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
      tema: "РћР Р“РђРќРР—РђР¦РРЇ IP-РўР•Р›Р•Р¤РћРќРР РќРђ РћРЎРќРћР’Р• РћРўР•Р§Р•РЎРўР’Р•РќРќР«РҐ Р Р•РЁР•РќРР™",
      vidRaboty: "Р Р°СЃС‡С‘С‚РЅРѕ-РіСЂР°С„РёС‡РµСЃРєР°СЏ СЂР°Р±РѕС‚Р° в„–1",
      disciplina: "РџСЂРѕРµРєС‚РёСЂРѕРІР°РЅРёРµ РіСЂР°С„РёС‡РµСЃРєРёС… РёРЅС‚РµСЂС„РµР№СЃРѕРІ РёРЅС„РѕСЂРјР°С†РёРѕРЅРЅС‹С… СЃРёСЃС‚РµРј",
      shapkaStroka: "Р›Р  09.03.02. 17.02.Р‘Рћ231РРЎРў",
      student: "Рў.\\,Рџ.~Р§РёРіРёСЂС‘РІ",
      rukovoditel: "Рћ.\\,Р’.~Р С‹Р±РєРёРЅР°",
      includeToc: true
    },
    sections: [
      {
        ...createSection(0, "Р’РІРµРґРµРЅРёРµ", false),
        blocks: [
          {
            id: makeId("block"),
            type: "text",
            content:
              "Р’ СЂР°Р±РѕС‚Рµ СЂР°СЃСЃРјР°С‚СЂРёРІР°РµС‚СЃСЏ СЃС‚СЂСѓРєС‚СѓСЂР° РёРЅС„РѕСЂРјР°С†РёРѕРЅРЅРѕР№ СЃРёСЃС‚РµРјС‹, РµС‘ РѕСЃРЅРѕРІРЅС‹Рµ РєРѕРјРїРѕРЅРµРЅС‚С‹ Рё СЃС†РµРЅР°СЂРёРё РёСЃРїРѕР»СЊР·РѕРІР°РЅРёСЏ. Р¦РµР»СЊ РѕС‚С‡С‘С‚Р° вЂ” Р·Р°С„РёРєСЃРёСЂРѕРІР°С‚СЊ С…РѕРґ РІС‹РїРѕР»РЅРµРЅРёСЏ Р·Р°РґР°РЅРёСЏ Рё РѕС„РѕСЂРјРёС‚СЊ СЂРµР·СѓР»СЊС‚Р°С‚С‹ РІ РµРґРёРЅРѕРј С€Р°Р±Р»РѕРЅРµ."
          },
          createBlock("pagebreak")
        ]
      },
      {
        ...createSection(0, "РҐРѕРґ СЂР°Р±РѕС‚С‹"),
        blocks: [
          {
            id: makeId("block"),
            type: "text",
            content: "Р”Р»СЏ РІС‹РїРѕР»РЅРµРЅРёСЏ СЂР°Р±РѕС‚С‹ Р±С‹Р»Рё РІС‹РґРµР»РµРЅС‹ СЃР»РµРґСѓСЋС‰РёРµ СЌС‚Р°РїС‹:"
          },
          {
            id: makeId("block"),
            type: "list",
            ordered: true,
            items: [
              { id: makeId("item"), label: "", text: "Р°РЅР°Р»РёР· РїСЂРµРґРјРµС‚РЅРѕР№ РѕР±Р»Р°СЃС‚Рё" },
              { id: makeId("item"), label: "", text: "РѕРїРёСЃР°РЅРёРµ РєР»СЋС‡РµРІС‹С… СЃСѓС‰РЅРѕСЃС‚РµР№" },
              { id: makeId("item"), label: "", text: "РїРѕРґРіРѕС‚РѕРІРєР° С‚Р°Р±Р»РёС†, СЂРёСЃСѓРЅРєРѕРІ Рё СЂР°СЃС‡С‘С‚РѕРІ" }
            ]
          }
        ]
      },
      {
        ...createSection(1, "РћРїРёСЃР°РЅРёРµ РјРѕРґРµР»Рё"),
        blocks: [
          {
            id: makeId("block"),
            type: "text",
            content: "РќРёР¶Рµ РїСЂРёРІРµРґС‘РЅ РїСЂРёРјРµСЂ РїСЂРѕРіСЂР°РјРјРЅРѕРіРѕ С„СЂР°РіРјРµРЅС‚Р°, РєРѕС‚РѕСЂС‹Р№ РјРѕР¶РЅРѕ РІСЃС‚Р°РІР»СЏС‚СЊ Р±РµР· СЂСѓС‡РЅРѕР№ СЌРєСЂР°РЅРёР·Р°С†РёРё СЃРёРјРІРѕР»РѕРІ."
          },
          {
            id: makeId("block"),
            type: "code",
            caption: "РџСЂРёРјРµСЂ СЂР°СЃС‡С‘С‚Р°",
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
            caption: "РџР»Р°РЅ РїСЂРѕРІРµСЂРєРё",
            cols: "3",
            data: "Р­С‚Р°Рї;Р”РµР№СЃС‚РІРёРµ;Р РµР·СѓР»СЊС‚Р°С‚\n1;Р—Р°РїРѕР»РЅРµРЅРёРµ С‚РёС‚СѓР»СЊРЅРѕРіРѕ Р»РёСЃС‚Р°;Р”Р°РЅРЅС‹Рµ СЃРѕС…СЂР°РЅРµРЅС‹\n2;Р”РѕР±Р°РІР»РµРЅРёРµ СЂР°Р·РґРµР»РѕРІ;РЎС‚СЂСѓРєС‚СѓСЂР° РѕС‚С‡С‘С‚Р° РіРѕС‚РѕРІР°\n3;Р“РµРЅРµСЂР°С†РёСЏ .tex;Р¤Р°Р№Р» РјРѕР¶РЅРѕ РєРѕРјРїРёР»РёСЂРѕРІР°С‚СЊ"
          },
          {
            id: makeId("block"),
            type: "graph",
            caption: "РЎРєРѕСЂРѕСЃС‚СЊ РѕР±СЂР°Р±РѕС‚РєРё Р·Р°РїСЂРѕСЃРѕРІ",
            title: "РќР°РіСЂСѓР·РєР° РїРѕ СЌС‚Р°РїР°Рј",
            xLabel: "Р­С‚Р°Рї",
            yLabel: "РјСЃ",
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
        ...createSection(0, "Р—Р°РєР»СЋС‡РµРЅРёРµ", false),
        blocks: [
          {
            id: makeId("block"),
            type: "text",
            content:
              "Р’ СЂРµР·СѓР»СЊС‚Р°С‚Рµ СЂР°Р±РѕС‚С‹ Р±С‹Р» РїРѕРґРіРѕС‚РѕРІР»РµРЅ РѕС‚С‡С‘С‚ РІ С„РѕСЂРјР°С‚Рµ LaTeX. РџРѕР»СѓС‡РµРЅРЅС‹Р№ С„Р°Р№Р» РјРѕР¶РЅРѕ РїРµСЂРµРЅРµСЃС‚Рё РІ Overleaf РёР»Рё СЃРєРѕРјРїРёР»РёСЂРѕРІР°С‚СЊ Р»РѕРєР°Р»СЊРЅРѕ."
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
  [/в‰¤/g, String.raw`\leq `],
  [/в‰Ґ/g, String.raw`\geq `],
  [/в‰ /g, String.raw`\neq `],
  [/в‰€/g, String.raw`\approx `],
  [/в‰ѓ/g, String.raw`\simeq `],
  [/в‰…/g, String.raw`\cong `],
  [/в‰Ў/g, String.raw`\equiv `],
  [/В±/g, String.raw`\pm `],
  [/в€“/g, String.raw`\mp `],
  [/Г—/g, String.raw`\times `],
  [/Г·/g, String.raw`\div `],
  [/В·/g, String.raw`\cdot `],
  [/в€љ/g, String.raw`\sqrt{}`],
  [/в€ћ/g, String.raw`\infty `],
  [/в€‘/g, String.raw`\sum `],
  [/в€Џ/g, String.raw`\prod `],
  [/в€«/g, String.raw`\int `],
  [/в€‚/g, String.raw`\partial `],
  [/в€‡/g, String.raw`\nabla `],
  [/в€€/g, String.raw`\in `],
  [/в€‰/g, String.raw`\notin `],
  [/в€‹/g, String.raw`\ni `],
  [/в€©/g, String.raw`\cap `],
  [/в€Є/g, String.raw`\cup `],
  [/вЉ‚/g, String.raw`\subset `],
  [/вЉ†/g, String.raw`\subseteq `],
  [/вЉѓ/g, String.raw`\supset `],
  [/вЉ‡/g, String.raw`\supseteq `],
  [/в€…/g, String.raw`\varnothing `],
  [/в€Ђ/g, String.raw`\forall `],
  [/в€ѓ/g, String.raw`\exists `],
  [/В¬/g, String.raw`\neg `],
  [/в€§/g, String.raw`\land `],
  [/в€Ё/g, String.raw`\lor `],
  [/в†’/g, String.raw`\to `],
  [/в†ђ/g, String.raw`\leftarrow `],
  [/в†”/g, String.raw`\leftrightarrow `],
  [/в‡’/g, String.raw`\Rightarrow `],
  [/в‡ђ/g, String.raw`\Leftarrow `],
  [/в‡”/g, String.raw`\Leftrightarrow `],
  [/в€ќ/g, String.raw`\propto `],
  [/в€ґ/g, String.raw`\therefore `],
  [/в€µ/g, String.raw`\because `],
  [/в€ /g, String.raw`\angle `],
  [/вЉҐ/g, String.raw`\perp `],
  [/в€Ґ/g, String.raw`\parallel `],
  [/в‰Є/g, String.raw`\ll `],
  [/в‰«/g, String.raw`\gg `],
  [/О±/g, String.raw`\alpha `],
  [/ОІ/g, String.raw`\beta `],
  [/Оі/g, String.raw`\gamma `],
  [/Оґ/g, String.raw`\delta `],
  [/Оµ/g, String.raw`\varepsilon `],
  [/О¶/g, String.raw`\zeta `],
  [/О·/g, String.raw`\eta `],
  [/Оё/g, String.raw`\theta `],
  [/О№/g, String.raw`\iota `],
  [/Оє/g, String.raw`\kappa `],
  [/О»/g, String.raw`\lambda `],
  [/Ој/g, String.raw`\mu `],
  [/ОЅ/g, String.raw`\nu `],
  [/Оѕ/g, String.raw`\xi `],
  [/ПЂ/g, String.raw`\pi `],
  [/ПЃ/g, String.raw`\rho `],
  [/Пѓ/g, String.raw`\sigma `],
  [/П„/g, String.raw`\tau `],
  [/П†/g, String.raw`\varphi `],
  [/П‡/g, String.raw`\chi `],
  [/П€/g, String.raw`\psi `],
  [/П‰/g, String.raw`\omega `],
  [/О“/g, String.raw`\Gamma `],
  [/О”/g, String.raw`\Delta `],
  [/О/g, String.raw`\Theta `],
  [/О›/g, String.raw`\Lambda `],
  [/Оћ/g, String.raw`\Xi `],
  [/О /g, String.raw`\Pi `],
  [/ОЈ/g, String.raw`\Sigma `],
  [/О¦/g, String.raw`\Phi `],
  [/ОЁ/g, String.raw`\Psi `],
  [/О©/g, String.raw`\Omega `]
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

% ===== Р СѓСЃСЃРєРёР№ СЏР·С‹Рє Рё С€СЂРёС„С‚С‹ (pdfLaTeX) =====
\usepackage[T2A]{fontenc}
\usepackage[utf8]{inputenc}
\usepackage[russian]{babel}
\addto\captionsrussian{\renewcommand{\contentsname}{РћРіР»Р°РІР»РµРЅРёРµ}}
\usepackage{mathptmx} % С€СЂРёС„С‚ РІ СЃС‚РёР»Рµ Times
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
    name={Р РёСЃСѓРЅРѕРє},
    labelsep={space},
    justification=centering,
    singlelinecheck=false
}

% ===== РџРѕР»СЏ, РёРЅС‚РµСЂРІР°Р»С‹, Р°Р±Р·Р°С†С‹ =====
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

% ===== РљР°СЂС‚РёРЅРєРё =====
\usepackage{tikz}
\usepackage{pgfplots}
\pgfplotsset{compat=1.18}
\usepackage{graphicx}
\graphicspath{{images/}} % РїР°РїРєР° РґР»СЏ СЃРєСЂРёРЅРѕРІ

\usepackage{caption}

% ===== РћРіР»Р°РІР»РµРЅРёРµ =====
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

% ===== РњР°С‚РµРјР°С‚РёРєР°, РєРѕРґ Рё СЂР°СЃС‡С‘С‚С‹ =====
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

% ===== РќР°СЃС‚СЂРѕР№РєР° СЂР°Р·РјРµСЂРѕРІ Р·Р°РіРѕР»РѕРІРєРѕРІ =====
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
РњРёРЅРёСЃС‚РµСЂСЃС‚РІРѕ С‚СЂР°РЅСЃРїРѕСЂС‚Р° Р РѕСЃСЃРёР№СЃРєРѕР№ Р¤РµРґРµСЂР°С†РёРё\\
Р¤РµРґРµСЂР°Р»СЊРЅРѕРµ Р°РіРµРЅС‚СЃС‚РІРѕ Р¶РµР»РµР·РЅРѕРґРѕСЂРѕР¶РЅРѕРіРѕ С‚СЂР°РЅСЃРїРѕСЂС‚Р°\\[0.2em]

Р¤РµРґРµСЂР°Р»СЊРЅРѕРµ РіРѕСЃСѓРґР°СЂСЃС‚РІРµРЅРЅРѕРµ Р±СЋРґР¶РµС‚РЅРѕРµ РѕР±СЂР°Р·РѕРІР°С‚РµР»СЊРЅРѕРµ СѓС‡СЂРµР¶РґРµРЅРёРµ\\
РІС‹СЃС€РµРіРѕ РѕР±СЂР°Р·РѕРІР°РЅРёСЏ\\
В«Р”Р°Р»СЊРЅРµРІРѕСЃС‚РѕС‡РЅС‹Р№ РіРѕСЃСѓРґР°СЂСЃС‚РІРµРЅРЅС‹Р№ СѓРЅРёРІРµСЂСЃРёС‚РµС‚ РїСѓС‚РµР№ СЃРѕРѕР±С‰РµРЅРёСЏВ»\\[0.2em]

РљР°С„РµРґСЂР° В«${latexEscape(meta.kafedra)}В»
\vfill

{\bfseries
\large ${latexEscape(meta.tema)}\\[0.3em]
\large ${latexEscape(meta.vidRaboty)}
}\\[0.3em]

\large РґРёСЃС†РёРїР»РёРЅР° В«${latexEscape(meta.disciplina)}В»\\
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
\small\textit{(РїРѕРґРїРёСЃСЊ, РґР°С‚Р°)}
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
\small\textit{(РїРѕРґРїРёСЃСЊ, РґР°С‚Р°)}
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
\noindent\textbf{РљРѕРґ ${currentCodeIndex} - ${latexEscape(block.caption)}}\par
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
\noindent\textbf{Р Р°СЃС‡С‘С‚ ${currentCalculationIndex} - ${latexEscape(block.caption)}}\par
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
\caption*{\hfill \textbf{РўР°Р±Р»РёС†Р° ${currentTableIndex} - ${latexEscape(block.caption)}}}
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
  let out = "\n% ================== РћРЎРќРћР’РќРђРЇ Р§РђРЎРўР¬ ==================\n\n";
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
          label: item.label || `РЎРµСЂРёСЏ ${index + 1}`,
          color: item.color || "teal",
          points: item.points || ""
        }))
      : [
          {
            id: makeId("series"),
            label: "РЎРµСЂРёСЏ 1",
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
