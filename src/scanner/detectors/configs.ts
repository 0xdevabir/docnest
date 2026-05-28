import type { ConfigFile, FileEntry } from "../types.js";
import { classifyConfig } from "../file-utils.js";

export function detectConfigs(files: FileEntry[]): ConfigFile[] {
  const configs: ConfigFile[] = [];
  for (const f of files) {
    const type = classifyConfig(f.name, f.relativePath);
    if (type !== null) {
      configs.push({ path: f.path, relativePath: f.relativePath, type });
    }
  }
  return configs;
}
