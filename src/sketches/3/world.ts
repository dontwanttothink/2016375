import type p5 from "p5";
import type { Stage } from "./stage";

export class World {
	p: p5;

	currentStage: Stage;

	constructor(p: p5, stage: Stage) {
		this.p = p;
		this.currentStage = stage;
	}

	transitionTo(newStage: Stage) {
		// TODO: animación
		this.currentStage = newStage;
	}

	draw() {
		this.currentStage.draw();
	}
}
