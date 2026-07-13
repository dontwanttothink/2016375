import type p5 from "p5";
import { Entity } from "../entity";
import { EntityArt } from "../entity/art";

enum ProtagonistInteractions {
	Example,
	Example2,
}

export class ProtagonistEntity extends Entity {
	energy = 3;

	get reach() {
		return this.energy;
	}

	isInteractive: boolean = true;
	isMovable: boolean = true;

	interactionOptions(): Map<number, string> {
		return new Map([
			[ProtagonistInteractions.Example, "Ejemplo"],
			[ProtagonistInteractions.Example2, "Ejemplo 2"],
		]);
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
