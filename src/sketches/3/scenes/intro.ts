import type p5 from "p5";
import { Protagonist } from "../characters/protagonist";
import { Stage } from "../stage";

export async function Intro(p: p5): Promise<Stage> {
	const stage = await Stage.fromName(p, "example");
	const protagonist = await Protagonist(p, [stage.width / 2, stage.height / 2]);

	stage.addEntity(protagonist);

	return stage;
}
