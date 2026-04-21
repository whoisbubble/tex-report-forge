"use client";

import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import {
  buildFullTex,
  buildSectionDisplayInfo,
  createBlock,
  createExampleDraft,
  createInitialDraft,
  createSection,
  makeId,
  normalizeDraft,
  type CodeBlock,
  type FigureBlock,
  type GraphBlock,
  type GraphSeries,
  type ListBlock,
  type ReportBlock,
  type ReportDraft,
  type ReportMeta,
  type SectionLevel,
  type TableBlock,
  type TextBlock
} from "@/lib/report";

const storageKey = "tex-report-forge-draft";
const projectFileApp = "tex-report-forge";
const projectFileVersion = 1;

const blockLabels: Record<ReportBlock["type"], string> = {
  text: "Текст",
  figure: "Рисунок",
  code: "Код",
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

export default function Home() {
  const [draft, setDraft] = useState<ReportDraft>(() => createInitialDraft());
  const [currentLevel, setCurrentLevel] = useState<SectionLevel>(0);
  const [generatedSnapshot, setGeneratedSnapshot] = useState("");
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "error">("idle");
  const [projectStatus, setProjectStatus] = useState<"idle" | "saved" | "loaded" | "error">("idle");
  const [pdfStatus, setPdfStatus] = useState<"idle" | "building" | "done" | "error">("idle");
  const [loaded, setLoaded] = useState(false);
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
  const projectInputRef = useRef<HTMLInputElement>(null);

  const tex = useMemo(() => buildFullTex(draft), [draft]);
  const sectionDisplayInfo = useMemo(() => buildSectionDisplayInfo(draft.sections), [draft.sections]);
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
    window.localStorage.setItem(storageKey, JSON.stringify(draft));
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
          tex
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

  function downloadDraftProject() {
    const payload = {
      app: projectFileApp,
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
    link.download = `tex-report-project-${date}.json`;
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
          <p className="eyebrow">LaTeX report forge</p>
          <h1>MakeTexChigga</h1>
          <p className="subtitle">Большой редактор отчёта без тесного окошка и ручной сборки шаблона.</p>
        </div>
        <div className="topbar-actions">
          <button className="button primary" type="button" onClick={generateTex}>
            {generatedSnapshot ? "Обновить .tex" : "Сгенерировать .tex"}
          </button>
          <button className="button ghost" type="button" onClick={downloadDraftProject}>
            {projectStatus === "saved" ? "Проект сохранён" : "Сохранить проект"}
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
          <span>Титульный лист</span>
          <small>шапка, подписи, город, год</small>
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
            <p>
              Выберите раздел, и новые разделы будут вставляться сразу после него. Сами блоки редактируются на всю
              ширину страницы.
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
              <button className="button danger full" type="button" onClick={clearDraft}>
                Очистить черновик
              </button>
            </div>

            <nav className="section-jump" aria-label="Навигация по разделам">
              {draft.sections.map((section, index) => (
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
              <p>Добавьте первый раздел, а потом наполняйте его текстом, кодом, таблицами и рисунками.</p>
            </div>
          ) : (
            draft.sections.map((section, sectionIndex) => (
              <article
                className={`section-panel level-${section.level} ${selectedSectionId === section.id ? "selected" : ""}`}
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

                <div className="block-toolbar">
                  {(["text", "figure", "code", "table", "graph", "list", "pagebreak"] as ReportBlock["type"][]).map(
                    (type) => (
                      <button className="chip-button" key={type} type="button" onClick={() => addBlock(section.id, type)}>
                        + {blockLabels[type]}
                      </button>
                    )
                  )}
                </div>

                <div className="blocks">
                  {section.blocks.length === 0 ? (
                    <p className="block-empty">В разделе ещё нет блоков. Добавьте текст, рисунок, код или таблицу.</p>
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
                        onRemoveGraphSeries={(seriesId) => removeGraphSeries(section.id, block.id, seriesId)}
                        onRemoveListItem={(itemId) => removeListItem(section.id, block.id, itemId)}
                        onUpdate={(updater) => updateBlock(section.id, block.id, updater)}
                        onUpdateGraphSeries={(seriesId, patch) => updateGraphSeries(section.id, block.id, seriesId, patch)}
                        onUpdateListItem={(itemId, patch) => updateListItem(section.id, block.id, itemId, patch)}
                      />
                    ))
                  )}
                </div>
              </article>
            ))
          )}
        </div>
      </section>

      <section className="tex-panel" aria-label="LaTeX результат">
        <div className="tex-head">
          <div>
            <h2>.tex результат</h2>
            <p>
              Полный файл обновляется автоматически. Нажмите генерацию, скопируйте код и откройте{" "}
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

function extractDraftFromProjectFile(value: unknown): ReportDraft | null {
  if (isReportDraft(value)) {
    return value;
  }

  if (isRecord(value) && isReportDraft(value.draft)) {
    return value.draft;
  }

  return null;
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

function BlockEditor({
  onAddGraphSeries,
  block,
  blockIndex,
  onAddListItem,
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
  onMoveDown: () => void;
  onMoveUp: () => void;
  onRemove: () => void;
  onRemoveGraphSeries: (seriesId: string) => void;
  onRemoveListItem: (itemId: string) => void;
  onUpdate: (updater: (block: ReportBlock) => ReportBlock) => void;
  onUpdateGraphSeries: (seriesId: string, patch: Partial<Pick<GraphSeries, "label" | "color" | "points">>) => void;
  onUpdateListItem: (itemId: string, patch: Partial<{ label: string; text: string }>) => void;
}) {
  return (
    <div className={`block-editor type-${block.type}`}>
      <div className="block-head">
        <div>
          <span className="block-index">Блок {blockIndex + 1}</span>
          <h3>{blockLabels[block.type]}</h3>
        </div>
        <div className="block-actions">
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
        <label className="field">
          <span>Текст раздела</span>
          <textarea
            className="large-textarea"
            placeholder="Пишите текст отчёта здесь. Для принудительного переноса в LaTeX можно использовать \\\\."
            value={(block as TextBlock).content}
            onChange={(event) =>
              onUpdate((current) =>
                current.type === "text" ? { ...current, content: event.target.value } : current
              )
            }
          />
        </label>
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
              placeholder="Сюда можно вставлять код как есть."
              value={(block as CodeBlock).code}
              onChange={(event) =>
                onUpdate((current) => (current.type === "code" ? { ...current, code: event.target.value } : current))
              }
            />
          </label>
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
          </div>
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

          <div className="series-list">
            {(block as GraphBlock).series.map((series, index) => (
              <div className="series-editor" key={series.id}>
                <div className="series-head">
                  <strong>Серия {index + 1}</strong>
                  <button className="mini-button danger-text" type="button" onClick={() => onRemoveGraphSeries(series.id)}>
                    Удалить серию
                  </button>
                </div>
                <div className="block-grid">
                  <label className="field">
                    <span>Название серии</span>
                    <input
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
            Можно накладывать несколько серий на одну систему координат. Формат данных для каждой серии: одна строка —
            одна точка, `X;Y`.
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
