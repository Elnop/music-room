import { dirname } from 'node:path';

export function checkTreeEntry(message) {
  const [folder, ...rest] = message.split(':')[0].split(' ');
  const verdict = rest
    .join(' ')
    .replace(/\s*\([^)]*\)/g, '')
    .replace(/\b\d+\s+/g, '');
  return `${folder} ${verdict}`;
}

export function followFolderRenames(entry, renames, project) {
  const [folder, ...verdict] = entry.split(' ');
  for (const [from, to] of renames) {
    if (dirname(from) === `${project}/${folder}`) {
      return [dirname(to).slice(project.length + 1), ...verdict].join(' ');
    }
  }
  return entry;
}
