import type p5 from "p5";
import { Musgo } from "../characters/musgo";
import type { ProtagonistEntity } from "../characters/protagonist";
import { Stage } from "../stage";

export async function Entrada(
	p: p5,
	protagonist: ProtagonistEntity,
): Promise<Stage> {
	const stage = await Stage.fromName(p, "entrada");

	protagonist.position = stage.grid.toStageSpace([5, 6]);
	stage.addEntity(protagonist);

	const musgo = await Musgo(p, stage.grid.toStageSpace([4, 6]));
	stage.addEntity(musgo);

	return stage;
}
