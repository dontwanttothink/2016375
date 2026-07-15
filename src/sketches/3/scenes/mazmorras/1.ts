import type p5 from "p5";
import { Araña } from "../../characters/araña";
import type { ProtagonistEntity } from "../../characters/protagonist";
import { Stage } from "../../stage";
import { Mazmorra2 } from "./2";

export function Mazmorra1(position: 0 | 1 | 2 | 3 | 4 | 5 | 6) {
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

		const araña = await Araña(p, stage.grid.toStageSpace([4, 5]));
		stage.addEntity(araña);

		stage.grid.transitions.set([5, 0], Mazmorra2(5));
		stage.grid.transitions.set([6, 0], Mazmorra2(6));


		return stage;
	};
}
