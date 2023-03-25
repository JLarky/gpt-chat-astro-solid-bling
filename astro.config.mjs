// @ts-check
import { defineConfig } from 'astro/config';
import solid from '@astrojs/solid-js';
import { defineAstro } from 'qgp';
import deno from '@astrojs/deno';
import nodePolyfills from 'rollup-plugin-polyfill-node';

import { common } from './qgp.config.mjs';

// https://astro.build/config
export default defineConfig({
	site: 'https://qgp-qgp.deno.dev',
	integrations: [solid()],
	vite: defineAstro(common, {
		plugins: [nodePolyfills()],
		ssr: {
			external: ['gpt3-tokenizer'],
		},
	}),
	server: { port: 3000 },
	output: 'server',
	adapter: deno(),
});
