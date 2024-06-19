/* eslint-disable @typescript-eslint/no-var-requires */
const Path = require("path");

const defaultStylisticPlugin = require("@stylistic/eslint-plugin");
const javascriptStylisticPlugin = require("@stylistic/eslint-plugin-js");
const typescriptStylisticPlugin = require("@stylistic/eslint-plugin-ts");
const typescriptEslintPlugin = require("@typescript-eslint/eslint-plugin");
const typescriptEslintParser = require("@typescript-eslint/parser");
// const prettierConfig = require("eslint-config-prettier");
const pluginImport = require("eslint-plugin-import");
const pluginImportConfig = require("eslint-plugin-import/config/recommended.js");
// const prettierPlugin = require("eslint-plugin-prettier");
const globals = require("globals");

const allTsExtensionsArray = ["ts", "mts", "cts", "tsx", "mtsx", ".test.ts"];
const allJsExtensionsArray = ["js", "mjs", "cjs", "jsx", "mjsx", ".test.js"];
const allTsExtensions = allTsExtensionsArray.join(",");
const allJsExtensions = allJsExtensionsArray.join(",");
const allExtensions = [...allTsExtensionsArray, ...allJsExtensionsArray].join(
	","
);

const projectDirname = __dirname;

const importRules = {
	"import/no-unresolved": "error",
	"sort-imports": [
		"error",
		{
			allowSeparatedGroups: true,
			ignoreCase: true,
			ignoreDeclarationSort: true,
			ignoreMemberSort: false,
			memberSyntaxSortOrder: ["none", "all", "multiple", "single"],
		},
	],
	"import/order": [
		"error",
		{
			groups: [
				"builtin", // Built-in imports (come from NodeJS native) go first
				"external", // External imports
				"internal", // Absolute imports
				"parent", // Relative imports
				"sibling", // Relative imports
				// ['sibling', 'parent'], // Relative imports, the sibling and parent types they can be mingled together
				"index", // index imports
				"type", // type imports
				"unknown", // unknown
			],
			"newlines-between": "always",
			alphabetize: {
				order: "asc",
				caseInsensitive: true, // ignore case
			},
		},
	],
};

const baseRules = {
	// "prettier/prettier": "warn",
	"@stylistic/max-len": [
		"warn",
		{
			code: 140,
			ignoreComments: true,
			ignoreTrailingComments: true,
			ignoreStrings: true,
			ignoreUrls: true,
		},
	],
	"@stylistic/indent": ["error", "tab"],
	"@stylistic/semi": ["error", "always"],
	"@stylistic/quotes": [
		"warn",
		"double",
		{
			avoidEscape: true,
			allowTemplateLiterals: false,
		},
	],
	"@stylistic/object-curly-spacing": ["warn", "always"],
	"quote-props": ["warn", "as-needed"],
	"@stylistic/padded-blocks": ["warn", { classes: "always" }],
	"@typescript-eslint/no-unsafe-enum-comparison": ["off"],
	"@stylistic/array-element-newline": ["error", "always"],
	"@stylistic/object-property-newline": [
		"error",
		{ allowAllPropertiesOnSameLine: false },
	],
	"@stylistic/array-bracket-newline": ["error", { multiline: true }],
	"@stylistic/object-curly-newline": ["error", { multiline: true }],
	"@stylistic/padding-line-between-statements": [
		"error",
		{
			prev: "class",
			next: "class",
			blankLine: "always",
		},
	],
};

const typescriptRules = {
	// ...prettierConfig.rules,
	...pluginImportConfig.rules,
	...typescriptEslintPlugin.configs.recommended.rules,
	...typescriptEslintPlugin.configs["recommended-type-checked"].rules,
	...typescriptEslintPlugin.configs.strict.rules,
	...typescriptEslintPlugin.configs["strict-type-checked"].rules,
	...typescriptEslintPlugin.configs["stylistic-type-checked"].rules,
	// @ts-expect-error - disable-legacy is not in the typescript-eslint plugin
	...typescriptStylisticPlugin.configs["disable-legacy"].rules,
	...importRules,
	...baseRules,
};

const javascriptRules = {
	// ...prettierConfig.rules,
	...pluginImportConfig.rules,
	...typescriptEslintPlugin.configs.recommended.rules,
	...typescriptEslintPlugin.configs.strict.rules,
	...typescriptEslintPlugin.configs["stylistic"].rules,
	// @ts-expect-error - disable-legacy is not in the typescript-eslint plugin
	...javascriptStylisticPlugin.configs["disable-legacy"].rules,
	...importRules,
	...baseRules,
};

const typescriptRulesDev = {
	"@typescript-eslint/no-explicit-any": ["warn"],
	"@typescript-eslint/no-unused-vars": ["warn"],
	"@typescript-eslint/prefer-nullish-coalescing": ["off"],
	"@typescript-eslint/no-inferrable-types": ["off"],
	"@typescript-eslint/dot-notation": ["off"],
	"@typescript-eslint/no-namespace": ["off"],
	"@typescript-eslint/no-extraneous-class": ["off"],
};

const javascriptRulesDev = { "@typescript-eslint/no-unused-vars": ["warn"] };

module.exports = [
	{
		/* setup parser for all files */
		files: [`**/*.{${allExtensions}}`],
		languageOptions: {
			parser: typescriptEslintParser,
			parserOptions: {
				ecmaVersion: "latest", // 2024 sets the ecmaVersion parser option to 15
				tsconfigRootDir: Path.resolve(projectDirname),
				project: "./tsconfig.json",
				sourceType: "module",
			},
		},
	},
	{
		/* all typescript files, except config files */
		files: [`**/*.{${allTsExtensions}}`],
		ignores: [`**/*.config.{${allTsExtensions}}`],
		languageOptions: {
			globals: {
				...globals.node,
				...globals.es2021,
			},
		},
		settings: {
			"import/resolver": {
				typescript: {},
				node: {},
			},
		},
		plugins: {
			"@typescript-eslint": typescriptEslintPlugin,
			"@stylistic": defaultStylisticPlugin,
			import: pluginImport,
			// prettier: prettierPlugin
		},
		rules: {
			...typescriptRules,
			...typescriptRulesDev,
		},
	},
	{
		/* all javascript files, except config */
		files: [`**/*.{${allJsExtensions}}`],
		ignores: [`**/*.config.{${allJsExtensions}}`],
		languageOptions: {
			globals: {
				...globals.node,
				...globals.es2021,
			},
		},
		settings: {
			"import/resolver": {
				typescript: {},
				node: {},
			},
		},
		plugins: {
			"@typescript-eslint": typescriptEslintPlugin,
			"@stylistic": defaultStylisticPlugin,
			import: pluginImport,
			// prettier: prettierPlugin
		},
		rules: {
			...javascriptRules,
			...javascriptRulesDev,
		},
	},
	{
		/* config files: typescript */
		files: [`**/*.config.{${allTsExtensions}}`],
		settings: {
			"import/resolver": {
				typescript: {},
				node: {},
			},
		},
		plugins: {
			"@typescript-eslint": typescriptEslintPlugin,
			"@stylistic": defaultStylisticPlugin,
			import: pluginImport,
			// prettier: prettierPlugin
		},
		rules: {
			...typescriptRules,
			// '@typescript-eslint/prefer-nullish-coalescing': ['off'],
		},
	},
	{
		/* config files: javascript */
		files: [`**/*.config.{${allJsExtensions}}`],
		settings: {
			"import/parsers": {
				espree: [".js", ".mjs", ".cjs", ".jsx", ".mjsx"],
			},
			"import/resolver": {
				typescript: {},
				node: {},
			},
		},
		plugins: {
			"@typescript-eslint": typescriptEslintPlugin,
			"@stylistic": defaultStylisticPlugin,
			import: pluginImport,
			// prettier: prettierPlugin
		},
		rules: {
			...javascriptRules,
			"@typescript-eslint/no-unsafe-member-access": ["off"],
			"@typescript-eslint/no-unsafe-assignment": ["off"],
		},
	},
	{
		ignores: [
			"dist",
			"build",
			"**/*_lintignore*",
			"**/*-buildignore*",
			"**/*_buildignore*",
			"coverage",
		],
	},
];
