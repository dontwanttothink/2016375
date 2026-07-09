import type p5 from "p5";
import { Entity } from "../entity";
import { EntityArt } from "../entity/art";

export class ProtagonistEntity extends Entity {}

export async function Protagonist(p: p5, location: [number, number]) {
	const art = await EntityArt.fromName(p, "protagonist");
	art.center[1] = 15;

	const protagonist = new ProtagonistEntity(p, art, location);
	protagonist.hitbox = {
		height: 14,
	};
	return protagonist;
}
