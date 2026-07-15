import type p5 from "p5";
import { EntityArt } from "../entity/art";
import { EnemyEntity } from "./enemy";

export class ArañaEntity extends EnemyEntity {
	constructor(p: p5, art: EntityArt, position: [number, number]) {
		super(p, art, position);
		this.name = "Araña";
		this.isPlayerControlled = false;
	}
}

export async function Araña(p: p5, position: [number, number] = [0, 0]) {
	const art = await EntityArt.fromName(p, "araña");
	return new ArañaEntity(p, art, position);
}
