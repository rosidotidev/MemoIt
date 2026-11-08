// @ts-check
const eslint = require('@eslint/js');
const { defineConfig, globalIgnores } = require('eslint/config');
const tseslint = require('typescript-eslint');
const angular = require('angular-eslint');

const FIREBASE = [
  { regex: '^(firebase|@firebase)(/|$)', message: 'Only src/app/core/data may import Firebase (AD-1).' },
];

/** Builds a no-restricted-imports rule forbidding the given layers (by directory name). */
function forbidLayers(layers, extra = []) {
  return [
    'error',
    {
      patterns: [
        ...extra,
        ...layers.map((layer) => ({
          regex: `(^|/)${layer}(/|$)`,
          message: `Import not allowed by the layer table (AD-1 / allowed-imports): ${layer}.`,
        })),
      ],
    },
  ];
}

// Layers: domain <- core/state <- core/data <- shared <- features <- shell
const layerRules = [
  {
    // domain is pure: imports nothing outside itself, no Angular, no Firebase, no DOM.
    files: ['src/app/domain/**/*.ts'],
    ignores: ['**/*.spec.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            { regex: '^\\.\\./', message: 'domain imports nothing from other layers.' },
            { regex: '^@angular/', message: 'No Angular in domain.' },
            { regex: '^rxjs', message: 'No framework code in domain.' },
            ...FIREBASE,
          ],
        },
      ],
      'no-restricted-globals': [
        'error',
        ...['window', 'document', 'navigator', 'localStorage', 'sessionStorage', 'location', 'HTMLElement'].map(
          (name) => ({ name, message: 'No DOM access in domain.' }),
        ),
      ],
    },
  },
  {
    files: ['src/app/core/state/**/*.ts'],
    rules: { 'no-restricted-imports': forbidLayers(['data', 'shared', 'features', 'shell'], FIREBASE) },
  },
  {
    // core/data is the only place allowed to import firebase/*.
    files: ['src/app/core/data/**/*.ts'],
    rules: { 'no-restricted-imports': forbidLayers(['shared', 'features', 'shell']) },
  },
  {
    files: ['src/app/shared/**/*.ts'],
    rules: { 'no-restricted-imports': forbidLayers(['features', 'shell'], FIREBASE) },
  },
  {
    files: ['src/app/features/**/*.ts'],
    rules: { 'no-restricted-imports': forbidLayers(['shell'], FIREBASE) },
  },
  {
    files: ['src/app/shell/**/*.ts'],
    rules: { 'no-restricted-imports': ['error', { patterns: FIREBASE }] },
  },
  {
    files: ['src/app/*.ts', 'src/app/core/*.ts', 'src/main.ts', 'src/environments/**/*.ts'],
    rules: { 'no-restricted-imports': ['error', { patterns: FIREBASE }] },
  },
];

module.exports = defineConfig([
  globalIgnores(['dist/**', '.angular/**', 'node_modules/**', 'tests/**', 'scripts/**', 'coverage/**']),
  {
    files: ['**/*.ts'],
    extends: [eslint.configs.recommended, tseslint.configs.recommended, tseslint.configs.stylistic, angular.configs.tsRecommended],
    processor: angular.processInlineTemplates,
    rules: {
      '@angular-eslint/directive-selector': ['error', { type: 'attribute', prefix: 'memo', style: 'camelCase' }],
      '@angular-eslint/component-selector': ['error', { type: 'element', prefix: 'memo', style: 'kebab-case' }],
    },
  },
  {
    files: ['**/*.html'],
    extends: [angular.configs.templateRecommended, angular.configs.templateAccessibility],
    rules: {},
  },
  ...layerRules,
  {
    // AD-15b: dates are built and read only in domain/time.ts and ClockService.
    files: ['src/**/*.ts'],
    ignores: ['src/app/domain/time.ts', 'src/app/core/state/clock.service.ts', '**/*.spec.ts'],
    rules: {
      'no-restricted-syntax': [
        'error',
        { selector: "NewExpression[callee.name='Date']", message: 'Build dates in domain/time.ts only (AD-15b).' },
        { selector: "CallExpression[callee.object.name='Date']", message: 'Use domain/time.ts or ClockService (AD-15b).' },
        { selector: "MemberExpression[object.name='Intl'][property.name='NumberFormat']", message: 'Format numbers in domain/number.ts only (AD-16).' },
      ],
    },
  },
  {
    // AD-16 / AD-15d: numbers are parsed and formatted only in domain/number.ts.
    files: ['src/**/*.ts'],
    ignores: ['src/app/domain/number.ts', '**/*.spec.ts'],
    rules: {
      'no-restricted-properties': [
        'error',
        { property: 'toFixed', message: 'Format numbers in domain/number.ts only (AD-16).' },
        { property: 'toLocaleString', message: 'Format numbers in domain/number.ts only (AD-16).' },
      ],
    },
  },
  {
    // Firebase config file lives next to the data layer; specs may import test helpers freely.
    files: ['**/*.spec.ts'],
    rules: { 'no-restricted-imports': 'off', 'no-restricted-globals': 'off' },
  },
]);
