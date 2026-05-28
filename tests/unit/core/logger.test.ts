import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { Logger } from "../../../src/core/logger/index.js";

describe("Logger", () => {
  let stdoutSpy: ReturnType<typeof vi.spyOn>;
  let stderrSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    stdoutSpy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
    stderrSpy = vi.spyOn(process.stderr, "write").mockImplementation(() => true);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("writes info messages to stdout", () => {
    const log = new Logger({ level: "debug", format: "pretty" });
    log.info("hello world");
    expect(stdoutSpy).toHaveBeenCalled();
    const output = (stdoutSpy.mock.calls[0]?.[0] as string) ?? "";
    expect(output).toContain("hello world");
  });

  it("writes errors to stderr", () => {
    const log = new Logger({ level: "error", format: "pretty" });
    log.error("something broke");
    expect(stderrSpy).toHaveBeenCalled();
    const output = (stderrSpy.mock.calls[0]?.[0] as string) ?? "";
    expect(output).toContain("something broke");
  });

  it("suppresses messages below the configured level", () => {
    const log = new Logger({ level: "warn", format: "pretty" });
    log.debug("should be suppressed");
    log.info("also suppressed");
    expect(stdoutSpy).not.toHaveBeenCalled();
  });

  it("child logger inherits settings and appends tag", () => {
    const log = new Logger({ level: "debug", format: "pretty" });
    const child = log.child("mymodule");
    child.info("from child");
    const output = (stdoutSpy.mock.calls[0]?.[0] as string) ?? "";
    expect(output).toContain("[mymodule]");
  });

  it("outputs valid JSON in json format", () => {
    const log = new Logger({ level: "debug", format: "json" });
    log.info("json test");
    const raw = (stdoutSpy.mock.calls[0]?.[0] as string) ?? "";
    const parsed = JSON.parse(raw) as { level: string; message: string };
    expect(parsed.level).toBe("info");
    expect(parsed.message).toBe("json test");
  });
});
