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

	toStageSpace(location: [number, number]): [number, number] {
		return [
			this.origin[0] + location[0] * this.cellSize,
			this.origin[1] + location[1] * this.cellSize,
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
	collision: Art;

	entities: Entity[] = [];

	grid: StageGrid;

	constructor(
		p: p5,
		background: Art,
		collision: Art,
		snap: ([x, y]: [number, number]) => [number, number],
	) {
		this.p = p;
		this.background = background;
		this.collision = collision;
		this.snap = snap;
	}

	addEntity(entity: Entity) {
		entity.assignToStage(this);
		this.entities.push(entity);
	}

	draw() {
		for (const entity of this.entities) {
			entity.draw();
		}
		this.background.draw();
	}
}
