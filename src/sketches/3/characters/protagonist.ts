import type p5 from "p5";
import { Entity } from "../entity";
import { EntityArt } from "../entity/art";

export class ProtagonistEntity extends Entity {
	movement: boolean = false;

	userInteracted() {
		if (this.movement) {
			this.stage.grid.stopHighlighting();
			this.movement = false;
		} else {
			this.stage.grid.highlight(
				5,
				this.stage.grid.fromStageSpace(this.position),
				this.p.color("red"),
			);
			this.movement = true;
		}
	}
}

export async function Protagonist(p: p5, location: [number, number] = [0, 0]) {
	const art = await EntityArt.fromName(p, "protagonist");

	const protagonist = new ProtagonistEntity(p, art, location);
	protagonist.hitbox = {
		height: 14,
		center: [0, 4],
	};
	return protagonist;
}
