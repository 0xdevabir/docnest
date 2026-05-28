import type { AnalysisResult } from "../../analyzer/types.js";
import type { ArchEvidence, StateKind, StateManagementSystem } from "../types.js";

// ── Rule table ─────────────────────────────────────────────────────────────────

export interface StateLibRule {
  kind: StateKind;
  label: string;
  importPatterns: RegExp[];
  /** Patterns matched against function/class names and variable names in the file. */
  usageNamePatterns: RegExp[];
  /** Heuristic: file name patterns for store files. */
  filePatterns: RegExp[];
}

export const STATE_LIB_RULES: StateLibRule[] = [
  {
    kind: "redux",
    label: "Redux / RTK",
    importPatterns: [/^redux$/, /^react-redux$/, /^@reduxjs\/toolkit$/],
    usageNamePatterns: [/createSlice|createStore|configureStore|useSelector|useDispatch|createReducer/],
    filePatterns: [/slice\.(ts|js)$/, /store\.(ts|js)$/, /reducer\.(ts|js)$/],
  },
  {
    kind: "zustand",
    label: "Zustand",
    importPatterns: [/^zustand$/],
    usageNamePatterns: [/\bcreate\b.*Store|useStore/],
    filePatterns: [/store\.(ts|js)$/, /\.store\.(ts|js)$/],
  },
  {
    kind: "jotai",
    label: "Jotai",
    importPatterns: [/^jotai$/],
    usageNamePatterns: [/\batom\b|useAtom|useAtomValue/],
    filePatterns: [/atoms?\.(ts|js)$/],
  },
  {
    kind: "recoil",
    label: "Recoil",
    importPatterns: [/^recoil$/],
    usageNamePatterns: [/\batom\b|selector|useRecoilState|useRecoilValue/],
    filePatterns: [/atoms?\.(ts|js)$/, /selectors?\.(ts|js)$/],
  },
  {
    kind: "mobx",
    label: "MobX",
    importPatterns: [/^mobx$/, /^mobx-react(-lite)?$/],
    usageNamePatterns: [/observable|makeAutoObservable|makeObservable|\@action|\@computed/],
    filePatterns: [/store\.(ts|js)$/, /\.store\.(ts|js)$/],
  },
  {
    kind: "context",
    label: "React Context",
    importPatterns: [],
    usageNamePatterns: [/createContext\s*\(|useContext\s*\(/],
    filePatterns: [/context\.(tsx?|jsx?)$/, /provider\.(tsx?|jsx?)$/],
  },
  {
    kind: "vuex",
    label: "Vuex",
    importPatterns: [/^vuex$/],
    usageNamePatterns: [/createStore|mapState|mapActions|mapGetters/],
    filePatterns: [/store\.(ts|js)$/],
  },
  {
    kind: "pinia",
    label: "Pinia",
    importPatterns: [/^pinia$/],
    usageNamePatterns: [/defineStore\s*\(/],
    filePatterns: [/stores?\/|\.store\.(ts|js)$/],
  },
  {
    kind: "xstate",
    label: "XState",
    importPatterns: [/^xstate$/, /^@xstate\//],
    usageNamePatterns: [/createMachine|useMachine|interpret/],
    filePatterns: [/machine\.(ts|js)$/, /\.machine\.(ts|js)$/],
  },
];

// ── Detector ───────────────────────────────────────────────────────────────────

export function detectStateManagement(
  result: AnalysisResult,
): StateManagementSystem[] {
  const systems: StateManagementSystem[] = [];
  const totalFiles = result.files.size;

  for (const rule of STATE_LIB_RULES) {
    const storeFiles: string[] = [];
    const importEvidence: string[] = [];
    let importCount = 0;

    for (const [path, analysis] of result.files) {
      const externalImports = analysis.imports.filter((i) => i.isExternal);
      const hasImport = externalImports.some((imp) =>
        rule.importPatterns.some((p) => p.test(imp.specifier)),
      );
      const fileName = path.split("/").pop() ?? "";
      const hasFilePattern = rule.filePatterns.some((p) => p.test(fileName) || p.test(path));

      // For Context, check function names in the file
      const isContext = rule.kind === "context";
      const hasUsage = isContext
        ? checkContextUsage(analysis)
        : false;

      if (hasImport) {
        importCount++;
        importEvidence.push(path);
        if (isStoreFile(path, rule)) storeFiles.push(path);
      }
      if ((hasFilePattern && hasImport) || (isContext && hasUsage)) {
        if (!storeFiles.includes(path)) storeFiles.push(path);
      }
    }

    // Context: require multiple uses to avoid false positives
    if (rule.kind === "context" && storeFiles.length < 2) continue;
    if (rule.kind !== "context" && importCount === 0) continue;

    const confidence = scoreStateConfidence(rule.kind, importCount, storeFiles.length, totalFiles);
    const coverage = importCount / totalFiles;

    const evidence: ArchEvidence[] = [
      {
        description: `${importCount} file${importCount !== 1 ? "s" : ""} import ${rule.label}`,
        sources: importEvidence.slice(0, 3),
        weight: confidence,
      },
    ];
    if (storeFiles.length > 0) {
      evidence.push({
        description: `${storeFiles.length} detected store file(s)`,
        sources: storeFiles.slice(0, 3),
        weight: 0.6,
      });
    }

    systems.push({
      kind: rule.kind,
      label: rule.label,
      storeFiles,
      coverage,
      confidence,
      evidence,
    });
  }

  return systems.sort((a, b) => b.confidence - a.confidence);
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function isStoreFile(path: string, rule: StateLibRule): boolean {
  return rule.filePatterns.some((p) => p.test(path));
}

function checkContextUsage(analysis: { functions: { name: string }[] }): boolean {
  return analysis.functions.some((f) => /Provider$|Context$/.test(f.name));
}

function scoreStateConfidence(
  kind: StateKind,
  importCount: number,
  storeCount: number,
  totalFiles: number,
): number {
  if (kind === "context") {
    return Math.min(0.85, 0.4 + storeCount * 0.08);
  }
  const importRatio = importCount / totalFiles;
  return Math.min(0.95, 0.5 + importRatio * 2 + storeCount * 0.05);
}
