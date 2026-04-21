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
  const [loaded, setLoaded] = useState(false);
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
        setDraft(normalizeDraft(JSON.parse(saved) as ReportDraft));
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

  function updateMeta(key: keyof ReportMeta, value: string | boolean) {
    setDraft((previous) => ({
      ...previous,
      meta: {
        ...previous.meta,
        [key]: value
      }
    }));
  }

  function addSection(level = currentLevel) {
    setDraft((previous) => ({
      ...previous,
      sections: [...previous.sections, createSection(level)]
    }));
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

      setDraft(normalizeDraft(importedDraft));
      setCurrentLevel(0);
      setGeneratedSnapshot("");
      setProjectStatus("loaded");
    } catch {
      setProjectStatus("error");
      window.alert("Не получилось загрузить проект. Проверьте, что выбран JSON-файл этого редактора.");
    }
  }

  function loadExample() {
    if (!window.confirm("Загрузить пример? Текущий черновик будет заменён.")) return;
    setDraft(createExampleDraft());
    setCurrentLevel(0);
  }

  function clearDraft() {
    if (!window.confirm("Очистить весь черновик?")) return;
    setDraft(createInitialDraft());
    setCurrentLevel(0);
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
            <p>Кнопки ниже добавляют новый раздел в конец отчёта. Сами блоки редактируются на всю ширину страницы.</p>

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
                Добавить раздел
              </button>
              <button className="button ghost full" type="button" onClick={addLowerSection}>
                Добавить уровнем ниже
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
                <a className={`jump level-${section.level}`} href={`#${section.id}`} key={section.id}>
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
              <article className={`section-panel level-${section.level}`} id={section.id} key={section.id}>
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
                  {(["text", "figure", "code", "table", "list", "pagebreak"] as ReportBlock["type"][]).map(
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
                        onRemoveListItem={(itemId) => removeListItem(section.id, block.id, itemId)}
                        onUpdate={(updater) => updateBlock(section.id, block.id, updater)}
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
  block,
  blockIndex,
  onAddListItem,
  onMoveDown,
  onMoveUp,
  onRemove,
  onRemoveListItem,
  onUpdate,
  onUpdateListItem
}: {
  block: ReportBlock;
  blockIndex: number;
  onAddListItem: () => void;
  onMoveDown: () => void;
  onMoveUp: () => void;
  onRemove: () => void;
  onRemoveListItem: (itemId: string) => void;
  onUpdate: (updater: (block: ReportBlock) => ReportBlock) => void;
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
