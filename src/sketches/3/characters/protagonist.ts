import type p5 from "p5";
import { Entity } from "../entity";
import { EntityArt } from "../entity/art";

export class ProtagonistEntity extends Entity {}

export async function Protagonist(p: p5, location: [number, number]) {
	const art = await EntityArt.fromName(p, "example");
	art.loadAnimation("blink");

	return new ProtagonistEntity(art, location);
}
