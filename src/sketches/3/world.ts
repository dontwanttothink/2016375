import type p5 from "p5";
import type { Stage } from "./stage";

export class World {
	p: p5;

	/**
	 * El escenario activo actual.
	 */
	stage: Stage;

	constructor(p: p5, stage: Stage) {
		this.p = p;
		this.stage = stage;
	}

	transitionTo(newStage: Stage) {
		// TODO: animación
		this.stage = newStage;
	}

	draw() {
		this.stage.draw();
	}
}
