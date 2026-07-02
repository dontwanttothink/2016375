import type p5 from "p5";
import { Entity } from "../entity";
import { EntityArt } from "../entity/art";

export class ProtagonistEntity extends Entity {
	constructor(art: EntityArt, position: [number, number]) {
		super(art, position);
		this.height *= 0.3;
		this.width *= 0.3;
	}

	up() {
		this.displace([0, -10]);
	}

	down() {
		this.displace([0, 10]);
	}

	left() {
		this.displace([-10, 0]);
	}

	right() {
		this.displace([10, 0]);
	}
}

export async function Protagonist(p: p5, location: [number, number]) {
	const art = await EntityArt.fromName(p, "example");
	art.loadAnimation("blink");

	return new ProtagonistEntity(art, location);
}
