import type p5 from "p5";
import type { Entity } from "./entity";
import type { Art } from "./pixel-art";

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
 * Una habitación o área, incluida su cuadrícula.
 *
 * Las instancias de esta clase se encargan de gestionar las entidades en una
 * habitación.
 */
export class Stage {
	p: p5;

	background: Art;
	collision: p5.Image;

	entities: Entity[] = [];

	grid: StageGrid;

	constructor(p: p5, background: Art, collision: Art, grid: StageGrid) {
		this.p = p;

		if (
			background.appearance.width !== collision.appearance.width ||
			background.appearance.height !== collision.appearance.height
		) {
			throw new TypeError(
				"Las dimensiones del fondo y de la textura de colisión deben ser iguales.",
			);
		}

		this.background = background;
		this.collision = collision.appearance;
		this.grid = grid;
	}

	addEntity(entity: Entity) {
		entity.assignToStage(this);
		this.entities.push(entity);
	}

	screenDimensions(): [number, number] {
		const w = this.background.appearance.width;
		const h = this.background.appearance.width;

		const propoH = this.p.width * (h / w);
		const propoW = this.p.height * (w / h);

		if (propoH <= this.p.height) {
			return [this.p.width, propoH];
		} else {
			return [propoW, this.p.height];
		}
	}

	screenOrigin() {
		const [w, h] = this.screenDimensions();

		return [(this.p.width - w) / 2, (this.p.height - h) / 2];
	}

	fromScreenSpace(location: [number, number]) {
		const [x, y] = this.screenOrigin();
		const scale = this.screenDimensions()[0] / this.background.appearance.width;
		return [(location[0] - x) / scale, (location[1] - y) / scale];
	}

	toScreenSpace(stageLocation: [number, number]) {
		const [x, y] = this.screenOrigin();
		const scale = this.screenDimensions()[0] / this.background.appearance.width;
		return [(x + stageLocation[0]) * scale, (y + stageLocation[1]) * scale];
	}

	draw() {
		this.background.draw([0, 0], this.p.width, this.p.height, { fit: true });
		for (const entity of this.entities) {
			entity.draw();
		}
	}
}
