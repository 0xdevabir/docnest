import type { AnalysisResult } from "../../analyzer/types.js";
import type { ArchEvidence, AuthKind, AuthSystem } from "../types.js";

// ── Rule table ─────────────────────────────────────────────────────────────────

export interface AuthLibRule {
  kind: AuthKind;
  label: string;
  importPatterns: RegExp[];
  /** Matched against relative file paths. */
  pathPatterns: RegExp[];
  /** Matched against class/function/variable names in the file. */
  namePatterns: RegExp[];
  strategy: "token" | "session" | "both" | "unknown";
  /** Base confidence when at least one pattern fires. */
  baseConfidence: number;
}

export const AUTH_LIB_RULES: AuthLibRule[] = [
  {
    kind: "next-auth",
    label: "Auth.js (NextAuth)",
    importPatterns: [/^next-auth(\/|$)/, /^@auth\//],
    pathPatterns: [/\/(auth|api\/auth)\//i, /\[\.\.\.nextauth\]/i],
    namePatterns: [/NextAuth|getServerSession|useSession|signIn|signOut/],
    strategy: "session",
    baseConfidence: 0.9,
  },
  {
    kind: "clerk",
    label: "Clerk",
    importPatterns: [/^@clerk\//],
    pathPatterns: [/\/clerk\//i],
    namePatterns: [/ClerkProvider|useUser|useAuth|currentUser|clerkMiddleware/],
    strategy: "session",
    baseConfidence: 0.9,
  },
  {
    kind: "lucia",
    label: "Lucia",
    importPatterns: [/^lucia$/],
    pathPatterns: [/\/auth\//i],
    namePatterns: [/createSession|validateSession|lucia/],
    strategy: "session",
    baseConfidence: 0.9,
  },
  {
    kind: "passport",
    label: "Passport.js",
    importPatterns: [/^passport(\/|$)/, /^passport-/],
    pathPatterns: [/\/passport\//i, /\/auth\//i],
    namePatterns: [/passport\.use|passport\.authenticate|LocalStrategy|JwtStrategy/],
    strategy: "both",
    baseConfidence: 0.85,
  },
  {
    kind: "supabase",
    label: "Supabase Auth",
    importPatterns: [/^@supabase\//],
    pathPatterns: [/\/supabase\//i],
    namePatterns: [/createClient|supabase\.auth|signInWithPassword/],
    strategy: "session",
    baseConfidence: 0.85,
  },
  {
    kind: "firebase",
    label: "Firebase Auth",
    importPatterns: [/^firebase\/auth$/, /^@firebase\/auth$/],
    pathPatterns: [/\/firebase\//i],
    namePatterns: [/getAuth|signInWithEmail|onAuthStateChanged/],
    strategy: "token",
    baseConfidence: 0.85,
  },
  {
    kind: "jwt",
    label: "JWT",
    importPatterns: [/^jsonwebtoken$/, /^jose$/, /^@panva\/hkdf$/],
    pathPatterns: [/\/(auth|jwt|token)\//i],
    namePatterns: [/sign\b|verify\b|jwt\.|createJWT|verifyJWT/],
    strategy: "token",
    baseConfidence: 0.8,
  },
  {
    kind: "session",
    label: "Session-based Auth",
    importPatterns: [/^express-session$/, /^iron-session$/, /^@hapi\/iron$/],
    pathPatterns: [/\/session\//i],
    namePatterns: [/session\.|req\.session|ironSession/],
    strategy: "session",
    baseConfidence: 0.8,
  },
  {
    kind: "oauth",
    label: "OAuth / OpenID Connect",
    importPatterns: [/^openid-client$/, /^oauth2$/, /^@simplewebauthn\//],
    pathPatterns: [/\/oauth\//i, /\/openid\//i],
    namePatterns: [/oauth|authorizeUrl|tokenExchange/i],
    strategy: "token",
    baseConfidence: 0.75,
  },
  {
    kind: "api-key",
    label: "API Key Auth",
    importPatterns: [],
    pathPatterns: [/\/api-?key\//i],
    namePatterns: [/apiKey|api_key|x-api-key/i],
    strategy: "token",
    baseConfidence: 0.6,
  },
];

// ── Detector ───────────────────────────────────────────────────────────────────

export function detectAuthSystem(
  result: AnalysisResult,
): AuthSystem | null {
  const candidates: Array<{ rule: AuthLibRule; files: string[]; score: number }> = [];

  for (const rule of AUTH_LIB_RULES) {
    const authFiles: string[] = [];
    let score = 0;

    for (const [path, analysis] of result.files) {
      const rel = analysis.relativePath.replace(/\\/g, "/");
      const externalImports = analysis.imports.filter((i) => i.isExternal);

      const hasImport = externalImports.some((imp) =>
        rule.importPatterns.some((p) => p.test(imp.specifier)),
      );
      const hasPathMatch = rule.pathPatterns.some((p) => p.test(rel));
      const hasNameMatch = rule.namePatterns.length > 0 &&
        [
          ...analysis.functions.map((f) => f.name),
          ...analysis.classes.map((c) => c.name),
        ].some((name) => rule.namePatterns.some((p) => p.test(name)));

      const fileScore = (hasImport ? 2 : 0) + (hasPathMatch ? 1 : 0) + (hasNameMatch ? 1 : 0);
      if (fileScore > 0) {
        authFiles.push(path);
        score += fileScore;
      }
    }

    if (authFiles.length === 0) continue;
    candidates.push({ rule, files: authFiles, score });
  }

  if (candidates.length === 0) return null;

  // Pick the highest-scoring candidate
  candidates.sort((a, b) => b.score - a.score);
  const best = candidates[0]!;

  const confidence = Math.min(
    0.97,
    best.rule.baseConfidence * Math.min(1, best.score / 5),
  );

  const evidence: ArchEvidence[] = [
    {
      description: `${best.files.length} file(s) use ${best.rule.label}`,
      sources: best.files.slice(0, 3),
      weight: confidence,
    },
  ];

  // Surface secondary auth systems as evidence
  for (const other of candidates.slice(1, 3)) {
    evidence.push({
      description: `secondary auth signal: ${other.rule.label} (${other.files.length} file(s))`,
      sources: other.files.slice(0, 2),
      weight: 0.3,
    });
  }

  return {
    kind: best.rule.kind,
    label: best.rule.label,
    authFiles: best.files,
    strategy: best.rule.strategy,
    confidence,
    evidence,
  };
}
