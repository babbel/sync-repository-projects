import js from '@eslint/js';
import importX from 'eslint-plugin-import-x';
import globals from 'globals';

export default [
    {
        ignores: ['dist/*.js'],
    },
    js.configs.recommended,
    {
        plugins: { import: importX },
        languageOptions: {
            ecmaVersion: 'latest',
            sourceType: 'module',
            globals: {
                ...globals.es2021,
                ...globals.node,
                ...globals.jest,
            },
        },
        rules: {
            'no-restricted-syntax': 'off',
            'import/no-unresolved': ['error', {
                ignore: ['@octokit/core', '^@octokit/plugin-paginate-graphql'],
            }],
        },
    },
];
