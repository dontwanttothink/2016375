import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
	build: {
		rollupOptions: {
			input: {
				main: resolve(__dirname, "index.html"),
				project1: resolve(__dirname, "proyectos/1/index.html"),
				project2: resolve(__dirname, "proyectos/2/index.html"),
				project3: resolve(__dirname, "proyectos/3/index.html"),
			},
		},
	},
});
