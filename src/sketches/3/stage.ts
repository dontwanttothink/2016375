import type p5 from "p5";
import type { Entity } from "./entity";

export class StageGrid {
	origin: [number, number];

	width: number;
	height: number;
	cellSize: number;

	constructor(
		origin: [number, number],
		cellSize: number,
		width: number,
		height: number,
	) {
		this.origin = origin;
		this.width = width;
		this.height = height;
		this.cellSize = cellSize;
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

		// todo: lidiar con los errores de loadImage

		const backgroundURL = new URL("background.png", stageURL);
		const background = await p.loadImage(backgroundURL.href);

		const collisionURL = new URL("collision.png", stageURL);
		const collision = await p.loadImage(collisionURL.href);

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

		// todo: verificar los datos de gridproperties y crear el objeto de grid

		const { origin, cellSize, width, height } = gridProperties;

		return new Stage(
			p,
			background,
			collision,
			new StageGrid(origin, cellSize, width, height),
		);
	}

	private p: p5;

	private background: p5.Image;
	private collision: boolean[];

	private entities: Entity[] = [];

	grid: StageGrid;

	private constructor(
		p: p5,
		background: p5.Image,
		collision: p5.Image,
		grid: StageGrid,
	) {
		this.p = p;

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
		for (let i = 0; i < collision.pixels.length; i += 4) {
			const pixel = collision.pixels.slice(i, i + 4);
			this.collision.push(pixel.every((channel) => channel === 0));
		}

		this.grid = grid;
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

	fromScreenSpace(location: [number, number]) {
		const [x, y] = this.screenOrigin();
		const scale = this.screenDimensions()[0] / this.background.width;
		return [(location[0] - x) / scale, (location[1] - y) / scale];
	}

	toScreenSpace(stageLocation: [number, number]) {
		const [x, y] = this.screenOrigin();
		const scale = this.screenDimensions()[0] / this.background.width;
		return [(x + stageLocation[0]) * scale, (y + stageLocation[1]) * scale];
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

		for (const entity of this.entities) {
			entity.draw();
		}
	}
}
