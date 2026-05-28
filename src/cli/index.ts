#!/usr/bin/env node

/**
 * DocSmith CLI entrypoint.
 *
 * This file's only job: bootstrap the environment and hand off to the program.
 * Keep it thin — no business logic here.
 */

import { loadEnv } from "../utils/env.js";
import { createProgram } from "./program.js";

// Load .env before anything else so env vars are available to all modules
loadEnv();

const program = createProgram();

// Parse argv — Commander handles --help, --version, and unknown commands
await program.parseAsync(process.argv);
