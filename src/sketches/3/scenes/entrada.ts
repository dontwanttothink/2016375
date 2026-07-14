import type p5 from "p5";
import type { ProtagonistEntity } from "../characters/protagonist";
import { Stage } from "../stage";
import { Mazmorra1 } from "./mazmorras/1";

export async function Entrada(
	p: p5,
	protagonist: ProtagonistEntity,
): Promise<Stage> {
	const stage = await Stage.fromName(p, "entrada");

	protagonist.teleport(stage.grid.toStageSpace([5, 6]));
	stage.addEntity(protagonist);

	stage.grid.transitions.set([11, 2], Mazmorra1(0));
	stage.grid.transitions.set([11, 3], Mazmorra1(1));

	return stage;
}
