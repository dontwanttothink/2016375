import type p5 from "p5";
import type { ProtagonistEntity } from "../characters/protagonist";
import { Stage } from "../stage";
import { Mazmorra6 } from "./mazmorras/6";

export async function Entrada(
	p: p5,
	protagonist: ProtagonistEntity,
): Promise<Stage> {
	const stage = await Stage.fromName(p, "entrada");

	protagonist.teleport(stage.grid.toStageSpace([5, 6]));
	stage.addEntity(protagonist);

	stage.isExhausting = false;

	stage.grid.transitions.set([11, 2], Mazmorra6(0));
	stage.grid.transitions.set([11, 3], Mazmorra6(1));

	return stage;
}
