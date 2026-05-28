import type { Dependency, DependencyType, PackageJson } from "../types.js";

export function extractDependencies(
  pkg: PackageJson,
  source: string,
): Dependency[] {
  const groups: Array<[DependencyType, Record<string, string> | undefined]> = [
    ["prod", pkg.dependencies],
    ["dev", pkg.devDependencies],
    ["peer", pkg.peerDependencies],
    ["optional", pkg.optionalDependencies],
  ];

  return groups.flatMap(([type, deps]) =>
    deps
      ? Object.entries(deps).map(([name, version]) => ({
          name,
          version,
          type,
          source,
        }))
      : [],
  );
}
