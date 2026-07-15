import type p5 from "p5";
import { Art } from "../art";

export class EntityArt extends Art {
	public static async fromName(p: p5, name: string): Promise<Art> {
		return Art.fromName(p, name, "entities");
	}
}
