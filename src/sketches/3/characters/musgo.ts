import type p5 from "p5";
import { CombatantEntity } from "./combatant";
import { EntityArt } from "../entity/art";

export class MusgoEntity extends CombatantEntity { }

export async function Musgo(p: p5, location: [number, number] = [0, 0]) {
    const art = await EntityArt.fromName(p, "musgo");

    const musgo = new MusgoEntity(p, art, location);
    musgo.name = "Musgo";
    return musgo;
}