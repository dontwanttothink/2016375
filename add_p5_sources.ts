/// <reference types="@types/bun" />

// Este pequeño script agrega el código fuente de p5 y p5.quadrille, para
// ofrecer un link de descarga de la versión exacta que se usó.

import { resolve } from "node:path";
import { create } from "tar";

const sources = resolve(import.meta.dirname, "node_modules");

await create(
	{
		gzip: true,
		file: resolve(import.meta.dirname, "public", "p5-sources.tar.gz"),
		cwd: resolve(sources, "p5"),
	},
	["."],
);

await create(
	{
		gzip: true,
		file: resolve(import.meta.dirname, "public", "p5-quadrille-sources.tar.gz"),
		cwd: resolve(sources, "p5.quadrille"),
	},
	["."],
);
