import type p5 from "p5";
import { Musgo } from "../../characters/musgo";
import type { ProtagonistEntity } from "../../characters/protagonist";
import { Stage } from "../../stage";
import { Mazmorra5 } from "./5";
import { Mazmorra3 } from "./3";

export function Mazmorra4(position: 0 | 1 | 2 | 3) {
    return async (p: p5, protagonist: ProtagonistEntity) => {
        const stage = await Stage.fromName(p, "mazmorra4");
        stage.addEntity(protagonist);

        if (position === 0) {
            protagonist.teleport(stage.grid.toStageSpace([4, 4]));
        }
        else if (position === 1) {
            protagonist.teleport(stage.grid.toStageSpace([5, 4]));
        }
        else if (position === 2) {
            protagonist.teleport(stage.grid.toStageSpace([0, 0]));
        }
        else {
            protagonist.teleport(stage.grid.toStageSpace([0, 1]));
        }

        const musgo = await Musgo(p, stage.grid.toStageSpace([7, -1]));
        stage.addEntity(musgo);

        stage.grid.transitions.set([0, 0], Mazmorra5(0));
        stage.grid.transitions.set([0, 1], Mazmorra5(1));
        stage.grid.transitions.set([4, 4], Mazmorra3(2));
        stage.grid.transitions.set([5, 4], Mazmorra3(3));


        return stage;
    };
}
