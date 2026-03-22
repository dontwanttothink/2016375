/// <reference types="@types/bun" />
import { resolve } from "node:path";
import { defineConfig } from "vite";

export default defineConfig({
	build: {
		rolldownOptions: {
			input: {
				main: resolve(__dirname, "index.html"),
				project1: resolve(import.meta.dirname, "proyectos/1/index.html"),
				project2: resolve(import.meta.dirname, "proyectos/2/index.html"),
				project3: resolve(import.meta.dirname, "proyectos/3/index.html"),
			},
		},
	},
});
