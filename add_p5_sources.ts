/// <reference types="@types/bun" />

// Este pequeño script agrega el código fuente de p5, para ofrecer un link de
// descarga de la versión exacta que se usó.

import { resolve } from "node:path";
import { create } from "tar";

const sources = resolve(import.meta.dirname, "node_modules", "p5");

await create(
	{
		gzip: true,
		file: resolve(import.meta.dirname, "public", "p5-sources.tar.gz"),
		cwd: sources,
	},
	["."],
);
