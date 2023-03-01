// @ts-check
import { defineConfig } from 'astro/config';
import solid from '@astrojs/solid-js';
import { defineAstro } from 'qgp';

import { common } from './qgp.config.mjs';

// https://astro.build/config
export default defineConfig({
	site: 'https://example.com',
	integrations: [solid()],
	vite: defineAstro(common, {}),
	server: { port: 3000 },
});
