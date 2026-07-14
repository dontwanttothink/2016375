import type p5 from "p5";
import { CombatantEntity } from "./combatant";
import { EntityArt } from "../entity/art";

export class ProtagonistEntity extends CombatantEntity { }

export async function Protagonist(p: p5, location: [number, number] = [0, 0]) {
	const art = await EntityArt.fromName(p, "protagonist");
	await art.loadAnimation("walk_forward");

	const protagonist = new ProtagonistEntity(p, art, location);
	protagonist.name = "Protagonista";
	protagonist.hitbox = {
		height: 14,
		center: [0, 4],
	};
	return protagonist;
}
