import tailwindcss from '@tailwindcss/vite'

const tsConfig = {
	compilerOptions: {
		allowImportingTsExtensions: true,
		allowUnreachableCode: false,
		erasableSyntaxOnly: true,
		forceConsistentCasingInFileNames: true,
		noErrorTruncation: true,
		noFallthroughCasesInSwitch: true,
		noImplicitOverride: true,
		noImplicitReturns: true,
		noUncheckedIndexedAccess: true,
		noUnusedLocals: false,
		noUnusedParameters: false,
		useUnknownInCatchVariables: true,
		strict: true,
	},
}

export default defineNuxtConfig({
	modules: ['@nuxt/eslint', '@nuxt/fonts', '@nuxt/test-utils', '@nuxt/image', '@vueuse/nuxt'],
	devtools: { enabled: true },
	css: ['~/assets/css/main.css'],
	experimental: {
		typedPages: true,
	},
	compatibilityDate: '2025-07-15',
	vite: {
		plugins: [tailwindcss()],
	},
	typescript: {
		tsConfig,
		sharedTsConfig: tsConfig,
		nodeTsConfig: tsConfig,
	},
	eslint: {
		config: {
			nuxt: {
				sortConfigKeys: true,
			},
		},
	},
})
