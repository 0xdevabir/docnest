import type { AnalysisResult } from "../analyzer/types.js";
import {
  detectApiArchitecture,
  detectAuthSystem,
  detectFeatures,
  detectLayers,
  detectPatterns,
  detectStateManagement,
  detectZones,
  identifyBusinessLogic,
  identifyCoreModules,
  identifyServiceLayers,
} from "./detectors/index.js";
import { buildArchGraph, buildProjectMap } from "./graph/arch-graph.js";
import { collectAllSignals } from "./signals.js";
import type { ArchitectureMap, ArchitectureOptions } from "./types.js";
import { DEFAULT_SIGNAL_WEIGHTS } from "./types.js";

export class ArchitectureAnalyzerService {
  /**
   * Analyse the architecture of a repository from its AST analysis result.
   *
   * Synchronous: all input data is already in memory from ASTAnalyzerService.
   * Call sequence: ASTAnalyzerService.analyze() → ArchitectureAnalyzerService.analyze()
   */
  analyze(result: AnalysisResult, options: ArchitectureOptions): ArchitectureMap {
    const t0 = performance.now();
    const minConf = options.minConfidence ?? 0.25;
    const maxCoreModules = options.maxCoreModules ?? 20;

    // ── Step 1: Collect per-file signals ──────────────────────────────────────
    const signals = collectAllSignals(result.files, options.root);

    // ── Step 2: Run structural detectors ──────────────────────────────────────
    const zones = detectZones(result, signals, minConf);
    const layers = detectLayers(signals, minConf);
    const features = detectFeatures(result, options.root, minConf);
    const patterns = detectPatterns(result, options.root).filter(
      (p) => p.confidence >= minConf,
    );

    // ── Step 3: Run semantic detectors ────────────────────────────────────────
    const state = detectStateManagement(result).filter(
      (s) => s.confidence >= minConf,
    );
    const rawApi = detectApiArchitecture(result);
    const api =
      rawApi !== null && rawApi.confidence >= minConf ? rawApi : null;
    const rawAuth = detectAuthSystem(result);
    const auth =
      rawAuth !== null && rawAuth.confidence >= minConf ? rawAuth : null;

    // ── Step 4: Derive higher-order artefacts ──────────────────────────────────
    const coreModules = identifyCoreModules(result, maxCoreModules);
    const businessLogic = identifyBusinessLogic(result, layers);
    const serviceLayers = identifyServiceLayers(result, layers);

    // ── Step 5: Build architecture graph ──────────────────────────────────────
    const graph = buildArchGraph(zones, features, layers, result);

    // ── Step 6: Build project map ──────────────────────────────────────────────
    const projectMap = buildProjectMap(result, zones, layers, features, options.root);
    projectMap.coreModules = coreModules;

    // ── Stats ──────────────────────────────────────────────────────────────────
    const allZoneFiles = zones.flatMap((z) => z.files);
    const classifiedFiles = new Set(allZoneFiles.filter((f) => {
      const zone = zones.find((z) => z.files.includes(f));
      return zone?.kind !== "unknown";
    })).size;

    return {
      patterns,
      zones,
      layers,
      features,
      serviceLayers,
      state,
      api,
      auth,
      coreModules,
      businessLogic,
      projectMap,
      graph,
      stats: {
        totalFiles: result.files.size,
        classifiedFiles,
        analysisMs: performance.now() - t0,
      },
    };
  }
}
