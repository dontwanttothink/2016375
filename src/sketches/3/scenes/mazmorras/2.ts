import type p5 from "p5";
import { slime } from "../../characters/slime";
import type { ProtagonistEntity } from "../../characters/protagonist";
import { Stage } from "../../stage";
import { Mazmorra1 } from "./1";
import { Mazmorra3 } from "./3";
import { Mazmorra6 } from "./6";
import { Entity } from "../../entity/index";

let slimeDerrotado = false;
export function Mazmorra2(position: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8) {
    return async (p: p5, protagonist: ProtagonistEntity) => {
        const stage = await Stage.fromName(p, "mazmorra2");
        stage.addEntity(protagonist);
        protagonist.energy += 1;

        if (position === 0) {
            protagonist.teleport(stage.grid.toStageSpace([0, 0]));
        }
        else if (position === 1) {
            protagonist.teleport(stage.grid.toStageSpace([0, 1]));
        }
        else if (position === 2) {
            protagonist.teleport(stage.grid.toStageSpace([0, 2]));
        }
        else if (position === 3) {
            protagonist.teleport(stage.grid.toStageSpace([0, 3]));
        }
        else if (position === 4) {
            protagonist.teleport(stage.grid.toStageSpace([0, 4]));
        }
        else if (position === 5) {
            protagonist.teleport(stage.grid.toStageSpace([4, 6]));
        }
        else if (position === 6) {
            protagonist.teleport(stage.grid.toStageSpace([5, 6]));
        }
        else if (position === 7) {
            protagonist.teleport(stage.grid.toStageSpace([9, 1]));
        }
        else {
            protagonist.teleport(stage.grid.toStageSpace([9, 2]));
        }
let slime1: Entity | undefined;
if (!slimeDerrotado) {
    slime1 = await slime(p, stage.grid.toStageSpace([6, 2]));
    stage.addEntity(slime1);
}
if (slime1) {
    const comprobar = setInterval(() => {
        if (slime1.isDead) {
            slimeDerrotado = true;
            clearInterval(comprobar);
        }
    }, 100);
}

        stage.grid.transitions.set([3, 6], Mazmorra1(0));
        stage.grid.transitions.set([4, 6], Mazmorra1(0));
        stage.grid.transitions.set([5, 6], Mazmorra1(1));
        stage.grid.transitions.set([6, 6], Mazmorra1(1));
        stage.grid.transitions.set([9, 1], Mazmorra3(0));
        stage.grid.transitions.set([9, 2], Mazmorra3(1));
        stage.grid.transitions.set([0, 0], Mazmorra6(2));
        stage.grid.transitions.set([0, 1], Mazmorra6(3));
        stage.grid.transitions.set([0, 2], Mazmorra6(4));
        stage.grid.transitions.set([0, 3], Mazmorra6(5));
        stage.grid.transitions.set([0, 4], Mazmorra6(6));


        return stage;
    };
}
