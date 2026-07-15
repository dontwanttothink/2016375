import type p5 from "p5";
import type { ProtagonistEntity } from "../characters/protagonist";
import type { Entity } from "../entity";
import { IntegerPairMap } from "../utils";
import type { Stage } from ".";
import { StageComponent } from "./component";

interface StageGridDescriptor {
	origin: [number, number];
	cellSize: number;
}

export class StageGrid extends StageComponent {
	static HIGHLIGHT_ANIMATION_DURATION: number = 200;

	/**
	 * Los cuatro vecinos ortogonales de una celda. Compartido con
	 * {@link Entity.pathTo} para que ambas búsquedas en anchura recorran el mismo
	 * grafo.
	 */
	static NEIGHBOR_OFFSETS: [number, number][] = [
		[1, 0],
		[-1, 0],
		[0, 1],
		[0, -1],
	];

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
		field: IntegerPairMap<number>;
	} | null = null;

	#highlightedCells: IntegerPairMap<{
		opacity: number;
		color: p5.Color;
	}> = new IntegerPairMap();

	transitions: IntegerPairMap<
		(p: p5, protagonist: ProtagonistEntity) => Promise<Stage>
	> = new IntegerPairMap();

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

	toStageSpace(
		gridLocation: [number, number],
		whole: boolean = false,
	): [number, number] {
		const out: [number, number] = [
			this.origin[0] + (gridLocation[0] + 0.5) * this.cellSize,
			this.origin[1] + (gridLocation[1] + 0.5) * this.cellSize,
		];

		if (whole) {
			return out.map((p) => Math.floor(p)) as [number, number];
		} else {
			return out;
		}
	}

	/**
	 * Calcula, mediante una búsqueda en anchura, la distancia de la ruta más
	 * corta desde `from` hasta cada celda alcanzable, hasta un máximo de
	 * `maxDistance` pasos. Las paredes, los bordes y las demás entidades (salvo
	 * `except`) bloquean el paso, igual que en {@link Entity.pathTo}, de modo que
	 * el campo coincide con las celdas a las que la animación de movimiento puede
	 * llegar y `field.get(cell) === pathTo(cell).length - 1`.
	 */
	distanceField(
		from: [number, number],
		{ maxDistance, except }: { maxDistance: number; except?: Entity },
	): IntegerPairMap<number> {
		const field = new IntegerPairMap<number>();
		field.set(from, 0);

		let frontier: [number, number][] = [from];
		let distance = 0;

		while (frontier.length > 0 && distance < maxDistance) {
			distance += 1;
			const next: [number, number][] = [];

			for (const [x, y] of frontier) {
				for (const [dx, dy] of StageGrid.NEIGHBOR_OFFSETS) {
					const neighbor: [number, number] = [x + dx, y + dy];

					if (field.has(neighbor)) {
						continue;
					}
					if (!this.stage.emptyAt(this.toStageSpace(neighbor, true), except)) {
						continue;
					}

					field.set(neighbor, distance);
					next.push(neighbor);
				}
			}

			frontier = next;
		}

		return field;
	}

	highlight(
		radius: number,
		from: [number, number],
		color: p5.Color,
		except?: Entity,
	) {
		this.#highlight = {
			radius,
			from,
			color,
			field: this.distanceField(from, { maxDistance: radius, except }),
		};
	}

	stopHighlighting() {
		this.#highlight = null;
	}

	drawHighlights() {
		if (!this.#highlight && this.#highlightedCells.size === 0) {
			return;
		}

		this.p.push();
		this.p.rectMode(this.p.CENTER);
		this.p.noStroke();

		// 1. avivar (o mantener) las celdas alcanzables del resaltado activo
		if (this.#highlight) {
			const { color, field } = this.#highlight;

			for (const [cell, distance] of field) {
				if (distance === 0) {
					continue; // la celda de origen no se resalta
				}

				const cellState = this.#highlightedCells.getOrInsert(cell, {
					opacity: 0,
					color,
				});

				cellState.opacity = Math.min(
					cellState.opacity +
						(200 / StageGrid.HIGHLIGHT_ANIMATION_DURATION) * this.p.deltaTime,
					200,
				);
			}
		}

		// 2. desvanecer las celdas que ya no son alcanzables
		const faded: [number, number][] = [];
		for (const [cell, cellState] of this.#highlightedCells) {
			if (this.reachable(cell)) {
				continue;
			}

			cellState.opacity = Math.max(
				cellState.opacity -
					(200 / (StageGrid.HIGHLIGHT_ANIMATION_DURATION / 2)) *
						this.p.deltaTime,
				0,
			);

			if (cellState.opacity === 0) {
				faded.push(cell);
			}
		}
		for (const cell of faded) {
			this.#highlightedCells.delete(cell);
		}

		// 3. dibujar el estado actual
		for (const [cell, cellState] of this.#highlightedCells) {
			const currentColor = this.p.color(cellState.color);
			currentColor.setAlpha(cellState.opacity);

			this.p.fill(currentColor);
			this.p.square(
				...this.stage.toScreenSpace(this.toStageSpace(cell)),
				(this.cellSize - 3) * this.stage.scale,
			);
		}

		this.p.pop();
	}

	/**
	 * La distancia de la ruta más corta hasta `cell` desde el origen del
	 * resaltado activo, o `null` si no hay resaltado o la celda no es
	 * alcanzable dentro del radio.
	 */
	reachDistance(cell: [number, number]): number | null {
		if (!this.#highlight) {
			return null;
		}
		return this.#highlight.field.get(cell) ?? null;
	}

	/**
	 * Si la entidad seleccionada se puede mover a esta celda: es alcanzable y no
	 * es su propia celda de origen (distancia 0).
	 */
	reachable(cell: [number, number]): boolean {
		const distance = this.reachDistance(cell);
		return distance !== null && distance > 0;
	}

	/**
	 * Si `by` puede atacar la celda (ocupada) `targetCell`: existe una celda
	 * vecina, alcanzable dentro del alcance de `by`, desde la cual asestaría el
	 * golpe. Reutiliza el campo de distancias del resaltado cuando corresponde al
	 * atacante; de lo contrario lo calcula sobre la marcha.
	 */
	attackable(targetCell: [number, number], by: Entity): boolean {
		const from = this.fromStageSpace(by.position);

		const field =
			this.#highlight &&
			this.#highlight.from[0] === from[0] &&
			this.#highlight.from[1] === from[1] &&
			this.#highlight.radius >= by.reach
				? this.#highlight.field
				: this.distanceField(from, { maxDistance: by.reach, except: by });

		for (const [dx, dy] of StageGrid.NEIGHBOR_OFFSETS) {
			const distance = field.get([targetCell[0] + dx, targetCell[1] + dy]);
			if (distance !== undefined && distance + 1 <= by.reach) {
				return true;
			}
		}

		return false;
	}

	isHighlighting(cell: [number, number]): boolean {
		return this.reachable(cell);
	}
}
