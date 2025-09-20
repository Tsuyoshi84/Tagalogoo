// @ts-check
import withNuxt from './.nuxt/eslint.config.mjs'

export default withNuxt(
	// Your custom configs here
).override('nuxt/vue/rules', {
	rules: {
		'vue/block-order': ['error', { order: ['docs', 'script', 'template', 'style'] }],
		'vue/component-api-style': ['error', ['script-setup', 'composition']],
		'vue/component-name-in-template-casing': [
			'error',
			'PascalCase',
			{
				registeredComponentsOnly: false,
				ignores: [],
			},
		],
		'vue/component-options-name-casing': ['error', 'PascalCase'],
		'vue/custom-event-name-casing': ['error', 'camelCase'],
		'vue/define-emits-declaration': ['error', 'type-based'],
		'vue/define-macros-order': [
			'error',
			{
				order: ['defineOptions', 'defineModel', 'defineProps', 'defineEmits', 'defineSlots'],
				defineExposeLast: true,
			},
		],
		'vue/define-props-declaration': ['error', 'type-based'],
		'vue/html-button-has-type': 'error',
		'vue/html-comment-content-spacing': ['error', 'always'],
		'vue/html-self-closing': [
			'warn',
			{
				html: {
					void: 'any',
					normal: 'any',
					component: 'always',
				},
			},
		],
		'vue/no-boolean-default': 'error',
		'vue/no-required-prop-with-default': 'error',
		'vue/no-unused-properties': ['error', { groups: ['setup'] }],
		'vue/no-unused-refs': 'error',
		'vue/no-useless-mustaches': [
			'error',
			{ ignoreIncludesComment: true, ignoreStringEscape: true },
		],
		'vue/padding-line-between-blocks': 'error',
		'vue/prefer-true-attribute-shorthand': 'error',
		'vue/require-prop-comment': ['warn', { type: 'JSDoc' }],
		'vue/require-macro-variable-name': [
			'error',
			{
				defineProps: 'props',
				defineEmits: 'emit',
				defineSlots: 'slots',
				useSlots: 'slots',
				useAttrs: 'attrs',
			},
		],
		'vue/v-bind-style': [
			'error',
			'shorthand',
			{
				sameNameShorthand: 'never',
			},
		],

		// Disabled rules
		'vue/no-child-content': 'off',
		'vue/no-deprecated-dollar-listeners-api': 'off',
		'vue/no-deprecated-dollar-scopedslots-api': 'off',
		'vue/no-deprecated-filter': 'off',
		'vue/no-deprecated-html-element-is': 'off',
		'vue/no-deprecated-inline-template': 'off',
		'vue/no-deprecated-router-link-tag-prop': 'off',
		'vue/no-deprecated-scope-attribute': 'off',
		'vue/no-deprecated-slot-attribute': 'off',
		'vue/no-deprecated-slot-scope-attribute': 'off',
		'vue/no-deprecated-v-bind-sync': 'off',
		'vue/no-deprecated-v-is': 'off',
		'vue/no-deprecated-v-on-native-modifier': 'off',
		'vue/no-deprecated-v-on-number-modifiers': 'off',
		'vue/require-default-prop': 'off',
	},
})
