import type p5 from "p5";
import type { Entity } from "./entity";

interface DebugCellHighlight {
	location: [number, number];
	since: number;
}

class StageDebug {
	p: p5;
	stage: Stage;
	highlights: Set<DebugCellHighlight> = new Set();

	static HIGHLIGHT_DURATION = 100;

	constructor(p: p5, stage: Stage) {
		this.p = p;
		this.stage = stage;
	}

	highlight(location: [number, number]) {
		this.highlights.add({
			location,
			since: this.p.millis(),
		});
	}

	drawHighlights() {
		this.p.push();
		this.p.noStroke();

		for (const highlight of this.highlights) {
			const { since, location } = highlight;
			const t = (this.p.millis() - since) / StageDebug.HIGHLIGHT_DURATION;
			this.p.fill(255, 0, 0, (1 - t) * 230);
			this.p.square(...this.stage.toScreenSpace(location), this.stage.scale);

			if (t > 1) {
				this.highlights.delete(highlight);
			}
		}

		this.p.pop();
	}

	drawGrid() {
		this.p.push();
		this.p.stroke("red");
		for (
			let i = 0;
			i * this.stage.grid.cellSize <
			Math.max(this.stage.width, this.stage.height);
			++i
		) {
			this.p.line(
				...this.stage.toScreenSpace([
					0,
					this.stage.grid.origin[1] + i * this.stage.grid.cellSize,
				]),
				...this.stage.toScreenSpace([
					this.stage.width,
					this.stage.grid.origin[1] + i * this.stage.grid.cellSize,
				]),
			);

			this.p.line(
				...this.stage.toScreenSpace([
					this.stage.grid.origin[0] + i * this.stage.grid.cellSize,
					0,
				]),
				...this.stage.toScreenSpace([
					this.stage.grid.origin[0] + i * this.stage.grid.cellSize,
					this.stage.height,
				]),
			);
		}
		this.p.pop();
	}
}

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
			this.origin[0] + gridLocation[0] * this.cellSize,
			this.origin[1] + gridLocation[1] * this.cellSize,
		];
	}

	highlight(radius: number, from: [number, number]) {
		// this.#since;
		// this.#highlight =
	}

	drawHighlights() {}
}

/**
 * Una habitación o área, incluida su cuadrícula y sus datos de colisión.
 *
 * Las instancias de esta clase se encargan de gestionar las entidades dentro del
 * escenario.
 */
export class Stage {
	static STAGE_ART_URL = new URL("/art/stages/", window.location.origin);

	public static async fromName(p: p5, name: string): Promise<Stage> {
		const stageURL = new URL(`${name}/`, Stage.STAGE_ART_URL);

		const backgroundURL = new URL("background.png", stageURL);
		let background: p5.Image;
		try {
			background = await p.loadImage(backgroundURL.href);
		} catch (e) {
			throw new Error(
				`no se pudo cargar el fondo de "${name}" (es decir, ${backgroundURL.href})`,
				{ cause: e },
			);
		}

		const collisionURL = new URL("collision.png", stageURL);
		let collision: p5.Image;
		try {
			collision = await p.loadImage(collisionURL.href);
		} catch (e) {
			throw new Error(
				`no se pudo cargar la textura de colisión de ${name} (es decir, ${collisionURL.href})`,
				{ cause: e },
			);
		}

		const gridPropertiesURL = new URL("grid.json", stageURL);

		let gridProperties: unknown;
		try {
			const response = await fetch(gridPropertiesURL);

			if (response.ok) {
				gridProperties = await response.json();
			} else {
				throw new Error(response.statusText);
			}
		} catch (e) {
			throw new Error(
				`no se pudieron obtener las propiedades de la matriz asociada con el escenario ${name} (es decir, ${gridPropertiesURL.href})`,
				{ cause: e },
			);
		}

		StageGrid.assertIsValidDescriptor(gridProperties, gridPropertiesURL);

		const { origin, cellSize } = gridProperties;

		const stage = new Stage(
			p,
			background,
			collision,
			new StageGrid(origin, cellSize),
			name,
		);
		return stage;
	}

	private p: p5;

	/**
	 * Se usa solo para dar mejores mensajes diagnósticos.
	 */
	name?: string;

	readonly debug: StageDebug;

	private background: p5.Image;
	private collision: boolean[];

	private entities: Entity[] = [];

	/**
	 * Espacio que reservar bajo el escenario, en pixeles del espacio de la pantalla.
	 */
	bottomMargin: number = 0;

	grid: StageGrid;

	get width(): number {
		return this.background.width;
	}
	get height(): number {
		return this.background.height;
	}

	private constructor(
		p: p5,
		background: p5.Image,
		collision: p5.Image,
		grid: StageGrid,
		name?: string,
	) {
		this.p = p;
		this.name = name;

		if (
			background.width !== collision.width ||
			background.height !== collision.height
		) {
			throw new TypeError(
				"Las dimensiones del fondo y de la textura de colisión deben ser iguales.",
			);
		}

		this.background = background;

		// extraer datos de colisión de la textura
		collision.loadPixels();
		this.collision = [];

		const strangePixels = new Set();

		for (let i = 0; i < collision.pixels.length; i += 4) {
			const pixel = collision.pixels.slice(
				i,
				i + 4,
			) as unknown as Uint8ClampedArray; // la definición de p5 no es correcta

			this.collision.push(!pixel.every((channel) => channel > 5));

			if (
				!pixel.every((c) => c === 255) &&
				!pixel.every((c, i) => c === 0 || i === 3)
			) {
				strangePixels.add(
					[...pixel].map((p) => String(p).padStart(3, "0")).join(", "),
				);
			}
		}

		if (strangePixels.size > 0) {
			console.warn(
				`Hay pixeles extraños en la colisión${this.name ? ` de "${this.name}"` : ""}:\n\n\t${[...strangePixels].join("\n\t")}\n\nChromium (y no Gecko ni WebKit) parece hacer algo que modifica nuestras imágenes antes de que podamos acceder a sus valores exactos por pixel. Si todo parece funcionar bien, lo más probable es que esta advertencia se pueda ignorar.`,
			);
		}

		grid.assignToStage(p, this);
		this.grid = grid;

		this.debug = new StageDebug(this.p, this);
	}

	collidesAt(position: [number, number], except?: Entity) {
		if (position.some((v) => !Number.isInteger(v))) {
			throw new TypeError(`the position ${position} is not valid`);
		}
		// TODO: check entities

		const index = position[1] * this.width + position[0];
		if (
			position.some((v) => v < 0) ||
			position[0] >= this.width ||
			position[1] >= this.height
		) {
			return true;
		}

		return this.collision[index];
	}

	addEntity(entity: Entity) {
		entity.assignToStage(this);
		this.entities.push(entity);
	}

	screenDimensions(): [number, number] {
		const w = this.background.width;
		const h = this.background.height;

		const proportionalHeight = this.p.width * (h / w);
		const proportionalWidth = this.p.height * (w / h);

		if (proportionalHeight <= this.p.height) {
			return [this.p.width, proportionalHeight];
		} else {
			return [proportionalWidth, this.p.height];
		}
	}

	screenOrigin(): [number, number] {
		const [w, h] = this.screenDimensions();
		return [(this.p.width - w) / 2, (this.p.height - h) / 2];
	}

	/**
	 * La razón actual entre una unidad en el espacio de pantalla y una unidad en el
	 * espacio del escenario.
	 */
	get scale() {
		return this.screenDimensions()[0] / this.background.width;
	}

	fromScreenSpace(location: [number, number]): [number, number] {
		const [x, y] = this.screenOrigin();
		return [(location[0] - x) / this.scale, (location[1] - y) / this.scale];
	}

	toScreenSpace(stageLocation: [number, number]): [number, number] {
		const [x, y] = this.screenOrigin();
		return [
			x + stageLocation[0] * this.scale,
			y + stageLocation[1] * this.scale,
		];
	}

	draw() {
		this.p.push();
		this.p.noSmooth();
		this.p.image(
			this.background,
			...this.screenOrigin(),
			...this.screenDimensions(),
		);
		this.p.pop();

		if (import.meta.env.MODE === "DEBUG") {
			this.p.push();
			this.p.noStroke();
			this.p.fill(255, 255, 255, 255);
			for (const [i, occupied] of this.collision.entries()) {
				if (occupied) {
					this.p.square(
						...this.toScreenSpace([i % this.width, Math.floor(i / this.width)]),
						this.scale,
					);
				}
			}
			this.p.pop();
		}

		for (const entity of this.entities) {
			entity.draw();
		}

		if (import.meta.env.MODE === "DEBUG") {
			const stageCoordinates = this.fromScreenSpace([
				this.p.mouseX,
				this.p.mouseY,
			]).map(Math.floor) as [number, number];

			this.p.textAlign(this.p.LEFT, this.p.TOP);
			this.p.noStroke();
			this.p.text(
				`${stageCoordinates} ${this.collidesAt(stageCoordinates)}`,
				0,
				0,
			);

			if (this.collidesAt(stageCoordinates)) {
				this.p.textAlign(this.p.CENTER);
				this.p.text("c", this.p.mouseX, this.p.mouseY - 20);
			}
			this.p.pop();

			this.debug.drawHighlights();
			this.debug.drawGrid();
		}
	}
}
