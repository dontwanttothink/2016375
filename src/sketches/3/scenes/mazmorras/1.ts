import type p5 from "p5";
import { Araña } from "../../characters/araña";
import { Musgo } from "../../characters/musgo";
import type { ProtagonistEntity } from "../../characters/protagonist";
import { Stage } from "../../stage";
import { Mazmorra2 } from "./2";

export function Mazmorra1(position: 0 | 1) {
	return async (p: p5, protagonist: ProtagonistEntity) => {
		const stage = await Stage.fromName(p, "mazmorra1");
		stage.addEntity(protagonist);

		if (position === 0) {
			protagonist.teleport(stage.grid.toStageSpace([5, 0]));
		}
		else if (position === 1) {
			protagonist.teleport(stage.grid.toStageSpace([6, 0]));
		}
		else if (position === 2) {
			protagonist.teleport(stage.grid.toStageSpace([6, 0]));
		}
		else if (position === 3) {
			protagonist.teleport(stage.grid.toStageSpace([6, 0]));
		}
		else if (position === 4) {
			protagonist.teleport(stage.grid.toStageSpace([6, 0]));
		}
		else if (position === 5) {
			protagonist.teleport(stage.grid.toStageSpace([6, 0]));
		}
		else {
			protagonist.teleport(stage.grid.toStageSpace([6, 0]));
		}

		const musgo = await Musgo(p, stage.grid.toStageSpace([6, 2]));
		stage.addEntity(musgo);

		const unaraña = await Araña(p, stage.grid.toStageSpace([2, 3]));
		stage.addEntity(unaraña);

		const unaraña2 = await Araña(p, stage.grid.toStageSpace([8, 6]));
		stage.addEntity(unaraña2);

		stage.grid.transitions.set([5, 0], Mazmorra2(5));
		stage.grid.transitions.set([6, 0], Mazmorra2(6));

		return stage;
	};
}
