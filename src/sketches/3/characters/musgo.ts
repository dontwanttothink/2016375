import type p5 from "p5";
import { EntityArt } from "../entity/art";
import { CombatantEntity } from "./combatant";

export class MusgoEntity extends CombatantEntity {
	constructor(p: p5, art: EntityArt, position: [number, number]) {
		super(p, art, position);
		this.name = "Musgo";
		this.isMovable = false;
	}
}

export async function Musgo(p: p5, location: [number, number] = [0, 0]) {
	const art = await EntityArt.fromName(p, "musgo");
	return new MusgoEntity(p, art, location);
}
