import {cloudflareTest, readD1Migrations} from "@cloudflare/vitest-pool-workers";
import {defineConfig} from "vitest/config";
import path from "node:path";

export default defineConfig({
	plugins: [
		cloudflareTest(async () => ({
			wrangler: {
				configPath: "./wrangler.jsonc",
			},
			miniflare: {
				bindings: {
					TEST_MIGRATIONS: await readD1Migrations(
						path.join(process.cwd(), "migrations"),
					),
				},
			},
		})),
	],
	test: {
		include: ["tests/**/*.test.ts"],
		setupFiles: ["./tests/setup.ts"],
	},
});
