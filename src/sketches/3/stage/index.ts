import type p5 from "p5";
import type { Entity } from "../entity";
import { StageDebug } from "./debug";
import { StageGrid } from "./grid";
import { StageInteraction } from "./interaction";

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
		const loadBackground = async (): Promise<p5.Image> => {
			try {
				return await p.loadImage(backgroundURL.href);
			} catch (e) {
				throw new Error(
					`no se pudo cargar el fondo de "${name}" (es decir, ${backgroundURL.href})`,
					{ cause: e },
				);
			}
		};

		const collisionURL = new URL("collision.png", stageURL);
		const loadCollision = async (): Promise<p5.Image> => {
			try {
				return await p.loadImage(collisionURL.href);
			} catch (e) {
				throw new Error(
					`no se pudo cargar la textura de colisión de ${name} (es decir, ${collisionURL.href})`,
					{ cause: e },
				);
			}
		};

		const gridPropertiesURL = new URL("grid.json", stageURL);
		const loadGridProperties = async (): Promise<unknown> => {
			try {
				const response = await fetch(gridPropertiesURL);

				if (response.ok) {
					return await response.json();
				} else {
					throw new Error(response.statusText);
				}
			} catch (e) {
				throw new Error(
					`no se pudieron obtener las propiedades de la matriz asociada con el escenario ${name} (es decir, ${gridPropertiesURL.href})`,
					{ cause: e },
				);
			}
		};

		const [background, collision, gridProperties] = await Promise.all([
			loadBackground(),
			loadCollision(),
			loadGridProperties(),
		]);

		StageGrid.assertIsValidDescriptor(gridProperties, gridPropertiesURL);

		const { origin, cellSize } = gridProperties;

		const stage = new Stage(
			p,
			background,
			collision,
			new StageGrid(origin, cellSize),
			new StageInteraction(),
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
	bottomMargin: number = 100;

	grid: StageGrid;

	get width(): number {
		return this.background.width;
	}
	get height(): number {
		return this.background.height;
	}

	interaction: StageInteraction;

	private constructor(
		p: p5,
		background: p5.Image,
		collision: p5.Image,
		grid: StageGrid,
		interaction: StageInteraction,
		name?: string,
	) {
		this.p = p;
		this.name = name;

		if (
			background.width !== collision.width ||
			background.height !== collision.height
		) {
			throw new TypeError(
				`Las dimensiones del fondo y de la textura de colisión deben ser iguales. (${name ? `"${name}"` : "ningún nombre proporcionado"})`,
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

		interaction.assignToStage(p, this);
		this.interaction = interaction;

		this.debug = new StageDebug(this.p, this);
	}

	/**
	 * @param position En el espacio del escenario
	 */
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

	/**
	 * @param position En el espacio del escenario
	 */
	intersectsWithEntityAt(location: [number, number]) {
		return this.entities.findLast((e) => e.intersects(location)) ?? null;
	}

	addEntity(entity: Entity) {
		entity.assignToStage(this);
		this.entities.push(entity);
	}

	screenDimensions(): [number, number] {
		const w = this.background.width;
		const h = this.background.height;

		const availableHeight = this.p.height - this.bottomMargin;

		const proportionalHeight = this.p.width * (h / w);
		const proportionalWidth = availableHeight * (w / h);

		if (proportionalHeight <= availableHeight) {
			return [this.p.width, proportionalHeight];
		} else {
			return [proportionalWidth, availableHeight];
		}
	}

	screenOrigin(): [number, number] {
		const availableHeight = this.p.height - this.bottomMargin;
		const [w, h] = this.screenDimensions();

		return [(this.p.width - w) / 2, (availableHeight - h) / 2];
	}

	/**
	 * La razón actual entre una unidad en el espacio de la pantalla y una unidad en
	 * el espacio del escenario.
	 */
	get scale() {
		return this.screenDimensions()[0] / this.background.width;
	}

	/**
	 * Convierte una posición absoluta en el espacio de la pantalla a una posición
	 * absoluta en el espacio del escenario.
	 */
	fromScreenSpace(location: [number, number]): [number, number] {
		const [x, y] = this.screenOrigin();
		return [(location[0] - x) / this.scale, (location[1] - y) / this.scale];
	}

	/**
	 * Convierte una posición absoluta en el espacio del escenario a una posición
	 * absoluta en el espacio de la pantalla.
	 */
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

		this.grid.drawHighlights();

		for (const entity of this.entities) {
			entity.draw();
		}

		if (import.meta.env.MODE === "DEBUG") {
			this.p.push();
			this.debug.drawCollision(this.collision);
			this.debug.drawHighlights();
			this.debug.drawGrid();
			this.debug.drawPerformance();
			this.debug.drawPositions();
			this.p.pop();
		}
	}
}
