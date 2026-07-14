import type p5 from "p5";
import { Protagonist, type ProtagonistEntity } from "../characters/protagonist";
import { Stage } from "../stage";

export async function Intro(
	p: p5,
	protagonist: ProtagonistEntity,
): Promise<Stage> {
	const stage = await Stage.fromName(p, "example");

	protagonist.position = [stage.width / 2, stage.height / 2];
	stage.addEntity(protagonist);

	return stage;
}
