import { spawn } from "node:child_process";
import { access, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { NextResponse } from "next/server";
import type { ReportDraft } from "@/lib/report";

export const runtime = "nodejs";

const defaultCompiler = "pdflatex";

export async function POST(request: Request) {
  const tempDir = await mkdtemp(join(tmpdir(), "tex-report-forge-"));

  try {
    const payload = (await request.json()) as { tex?: string; draft?: ReportDraft };
    const tex = payload.tex?.trim();

    if (!tex) {
      return NextResponse.json({ error: "Пустой TEX" }, { status: 400 });
    }

    const texPath = join(tempDir, "main.tex");
    const pdfPath = join(tempDir, "main.pdf");

    await writeFile(texPath, tex, "utf8");
    await writeEmbeddedImages(tempDir, payload.draft);

    const latexCompiler = await resolveLatexCompiler();

    const firstPass = await runLatex(tempDir, latexCompiler);
    if (firstPass.code !== 0) {
      const details = summarizeLatexLog(firstPass.log);
      console.error("[compile-pdf] First LaTeX pass failed\n" + details);
      return NextResponse.json(
        {
          error: "LaTeX compilation failed",
          details
        },
        { status: 500 }
      );
    }

    const secondPass = await runLatex(tempDir, latexCompiler);
    if (secondPass.code !== 0) {
      const details = summarizeLatexLog(secondPass.log);
      console.error("[compile-pdf] Second LaTeX pass failed\n" + details);
      return NextResponse.json(
        {
          error: "LaTeX compilation failed",
          details
        },
        { status: 500 }
      );
    }

    const pdf = await readFile(pdfPath);

    return new NextResponse(pdf, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="report.pdf"'
      }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Неизвестная ошибка компиляции PDF";

    return NextResponse.json(
      {
        error: "PDF build failed",
        details: message
      },
      { status: 500 }
    );
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
}

async function resolveLatexCompiler() {
  const candidates = [
    process.env.MIKTEX_BINDIR ? join(process.env.MIKTEX_BINDIR, "pdflatex.exe") : null,
    process.env.LOCALAPPDATA
      ? join(process.env.LOCALAPPDATA, "Programs", "MiKTeX", "miktex", "bin", "x64", "pdflatex.exe")
      : null,
    process.env.ProgramFiles
      ? join(process.env.ProgramFiles, "MiKTeX", "miktex", "bin", "x64", "pdflatex.exe")
      : null,
    process.env["ProgramFiles(x86)"]
      ? join(process.env["ProgramFiles(x86)"], "MiKTeX", "miktex", "bin", "x64", "pdflatex.exe")
      : null,
    defaultCompiler
  ].filter(Boolean) as string[];

  for (const candidate of candidates) {
    if (candidate === defaultCompiler) {
      return candidate;
    }

    try {
      await access(candidate);
      return candidate;
    } catch {
      // try next candidate
    }
  }

  return defaultCompiler;
}

function runLatex(workdir: string, latexCompiler: string) {
  return new Promise<{ code: number; log: string }>((resolve, reject) => {
    const child = spawn(
      latexCompiler,
      ["-interaction=nonstopmode", "-halt-on-error", "main.tex"],
      {
        cwd: workdir
      }
    );

    let log = "";

    child.stdout.on("data", (chunk) => {
      log += chunk.toString();
    });

    child.stderr.on("data", (chunk) => {
      log += chunk.toString();
    });

    child.on("error", (error) => {
      if ("code" in error && error.code === "ENOENT") {
        reject(
          new Error(
            "Локальный pdflatex не найден. Если MiKTeX уже установлен, перезапустите dev-сервер или проверьте путь к MiKTeX."
          )
        );
        return;
      }

      reject(error);
    });

    child.on("close", (code) => {
      resolve({
        code: code ?? 1,
        log
      });
    });
  });
}

function summarizeLatexLog(log: string) {
  const lines = log.split(/\r?\n/);
  const errorIndex = lines.findIndex(
    (line) => line.startsWith("!") || line.includes("LaTeX Error:") || line.includes("Fatal error occurred")
  );

  if (errorIndex >= 0) {
    const start = Math.max(0, errorIndex - 8);
    const end = Math.min(lines.length, errorIndex + 18);
    return lines.slice(start, end).join("\n").trim();
  }

  return lines.slice(Math.max(0, lines.length - 40)).join("\n").trim();
}

async function writeEmbeddedImages(tempDir: string, draft?: ReportDraft) {
  if (!draft) return;

  const figureBlocks = draft.sections.flatMap((section) => section.blocks).filter((block) => block.type === "figure");
  const images = figureBlocks
    .map((block) => ({
      filename: normalizeImageFilename(block.filename),
      imageData: block.imageData?.trim() ?? ""
    }))
    .filter((item) => item.filename && item.imageData);

  if (images.length === 0) return;

  for (const image of images) {
    const match = image.imageData.match(/^data:.*?;base64,(.+)$/);
    if (!match) continue;

    const outputPath = join(tempDir, "images", ...image.filename.split("/"));
    await mkdir(dirname(outputPath), { recursive: true });
    await writeFile(outputPath, Buffer.from(match[1], "base64"));
  }
}

function normalizeImageFilename(filename: string) {
  return filename
    .replace(/\r\n?/g, "")
    .replace(/\\/g, "/")
    .replace(/[\u200B-\u200F\u202A-\u202E\u2066-\u2069\uFEFF]/g, "")
    .trim()
    .replace(/^\.?\//, "")
    .replace(/^images\//i, "")
    .split("/")
    .filter((segment) => segment && segment !== "." && segment !== "..")
    .join("/");
}
