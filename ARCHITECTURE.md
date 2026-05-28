# DocSmith — Architecture

DocSmith is a developer documentation CLI. It scans a repository, parses TypeScript source
files into ASTs, infers architecture, and produces documentation (README, API docs, etc.)
either via static analysis or by calling an AI provider.

---

## Table of Contents

1. [Module Map](#module-map)
2. [Module Explanations](#module-explanations)
3. [System Flow](#system-flow)
4. [Service Relationships](#service-relationships)
5. [Business Logic Areas](#business-logic-areas)
6. [CLI Commands Reference](#cli-commands-reference)
7. [Public API (Library Mode)](#public-api-library-mode)

---

## Module Map

```
src/
├── cli/                  CLI entry point + Commander program factory
├── commands/             One file per CLI command; registered onto the program
├── core/
│   ├── config/           Config loading (cosmiconfig + jiti + Zod)
│   ├── errors/           Typed error hierarchy
│   └── logger/           Structured logger with levels
├── scanner/              File-system walker; detects framework/entrypoints/deps
├── analyzer/             TypeScript Compiler API — per-file AST extraction + module graph
├── architecture/         Architecture inference engine (zones, layers, patterns)
├── dependency-graph/     Graph metrics, cycle detection, serialization
├── readme/               README generation: sections + templates + renderer
├── ai/                   AI provider registry + adapter interface
├── plugins/              Plugin runner + loader (hook-based lifecycle)
├── utils/                fs helpers, terminal formatting, env
└── types/                Shared primitives (Result<T,E>, Maybe, etc.)
```

---

## Module Explanations

### `cli/`
**Entry point for the `docsmith` binary.**

`cli/index.ts` creates the Commander `Program` and calls `program.parseAsync(process.argv)`.
`cli/program.ts` builds the program object, attaches global flags (`--verbose`, `--no-color`),
registers a `preAction` hook to forward `--verbose` into `DOCSMITH_LOG_LEVEL`, and delegates
command registration to `commands/index.ts`.

### `commands/`
**One file per user-facing command.**

Each file exports a single `register<Name>Command(program)` function. They are all wired
together in `commands/index.ts` which is the only file that knows about all commands.
Adding a new command means: create the file, export the registration function, import it in
`index.ts` — nothing else changes.

| File | Command | Purpose |
|------|---------|---------|
| `init.ts` | `docsmith init` | Scaffold `docsmith.config.*` in the current directory |
| `build.ts` | `docsmith build` | Load config, run plugin lifecycle, write output |
| `serve.ts` | `docsmith serve` | Serve built docs locally |
| `watch.ts` | `docsmith watch` | Rebuild on file changes |
| `generate.ts` | `docsmith generate <source>` | AI-powered doc generation from a source file |
| `explain.ts` | `docsmith explain <source>` | AI explanation of what a source file does |
| `readme.ts` | `docsmith readme [root]` | Generate README.md from static analysis |

### `core/config/`
**Project configuration, loading, and validation.**

Uses `cosmiconfig` to discover `docsmith.config.*` files (JSON, JS, TS). TypeScript configs
are executed at load time via `jiti` — no separate compile step. The loaded object is
validated against a `Zod` schema defined in `schema.ts`. The schema covers:
`ai`, `diagrams`, `templates`, `framework`, `output`, `plugins`, and `ignoredFolders`.

Key exports: `defineConfig` (type-helper for user configs), `loadConfig`, `tryLoadConfig`.

### `core/errors/`
**Typed error hierarchy.**

All errors extend `DocSmithError`. Sub-classes cover distinct failure domains:
`ConfigError`, `ConfigNotFoundError`, `ConfigValidationError`, `PluginError`,
`PluginLoadError`, `CommandError`, `FileSystemError`.

Commands are wrapped with `withErrorHandling(action, logger)` from `errors/handler.ts`,
which catches `DocSmithError` and formats its message before exiting.

### `core/logger/`
**Structured logger.**

Level-based (`debug`, `info`, `warn`, `error`, `silent`). Controlled by the
`DOCSMITH_LOG_LEVEL` environment variable (set from `--verbose`). Produces colored
terminal output via `formatters.ts`. Supports `logger.child(namespace)` for scoped
sub-loggers (e.g., `logger.child("plugins")`).

### `scanner/`
**Repository file-system walker and metadata detector.**

The central class is `RepositoryScanner`. Its `scan(options)` method does a BFS walk
of the file tree (respecting `.gitignore` and `ignoredFolders` from config), then passes
the collected `FileEntry[]` through a set of detectors:

| Detector | Output |
|----------|--------|
| `framework.ts` | Which framework the project uses (Next.js, Express, Hono, etc.) |
| `entrypoints.ts` | Main entry files (`src/index.ts`, `main.ts`, etc.) |
| `configs.ts` | Config files present (`tsconfig.json`, `.eslintrc`, etc.) |
| `dependencies.ts` | Parsed `package.json` deps (prod + dev) |
| `monorepo.ts` | Whether the project is a monorepo (pnpm workspaces, Turborepo, etc.) |
| `scripts.ts` | `package.json` scripts |

Result type: `ProjectStructure` — the canonical "what does this repo look like" snapshot.

The scanner has its own `ScanCache` and supports invalidation per root path.

### `analyzer/`
**TypeScript AST analysis engine.**

Powered by the TypeScript Compiler API (`typescript` package).

`ASTAnalyzerService.analyze(options)` is the main entry point:
1. Checks per-file mtime against `AnalysisCache`; only re-parses changed files.
2. Creates a single `ts.Program` covering all stale files.
3. For each source file, calls `analyzeSourceFile(sf, compilerOptions, root)`.
4. Builds a `ModuleGraph` from all file analyses via `buildModuleGraph`.

**Extractors** (in `analyzer/extractors/`) — each takes a `ts.SourceFile` and returns
typed structures:

| Extractor | Extracts |
|-----------|----------|
| `imports.ts` | All import statements with bindings and kind |
| `exports.ts` | All exports (named, default, re-export) |
| `functions.ts` | Top-level functions with params and kind |
| `classes.ts` | Classes with methods, properties |
| `components.ts` | React/framework components (by convention + JSX) |
| `hooks.ts` | Custom hooks (functions starting with `use`) |
| `services.ts` | Service classes/objects (DI patterns, API clients) |
| `api-routes.ts` | Route handler definitions (Express, Hono, Next.js, Fastify) |

Each `FileAnalysis` aggregates all extractor results for one file.

**Module graph** (`analyzer/graph/`):
- `ModuleResolver` resolves import specifiers to absolute paths using the same
  path-mapping rules as the TypeScript compiler (`paths`, `baseUrl`, etc.).
- `buildModuleGraph` walks all `FileAnalysis` import edges and builds
  `ModuleGraph { nodes, edges, reverseEdges, edgeMeta }`.

### `architecture/`
**Architecture inference engine.** Runs synchronously on top of `AnalysisResult`.

`ArchitectureAnalyzerService.analyze(result, options)` orchestrates the pipeline:

```
AnalysisResult
    │
    ▼
collectAllSignals()   ← path patterns, import patterns, naming conventions
    │
    ├─ detectZones()      → frontend / backend / shared / config / test / unknown
    ├─ detectLayers()     → presentation / application / domain / infrastructure
    ├─ detectFeatures()   → feature boundaries inferred from folder structure
    ├─ detectPatterns()   → MVC, Repository, CQRS, Hexagonal, etc.
    ├─ detectStateManagement() → Redux, Zustand, Jotai, MobX, etc.
    ├─ detectApiArchitecture() → REST, tRPC, GraphQL
    ├─ detectAuthSystem() → NextAuth, Passport, JWT patterns, etc.
    ├─ identifyCoreModules()   → files with highest in-degree
    ├─ identifyBusinessLogic() → files in domain layer or named as services
    └─ identifyServiceLayers() → files providing cross-cutting services
         │
         ▼
    buildArchGraph() + buildProjectMap()
         │
         ▼
    ArchitectureMap
```

**Signal system** (`architecture/signals.ts`): Files emit weighted "votes" for zones
and layers based on path segments, import names, and naming conventions. Detectors
aggregate votes via `winningVote()` which returns a winner + confidence score.
Results below `minConfidence` (default `0.25`) are discarded.

### `dependency-graph/`
**Enriched dependency graph with metrics, cycles, and serialization.**

Built from `ModuleGraph` (output of the analyzer) via `buildFromModuleGraph()`.

Key computations in `dependency-graph/analyzer.ts`:
- **PageRank-based importance** (`computeImportance`) — files with many reverse edges score higher.
- **Hub threshold** (`computeHubThreshold`) — nodes above the threshold are categorized as `"hub"`.
- **Depth from entry points** (`computeDepths`).
- **Node categorization**: `hub | entry | barrel | leaf | isolated | module`.

`dependency-graph/cycles.ts` — `detectEnhancedCycles()` finds circular dependencies and
assigns each cycle a `CycleSeverity` (`low | medium | high | critical`).

`dependency-graph/chains.ts` — `longestChain()`, `transitiveDeps()`, `transitiveConsumers()`.

`dependency-graph/serializer.ts` — converts a `DependencyGraph` to:
- `toMermaid()` → Mermaid flowchart
- `toD3()` → D3-compatible `{ nodes, links }` JSON
- `toDot()` → Graphviz DOT format

### `readme/`
**README generation from repository analysis.**

`generateReadme(root, opts)` is the high-level entry point:

```
generateReadme(root, opts)
    │
    ├─ buildReadmeContext(root, opts)
    │      ├─ RepositoryScanner.scan()     → ProjectStructure
    │      ├─ (unless --skip-analysis)
    │      │    ASTAnalyzerService.analyze()     → AnalysisResult
    │      │    ArchitectureAnalyzerService.analyze() → ArchitectureMap
    │      └─ ReadmeContext assembled
    │
    └─ renderReadme(ctx, opts)
           ├─ getTemplate(name)   → ordered list of section IDs
           └─ for each section: SectionRenderer(ctx) → RenderedSection
                │
                └─ ReadmeResult { content, sections, templateUsed }
```

**Sections** (in `readme/sections/`):

| Section | Content |
|---------|---------|
| `overview.ts` | Project name, description, badges |
| `tech-stack.ts` | Detected framework + key dependencies |
| `setup.ts` | Install + environment setup instructions |
| `usage.ts` | Common usage examples |
| `scripts.ts` | `package.json` scripts table |
| `folder-structure.ts` | Directory tree with annotations |
| `architecture.ts` | Detected patterns, zones, layers |
| `environment.ts` | Required env vars inferred from source |

**Templates** (`readme/templates/`): `default`, `library`, `api`, `minimal` —
each specifies an ordered subset of sections.

### `ai/`
**AI provider abstraction layer.**

`aiRegistry` is a singleton registry. External adapters (e.g., `@docsmith/provider-anthropic`)
implement `AIProviderAdapter` and call `aiRegistry.register(adapter)` at startup.

Commands resolve an adapter: `aiRegistry.resolve("anthropic")` → adapter, then call
`adapter.generate(req)` or `adapter.explain(req)`.

No AI logic lives inside DocSmith itself — providers are opt-in packages.

### `plugins/`
**Hook-based plugin system used by the `build` command.**

`PluginRunner` loads plugins declared in config (package names, factory functions, or plugin
objects) via `resolvePlugin()` / `loadPluginFromPackage()`. Hooks fired in order:
`setup` → `buildStart` → `buildEnd` (or `buildError` on failure).

Plugin shape: `{ name: string; setup?(ctx): void; buildStart?(ctx): void; ... }`.

---

## System Flow

### `docsmith readme [root]`

```
CLI args
  └─▶ commands/readme.ts
        └─▶ readme/index.ts :: generateReadme(root, opts)
              ├─▶ scanner/scanner.ts :: RepositoryScanner.scan()
              │     ├─ BFS walk (respects .gitignore)
              │     └─ detectors: framework, entrypoints, configs, deps, monorepo
              │                                         ↓
              │                               ProjectStructure
              │
              ├─▶ analyzer/service.ts :: ASTAnalyzerService.analyze()
              │     ├─ TypeScriptParser.createProgram(files)
              │     ├─ analyzeSourceFile() × N  (per-file extractors)
              │     └─ buildModuleGraph()
              │                                         ↓
              │                                  AnalysisResult
              │
              ├─▶ architecture/service.ts :: ArchitectureAnalyzerService.analyze()
              │     ├─ collectAllSignals()
              │     ├─ detectors (zones, layers, patterns, state, api, auth)
              │     └─ buildArchGraph() + buildProjectMap()
              │                                         ↓
              │                                 ArchitectureMap
              │
              └─▶ readme/renderer.ts :: renderReadme(ctx, opts)
                    └─ sections rendered per template
                                                        ↓
                                              ReadmeResult (markdown string)
```

### `docsmith generate <source>`

```
CLI args
  └─▶ commands/generate.ts
        ├─ readFile(sourcePath)
        ├─ aiRegistry.resolve(provider) → AIProviderAdapter
        └─ adapter.generate({ source, template, format, instructions })
                                                   ↓
                                       AIResponse (markdown string)
                                       → file or stdout
```

### `docsmith build`

```
CLI args
  └─▶ commands/build.ts
        ├─ tryLoadConfig()   (cosmiconfig → jiti → Zod)
        ├─ PluginRunner.load(config)
        ├─ runHook("setup")
        ├─ runHook("buildStart")
        ├─ [document processing pipeline — not yet implemented]
        └─ runHook("buildEnd")
```

---

## Service Relationships

```
RepositoryScanner
    │  produces ProjectStructure
    ▼
readme/context.ts :: buildReadmeContext
    │  also calls ↓
    ▼
ASTAnalyzerService
    │  produces AnalysisResult { files: Map<path, FileAnalysis>, graph: ModuleGraph }
    │
    ├──▶ ArchitectureAnalyzerService
    │        produces ArchitectureMap
    │        consumed by: readme/sections/architecture.ts
    │
    └──▶ buildDependencyGraph / buildFromModuleGraph
             produces DependencyGraph { nodes, edges, cycles, metrics }
             consumed by: serializers (Mermaid, D3, DOT)
                          readme/sections/architecture.ts (cycle warnings)

aiRegistry
    │  resolves AIProviderAdapter
    └──▶ adapter.generate() / adapter.explain()
         consumed by: commands/generate.ts, commands/explain.ts

PluginRunner
    │  loads DocSmithPlugin instances
    └──▶ lifecycle hooks (setup, buildStart, buildEnd, buildError)
         consumed by: commands/build.ts
```

---

## Business Logic Areas

### Architecture inference — `src/architecture/`

The core intelligence of DocSmith. All business rules for classifying what a
file "is" live here:

- **`signals.ts`** — Rules that map file paths, import names, and function names
  to architectural signals (e.g., `pages/` → `frontend` zone, `use` prefix → `hook` layer).
  `PATH_SIGNAL_RULES`, `IMPORT_SIGNAL_RULES`, `NAMING_RULES` are the rule tables.

- **`detectors/zones.ts`** — Decides whether a file belongs to `frontend`, `backend`,
  `shared`, `config`, or `test` by aggregating signal votes.

- **`detectors/layers.ts`** — Classifies files into `presentation`, `application`,
  `domain`, or `infrastructure`.

- **`detectors/patterns.ts`** — Detects high-level patterns (MVC, Hexagonal, Repository).

- **`detectors/features.ts`** — Identifies feature-slice boundaries from folder structure.

- **`detectors/state.ts`** / **`detectors/auth.ts`** — Library-specific detection via
  `STATE_LIB_RULES` and `AUTH_LIB_RULES` rule tables.

### AST extraction — `src/analyzer/extractors/`

Transforms raw TypeScript AST nodes into typed domain objects. Each extractor handles
a single concern (imports, exports, functions, classes, components, hooks, services,
API routes). This is where the bridge between compiler internals and DocSmith's
domain model lives.

### Dependency ranking — `src/dependency-graph/analyzer.ts`

PageRank-inspired scoring (`computeImportance`) determines which files are
architecturally central. This drives the "core modules" list in the README and
architecture outputs.

### README content decisions — `src/readme/sections/`

Each section renderer encodes the logic for turning raw analysis data into
developer-readable prose and tables. This is where "what should a README say about
this project" is decided.

---

## CLI Commands Reference

| Command | Key Options | What it does |
|---------|------------|--------------|
| `docsmith init` | — | Scaffold `docsmith.config.ts` |
| `docsmith build` | `--config`, `--watch` | Load config, run plugin hooks, build output |
| `docsmith serve` | — | Serve built docs |
| `docsmith watch` | — | Rebuild on file changes |
| `docsmith generate <src>` | `--provider`, `--output`, `--template`, `--dry-run` | AI-generate docs from a source file |
| `docsmith explain <src>` | `--depth`, `--format`, `--provider` | AI-explain what a source file does |
| `docsmith readme [root]` | `--template`, `--output`, `--skip-analysis`, `--min-confidence` | Generate README from static analysis |

Global flags on every command: `--verbose` (debug logging), `--no-color`.

---

## Public API (Library Mode)

DocSmith can be imported as a library (`import { ... } from "docsmith"`).
`src/index.ts` is the public API surface. It exports:

- **Config**: `defineConfig`, `loadConfig`, `tryLoadConfig` + types
- **Logger**: `Logger`, `logger` singleton
- **Errors**: all typed error classes
- **Plugin system**: `PluginRunner` + `DocSmithPlugin` interface
- **AI registry**: `aiRegistry` + `AIProviderAdapter` interface
- **AST engine**: `ASTAnalyzerService`, `analyzeSourceFile`, `buildModuleGraph`,
  `ModuleResolver`, `TypeScriptParser`, + all analysis types
- **Architecture engine**: `ArchitectureAnalyzerService`, signal rules + all types
- **Dependency graph**: all builder functions, serializers, analysis utilities + all types
- **Shared types**: `Result<T,E>`, `ok`, `err`, `Maybe`, `Dict`
