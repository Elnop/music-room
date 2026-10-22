// Git renames for check-exceptions.mjs: an exception entry or an inline
// escape follows its file when the file moves.

// Parses `git diff --name-status -M -z` output into [old, new] repository
// paths, renames only.
export function parseRenames(output) {
  const fields = output.split('\0');
  const renames = [];
  for (let i = 0; i < fields.length; ) {
    const status = fields[i];
    if (status.startsWith('R')) {
      renames.push([fields[i + 1], fields[i + 2]]);
      i += 3;
    } else {
      i += status.startsWith('C') ? 3 : 2;
    }
  }
  return renames;
}

// Rewrites a path at the end of an entry to the file's new path, on a path
// boundary. A list of one project (`project` given) follows only the renames
// inside that project, matched from the repository root or from the project
// root (`**/src/a.ts`). A shared list (`project` undefined) matches repository
// paths only (`/mobile/src/a.ts`), so a move in one project never rewrites an
// entry of the other.
export function followRenames(entry, renames, project) {
  for (const [from, to] of renames) {
    const candidates = [];
    if (project === undefined) {
      candidates.push([from, to]);
    } else if (from.startsWith(`${project}/`) && to.startsWith(`${project}/`)) {
      candidates.push([from, to], [from.slice(project.length + 1), to.slice(project.length + 1)]);
    }
    for (const [oldPath, newPath] of candidates) {
      if (entry.endsWith(`/${oldPath}`) || entry.endsWith(` ${oldPath}`)) {
        return entry.slice(0, -oldPath.length) + newPath;
      }
    }
  }
  return entry;
}
