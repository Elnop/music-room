// dependency-cruiser: layer direction, no cross-feature import, no cycle.
// Each rule's `comment` points to its section in .agents/rules/architecture.md.
// The features/, shared/ and navigation/ rules describe the target layout and
// match nothing until #377 creates those folders. Known violations live in
// .dependency-cruiser-known-violations.json and may only shrink (see
// .agents/rules/guardrails.md).
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
        'src/shared/ must not import src/features/ or src/navigation/. See .agents/rules/architecture.md#layers',
      from: { path: '^src/shared/' },
      to: { path: '^src/(features|navigation)/' },
    },
    {
      name: 'features-not-to-navigation',
      severity: 'error',
      comment:
        'src/features/ must not import src/navigation/. See .agents/rules/architecture.md#layers',
      from: { path: '^src/features/' },
      to: { path: '^src/navigation/' },
    },
  ],
  options: {
    doNotFollow: { path: 'node_modules' },
    tsConfig: { fileName: 'tsconfig.json' },
    tsPreCompilationDeps: true,
    enhancedResolveOptions: {
      exportsFields: ['exports'],
      conditionNames: ['import', 'require', 'node', 'default', 'types', 'react-native'],
      extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
      mainFields: ['react-native', 'module', 'main', 'types'],
    },
  },
};
