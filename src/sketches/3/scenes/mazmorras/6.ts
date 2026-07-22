import type p5 from "p5";
import type { ProtagonistEntity } from "../../characters/protagonist";
import { Slime } from "../../characters/slime";
import { Stage } from "../../stage";
import { Mazmorra2 } from "./2";

export function Mazmorra6(position: 0 | 1 | 2 | 3 | 4 | 5 | 6) {
	return async (p: p5, protagonist: ProtagonistEntity) => {
		const stage = await Stage.fromName(p, "mazmorra6");
		stage.addEntity(protagonist);
		// protagonist.energy += 1;

		if (position === 0) {
			protagonist.teleport(stage.grid.toStageSpace([0, 0]));
		} else if (position === 1) {
			protagonist.teleport(stage.grid.toStageSpace([0, 1]));
		} else if (position === 2) {
			protagonist.teleport(stage.grid.toStageSpace([9, 0]));
		} else if (position === 3) {
			protagonist.teleport(stage.grid.toStageSpace([9, 1]));
		} else if (position === 4) {
			protagonist.teleport(stage.grid.toStageSpace([9, 2]));
		} else if (position === 5) {
			protagonist.teleport(stage.grid.toStageSpace([9, 3]));
		} else {
			protagonist.teleport(stage.grid.toStageSpace([9, 4]));
		}

		const slime1 = await Slime(p, stage.grid.toStageSpace([6, 2]));
		stage.addEntity(slime1);

		// if (!slimeDerrotado) {
		// }

		// if (slime1) {
		// 	const comprobar = setInterval(() => {
		// 		if (slime1.isDead) {
		// 			slimeDerrotado = true;
		// 			clearInterval(comprobar);
		// 		}
		// 	}, 100);
		// }

		stage.grid.transitions.set([9, 0], Mazmorra2(0));
		stage.grid.transitions.set([9, 1], Mazmorra2(1));
		stage.grid.transitions.set([9, 2], Mazmorra2(2));
		stage.grid.transitions.set([9, 3], Mazmorra2(3));
		stage.grid.transitions.set([9, 4], Mazmorra2(4));
		stage.grid.transitions.set([9, 5], Mazmorra2(4));
		stage.grid.transitions.set([9, 6], Mazmorra2(4));

		return stage;
	};
}
