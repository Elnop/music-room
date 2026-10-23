// dependency-cruiser: layer direction, no cross-feature import, no cycle.
// Each rule's `comment` points to its section in .agents/rules/architecture.md.
// Known violations live in .dependency-cruiser-known-violations.json and may
// only shrink (see .agents/rules/guardrails.md).
/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    {
      name: 'no-circular',
      severity: 'error',
      comment: 'Circular dependency. See .agents/rules/architecture.md#no-circular',
      from: {},
      to: { circular: true },
    },
    {
      name: 'no-cross-feature-imports',
      severity: 'error',
      comment:
        'A feature imports another feature; move the shared code to src/shared/. See .agents/rules/architecture.md#no-cross-feature-imports',
      from: { path: '^src/features/([^/]+)/' },
      to: { path: '^src/features/([^/]+)/', pathNot: '^src/features/$1/' },
    },
    {
      name: 'shared-not-to-features',
      severity: 'error',
      comment:
        'src/shared/ must not import src/features/ or src/realtime/. See .agents/rules/architecture.md#layers',
      from: { path: '^src/shared/' },
      to: { path: '^src/(features|realtime)/' },
    },
    {
      name: 'app-only-from-server',
      severity: 'error',
      comment:
        'src/app/ is the composition root (routes registry, OpenAPI document): it may import features and shared, and only src/server.ts imports it. See .agents/rules/architecture.md#layers',
      from: { path: '^src/', pathNot: ['^src/server\\.ts$', '^src/app/'] },
      to: { path: '^src/app/' },
    },
    {
      name: 'services-not-to-controller',
      severity: 'error',
      comment:
        'A service must not import a controller or a routes file (routes -> controller -> services -> shared). See .agents/rules/architecture.md#layers',
      from: { path: '^src/features/[^/]+/services/' },
      to: { path: '\\.(controller|routes)\\.ts$' },
    },
  ],
  options: {
    doNotFollow: { path: 'node_modules' },
    exclude: { path: '^src/shared/types/supabase\\.generated\\.ts$' },
    tsConfig: { fileName: 'tsconfig.json' },
    tsPreCompilationDeps: true,
    enhancedResolveOptions: {
      exportsFields: ['exports'],
      conditionNames: ['import', 'require', 'node', 'default', 'types'],
      extensions: ['.ts', '.js', '.json'],
    },
  },
};
