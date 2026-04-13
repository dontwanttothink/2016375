/// <reference types="@types/bun" />
import { readdir } from "node:fs/promises";
import { resolve } from "node:path";
import { defineConfig } from "vite";

const hostname = "https://2016375-f5d5d5.gitlab.io";

async function inputs(root: string) {
	return (
		await readdir(root, {
			recursive: true,
			withFileTypes: true,
		})
	)
		.filter((f) => f.isFile())
		.map((f) => resolve(f.parentPath, f.name));
}

export default defineConfig({
	build: {
		sourcemap: true,
		license: {
			fileName: "licencias.md",
		},
		rolldownOptions: {
			input: [
				resolve(import.meta.dirname, "index.html"),
				...(await inputs(resolve(import.meta.dirname, "proyectos"))),
				...(await inputs(resolve(import.meta.dirname, "demos"))),
			],
			output: {
				postBanner: `/* Consulta la información de derechos de autor de las dependencias incluidas aquí: ${hostname}/licencias.md\nObtén más información sobre el código fuente y las licencias GPL y LGPL en la página principal: ${hostname} */`,
			},
		},
	},
});
