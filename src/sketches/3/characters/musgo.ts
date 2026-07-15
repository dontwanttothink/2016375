import type p5 from "p5";
import { EntityArt } from "../entity/art";
import { EnemyEntity } from "./enemy";

export class MusgoEntity extends EnemyEntity {
	constructor(p: p5, art: EntityArt, position: [number, number]) {
		super(p, art, position);
		this.name = "Musgo";
	}
}

export async function Musgo(p: p5, position: [number, number] = [0, 0]) {
	const art = await EntityArt.fromName(p, "musgo");
	return new MusgoEntity(p, art, position);
}
