import type p5 from "p5";
import { EntityArt } from "../entity/art";
import { EnemyEntity } from "./enemy";

export class SlimeEntity extends EnemyEntity {
    constructor(p: p5, art: EntityArt, position: [number, number]) {
        super(p, art, position);
        this.name = "Slime";
    }
}

export async function slime(p: p5, position: [number, number] = [0, 0]) {
    const art = await EntityArt.fromName(p, "slime");
    return new SlimeEntity(p, art, position);
}
