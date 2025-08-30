// @ts-check
import { defineConfig } from 'astro/config';
import solid from '@astrojs/solid-js';
import { defineAstro } from 'qgp';
import deno from '@astrojs/deno';

import { common } from './qgp.config.mjs';

// https://astro.build/config
export default defineConfig({
	site: 'https://qgp-gpt.deno.dev',
	integrations: [solid()],
	vite: defineAstro(common, {}),
	server: { port: 3000 },
	output: 'server',
	adapter: deno(),
});
