import type { ApiFramework, HttpMethod, SourceRange } from "../types.js";

export type RouteMethod = HttpMethod;

export type AuthStrategy =
  | "jwt"
  | "session"
  | "apikey"
  | "oauth"
  | "basic"
  | "custom"
  | "none";

export type ValidationLib =
  | "zod"
  | "joi"
  | "yup"
  | "class-validator"
  | "typebox"
  | "custom"
  | "unknown";

export type MiddlewarePurpose =
  | "auth"
  | "cors"
  | "logging"
  | "ratelimit"
  | "parsing"
  | "compression"
  | "validation"
  | "error"
  | "unknown";

export type ParamLocation = "path" | "query" | "body" | "header";

export interface RouteParam {
  name: string;
  in: ParamLocation;
  required: boolean;
  /** Inferred TypeScript type or schema name if available. */
  schema?: string;
}

export interface MiddlewareRef {
  name: string;
  purpose: MiddlewarePurpose;
  /** String arguments passed to the middleware factory (first 2 only). */
  args: string[];
}

export interface AuthInfo {
  protected: boolean;
  strategy: AuthStrategy;
  /** Role strings found in middleware args (e.g. "ADMIN", "USER"). */
  roles: string[];
  /** Scope strings found in middleware args (e.g. "read:users"). */
  scopes: string[];
}

export interface ValidationInfo {
  lib: ValidationLib;
  target: "body" | "query" | "params" | "headers" | "response" | "unknown";
  /** Named schema identifier if not inline (e.g. "CreateUserSchema"). */
  schemaName?: string;
  inline: boolean;
}

/**
 * Rich metadata for a single API route handler. All optional fields are
 * populated on a best-effort basis from static analysis.
 */
export interface RouteEntry {
  /** URL pattern in Express/OpenAPI :param style (undefined for tRPC). */
  path?: string;
  methods: RouteMethod[];
  /** Function or variable name that handles the request. */
  handler: string;
  framework: ApiFramework;
  /** Prefix contributed by a parent router/group, if resolved. */
  groupPath?: string;
  /** Derived from JSDoc @tag or leading path segments — used for docs grouping. */
  tags: string[];
  /** From leading JSDoc comment, if present. */
  description?: string;
  middleware: MiddlewareRef[];
  auth: AuthInfo;
  validation: ValidationInfo[];
  params: RouteParam[];
  isExported: boolean;
  location: SourceRange;
}

/**
 * A logical grouping of routes under a shared path prefix.
 * Populated when a named router/subapp is detected, or derived
 * heuristically from common path prefix across routes.
 */
export interface RouteGroup {
  /** Shared URL prefix for all routes in this group. */
  prefix: string;
  /** Middleware applied at the group level. */
  middleware: MiddlewareRef[];
  routes: RouteEntry[];
  nested: RouteGroup[];
}

export interface RouteAnalysis {
  /** Primary framework detected in this file. */
  framework: ApiFramework;
  /** All routes found — flat list, regardless of grouping. */
  routes: RouteEntry[];
  /** Routes grouped by shared path prefix. */
  groups: RouteGroup[];
}
