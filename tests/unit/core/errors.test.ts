import { describe, expect, it } from "vitest";

import {
  CommandError,
  ConfigNotFoundError,
  ConfigValidationError,
  DocSmithError,
  FileSystemError,
  PluginError,
} from "../../../src/core/errors/index.js";

describe("DocSmithError", () => {
  it("sets name, code, and exitCode", () => {
    const err = new DocSmithError("test message", "TEST_CODE", 2);
    expect(err.name).toBe("DocSmithError");
    expect(err.code).toBe("TEST_CODE");
    expect(err.exitCode).toBe(2);
    expect(err.message).toBe("test message");
  });

  it("is an instanceof Error", () => {
    expect(new DocSmithError("msg")).toBeInstanceOf(Error);
  });
});

describe("ConfigNotFoundError", () => {
  it("includes searched paths in the message", () => {
    const err = new ConfigNotFoundError(["/foo/docsmith.config.js"]);
    expect(err.message).toContain("/foo/docsmith.config.js");
    expect(err.code).toBe("CONFIG_NOT_FOUND");
    expect(err).toBeInstanceOf(DocSmithError);
  });
});

describe("ConfigValidationError", () => {
  it("formats issues into a readable message", () => {
    const err = new ConfigValidationError([
      { path: "name", message: "Required" },
    ]);
    expect(err.message).toContain("name");
    expect(err.message).toContain("Required");
    expect(err.issues).toHaveLength(1);
  });
});

describe("PluginError", () => {
  it("prefixes the plugin name", () => {
    const err = new PluginError("my-plugin", "something broke");
    expect(err.message).toContain("my-plugin");
    expect(err.pluginName).toBe("my-plugin");
  });
});

describe("CommandError", () => {
  it("stores the command name", () => {
    const err = new CommandError("build", "Build failed");
    expect(err.command).toBe("build");
  });
});

describe("FileSystemError", () => {
  it("includes the file path", () => {
    const err = new FileSystemError("/some/path.md", "Could not read");
    expect(err.message).toContain("/some/path.md");
    expect(err.filePath).toBe("/some/path.md");
  });
});
