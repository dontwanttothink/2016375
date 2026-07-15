import type p5 from "p5";
import { slime } from "../../characters/slime";
import type { ProtagonistEntity } from "../../characters/protagonist";
import { Stage } from "../../stage";
import { Mazmorra4 } from "./4";

export function Mazmorra5(position: 0 | 1) {
    return async (p: p5, protagonist: ProtagonistEntity) => {
        const stage = await Stage.fromName(p, "mazmorra5");
        stage.addEntity(protagonist);
        protagonist.energy += 1;

        if (position === 0) {
            protagonist.teleport(stage.grid.toStageSpace([8, 0]));
        } else {
            protagonist.teleport(stage.grid.toStageSpace([8, 1]));
        }

        const slime1 = await slime(p, stage.grid.toStageSpace([2, 0]));
        stage.addEntity(slime1);
        const slime2 = await slime(p, stage.grid.toStageSpace([2, 1]));
        stage.addEntity(slime2);
        const slime3 = await slime(p, stage.grid.toStageSpace([2, 2]));
        stage.addEntity(slime3);

        stage.grid.transitions.set([8, 0], Mazmorra4(2));
        stage.grid.transitions.set([8, 1], Mazmorra4(3));


        return stage;
    };
}
