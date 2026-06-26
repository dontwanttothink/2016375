import type p5 from "p5";
import type { Entity } from "./entity";
import type { Art } from "./pixel-art";

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

	snap: ([x, y]: [number, number]) => [number, number];

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
