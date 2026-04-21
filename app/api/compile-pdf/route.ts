import { spawn } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const latexCompiler = "pdflatex";

export async function POST(request: Request) {
  const tempDir = await mkdtemp(join(tmpdir(), "tex-report-forge-"));

  try {
    const payload = (await request.json()) as { tex?: string };
    const tex = payload.tex?.trim();

    if (!tex) {
      return NextResponse.json({ error: "Пустой TEX" }, { status: 400 });
    }

    const texPath = join(tempDir, "main.tex");
    const pdfPath = join(tempDir, "main.pdf");

    await writeFile(texPath, tex, "utf8");

    const firstPass = await runLatex(tempDir);
    if (firstPass.code !== 0) {
      return NextResponse.json(
        {
          error: "LaTeX compilation failed",
          details: firstPass.log
        },
        { status: 500 }
      );
    }

    const secondPass = await runLatex(tempDir);
    if (secondPass.code !== 0) {
      return NextResponse.json(
        {
          error: "LaTeX compilation failed",
          details: secondPass.log
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

function runLatex(workdir: string) {
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
            "Локальный pdflatex не найден. Установите MiKTeX или TeX Live, чтобы собирать PDF прямо из приложения."
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
