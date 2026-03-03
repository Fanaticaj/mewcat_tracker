import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(currentDir, "..");
const scriptPath = path.resolve(repoRoot, "decompress.py");
const decodedCsvDir = path.resolve(repoRoot, "decoded_csv");
const tempSavDir = path.resolve(os.tmpdir(), "mewcat_tracker_uploads");

function sanitizeBaseName(fileName: string) {
  const baseName = path.parse(fileName).name;
  const cleaned = baseName.replace(/[^a-z0-9-_]+/gi, "_").replace(/^_+|_+$/g, "");
  return cleaned.length > 0 ? cleaned : "mewgenics-save";
}

function createTimestamp() {
  return new Date().toISOString().replace(/[:.]/g, "-");
}

function readRequestBody(req: NodeJS.ReadableStream) {
  return new Promise<Buffer>((resolve, reject) => {
    const chunks: Buffer[] = [];

    req.on("data", (chunk) => {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    });
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

function runCommand(command: string, args: string[]) {
  return new Promise<{ code: number; stderr: string; stdout: string }>(
    (resolve, reject) => {
      const child = spawn(command, args, {
        cwd: repoRoot,
        windowsHide: true,
      });
      let stdout = "";
      let stderr = "";

      child.stdout.on("data", (chunk) => {
        stdout += chunk.toString();
      });
      child.stderr.on("data", (chunk) => {
        stderr += chunk.toString();
      });
      child.on("error", reject);
      child.on("close", (code) => {
        resolve({
          code: code ?? 1,
          stderr,
          stdout,
        });
      });
    },
  );
}

async function runDecompressScript(savPath: string, csvPath: string) {
  const commandCandidates =
    process.platform === "win32"
      ? [
          { command: "python", args: [scriptPath, savPath, "--csv", csvPath] },
          { command: "py", args: ["-3", scriptPath, savPath, "--csv", csvPath] },
        ]
      : [{ command: "python3", args: [scriptPath, savPath, "--csv", csvPath] }];

  let lastError = "Python is not available.";

  for (const candidate of commandCandidates) {
    try {
      const result = await runCommand(candidate.command, candidate.args);

      if (result.code === 0) return result;

      lastError = result.stderr.trim() || result.stdout.trim() || lastError;
    } catch (error) {
      lastError = error instanceof Error ? error.message : lastError;
    }
  }

  throw new Error(lastError);
}

function jsonResponse(
  res: import("node:http").ServerResponse,
  statusCode: number,
  body: Record<string, unknown>,
) {
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(body));
}

async function decodeSavUpload(
  req: import("node:http").IncomingMessage,
  res: import("node:http").ServerResponse,
) {
  if (req.method !== "POST") {
    jsonResponse(res, 405, { error: "Use POST for save decoding." });
    return;
  }

  const uploadedName = req.headers["x-file-name"];
  const fileName =
    typeof uploadedName === "string" && uploadedName.trim().length > 0
      ? uploadedName
      : "mewgenics-save.sav";
  const body = await readRequestBody(req);

  if (body.length === 0) {
    jsonResponse(res, 400, { error: "No .sav data was uploaded." });
    return;
  }

  const safeBaseName = sanitizeBaseName(fileName);
  const stamp = createTimestamp();
  const tempSavPath = path.resolve(tempSavDir, `${safeBaseName}-${stamp}.sav`);
  const outputCsvPath = path.resolve(decodedCsvDir, `${safeBaseName}-${stamp}.csv`);

  await fs.mkdir(tempSavDir, { recursive: true });
  await fs.mkdir(decodedCsvDir, { recursive: true });

  try {
    await fs.writeFile(tempSavPath, body);
    await runDecompressScript(tempSavPath, outputCsvPath);

    jsonResponse(res, 200, {
      csvPath: outputCsvPath,
      message: `Decoded ${fileName} to ${outputCsvPath}.`,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to decode that save file.";
    jsonResponse(res, 500, { error: message });
  } finally {
    await fs.rm(tempSavPath, { force: true });
  }
}

function savDecodePlugin() {
  return {
    configurePreviewServer(server: import("vite").PreviewServer) {
      server.middlewares.use("/api/decode-sav", (req, res) => {
        void decodeSavUpload(req, res);
      });
    },
    configureServer(server: import("vite").ViteDevServer) {
      server.middlewares.use("/api/decode-sav", (req, res) => {
        void decodeSavUpload(req, res);
      });
    },
    name: "sav-decode-api",
  };
}

export default defineConfig({
  plugins: [react(), savDecodePlugin()],
});
