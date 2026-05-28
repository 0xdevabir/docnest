import path from "node:path";

import fs from "fs-extra";

import { FileSystemError } from "../core/errors/index.js";

// ── Safe wrappers around fs-extra ──────────────────────────────────────────

/**
 * Read a file as UTF-8 text. Throws `FileSystemError` on failure.
 */
export async function readFile(filePath: string): Promise<string> {
  try {
    return await fs.readFile(filePath, "utf8");
  } catch {
    throw new FileSystemError(filePath, "Could not read file");
  }
}

/**
 * Write text to a file, creating parent directories as needed.
 */
export async function writeFile(
  filePath: string,
  content: string,
): Promise<void> {
  try {
    await fs.outputFile(filePath, content, "utf8");
  } catch {
    throw new FileSystemError(filePath, "Could not write file");
  }
}

/**
 * Copy a file or directory. Creates destination parent dirs automatically.
 */
export async function copyPath(src: string, dest: string): Promise<void> {
  try {
    await fs.copy(src, dest, { overwrite: true });
  } catch {
    throw new FileSystemError(src, `Could not copy to ${dest}`);
  }
}

/**
 * Remove a file or directory recursively.
 */
export async function removePath(targetPath: string): Promise<void> {
  try {
    await fs.remove(targetPath);
  } catch {
    throw new FileSystemError(targetPath, "Could not remove path");
  }
}

/**
 * Ensure a directory exists, creating it (and parents) if needed.
 */
export async function ensureDir(dirPath: string): Promise<void> {
  try {
    await fs.ensureDir(dirPath);
  } catch {
    throw new FileSystemError(dirPath, "Could not create directory");
  }
}

/**
 * Check if a path exists on disk.
 */
export async function pathExists(targetPath: string): Promise<boolean> {
  return fs.pathExists(targetPath);
}

/**
 * Resolve a path relative to the current working directory.
 */
export function resolveCwd(...segments: string[]): string {
  return path.resolve(process.cwd(), ...segments);
}

/**
 * Read and parse a JSON file. Throws `FileSystemError` on I/O failure
 * and `SyntaxError` on malformed JSON.
 */
export async function readJson<T = unknown>(filePath: string): Promise<T> {
  const text = await readFile(filePath);
  return JSON.parse(text) as T;
}
