import type p5 from "p5";
import type { Stage } from ".";

interface StageGridDescriptor {
	origin: [number, number];
	cellSize: number;
}

export class StageGrid {
	static assertIsValidDescriptor(
		descriptor: unknown,
		source: URL,
	): asserts descriptor is StageGridDescriptor {
		const MUST = "el descriptor de la cuadrícula debe";
		const SOURCE = `(en ${source.href})`;
		const msg = (str: string) => `${MUST} ${str}. ${SOURCE}`;

		if (!descriptor || typeof descriptor !== "object") {
			throw new TypeError(msg("ser un objeto"));
		}

		if (!("origin" in descriptor)) {
			throw new TypeError(msg("indicar un origen (origin)"));
		}

		if (!("cellSize" in descriptor)) {
			throw new TypeError(msg("indicar el tamaño de una celda (cellSize)"));
		}

		const { cellSize, origin } = descriptor;

		if (typeof cellSize !== "number") {
			throw new TypeError("cellSize debe ser un número.");
		}

		if (
			!Array.isArray(origin) ||
			origin.length !== 2 ||
			origin.some((x) => typeof x !== "number")
		) {
			throw new TypeError("origin debe ser un arreglo de dos números");
		}
	}

	#p?: p5;
	#stage?: Stage;

	get p(): p5 {
		if (!this.#p) {
			throw new ReferenceError();
		}
		return this.#p;
	}

	get stage(): Stage {
		if (!this.#stage) {
			throw new ReferenceError();
		}
		return this.#stage;
	}

	origin: [number, number];

	/**
	 * en términos de un pixel del escenario
	 */
	cellSize: number;

	constructor(origin: [number, number], cellSize: number) {
		this.origin = origin;
		this.cellSize = cellSize;
	}

	assignToStage(p: p5, stage: Stage) {
		this.#p = p;
		this.#stage = stage;
	}

	fromStageSpace(location: [number, number]): [number, number] {
		return [
			Math.floor((location[0] - this.origin[0]) / this.cellSize),
			Math.floor((location[1] - this.origin[1]) / this.cellSize),
		];
	}

	toStageSpace(gridLocation: [number, number]): [number, number] {
		return [
			this.origin[0] + (gridLocation[0] + 0.5) * this.cellSize,
			this.origin[1] + (gridLocation[1] + 0.5) * this.cellSize,
		];
	}

	highlight(radius: number, from: [number, number]) {
		// this.#since;
		// this.#highlight =
	}

	drawHighlights() {}
}
