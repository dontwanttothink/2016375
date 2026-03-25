/// <reference types="@types/bun" />
import { resolve } from "node:path";
import { defineConfig } from "vite";

const hostname = "https://2016375-f5d5d5.gitlab.io";

export default defineConfig({
	build: {
		sourcemap: true,
		license: {
			fileName: "licencias.md",
		},
		rolldownOptions: {
			input: {
				main: resolve(__dirname, "index.html"),
				project1: resolve(import.meta.dirname, "proyectos/1/index.html"),
				project2: resolve(import.meta.dirname, "proyectos/2/index.html"),
				project3: resolve(import.meta.dirname, "proyectos/3/index.html"),
			},
			output: {
				postBanner: `/* Consulta la información de derechos de autor de las dependencias incluidas aquí: ${hostname}/licencias.md\nObtén más información sobre el código fuente y las licencias GPL y LGPL en la página principal: ${hostname} */`,
			},
		},
	},
});
