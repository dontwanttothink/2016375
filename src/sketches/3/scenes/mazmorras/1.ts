import type p5 from "p5";
import { Musgo } from "../../characters/musgo";
import type { ProtagonistEntity } from "../../characters/protagonist";
import { Stage } from "../../stage";

export function Mazmorra1(position: 0 | 1) {
	return async (p: p5, protagonist: ProtagonistEntity) => {
		const stage = await Stage.fromName(p, "mazmorra1");
		stage.addEntity(protagonist);

		if (position === 0) {
			protagonist.teleport(stage.grid.toStageSpace([0, 6]));
		} else {
			protagonist.teleport(stage.grid.toStageSpace([0, 7]));
		}

		const musgo = await Musgo(p, stage.grid.toStageSpace([6, 2]));
		stage.addEntity(musgo);

		return stage;
	};
}
