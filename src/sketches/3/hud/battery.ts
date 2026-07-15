// import type p5 from "p5";
import type { Art } from "../art";
import type { ProtagonistEntity } from "../characters/protagonist";

export class BatteryDisplay {
	// p: p5;

	entity: ProtagonistEntity;
	displayedLevel: number;

	art: Art;

	constructor(art: Art, protagonist: ProtagonistEntity) {
		this.entity = protagonist;
		this.art = art;
		this.displayedLevel = protagonist.energy;
	}

	tick() {
		// deltaTime-based change to `displayedLevel`
	}

	draw() {}
}
