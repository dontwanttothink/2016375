import type p5 from "p5";
import type { ProtagonistEntity } from "../characters/protagonist";
import { Stage } from "../stage";

export async function Entrada(
	p: p5,
	protagonist: ProtagonistEntity,
): Promise<Stage> {
	const stage = await Stage.fromName(p, "entrada");

	protagonist.position = stage.grid.toStageSpace([5, 6]);
	stage.addEntity(protagonist);

	return stage;
}
