import type p5 from "p5";
import { expect, IntegerPairMap } from "../utils";
import { StageComponent } from "./component";

interface StageGridDescriptor {
	origin: [number, number];
	cellSize: number;
}

export class StageGrid extends StageComponent {
	static HIGHLIGHT_ANIMATION_DURATION: number = 200;

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

	#highlight: {
		radius: number;
		from: [number, number];
		color: p5.Color;
		mode: "move" | "attack";
	} | null = null;

	#highlightedCells: IntegerPairMap<{
		opacity: number;
		color: p5.Color;
	}> = new IntegerPairMap();

	origin: [number, number];

	/**
	 * en términos de un pixel del escenario
	 */
	cellSize: number;

	constructor(origin: [number, number], cellSize: number) {
		super();
		this.origin = origin;
		this.cellSize = cellSize;
	}

	normalizeStageSpace(location: [number, number]): [number, number] {
		return this.toStageSpace(this.fromStageSpace(location));
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

	/**
	 * @param radius
	 * @param from en términos del espacio de la cuadrícula
	 * @param color
	 * @param mode
	 */
	highlight(
		radius: number,
		from: [number, number],
		color: p5.Color,
		mode: "move" | "attack" = "move",
	) {
		this.#highlight = { radius, from, color, mode };
	}

	stopHighlighting() {
		this.#highlight = null;
	}

	drawHighlights() {
		if (!this.#highlight && this.#highlightedCells.size === 0) {
			return;
		}

		const [startX, startY] = this.fromStageSpace([0, 0]);
		const [endX, endY] = this.fromStageSpace([
			this.stage.width,
			this.stage.height,
		]);

		this.p.push();
		this.p.rectMode(this.p.CENTER);

		this.p.noStroke();

		// actualizar estado

		for (let i = startX; i < endX; ++i) {
			for (let j = startY; j < endY; ++j) {
				if (this.#isHighlighting([i, j])) {
					const { color } = expect(this.#highlight);
					const cellState = this.#highlightedCells.getOrInsert([i, j], {
						opacity: 0,
						color,
					});

					cellState.opacity = Math.min(
						cellState.opacity +
							(200 / StageGrid.HIGHLIGHT_ANIMATION_DURATION) * this.p.deltaTime,
						200,
					);
				} else {
					const cellState = this.#highlightedCells.get([i, j]);
					if (cellState) {
						cellState.opacity = Math.max(
							cellState.opacity -
								(200 / (StageGrid.HIGHLIGHT_ANIMATION_DURATION / 2)) *
									this.p.deltaTime,
							0,
						);

						if (cellState.opacity === 0) {
							this.#highlightedCells.delete([i, j]);
						}
					}
				}
			}
		}

		// dibujar el estado actual

		for (const [[i, j], cellState] of this.#highlightedCells) {
			const currentColor = this.p.color(cellState.color);
			currentColor.setAlpha(cellState.opacity);

			this.p.fill(currentColor);
			this.p.square(
				...this.stage.toScreenSpace(this.toStageSpace([i, j])),
				(this.cellSize - 3) * this.stage.scale,
			);
		}

		this.p.pop();
	}

	/**
	 * Distancia taxicab en términos del espacio de la cuadrícula.
	 */
	static distance(location1: [number, number], location2: [number, number]) {
		return (
			Math.abs(location1[0] - location2[0]) +
			Math.abs(location1[1] - location2[1])
		);
	}

	/**
	 * @param within radio taxicab, en términos del espacio de la cuadrícula
	 * @param from en el espacio de la cuadrícula
	 * @param cell en el espacio de la cuadrícula
	 */
	attackable(
		within: number,
		from: [number, number],
		cell: [number, number],
	): boolean {
		const distance = StageGrid.distance(from, cell);
		return (
			distance <= within &&
			distance !== 0 &&
			!this.stage.collidesAt(this.toStageSpace(cell))
		);
	}
	reachable(
		within: number,
		from: [number, number],
		cell: [number, number],
	): boolean {
		const distance = StageGrid.distance(from, cell);
		return (
			distance <= within &&
			distance !== 0 &&
			!this.stage.collidesAt(this.toStageSpace(cell)) &&
			!this.stage.intersectsWithEntityAt(this.toStageSpace(cell))
		);
	}

	#isHighlighting(cell: [number, number]) {
		if (this.#highlight) {
			const { radius, from, mode } = this.#highlight;
			return mode === "attack"
				? this.attackable(radius, from, cell)
				: this.reachable(radius, from, cell);
		}
		return false;
	}
	isHighlighting(cell: [number, number]): boolean {
		return this.#isHighlighting(cell);
	}
}
