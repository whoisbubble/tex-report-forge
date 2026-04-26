"use client";

import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import {
  buildFullTex,
  buildSectionDisplayInfo,
  cloneBlock,
  cloneSection,
  createBlock,
  createCapabilitiesDraft,
  createExampleDraft,
  createInitialDraft,
  createSection,
  makeId,
  normalizeDraft,
  type CodeBlock,
  type CalculationBlock,
  type FigureBlock,
  type GraphBlock,
  type GraphSeries,
  type ListBlock,
  type ReportBlock,
  type ReportDraft,
  type ReportMeta,
  type ReportSection,
  type SectionLevel,
  type TableBlock,
  type TitlePageFontSize,
  type TextBlock
} from "@/lib/report";

const appName = "tex.bostoncrew.ru";
const legacyAppNames = ["MakeTexChigga", "tex-report-forge", appName];
const storageKey = "tex-report-forge-draft";
const projectFileApp = appName;
const projectFileVersion = 1;
const projectFileKind = "project";
const capabilitiesFileKind = "project-capabilities";

const blockLabels: Record<ReportBlock["type"], string> = {
  text: "Текст",
  figure: "Рисунок",
  code: "Код",
  calculation: "Расчёты",
  table: "Таблица",
  graph: "График",
  list: "Список",
  pagebreak: "Разрыв страницы"
};

const levelLabels: Record<SectionLevel, string> = {
  0: "\\section*",
  1: "\\subsection*",
  2: "\\subsubsection*"
};

const metaFields: Array<{
  key: keyof Omit<ReportMeta, "includeToc">;
  label: string;
  type?: "text" | "number";
  wide?: boolean;
}> = [
  { key: "kafedra", label: "Кафедра", wide: true },
  { key: "tema", label: "Тема работы", wide: true },
  { key: "vidRaboty", label: "Вид работы" },
  { key: "disciplina", label: "Дисциплина", wide: true },
  { key: "shapkaStroka", label: "Шифр / группа / вариант" },
  { key: "studentLabel", label: "Подпись студента" },
  { key: "rukovoditelLabel", label: "Подпись руководителя" },
  { key: "rukovoditelDolzhnost", label: "Должность руководителя" },
  { key: "student", label: "Студент" },
  { key: "rukovoditel", label: "Руководитель" },
  { key: "city", label: "Город" },
  { key: "year", label: "Год", type: "number" }
];

const titlePageTextFields: Array<{
  key:
    | "ministryLine1"
    | "ministryLine2"
    | "universityLine1"
    | "universityLine2"
    | "universityLine3";
  label: string;
  wide?: boolean;
}> = [
  { key: "ministryLine1", label: "Первая строка шапки", wide: true },
  { key: "ministryLine2", label: "Вторая строка шапки", wide: true },
  { key: "universityLine1", label: "Первая строка вуза", wide: true },
  { key: "universityLine2", label: "Вторая строка вуза", wide: true },
  { key: "universityLine3", label: "Третья строка вуза", wide: true }
];

const titlePageSizeLabels: Record<TitlePageFontSize, string> = {
  small: "Мелкий",
  normalsize: "Обычный",
  large: "Крупный",
  Large: "Очень крупный",
  LARGE: "Максимальный",
  huge: "Huge",
  Huge: "Huge+"
};

const titlePageSizeFields: Array<{
  key:
    | "titlePageHeaderSize"
    | "titlePageUniversitySize"
    | "titlePageKafedraSize"
    | "titlePageWorkTitleSize"
    | "titlePageDisciplineSize"
    | "titlePageCodeSize"
    | "titlePageSignatureLabelSize"
    | "titlePageSignatureNameSize"
    | "titlePageSignNoteSize"
    | "titlePageFooterSize";
  label: string;
}> = [
  { key: "titlePageHeaderSize", label: "Размер шапки" },
  { key: "titlePageUniversitySize", label: "Размер блока вуза" },
  { key: "titlePageKafedraSize", label: "Размер кафедры" },
  { key: "titlePageWorkTitleSize", label: "Размер названия работы" },
  { key: "titlePageDisciplineSize", label: "Размер дисциплины" },
  { key: "titlePageCodeSize", label: "Размер шифра / группы" },
  { key: "titlePageSignatureLabelSize", label: "Размер подписей слева" },
  { key: "titlePageSignatureNameSize", label: "Размер ФИО справа" },
  { key: "titlePageSignNoteSize", label: "Размер подписи/даты" },
  { key: "titlePageFooterSize", label: "Размер города и года" }
];

const graphPreviewColors: Record<string, string> = {
  teal: "#4fd0b0",
  blue: "#74a7ff",
  red: "#ff7389",
  orange: "#ffae57",
  "green!60!black": "#8ad06f",
  violet: "#c18cff"
};

const calculationEnvironmentLabels: Record<CalculationBlock["environment"], string> = {
  "equation*": "Формула без номера",
  equation: "Формула с номером",
  "align*": "Несколько строк без номеров",
  align: "Несколько строк с номерами",
  "gather*": "Строки по центру без номеров",
  gather: "Строки по центру с номерами",
  "multline*": "Длинная формула без номера",
  multline: "Длинная формула с номером"
};

const calculationFontSizeLabels: Record<CalculationBlock["fontSize"], string> = {
  normalsize: "Обычный",
  small: "Меньше",
  footnotesize: "Маленький",
  scriptsize: "Очень маленький",
  tiny: "Минимальный"
};

const tableFontSizeLabels = calculationFontSizeLabels;

const calculationInsertTemplates = [
  { label: "frac", template: String.raw`\frac{__CURSOR__}{}` },
  { label: "sqrt", template: String.raw`\sqrt{__CURSOR__}` },
  { label: "^{}", template: String.raw`x^{__CURSOR__}` },
  { label: "_{}", template: String.raw`x_{__CURSOR__}` },
  { label: "\\\\", template: "\\\\\n" },
  { label: "sum", template: String.raw`\sum_{i=1}^{n} __CURSOR__` },
  { label: "int", template: String.raw`\int_{a}^{b} __CURSOR__ \, dx` },
  { label: "lim", template: String.raw`\lim_{x \to \infty} __CURSOR__` },
  { label: "alpha", template: String.raw`\alpha` },
  { label: "beta", template: String.raw`\beta` },
  { label: "pi", template: String.raw`\pi` },
  { label: "cap", template: String.raw`\cap` },
  { label: "cup", template: String.raw`\cup` },
  { label: "subseteq", template: String.raw`\subseteq` },
  { label: "in", template: String.raw`\in` },
  { label: "leq", template: String.raw`\leq` },
  { label: "geq", template: String.raw`\geq` },
  { label: "neq", template: String.raw`\neq` },
  { label: "pm", template: String.raw`\pm` },
  { label: "pmatrix", template: String.raw`\begin{pmatrix}
__CURSOR__
\end{pmatrix}` },
  { label: "cases", template: String.raw`\begin{cases}
__CURSOR__
\end{cases}` }
];

const textInsertGroups = [
  {
    title: "Быстрые формулы",
    items: [
      { label: "$...$", template: "$__CURSOR__$" },
      { label: "\\(...\\)", template: String.raw`\(__CURSOR__\)` },
      { label: "\\[...\\]", template: String.raw`\[
__CURSOR__
\]` },
      { label: "\\frac", template: String.raw`$\frac{__CURSOR__}{}$` },
      { label: "\\sqrt", template: String.raw`$\sqrt{__CURSOR__}$` },
      { label: "индекс", template: String.raw`$x_{__CURSOR__}$` },
      { label: "степень", template: String.raw`$x^{__CURSOR__}$` }
    ]
  },
  {
    title: "Логика и множества",
    items: [
      { label: "\\mu", template: String.raw`$\mu_{__CURSOR__}(x)$` },
      { label: "\\rho", template: String.raw`$\rho_{__CURSOR__}$` },
      { label: "\\cap", template: String.raw`$A \cap B$` },
      { label: "\\cup", template: String.raw`$A \cup B$` },
      { label: "\\subseteq", template: String.raw`$A \subseteq B$` },
      { label: "\\in", template: String.raw`$x \in A$` },
      { label: "\\forall", template: String.raw`$\forall x \in X$` },
      { label: "\\exists", template: String.raw`$\exists x$` }
    ]
  },
  {
    title: "Греческие и знаки",
    items: [
      { label: "\\alpha", template: String.raw`$\alpha$` },
      { label: "\\beta", template: String.raw`$\beta$` },
      { label: "\\gamma", template: String.raw`$\gamma$` },
      { label: "\\Delta", template: String.raw`$\Delta$` },
      { label: "\\approx", template: String.raw`$\approx$` },
      { label: "\\leq", template: String.raw`$\leq$` },
      { label: "\\geq", template: String.raw`$\geq$` },
      { label: "\\infty", template: String.raw`$\infty$` }
    ]
  },
  {
    title: "Полезные вставки",
    items: [
      { label: "\\textbf", template: String.raw`\textbf{__CURSOR__}` },
      { label: "\\emph", template: String.raw`\emph{__CURSOR__}` },
      { label: "align*", template: String.raw`\[
\begin{align*}
__CURSOR__
\end{align*}
\]` },
      { label: "перенос", template: "\\\\\n" },
      { label: "маркер", template: "• __CURSOR__" },
      { label: "стрелка", template: String.raw`$\Rightarrow$` }
    ]
  }
] as const;

export default function Home() {
  const [draft, setDraft] = useState<ReportDraft>(() => createInitialDraft());
  const [currentLevel, setCurrentLevel] = useState<SectionLevel>(0);
  const [generatedSnapshot, setGeneratedSnapshot] = useState("");
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "error">("idle");
  const [projectStatus, setProjectStatus] = useState<"idle" | "saved" | "loaded" | "error">("idle");
  const [pdfStatus, setPdfStatus] = useState<"idle" | "building" | "done" | "error">("idle");
  const [loaded, setLoaded] = useState(false);
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [collapsedSectionIds, setCollapsedSectionIds] = useState<string[]>([]);
  const projectInputRef = useRef<HTMLInputElement>(null);

  const tex = useMemo(() => buildFullTex(draft), [draft]);
  const sectionDisplayInfo = useMemo(() => buildSectionDisplayInfo(draft.sections), [draft.sections]);
  const sectionSearchIndex = useMemo(
    () =>
      Object.fromEntries(
        draft.sections.map((section) => [section.id, buildSectionSearchText(section, sectionDisplayInfo[section.id]?.fullTitle || "")])
      ),
    [draft.sections, sectionDisplayInfo]
  );
  const filteredSections = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    if (!normalizedQuery) return draft.sections;

    return draft.sections.filter((section) => sectionSearchIndex[section.id].includes(normalizedQuery));
  }, [draft.sections, searchQuery, sectionSearchIndex]);
  const isTexDirty = generatedSnapshot !== "" && generatedSnapshot !== tex;
  const blockCount = useMemo(
    () => draft.sections.reduce((total, section) => total + section.blocks.length, 0),
    [draft.sections]
  );

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(storageKey);

      if (saved) {
        const normalizedDraft = normalizeDraft(JSON.parse(saved) as ReportDraft);
        setDraft(normalizedDraft);
        setSelectedSectionId(normalizedDraft.sections[0]?.id ?? null);
      }
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!loaded) return;

    try {
      window.localStorage.setItem(storageKey, JSON.stringify(draft));
    } catch (error) {
      if (isQuotaExceededError(error)) {
        try {
          window.localStorage.setItem(storageKey, JSON.stringify(createAutosaveDraft(draft)));
          console.warn(
            "[autosave] Project exceeded localStorage quota; embedded figure files were omitted from browser autosave."
          );
        } catch (fallbackError) {
          console.error("[autosave] Failed to store fallback draft.", fallbackError);
        }

        return;
      }

      console.error("[autosave] Failed to store draft.", error);
    }
  }, [draft, loaded]);

  useEffect(() => {
    if (copyStatus === "idle") return;

    const timer = window.setTimeout(() => setCopyStatus("idle"), 1800);
    return () => window.clearTimeout(timer);
  }, [copyStatus]);

  useEffect(() => {
    if (projectStatus === "idle") return;

    const timer = window.setTimeout(() => setProjectStatus("idle"), 2200);
    return () => window.clearTimeout(timer);
  }, [projectStatus]);

  useEffect(() => {
    if (pdfStatus !== "done" && pdfStatus !== "error") return;

    const timer = window.setTimeout(() => setPdfStatus("idle"), 2200);
    return () => window.clearTimeout(timer);
  }, [pdfStatus]);

  useEffect(() => {
    if (draft.sections.length === 0) {
      setSelectedSectionId(null);
      return;
    }

    if (!selectedSectionId || !draft.sections.some((section) => section.id === selectedSectionId)) {
      setSelectedSectionId(draft.sections[0]?.id ?? null);
    }
  }, [draft.sections, selectedSectionId]);

  function updateMeta(key: keyof ReportMeta, value: string | boolean) {
    setDraft((previous) => ({
      ...previous,
      meta: {
        ...previous.meta,
        [key]: value
      }
    }));
  }

  function addSection(level = currentLevel, afterSectionId = selectedSectionId) {
    const newSection = createSection(level);

    setDraft((previous) => {
      const insertIndex = afterSectionId
        ? previous.sections.findIndex((section) => section.id === afterSectionId)
        : -1;

      if (insertIndex < 0) {
        return {
          ...previous,
          sections: [...previous.sections, newSection]
        };
      }

      const sections = [...previous.sections];
      sections.splice(insertIndex + 1, 0, newSection);

      return {
        ...previous,
        sections
      };
    });

    setSelectedSectionId(newSection.id);
  }

  function addLowerSection() {
    const nextLevel = Math.min(currentLevel + 1, 2) as SectionLevel;

    setCurrentLevel(nextLevel);
    addSection(nextLevel);
  }

  function moveSection(sectionId: string, direction: -1 | 1) {
    setDraft((previous) => {
      const index = previous.sections.findIndex((section) => section.id === sectionId);
      const nextIndex = index + direction;

      if (index < 0 || nextIndex < 0 || nextIndex >= previous.sections.length) {
        return previous;
      }

      const sections = [...previous.sections];
      [sections[index], sections[nextIndex]] = [sections[nextIndex], sections[index]];

      return { ...previous, sections };
    });
  }

  function updateSection(sectionId: string, patch: Partial<{ title: string; level: SectionLevel; isNumbered: boolean }>) {
    setDraft((previous) => ({
      ...previous,
      sections: previous.sections.map((section) =>
        section.id === sectionId ? { ...section, ...patch } : section
      )
    }));
  }

  function removeSection(sectionId: string) {
    setDraft((previous) => ({
      ...previous,
      sections: previous.sections.filter((section) => section.id !== sectionId)
    }));
  }

  function toggleSectionCollapse(sectionId: string) {
    setCollapsedSectionIds((previous) =>
      previous.includes(sectionId) ? previous.filter((id) => id !== sectionId) : [...previous, sectionId]
    );
  }

  function collapseAllSections() {
    setCollapsedSectionIds(draft.sections.map((section) => section.id));
  }

  function expandAllSections() {
    setCollapsedSectionIds([]);
  }

  function duplicateSection(sectionId: string) {
    setDraft((previous) => {
      const index = previous.sections.findIndex((section) => section.id === sectionId);
      if (index < 0) return previous;

      const duplicated = cloneSection(previous.sections[index]);
      const sections = [...previous.sections];
      sections.splice(index + 1, 0, duplicated);

      setSelectedSectionId(duplicated.id);

      return {
        ...previous,
        sections
      };
    });
  }

  function insertSectionAfter(sectionId: string, level: SectionLevel) {
    setSelectedSectionId(sectionId);
    addSection(level, sectionId);
  }

  function addBlock(sectionId: string, type: ReportBlock["type"]) {
    setDraft((previous) => {
      const figureIndex =
        previous.sections.reduce(
          (total, section) =>
            total + section.blocks.filter((block) => block.type === "figure").length,
          0
        ) + 1;

      return {
        ...previous,
        sections: previous.sections.map((section) =>
          section.id === sectionId
            ? { ...section, blocks: [...section.blocks, createBlock(type, figureIndex)] }
            : section
        )
      };
    });
  }

  function updateBlock(sectionId: string, blockId: string, updater: (block: ReportBlock) => ReportBlock) {
    setDraft((previous) => ({
      ...previous,
      sections: previous.sections.map((section) => {
        if (section.id !== sectionId) return section;

        return {
          ...section,
          blocks: section.blocks.map((block) => (block.id === blockId ? updater(block) : block))
        };
      })
    }));
  }

  function removeBlock(sectionId: string, blockId: string) {
    setDraft((previous) => ({
      ...previous,
      sections: previous.sections.map((section) =>
        section.id === sectionId
          ? { ...section, blocks: section.blocks.filter((block) => block.id !== blockId) }
          : section
      )
    }));
  }

  function duplicateBlock(sectionId: string, blockId: string) {
    setDraft((previous) => ({
      ...previous,
      sections: previous.sections.map((section) => {
        if (section.id !== sectionId) return section;

        const index = section.blocks.findIndex((block) => block.id === blockId);
        if (index < 0) return section;

        const duplicated = cloneBlock(section.blocks[index]);
        const blocks = [...section.blocks];
        blocks.splice(index + 1, 0, duplicated);

        return {
          ...section,
          blocks
        };
      })
    }));
  }

  function moveBlock(sectionId: string, blockId: string, direction: -1 | 1) {
    setDraft((previous) => ({
      ...previous,
      sections: previous.sections.map((section) => {
        if (section.id !== sectionId) return section;

        const index = section.blocks.findIndex((block) => block.id === blockId);
        const nextIndex = index + direction;

        if (index < 0 || nextIndex < 0 || nextIndex >= section.blocks.length) {
          return section;
        }

        const blocks = [...section.blocks];
        [blocks[index], blocks[nextIndex]] = [blocks[nextIndex], blocks[index]];

        return { ...section, blocks };
      })
    }));
  }

  function updateListItem(
    sectionId: string,
    blockId: string,
    itemId: string,
    patch: Partial<{ label: string; text: string }>
  ) {
    updateBlock(sectionId, blockId, (block) => {
      if (block.type !== "list") return block;

      return {
        ...block,
        items: block.items.map((item) => (item.id === itemId ? { ...item, ...patch } : item))
      };
    });
  }

  function addListItem(sectionId: string, blockId: string) {
    updateBlock(sectionId, blockId, (block) => {
      if (block.type !== "list") return block;

      return {
        ...block,
        items: [...block.items, { id: makeId("item"), label: "", text: "" }]
      };
    });
  }

  function removeListItem(sectionId: string, blockId: string, itemId: string) {
    updateBlock(sectionId, blockId, (block) => {
      if (block.type !== "list") return block;

      return {
        ...block,
        items: block.items.filter((item) => item.id !== itemId)
      };
    });
  }

  function updateGraphSeries(
    sectionId: string,
    blockId: string,
    seriesId: string,
    patch: Partial<Pick<GraphSeries, "label" | "color" | "points">>
  ) {
    updateBlock(sectionId, blockId, (block) => {
      if (block.type !== "graph") return block;

      return {
        ...block,
        series: block.series.map((series) => (series.id === seriesId ? { ...series, ...patch } : series))
      };
    });
  }

  function addGraphSeries(sectionId: string, blockId: string) {
    updateBlock(sectionId, blockId, (block) => {
      if (block.type !== "graph") return block;

      return {
        ...block,
        series: [
          ...block.series,
          {
            id: makeId("series"),
            label: `Серия ${block.series.length + 1}`,
            color: "teal",
            points: "1;10\n2;15\n3;12"
          }
        ]
      };
    });
  }

  function removeGraphSeries(sectionId: string, blockId: string, seriesId: string) {
    updateBlock(sectionId, blockId, (block) => {
      if (block.type !== "graph") return block;
      if (block.series.length <= 1) return block;

      return {
        ...block,
        series: block.series.filter((series) => series.id !== seriesId)
      };
    });
  }

  async function copyTex() {
    try {
      await navigator.clipboard.writeText(tex);
      setCopyStatus("copied");
    } catch {
      setCopyStatus("error");
    }
  }

  function generateTex() {
    setGeneratedSnapshot(tex);
  }

  function downloadTex() {
    const blob = new Blob([tex], { type: "text/x-tex;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "report.tex";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  async function buildPdf() {
    setPdfStatus("building");

    try {
      const response = await fetch("/api/compile-pdf", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          tex,
          draft
        })
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string; details?: string } | null;
        throw new Error(payload?.details || payload?.error || "Компиляция PDF не удалась");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = url;
      link.download = "report.pdf";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      setPdfStatus("done");
    } catch (error) {
      setPdfStatus("error");
      const message =
        error instanceof Error
          ? error.message
          : "Не получилось собрать PDF. Установите pdflatex, например MiKTeX или TeX Live.";
      window.alert(message);
    }
  }

  function downloadCapabilitiesJson() {
    const capabilitiesDraft = createCapabilitiesDraft();
    const payload = {
      app: appName,
      kind: capabilitiesFileKind,
      version: 9,
      draft: capabilitiesDraft,
      generatedAt: new Date().toISOString(),
      purpose: "Редактор отчетов с генерацией LaTeX и локальной сборкой PDF.",
      formats: {
        editable_project: "json",
        latex_export: "tex",
        pdf_export: "pdf"
      },
      titlePageControls: {
        editableTextFields: [
          "ministryLine1",
          "ministryLine2",
          "universityLine1",
          "universityLine2",
          "universityLine3",
          "kafedra",
          "tema",
          "vidRaboty",
          "disciplina",
          "shapkaStroka",
          "studentLabel",
          "rukovoditelLabel",
          "rukovoditelDolzhnost",
          "student",
          "rukovoditel",
          "city",
          "year"
        ],
        fontSizeFields: [
          "titlePageHeaderSize",
          "titlePageUniversitySize",
          "titlePageKafedraSize",
          "titlePageWorkTitleSize",
          "titlePageDisciplineSize",
          "titlePageCodeSize",
          "titlePageSignatureLabelSize",
          "titlePageSignatureNameSize",
          "titlePageSignNoteSize",
          "titlePageFooterSize"
        ],
        fontSizeOptions: ["small", "normalsize", "large", "Large", "LARGE", "huge", "Huge"]
      },
      features: {
        titlePage: true,
        titlePageTemplateEditing: "default university layout with editable text lines and font sizes",
        textInsertPalette: "modal keyboard for formulas, symbols and common LaTeX snippets inside text blocks",
        newcomerTutorial: true,
        headingNumbering: "automatic with optional disable per section",
        sectionInsertion: "after selected section",
        sectionSelection: true,
        sectionCollapse: true,
        sectionCollapseAll: true,
        sectionDuplication: true,
        blockDuplication: true,
        globalSearch: "search across headings and all block content",
        localAutosave: true,
        projectImportExport: true,
        graphPreview: "inline SVG preview in editor before TEX/PDF generation",
        inlineMathInTextBlocks: true,
        tableMathSupport: true,
        tableSizingControl: true,
        tableCellWrapping: true,
        calculationFontSizeControl: true,
        overleafShortcut: true,
        embeddedFigureFiles: true,
        localPdfCompilation: "requires pdflatex / MiKTeX / TeX Live"
      },
      blockTypes: [
        {
          type: "text",
          purpose: "Обычный текст отчета"
        },
        {
          type: "figure",
          purpose: "Внешняя картинка из images/",
          fields: ["filename", "caption", "imageData"],
          filenameRule:
            "Use the file name relative to the images/ folder, for example schema.png or diagrams/er_model.png.",
          localPdfHint:
            "For local PDF compilation attach the image in the figure block so the app can place it into the temporary images/ directory automatically.",
          overleafHint:
            "For Overleaf export keep filename filled and upload the corresponding file into the images/ folder there."
        },
          {
            type: "code",
            displayName: "Код",
            purpose: "Кодовый фрагмент с безопасным verbatim-выводом",
            fields: ["caption", "code"]
          },
          {
            type: "calculation",
            displayName: "Расчёты",
            purpose: "Блок формул и математических вычислений",
            fields: ["caption", "environment", "fontSize", "formula"],
            environmentOptions: [
              "equation*",
              "equation",
              "align*",
              "align",
              "gather*",
              "gather",
              "multline*",
              "multline"
            ],
            fontSizeOptions: ["normalsize", "small", "footnotesize", "scriptsize", "tiny"],
            inlineMathInText:
              "Text blocks support inline formulas via $...$, \\(...\\) and display blocks via \\[...\\].",
            overflowGuidance: [
              "For long single formulas prefer multline* or multline.",
              "For multi-step derivations prefer align* or align and split with \\\\.",
              "If the formula still does not fit, reduce fontSize to small, footnotesize or scriptsize."
            ]
          },
        {
          type: "table",
          purpose: "Таблица из строк и ячеек, разделенных ;",
          fields: ["caption", "cols", "fontSize", "fitToWidth", "wrapCells", "data"],
          fontSizeOptions: ["normalsize", "small", "footnotesize", "scriptsize", "tiny"],
          inlineMathInCells:
            "Table captions and cells support inline formulas via $...$, \\(...\\) and display math via \\[...\\].",
          unicodeMathHint:
            "Inside math delimiters common Unicode symbols like μ, ∩, ≤, α, ∞ are converted to LaTeX automatically.",
          layoutGuidance:
            "Use fontSize to shrink wide tables, fitToWidth=true to scale the whole table to printable page width, and wrapCells=true to enable automatic line wrapping in cells."
        },
        {
          type: "graph",
          purpose: "График через TikZ/PGFPlots",
          fields: ["caption", "title", "xLabel", "yLabel", "mode", "startAtZero", "series"],
          seriesFields: ["label", "color", "points"],
          preview: "inline SVG preview with axes and legend"
        },
        {
          type: "list",
          purpose: "Маркированный или нумерованный список",
          fields: ["ordered", "items"]
        },
        {
          type: "pagebreak",
          purpose: "Разрыв страницы"
        }
      ],
      neuralInstructions: {
        summary:
          "Если этот JSON отправляется в нейросеть, она должна понимать структуру приложения и помогать заполнять разделы, блоки, графики и титульный лист без нарушения схемы.",
        recommendedWorkflow: [
          "Сначала использовать AI-чат для черновой структуры и содержания",
          "Потом сгенерировать и импортировать .json проекта",
          "После этого доправить документ в редакторе и собрать TEX или PDF"
        ],
        formulaGuidance: [
          "Inline formulas inside text blocks must be wrapped with $...$.",
          "Use the text-block insert palette when you need formulas, greek letters, set symbols or ready-made LaTeX snippets.",
          "Long formulas should use multline* or align* instead of a single long equation line.",
          "Use the calculation fontSize field when a formula is slightly wider than the printable area."
        ],
        tableGuidance: [
          "Table cells may contain inline math like $\\mu_A(x)$ or $X \\cap Y$.",
          "Use semicolon ; only as a cell separator, not inside the formula text unless escaped or rewritten.",
          "For wide tables, reduce fontSize, enable fitToWidth, or turn on wrapCells for automatic line wrapping."
        ],
        titlePageGuidance: [
          "The default title page layout should be preserved unless the user asks for a custom composition.",
          "The main title page text lines are editable through meta.ministryLine1, meta.ministryLine2, meta.universityLine1, meta.universityLine2 and meta.universityLine3.",
          "Font sizing for title-page zones is controlled by titlePageHeaderSize, titlePageUniversitySize, titlePageKafedraSize, titlePageWorkTitleSize, titlePageDisciplineSize, titlePageCodeSize, titlePageSignatureLabelSize, titlePageSignatureNameSize, titlePageSignNoteSize and titlePageFooterSize."
        ],
        onboarding: [
          "1. Use an AI chat to draft the work.",
          "2. Give the AI the capabilities.json file so it understands the editor schema.",
          "3. Ask the AI for a .json project file and import it into the editor.",
          "4. Polish the draft, export .tex and continue in Overleaf when needed."
        ]
      }
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json;charset=utf-8"
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "tex-bostoncrew-ru-capabilities.json";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  function downloadDraftProject() {
    const payload = {
      app: projectFileApp,
      kind: projectFileKind,
      version: projectFileVersion,
      savedAt: new Date().toISOString(),
      draft
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json;charset=utf-8"
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const date = new Date().toISOString().slice(0, 10);

    link.href = url;
    link.download = `tex-bostoncrew-project-${date}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setProjectStatus("saved");
  }

  async function uploadDraftProject(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;

    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as unknown;
      const importedDraft = extractDraftFromProjectFile(parsed);

      if (!importedDraft && isCapabilitiesExportFile(parsed)) {
        setProjectStatus("error");
        window.alert(
          "Это не файл проекта, а описание возможностей приложения для нейронки. Его не нужно загружать в редактор. Для загрузки используйте файл из кнопки «Сохранить проект»."
        );
        return;
      }

      if (!importedDraft) {
        throw new Error("Invalid project file");
      }

      if (!window.confirm("Загрузить проект из файла? Текущий черновик будет заменён.")) return;

      const normalizedDraft = normalizeDraft(importedDraft);
      setDraft(normalizedDraft);
      setCurrentLevel(0);
      setSelectedSectionId(normalizedDraft.sections[0]?.id ?? null);
      setGeneratedSnapshot("");
      setProjectStatus("loaded");
    } catch {
      setProjectStatus("error");
      window.alert("Не получилось загрузить проект. Проверьте, что выбран JSON-файл этого редактора.");
    }
  }

  function loadExample() {
    if (!window.confirm("Загрузить пример? Текущий черновик будет заменён.")) return;
    const exampleDraft = createExampleDraft();
    setDraft(exampleDraft);
    setCurrentLevel(0);
    setSelectedSectionId(exampleDraft.sections[0]?.id ?? null);
  }

  function clearDraft() {
    if (!window.confirm("Очистить весь черновик?")) return;
    const initialDraft = createInitialDraft();
    setDraft(initialDraft);
    setCurrentLevel(0);
    setSelectedSectionId(initialDraft.sections[0]?.id ?? null);
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">&gt; ascii report shell</p>
          <h1>{appName}</h1>
          <p className="subtitle">Редактор отчётов и .tex без лишнего шума.</p>
        </div>
        <div className="topbar-actions">
          <button className="button primary" type="button" onClick={generateTex}>
            {generatedSnapshot ? "Обновить .tex" : "Сгенерировать .tex"}
          </button>
          <button className="button ghost" type="button" onClick={downloadDraftProject}>
            {projectStatus === "saved" ? "Проект сохранён" : "Сохранить проект"}
          </button>
          <button className="button ghost" type="button" onClick={downloadCapabilitiesJson}>
            Скачать capabilities.json
          </button>
          <button className="button ghost" type="button" onClick={() => projectInputRef.current?.click()}>
            {projectStatus === "loaded"
              ? "Проект загружен"
              : projectStatus === "error"
                ? "Ошибка загрузки"
                : "Загрузить проект"}
          </button>
          <input
            ref={projectInputRef}
            accept="application/json,.json"
            hidden
            type="file"
            onChange={uploadDraftProject}
          />
          <button className="button ghost" type="button" onClick={loadExample}>
            Загрузить пример
          </button>
          <button className="button ghost" type="button" onClick={copyTex}>
            {copyStatus === "copied" ? "Скопировано" : copyStatus === "error" ? "Не скопировалось" : "Скопировать .tex"}
          </button>
          <a className="button ghost" href="https://www.overleaf.com/project" rel="noreferrer" target="_blank">
            Открыть Overleaf
          </a>
          <button className="button primary" type="button" onClick={buildPdf}>
            {pdfStatus === "building"
              ? "Собираю PDF..."
              : pdfStatus === "done"
                ? "PDF готов"
                : pdfStatus === "error"
                  ? "Ошибка PDF"
                  : "Скачать PDF"}
          </button>
          <button className="button primary alt" type="button" onClick={downloadTex}>
            Скачать .tex
          </button>
        </div>
      </header>

      <details className="guide-panel">
        <summary>
          <span>Как начать</span>
          <small>4 шага для новичка</small>
        </summary>
        <ol className="guide-list">
          <li>Используй AI-чат, чтобы набросать структуру и содержание работы.</li>
          <li>Передай чату `capabilities.json`, чтобы он понял правила JSON и блоков.</li>
          <li>Попроси у чата готовый `.json` проекта и загрузи его сюда.</li>
          <li>Подправь документ, собери `.tex` и переходи в Overleaf.</li>
        </ol>
      </details>

      <section className="summary-band" aria-label="Сводка">
        <div>
          <span>{draft.sections.length}</span>
          <p>разделов</p>
        </div>
        <div>
          <span>{blockCount}</span>
          <p>блоков</p>
        </div>
        <div>
          <span>{currentLevel}</span>
          <p>текущий уровень</p>
        </div>
        <div>
          <span>{tex.length.toLocaleString("ru-RU")}</span>
          <p>символов .tex</p>
        </div>
      </section>

      <details className="meta-panel" open>
        <summary>
          <span>Титульник</span>
          <small>шаблон + поля</small>
        </summary>
        <div className="meta-grid">
          {metaFields.map((field) => (
            <label className={field.wide ? "field wide" : "field"} key={field.key}>
              <span>{field.label}</span>
              <input
                type={field.type || "text"}
                value={String(draft.meta[field.key])}
                onChange={(event) => updateMeta(field.key, event.target.value)}
              />
            </label>
          ))}
          <div className="meta-subsection wide">
            <div className="meta-subsection-header">
              <strong>Гибкий шаблон титульника</strong>
              <p>
                По умолчанию остаётся ваш университетский макет. Ниже можно менять строки шапки и размеры отдельных
                зон без ручной правки LaTeX.
              </p>
            </div>
            <div className="meta-subgrid">
              {titlePageTextFields.map((field) => (
                <label className={field.wide ? "field wide" : "field"} key={field.key}>
                  <span>{field.label}</span>
                  <input
                    type="text"
                    value={String(draft.meta[field.key])}
                    onChange={(event) => updateMeta(field.key, event.target.value)}
                  />
                </label>
              ))}
              {titlePageSizeFields.map((field) => (
                <label className="field" key={field.key}>
                  <span>{field.label}</span>
                  <select
                    value={draft.meta[field.key]}
                    onChange={(event) => updateMeta(field.key, event.target.value as TitlePageFontSize)}
                  >
                    {Object.entries(titlePageSizeLabels).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label} ({value})
                      </option>
                    ))}
                  </select>
                </label>
              ))}
            </div>
          </div>
          <label className="toggle-field wide">
            <input
              type="checkbox"
              checked={draft.meta.includeToc}
              onChange={(event) => updateMeta("includeToc", event.target.checked)}
            />
            <span>Добавить оглавление и строки `\addcontentsline` для разделов</span>
          </label>
        </div>
      </details>

      <section className="workspace" aria-label="Редактор отчёта">
        <aside className="side-panel">
          <div className="side-panel-inner">
            <h2>Разделы</h2>
            <p>Новые разделы вставляются после выбранного.</p>

            <label className="field search-field">
              <span>Глобальный поиск</span>
              <input
                type="text"
                placeholder="Заголовок, текст, код, расчёты, таблица, график..."
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
              />
            </label>
            <p className="search-hint">
              {searchQuery.trim()
                ? `Найдено разделов: ${filteredSections.length} из ${draft.sections.length}`
                : "Поиск по заголовкам и содержимому."}
            </p>

            <div className="level-picker" role="group" aria-label="Текущий уровень раздела">
              {([0, 1, 2] as SectionLevel[]).map((level) => (
                <button
                  className={currentLevel === level ? "level active" : "level"}
                  key={level}
                  type="button"
                  onClick={() => setCurrentLevel(level)}
                >
                  {level}
                  <span>{levelLabels[level]}</span>
                </button>
              ))}
            </div>

            <div className="side-actions">
              <button className="button primary full" type="button" onClick={() => addSection()}>
                {selectedSectionId ? "Добавить раздел после выбранного" : "Добавить раздел"}
              </button>
              <button className="button ghost full" type="button" onClick={addLowerSection}>
                {selectedSectionId ? "Добавить уровнем ниже после выбранного" : "Добавить уровнем ниже"}
              </button>
              <button
                className="button ghost full"
                type="button"
                onClick={() => setCurrentLevel((level) => Math.max(level - 1, 0) as SectionLevel)}
              >
                Подняться уровнем выше
              </button>
              <button className="button ghost full" type="button" onClick={collapseAllSections}>
                Свернуть все
              </button>
              <button className="button ghost full" type="button" onClick={expandAllSections}>
                Развернуть все
              </button>
              <button className="button danger full" type="button" onClick={clearDraft}>
                Очистить черновик
              </button>
            </div>

            <nav className="section-jump" aria-label="Навигация по разделам">
              {filteredSections.map((section, index) => (
                <a
                  className={`jump level-${section.level} ${selectedSectionId === section.id ? "active" : ""}`}
                  href={`#${section.id}`}
                  key={section.id}
                  onClick={() => setSelectedSectionId(section.id)}
                >
                  {sectionDisplayInfo[section.id]?.fullTitle || section.title || `Раздел ${index + 1}`}
                </a>
              ))}
            </nav>
          </div>
        </aside>

        <div className="editor-flow">
          {draft.sections.length === 0 ? (
            <div className="empty-state">
              <h2>Разделов пока нет</h2>
              <p>Добавьте первый раздел, а потом наполняйте его текстом, кодом, расчётами, таблицами и рисунками.</p>
            </div>
          ) : filteredSections.length === 0 ? (
            <div className="empty-state">
              <h2>Ничего не найдено</h2>
              <p>Попробуйте другой запрос. Поиск смотрит и в заголовки, и внутрь блоков.</p>
            </div>
          ) : (
            filteredSections.map((section, sectionIndex) => {
              const isCollapsed = !searchQuery.trim() && collapsedSectionIds.includes(section.id);

              return (
                <article
                  className={`section-panel level-${section.level} ${selectedSectionId === section.id ? "selected" : ""} ${isCollapsed ? "collapsed" : ""}`}
                  id={section.id}
                  key={section.id}
                  onClick={() => setSelectedSectionId(section.id)}
                >
                <div className="section-head">
                  <div className="section-title-row">
                    <span className="section-number">
                      {sectionDisplayInfo[section.id]?.numberingLabel || "∅"}
                    </span>
                    <label className="field title-field">
                      <span>
                        {section.level === 0 ? "Заголовок раздела" : "Подзаголовок"}
                        {sectionDisplayInfo[section.id]?.numberingLabel
                          ? ` · ${sectionDisplayInfo[section.id].numberingLabel}`
                          : " · без номера"}
                      </span>
                      <input
                        type="text"
                        value={section.title}
                        onChange={(event) => updateSection(section.id, { title: event.target.value })}
                      />
                    </label>
                    <label className="field level-field">
                      <span>Уровень</span>
                      <select
                        value={section.level}
                        onChange={(event) =>
                          updateSection(section.id, { level: Number(event.target.value) as SectionLevel })
                        }
                      >
                        <option value={0}>0 - section</option>
                        <option value={1}>1 - subsection</option>
                        <option value={2}>2 - subsubsection</option>
                      </select>
                    </label>
                    <label className="toggle-field section-toggle">
                      <input
                        type="checkbox"
                        checked={!section.isNumbered}
                        onChange={(event) => updateSection(section.id, { isNumbered: !event.target.checked })}
                      />
                      <span>Убрать номер заголовка</span>
                    </label>
                  </div>

                  <div className="section-tools">
                    <button
                      className="mini-button"
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        insertSectionAfter(section.id, section.level);
                      }}
                    >
                      + После
                    </button>
                    <button
                      className="mini-button"
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        insertSectionAfter(section.id, Math.min(section.level + 1, 2) as SectionLevel);
                      }}
                    >
                      + Ниже
                    </button>
                    <button className="mini-button" type="button" onClick={() => duplicateSection(section.id)}>
                      Дубль
                    </button>
                    <button
                      className="mini-button"
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        toggleSectionCollapse(section.id);
                      }}
                    >
                      {isCollapsed ? "Развернуть" : "Свернуть"}
                    </button>
                    <button className="mini-button" type="button" onClick={() => moveSection(section.id, -1)}>
                      Вверх
                    </button>
                    <button className="mini-button" type="button" onClick={() => moveSection(section.id, 1)}>
                      Вниз
                    </button>
                    <button className="mini-button danger-text" type="button" onClick={() => removeSection(section.id)}>
                      Удалить
                    </button>
                  </div>
                </div>
                {!isCollapsed && <div className="block-toolbar">
                  {(["text", "figure", "code", "calculation", "table", "graph", "list", "pagebreak"] as ReportBlock["type"][]).map(
                    (type) => (
                      <button className="chip-button" key={type} type="button" onClick={() => addBlock(section.id, type)}>
                        + {blockLabels[type]}
                      </button>
                    )
                  )}
                </div>}

                {isCollapsed ? (
                  <div className="section-collapsed-summary">
                    <span>{section.blocks.length} блоков</span>
                    <span>{section.level === 0 ? "Раздел" : section.level === 1 ? "Подраздел" : "Подпункт"}</span>
                  </div>
                ) : (
                <div className="blocks">
                  {section.blocks.length === 0 ? (
                    <p className="block-empty">В разделе ещё нет блоков. Добавьте текст, рисунок, код, расчёты или таблицу.</p>
                  ) : (
                    section.blocks.map((block, blockIndex) => (
                      <BlockEditor
                        block={block}
                        blockIndex={blockIndex}
                        key={block.id}
                        onAddListItem={() => addListItem(section.id, block.id)}
                        onMoveDown={() => moveBlock(section.id, block.id, 1)}
                        onMoveUp={() => moveBlock(section.id, block.id, -1)}
                        onRemove={() => removeBlock(section.id, block.id)}
                        onAddGraphSeries={() => addGraphSeries(section.id, block.id)}
                        onDuplicate={() => duplicateBlock(section.id, block.id)}
                        onRemoveGraphSeries={(seriesId) => removeGraphSeries(section.id, block.id, seriesId)}
                        onRemoveListItem={(itemId) => removeListItem(section.id, block.id, itemId)}
                        onUpdate={(updater) => updateBlock(section.id, block.id, updater)}
                        onUpdateGraphSeries={(seriesId, patch) => updateGraphSeries(section.id, block.id, seriesId, patch)}
                        onUpdateListItem={(itemId, patch) => updateListItem(section.id, block.id, itemId, patch)}
                      />
                    ))
                  )}
                </div>
                )}
              </article>
            );
            })
          )}
        </div>
      </section>

      <section className="tex-panel" aria-label="LaTeX результат">
        <div className="tex-head">
          <div>
            <h2>.tex результат</h2>
            <p>
              Полный файл обновляется автоматически. Нажмите генерацию, скопируйте `.tex` и откройте{" "}
              <a href="https://www.overleaf.com/project" rel="noreferrer" target="_blank">
                Overleaf
              </a>
              , чтобы вставить его в новый проект.
            </p>
            <span className={isTexDirty ? "tex-state dirty" : "tex-state"}>
              {generatedSnapshot
                ? isTexDirty
                  ? "После последней генерации есть изменения"
                  : "Текущая версия .tex сгенерирована"
                : "Файл ещё не генерировали в этой сессии"}
            </span>
          </div>
          <div className="tex-actions">
            <button className="button primary" type="button" onClick={generateTex}>
              {generatedSnapshot ? "Обновить .tex" : "Сгенерировать .tex"}
            </button>
            <button className="button ghost" type="button" onClick={copyTex}>
              {copyStatus === "copied" ? "Скопировано" : copyStatus === "error" ? "Не скопировалось" : "Скопировать"}
            </button>
            <a className="button ghost" href="https://www.overleaf.com/project" rel="noreferrer" target="_blank">
              Overleaf
            </a>
            <button className="button primary alt" type="button" onClick={downloadTex}>
              Скачать
            </button>
          </div>
        </div>
        <textarea className="tex-output" spellCheck={false} value={tex} readOnly />
      </section>
    </main>
  );
}

function buildSectionSearchText(section: ReportSection, fullTitle: string) {
  const blockText = section.blocks.map((block) => getBlockSearchText(block)).join(" ");

  return `${fullTitle} ${section.title} ${blockText}`.toLowerCase();
}

function getBlockSearchText(block: ReportBlock) {
  switch (block.type) {
    case "text":
      return block.content;
    case "figure":
      return `${block.filename} ${block.caption}`;
    case "code":
      return `${block.caption} ${block.code}`;
    case "calculation":
      return `${block.caption} ${block.environment} ${block.fontSize} ${block.formula}`;
    case "table":
      return `${block.caption} ${block.cols} ${block.fontSize} ${block.fitToWidth} ${block.wrapCells} ${block.data}`;
    case "graph":
      return `${block.caption} ${block.title} ${block.xLabel} ${block.yLabel} ${block.mode} ${block.series
        .map((series) => `${series.label} ${series.color} ${series.points}`)
        .join(" ")}`;
    case "list":
      return block.items.map((item) => `${item.label} ${item.text}`).join(" ");
    case "pagebreak":
      return "clearpage pagebreak";
    default:
      return "";
  }
}

function createAutosaveDraft(draft: ReportDraft): ReportDraft {
  return {
    ...draft,
    sections: draft.sections.map((section) => ({
      ...section,
      blocks: section.blocks.map((block) =>
        block.type === "figure" && block.imageData ? { ...block, imageData: "" } : block
      )
    }))
  };
}

function isQuotaExceededError(error: unknown) {
  return (
    error instanceof DOMException &&
    (error.name === "QuotaExceededError" || error.name === "NS_ERROR_DOM_QUOTA_REACHED" || error.code === 22)
  );
}

function parseGraphPreviewPoints(points: string) {
  return points
    .split("\n")
    .map((row) => row.trim())
    .filter(Boolean)
    .map((row) => {
      const [x = "", y = ""] = row.split(";");
      const xRaw = x.trim();
      const yValue = Number(y.trim().replace(",", "."));
      const xNumeric = /^-?\d+(?:[.,]\d+)?$/.test(xRaw) ? Number(xRaw.replace(",", ".")) : null;

      return {
        xRaw,
        xNumeric,
        y: Number.isFinite(yValue) ? yValue : null
      };
    })
    .filter((point) => point.xRaw && point.y !== null) as Array<{
    xRaw: string;
    xNumeric: number | null;
    y: number;
  }>;
}

function resolveGraphPreviewColor(color: string) {
  return graphPreviewColors[color] ?? color ?? "#ffae57";
}

function formatAxisTick(value: number) {
  if (Math.abs(value) >= 100 || Number.isInteger(value)) {
    return String(Math.round(value * 100) / 100);
  }

  return value.toFixed(2).replace(/\.?0+$/, "");
}

function extractDraftFromProjectFile(value: unknown): ReportDraft | null {
  if (isReportDraft(value)) {
    return value;
  }

  if (isRecord(value) && isReportDraft(value.draft)) {
    return value.draft;
  }

  return null;
}

function isCapabilitiesExportFile(value: unknown) {
  if (!isRecord(value)) {
    return false;
  }

  if (value.kind === capabilitiesFileKind) {
    return true;
  }

  return (
    typeof value.app === "string" &&
    legacyAppNames.includes(value.app) &&
    isRecord(value.features) &&
    Array.isArray(value.blockTypes) &&
    isRecord(value.neuralInstructions)
  );
}

function isReportDraft(value: unknown): value is ReportDraft {
  if (!isRecord(value) || !isRecord(value.meta) || !Array.isArray(value.sections)) {
    return false;
  }

  return value.sections.every((section) => {
    if (!isRecord(section) || typeof section.id !== "string" || typeof section.title !== "string") {
      return false;
    }

    if (![0, 1, 2].includes(Number(section.level)) || !Array.isArray(section.blocks)) {
      return false;
    }

    return section.blocks.every((block) => isRecord(block) && typeof block.id === "string" && typeof block.type === "string");
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function GraphPreview({ block }: { block: GraphBlock }) {
  const width = 760;
  const height = 320;
  const padding = { top: 24, right: 22, bottom: 56, left: 58 };
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;

  const parsedSeries = block.series
    .map((series) => ({
      ...series,
      color: resolveGraphPreviewColor(series.color),
      points: parseGraphPreviewPoints(series.points)
    }))
    .filter((series) => series.points.length > 0);

  if (parsedSeries.length === 0) {
    return <div className="graph-preview-empty">Добавьте хотя бы одну корректную точку в формате `X;Y`.</div>;
  }

  const allPoints = parsedSeries.flatMap((series) => series.points);
  const isNumericX = allPoints.every((point) => point.xNumeric !== null);
  const categories = Array.from(new Set(allPoints.map((point) => point.xRaw)));
  const orderedSeries = parsedSeries.map((series) => ({
    ...series,
    points: [...series.points].sort((left, right) => {
      if (!isNumericX) {
        return categories.indexOf(left.xRaw) - categories.indexOf(right.xRaw);
      }

      return (left.xNumeric ?? 0) - (right.xNumeric ?? 0);
    })
  }));

  const xNumbers = isNumericX ? allPoints.map((point) => point.xNumeric ?? 0) : [];
  let xMin = isNumericX ? Math.min(...xNumbers) : 0;
  let xMax = isNumericX ? Math.max(...xNumbers) : Math.max(categories.length - 1, 1);

  if (block.startAtZero && isNumericX) {
    xMin = Math.min(0, xMin);
  }

  if (xMin === xMax) {
    xMin -= 1;
    xMax += 1;
  }

  const yNumbers = allPoints.map((point) => point.y);
  let yMin = block.startAtZero ? 0 : Math.min(...yNumbers);
  let yMax = Math.max(...yNumbers);

  if (yMin === yMax) {
    yMax += Math.max(Math.abs(yMax) * 0.15, 1);
    if (!block.startAtZero) {
      yMin -= Math.max(Math.abs(yMin) * 0.15, 1);
    }
  } else {
    const yPadding = (yMax - yMin) * 0.08;
    yMax += yPadding;
    if (!block.startAtZero) {
      yMin -= yPadding * 0.35;
    }
  }

  const baselineValue = yMin <= 0 && yMax >= 0 ? 0 : yMin;
  const scaleX = (value: number) => padding.left + ((value - xMin) / (xMax - xMin)) * plotWidth;
  const scaleY = (value: number) => padding.top + (1 - (value - yMin) / (yMax - yMin)) * plotHeight;
  const categoryStep = categories.length > 1 ? plotWidth / (categories.length - 1) : 0;
  const scaleCategoryX = (index: number) =>
    categories.length <= 1 ? padding.left + plotWidth / 2 : padding.left + categoryStep * index;

  const yTicks = Array.from({ length: 5 }, (_, index) => yMin + ((yMax - yMin) * index) / 4);
  const xTicks = isNumericX
    ? Array.from({ length: 5 }, (_, index) => {
        const value = xMin + ((xMax - xMin) * index) / 4;
        return {
          key: `tick-${index}`,
          label: formatAxisTick(value),
          x: scaleX(value)
        };
      })
    : categories.map((category, index) => ({
        key: category,
        label: category,
        x: scaleCategoryX(index)
      }));

  const barGroupWidth = Math.min(84, plotWidth / Math.max(categories.length, 1) * 0.72);
  const barWidth = Math.max((barGroupWidth - 8) / Math.max(orderedSeries.length, 1), 10);
  const baselineY = scaleY(baselineValue);

  return (
    <div className="graph-preview">
      <div className="graph-preview-meta">
        <strong>Предпросмотр графика</strong>
        <span>
          Серий: {orderedSeries.length} · Точек: {allPoints.length}
        </span>
      </div>

      <div className="graph-preview-frame">
        <svg aria-label="Предпросмотр графика" className="graph-preview-svg" role="img" viewBox={`0 0 ${width} ${height}`}>
          {yTicks.map((tick, index) => {
            const y = scaleY(tick);

            return (
              <g key={`y-${index}`}>
                <line className="graph-grid-line" x1={padding.left} x2={width - padding.right} y1={y} y2={y} />
                <text className="graph-axis-label" textAnchor="end" x={padding.left - 10} y={y + 4}>
                  {formatAxisTick(tick)}
                </text>
              </g>
            );
          })}

          {xTicks.map((tick) => (
            <g key={tick.key}>
              <line className="graph-grid-line vertical" x1={tick.x} x2={tick.x} y1={padding.top} y2={height - padding.bottom} />
              <text className="graph-axis-label" textAnchor="middle" x={tick.x} y={height - padding.bottom + 24}>
                {tick.label}
              </text>
            </g>
          ))}

          <line className="graph-axis-line" x1={padding.left} x2={width - padding.right} y1={baselineY} y2={baselineY} />
          <line className="graph-axis-line" x1={padding.left} x2={padding.left} y1={padding.top} y2={height - padding.bottom} />

          {orderedSeries.map((series, seriesIndex) => {
            if (block.mode === "bar") {
              return (
                <g key={series.id}>
                  {series.points.map((point) => {
                    const categoryIndex = categories.indexOf(point.xRaw);
                    const groupCenter = scaleCategoryX(categoryIndex);
                    const x =
                      groupCenter -
                      barGroupWidth / 2 +
                      seriesIndex * barWidth +
                      Math.max((barGroupWidth - barWidth * orderedSeries.length) / 2, 0);
                    const y = scaleY(point.y);
                    const rectHeight = Math.max(Math.abs(baselineY - y), 1);

                    return (
                      <rect
                        key={`${series.id}-${point.xRaw}-${point.y}`}
                        fill={series.color}
                        opacity="0.82"
                        rx="4"
                        ry="4"
                        stroke={series.color}
                        x={x}
                        y={Math.min(y, baselineY)}
                        width={barWidth - 3}
                        height={rectHeight}
                      />
                    );
                  })}
                </g>
              );
            }

            const coordinates = series.points.map((point) => {
              const x = isNumericX ? scaleX(point.xNumeric ?? 0) : scaleCategoryX(categories.indexOf(point.xRaw));
              const y = scaleY(point.y);

              return { x, y, key: `${series.id}-${point.xRaw}-${point.y}` };
            });

            const path = coordinates
              .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`)
              .join(" ");

            return (
              <g key={series.id}>
                <path className="graph-series-line" d={path} stroke={series.color} />
                {coordinates.map((point) => (
                  <circle
                    key={point.key}
                    className="graph-series-point"
                    cx={point.x}
                    cy={point.y}
                    fill={series.color}
                    r="4.5"
                  />
                ))}
              </g>
            );
          })}

          {block.title.trim() ? (
            <text className="graph-title" textAnchor="middle" x={width / 2} y={14}>
              {block.title}
            </text>
          ) : null}

          {block.xLabel.trim() ? (
            <text className="graph-axis-title" textAnchor="middle" x={width / 2} y={height - 12}>
              {block.xLabel}
            </text>
          ) : null}

          {block.yLabel.trim() ? (
            <text
              className="graph-axis-title"
              textAnchor="middle"
              transform={`translate(18 ${height / 2}) rotate(-90)`}
            >
              {block.yLabel}
            </text>
          ) : null}
        </svg>
      </div>

      <div className="graph-legend">
        {orderedSeries.map((series, index) => (
          <span className="graph-legend-item" key={series.id}>
            <span className="graph-legend-swatch" style={{ backgroundColor: series.color }} />
            {series.label.trim() || `Серия ${index + 1}`}
          </span>
        ))}
      </div>
    </div>
  );
}

function BlockEditor({
  onAddGraphSeries,
  block,
  blockIndex,
  onAddListItem,
  onDuplicate,
  onMoveDown,
  onMoveUp,
  onRemove,
  onRemoveGraphSeries,
  onRemoveListItem,
  onUpdate,
  onUpdateGraphSeries,
  onUpdateListItem
}: {
  onAddGraphSeries: () => void;
  block: ReportBlock;
  blockIndex: number;
  onAddListItem: () => void;
  onDuplicate: () => void;
  onMoveDown: () => void;
  onMoveUp: () => void;
  onRemove: () => void;
  onRemoveGraphSeries: (seriesId: string) => void;
  onRemoveListItem: (itemId: string) => void;
  onUpdate: (updater: (block: ReportBlock) => ReportBlock) => void;
  onUpdateGraphSeries: (seriesId: string, patch: Partial<Pick<GraphSeries, "label" | "color" | "points">>) => void;
  onUpdateListItem: (itemId: string, patch: Partial<{ label: string; text: string }>) => void;
}) {
  const calculationTextareaRef = useRef<HTMLTextAreaElement>(null);
  const figureFileInputRef = useRef<HTMLInputElement>(null);
  const textTextareaRef = useRef<HTMLTextAreaElement>(null);
  const [isTextInsertOpen, setIsTextInsertOpen] = useState(false);

  function insertCalculationTemplate(template: string) {
    if (block.type !== "calculation") return;

    const textarea = calculationTextareaRef.current;
    const marker = "__CURSOR__";
    const insertion = template.replace(marker, "");
    const selectionStart = textarea?.selectionStart ?? block.formula.length;
    const selectionEnd = textarea?.selectionEnd ?? block.formula.length;
    const nextFormula =
      block.formula.slice(0, selectionStart) + insertion + block.formula.slice(selectionEnd);

    onUpdate((current) =>
      current.type === "calculation" ? { ...current, formula: nextFormula } : current
    );

    window.requestAnimationFrame(() => {
      if (!textarea) return;
      const cursorOffset = template.includes(marker) ? template.indexOf(marker) : insertion.length;
      const cursorPosition = selectionStart + Math.max(cursorOffset, 0);
      textarea.focus();
      textarea.setSelectionRange(cursorPosition, cursorPosition);
    });
  }

  function insertTextTemplate(template: string) {
    if (block.type !== "text") return;

    const textarea = textTextareaRef.current;
    const marker = "__CURSOR__";
    const selectionStart = textarea?.selectionStart ?? block.content.length;
    const selectionEnd = textarea?.selectionEnd ?? block.content.length;
    const insertion = template.replace(marker, "");
    const nextContent = block.content.slice(0, selectionStart) + insertion + block.content.slice(selectionEnd);

    onUpdate((current) => (current.type === "text" ? { ...current, content: nextContent } : current));

    window.requestAnimationFrame(() => {
      if (!textarea) return;
      const cursorOffset = template.includes(marker) ? template.indexOf(marker) : insertion.length;
      const cursorPosition = selectionStart + Math.max(cursorOffset, 0);
      textarea.focus();
      textarea.setSelectionRange(cursorPosition, cursorPosition);
    });
  }

  function handleFigureFileChange(event: ChangeEvent<HTMLInputElement>) {
    if (block.type !== "figure") return;

    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const imageData = typeof reader.result === "string" ? reader.result : "";

      onUpdate((current) =>
        current.type === "figure"
          ? {
              ...current,
              filename: file.name,
              imageData
            }
          : current
      );
    };
    reader.readAsDataURL(file);
    event.target.value = "";
  }

  return (
    <div className={`block-editor type-${block.type}`}>
      <div className="block-head">
        <div>
          <span className="block-index">Блок {blockIndex + 1}</span>
          <h3>{blockLabels[block.type]}</h3>
        </div>
        <div className="block-actions">
          <button className="mini-button" type="button" onClick={onDuplicate}>
            Дубль
          </button>
          <button className="mini-button" type="button" onClick={onMoveUp}>
            Вверх
          </button>
          <button className="mini-button" type="button" onClick={onMoveDown}>
            Вниз
          </button>
          <button className="mini-button danger-text" type="button" onClick={onRemove}>
            Удалить
          </button>
        </div>
      </div>

      {block.type === "text" && (
        <>
          <div className="text-tools">
            <button className="chip-button" type="button" onClick={() => setIsTextInsertOpen(true)}>
              Вставки
            </button>
            <span className="inline-note">Формулы, символы и шпаргалка.</span>
          </div>
          <label className="field">
            <span>Текст</span>
            <textarea
              ref={textTextareaRef}
              className="large-textarea"
              placeholder="Основной текст раздела."
              value={(block as TextBlock).content}
              onChange={(event) =>
                onUpdate((current) =>
                  current.type === "text" ? { ...current, content: event.target.value } : current
                )
              }
            />
          </label>
          <p className="inline-note">Поддерживаются `$...$`, `\\(...\\)` и `\\[...\\]`.</p>
          {isTextInsertOpen ? (
            <div className="overlay-backdrop" onClick={() => setIsTextInsertOpen(false)}>
              <div
                aria-modal="true"
                className="insert-modal"
                role="dialog"
                onClick={(event) => event.stopPropagation()}
              >
                <div className="insert-modal-head">
                  <div>
                    <strong>Вставки в текст</strong>
                    <p>Вставка идёт в место курсора.</p>
                  </div>
                  <button className="mini-button" type="button" onClick={() => setIsTextInsertOpen(false)}>
                    Закрыть
                  </button>
                </div>
                <div className="insert-groups">
                  {textInsertGroups.map((group) => (
                    <section className="insert-group" key={group.title}>
                      <strong>{group.title}</strong>
                      <div className="insert-chips">
                        {group.items.map((item) => (
                          <button
                            className="chip-button"
                            key={`${group.title}-${item.label}`}
                            type="button"
                            onClick={() => insertTextTemplate(item.template)}
                          >
                            {item.label}
                          </button>
                        ))}
                      </div>
                    </section>
                  ))}
                </div>
              </div>
            </div>
          ) : null}
        </>
      )}

      {block.type === "figure" && (
        <div className="block-grid">
          <label className="field">
            <span>Имя файла в папке images</span>
            <input
              type="text"
              value={(block as FigureBlock).filename}
              onChange={(event) =>
                onUpdate((current) =>
                  current.type === "figure" ? { ...current, filename: event.target.value } : current
                )
              }
            />
          </label>
          <label className="field">
            <span>Подпись к рисунку</span>
            <input
              type="text"
              value={(block as FigureBlock).caption}
              onChange={(event) =>
                onUpdate((current) =>
                  current.type === "figure" ? { ...current, caption: event.target.value } : current
                )
              }
            />
          </label>
          <p className="inline-note">Файл положите рядом с `.tex` в папку `images/`.</p>
        </div>
      )}

      {block.type === "figure" && (
        <>
          <div className="text-tools">
            <button className="chip-button" type="button" onClick={() => figureFileInputRef.current?.click()}>
              Прикрепить картинку
            </button>
            {(block as FigureBlock).imageData ? (
              <button
                className="chip-button"
                type="button"
                onClick={() =>
                  onUpdate((current) => (current.type === "figure" ? { ...current, imageData: "" } : current))
                }
              >
                Убрать вложение
              </button>
            ) : null}
            <input
              ref={figureFileInputRef}
              accept="image/*"
              hidden
              type="file"
              onChange={handleFigureFileChange}
            />
          </div>
          <p className="inline-note">
            {(block as FigureBlock).imageData
              ? `Локальная копия прикреплена: ${(block as FigureBlock).filename}`
              : "Для локальной PDF-сборки прикрепите файл здесь. Для Overleaf можно просто указать имя и загрузить картинку в images/."}
          </p>
        </>
      )}

      {block.type === "code" && (
        <>
          <label className="field">
            <span>Подпись к коду</span>
            <input
              type="text"
              value={(block as CodeBlock).caption}
              onChange={(event) =>
                onUpdate((current) =>
                  current.type === "code" ? { ...current, caption: event.target.value } : current
                )
              }
            />
          </label>
          <label className="field">
            <span>Код</span>
            <textarea
              className="code-textarea"
              placeholder="Код."
              value={(block as CodeBlock).code}
              onChange={(event) =>
                onUpdate((current) => (current.type === "code" ? { ...current, code: event.target.value } : current))
              }
            />
          </label>
        </>
      )}

      {block.type === "calculation" && (
        <>
          <div className="block-grid">
            <label className="field">
              <span>Подпись к расчёту</span>
              <input
                type="text"
                value={(block as CalculationBlock).caption}
                onChange={(event) =>
                  onUpdate((current) =>
                    current.type === "calculation" ? { ...current, caption: event.target.value } : current
                  )
                }
              />
            </label>
            <label className="field">
              <span>Формат вывода</span>
              <select
                value={(block as CalculationBlock).environment}
                onChange={(event) =>
                  onUpdate((current) =>
                    current.type === "calculation"
                      ? { ...current, environment: event.target.value as CalculationBlock["environment"] }
                      : current
                  )
                }
              >
                {Object.entries(calculationEnvironmentLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>Размер формулы</span>
              <select
                value={(block as CalculationBlock).fontSize}
                onChange={(event) =>
                  onUpdate((current) =>
                    current.type === "calculation"
                      ? { ...current, fontSize: event.target.value as CalculationBlock["fontSize"] }
                      : current
                  )
                }
              >
                {Object.entries(calculationFontSizeLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="formula-toolbar">
            {calculationInsertTemplates.map(({ label, template }) => (
              <button
                className="chip-button"
                key={label}
                type="button"
                onClick={() => insertCalculationTemplate(template)}
              >
                {label}
              </button>
            ))}
          </div>

          <label className="field">
            <span>Формула или набор формул</span>
            <textarea
              ref={calculationTextareaRef}
              className="code-textarea calculation-textarea"
              placeholder={"Можно писать LaTeX-команды или просто Unicode-символы.\nНапример: \\sqrt{a^2+b^2} = c\nили: A ∩ B ⊆ C"}
              value={(block as CalculationBlock).formula}
              onChange={(event) =>
                onUpdate((current) =>
                  current.type === "calculation" ? { ...current, formula: event.target.value } : current
                )
              }
            />
          </label>

          <p className="inline-note">
            Для длинных выражений лучше `multline*` или `align*`. Unicode-символы вроде `√`, `∩`, `≤`, `α`, `∞`
            тоже переводятся.
          </p>
        </>
      )}

      {block.type === "table" && (
        <>
          <div className="block-grid">
            <label className="field">
              <span>Подпись к таблице</span>
              <input
                type="text"
                value={(block as TableBlock).caption}
                onChange={(event) =>
                  onUpdate((current) =>
                    current.type === "table" ? { ...current, caption: event.target.value } : current
                  )
                }
              />
            </label>
            <label className="field">
              <span>Столбцов, 0 = авто</span>
              <input
                min="0"
                type="number"
                value={(block as TableBlock).cols}
                onChange={(event) =>
                  onUpdate((current) => (current.type === "table" ? { ...current, cols: event.target.value } : current))
                }
              />
            </label>
            <label className="field">
              <span>Размер таблицы</span>
              <select
                value={(block as TableBlock).fontSize}
                onChange={(event) =>
                  onUpdate((current) =>
                    current.type === "table"
                      ? { ...current, fontSize: event.target.value as TableBlock["fontSize"] }
                      : current
                  )
                }
              >
                {Object.entries(tableFontSizeLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label className="toggle-field wide">
            <input
              type="checkbox"
              checked={(block as TableBlock).fitToWidth}
              onChange={(event) =>
                onUpdate((current) =>
                  current.type === "table" ? { ...current, fitToWidth: event.target.checked } : current
                )
              }
            />
            <span>Вписать таблицу по ширине страницы</span>
          </label>
          <label className="toggle-field wide">
            <input
              type="checkbox"
              checked={(block as TableBlock).wrapCells}
              onChange={(event) =>
                onUpdate((current) =>
                  current.type === "table" ? { ...current, wrapCells: event.target.checked } : current
                )
              }
            />
            <span>Автоматически переносить длинный текст в ячейках</span>
          </label>
          <label className="field">
            <span>Данные таблицы</span>
            <textarea
              className="large-textarea"
              placeholder={"Каждая строка — строка таблицы.\nЯчейки разделяйте точкой с запятой (;).\nОбъект;Структура;Состояние"}
              value={(block as TableBlock).data}
              onChange={(event) =>
                onUpdate((current) => (current.type === "table" ? { ...current, data: event.target.value } : current))
              }
            />
          </label>
          <p className="inline-note">
            В ячейках работают `$...$` и `\\(...\\)`. Если широко, уменьшите размер, включите вписывание или перенос.
          </p>
        </>
      )}

      {block.type === "graph" && (
        <>
          <div className="block-grid">
            <label className="field">
              <span>Подпись к графику</span>
              <input
                type="text"
                value={(block as GraphBlock).caption}
                onChange={(event) =>
                  onUpdate((current) =>
                    current.type === "graph" ? { ...current, caption: event.target.value } : current
                  )
                }
              />
            </label>
            <label className="field">
              <span>Заголовок внутри графика</span>
              <input
                type="text"
                value={(block as GraphBlock).title}
                onChange={(event) =>
                  onUpdate((current) =>
                    current.type === "graph" ? { ...current, title: event.target.value } : current
                  )
                }
              />
            </label>
          </div>
          <div className="block-grid">
            <label className="field">
              <span>Подпись оси X</span>
              <input
                type="text"
                value={(block as GraphBlock).xLabel}
                onChange={(event) =>
                  onUpdate((current) =>
                    current.type === "graph" ? { ...current, xLabel: event.target.value } : current
                  )
                }
              />
            </label>
            <label className="field">
              <span>Подпись оси Y</span>
              <input
                type="text"
                value={(block as GraphBlock).yLabel}
                onChange={(event) =>
                  onUpdate((current) =>
                    current.type === "graph" ? { ...current, yLabel: event.target.value } : current
                  )
                }
              />
            </label>
          </div>
          <div className="block-grid">
            <label className="field">
              <span>Тип графика</span>
              <select
                value={(block as GraphBlock).mode}
                onChange={(event) =>
                  onUpdate((current) =>
                    current.type === "graph"
                      ? { ...current, mode: event.target.value as GraphBlock["mode"] }
                      : current
                  )
                }
              >
                <option value="line">Линейный</option>
                <option value="bar">Столбчатый</option>
              </select>
            </label>
            <div className="field">
              <span>Начинать ось с нуля</span>
              <label className="toggle-field graph-zero-toggle">
                <input
                  checked={(block as GraphBlock).startAtZero}
                  type="checkbox"
                  onChange={(event) =>
                    onUpdate((current) =>
                      current.type === "graph" ? { ...current, startAtZero: event.target.checked } : current
                    )
                  }
                />
                <span>Да, от 0</span>
              </label>
            </div>
          </div>

          <GraphPreview block={block as GraphBlock} />

          <div className="series-list">
            {(block as GraphBlock).series.map((series, index) => (
              <div className="series-editor" key={series.id}>
                <div className="series-head">
                  <strong>{series.label.trim() || `Серия ${index + 1}`}</strong>
                  <button className="mini-button danger-text" type="button" onClick={() => onRemoveGraphSeries(series.id)}>
                    Удалить серию
                  </button>
                </div>
                <div className="block-grid">
                  <label className="field">
                    <span>Название серии</span>
                    <input
                      placeholder={`Например: API ${index + 1}`}
                      type="text"
                      value={series.label}
                      onChange={(event) => onUpdateGraphSeries(series.id, { label: event.target.value })}
                    />
                  </label>
                  <label className="field">
                    <span>Цвет серии</span>
                    <select
                      value={series.color}
                      onChange={(event) => onUpdateGraphSeries(series.id, { color: event.target.value })}
                    >
                      <option value="teal">Бирюзовый</option>
                      <option value="blue">Синий</option>
                      <option value="red">Красный</option>
                      <option value="orange">Оранжевый</option>
                      <option value="green!60!black">Зелёный</option>
                      <option value="violet">Фиолетовый</option>
                    </select>
                  </label>
                </div>
                <label className="field">
                  <span>Точки серии</span>
                  <textarea
                    className="large-textarea"
                    placeholder={"Каждая строка — одна точка.\nФормат: X;Y\nЯнв;12\nФев;18\nМар;15"}
                    value={series.points}
                    onChange={(event) => onUpdateGraphSeries(series.id, { points: event.target.value })}
                  />
                </label>
              </div>
            ))}
          </div>
          <button className="chip-button" type="button" onClick={onAddGraphSeries}>
            + Серия
          </button>
          <p className="inline-note">
            Формат точек: одна строка = одна точка, `X;Y`.
          </p>
        </>
      )}

      {block.type === "list" && (
        <div className="list-editor">
          <label className="toggle-field">
            <input
              checked={(block as ListBlock).ordered}
              type="checkbox"
              onChange={(event) =>
                onUpdate((current) =>
                  current.type === "list" ? { ...current, ordered: event.target.checked } : current
                )
              }
            />
            <span>Нумерованный список</span>
          </label>

          {(block as ListBlock).items.map((item, index) => (
            <div className="list-row" key={item.id}>
              <label className="field">
                <span>Объект {index + 1}</span>
                <input
                  type="text"
                  value={item.label}
                  onChange={(event) => onUpdateListItem(item.id, { label: event.target.value })}
                />
              </label>
              <label className="field">
                <span>Текст {index + 1}</span>
                <input
                  type="text"
                  value={item.text}
                  onChange={(event) => onUpdateListItem(item.id, { text: event.target.value })}
                />
              </label>
              <button className="mini-button danger-text list-remove" type="button" onClick={() => onRemoveListItem(item.id)}>
                Удалить
              </button>
            </div>
          ))}

          <button className="chip-button" type="button" onClick={onAddListItem}>
            + Пункт
          </button>
        </div>
      )}

      {block.type === "pagebreak" && (
        <p className="inline-note">В итоговый файл будет добавлена команда `\clearpage`.</p>
      )}
    </div>
  );
}
