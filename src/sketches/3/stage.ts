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

	background: Entity;
	collision: Entity;

	entities: Entity[] = [];

	constructor(p: p5, background: Art, collision: Art) {
		this.p = p;
		this.background = background;
		this.collision = collision;
	}

	draw() {
		// fit the stage space inside
		// take the coordinates of the entities and map them to screen space
	}
}
