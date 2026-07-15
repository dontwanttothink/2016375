import type p5 from "p5";
import { Slime } from "../../characters/slime";
import type { ProtagonistEntity } from "../../characters/protagonist";
import { Stage } from "../../stage";
import { Mazmorra4 } from "./4";
import { Mazmorra2 } from "./2";

export function Mazmorra3(position: 0 | 1 | 2 | 3) {
    return async (p: p5, protagonist: ProtagonistEntity) => {
        const stage = await Stage.fromName(p, "mazmorra3");
        stage.addEntity(protagonist);

        if (position === 0) {
            protagonist.teleport(stage.grid.toStageSpace([0, 0]));
        }
        else if (position === 1) {
            protagonist.teleport(stage.grid.toStageSpace([0, 1]));
        }
        else if (position === 2) {
            protagonist.teleport(stage.grid.toStageSpace([6, -2]));
        } else {
            protagonist.teleport(stage.grid.toStageSpace([7, -2]));
        }


        const slime1 = await Slime(p, stage.grid.toStageSpace([8, 0]));
        stage.addEntity(slime1);
        const slime2 = await Slime(p, stage.grid.toStageSpace([8, 1]));
        stage.addEntity(slime2);

        stage.grid.transitions.set([6, -2], Mazmorra4(0));
        stage.grid.transitions.set([7, -2], Mazmorra4(1));
        stage.grid.transitions.set([0, 0], Mazmorra2(7));
        stage.grid.transitions.set([0, 1], Mazmorra2(8));


        return stage;
    };
}
