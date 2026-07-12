import type p5 from "p5";
import type { Stage } from "./stage";
import { Textbox } from "./textbox";

export class World {
	p: p5;
	stage: Stage;
	panel: Textbox;

	/**
	 * El escenario activo actual.
	 */

	constructor(p: p5, stage: Stage) {
		this.p = p;
		this.stage = stage;
		this.panel = new Textbox(p);
	}

	transitionTo(newStage: Stage) {
		// TODO: animación
		this.stage = newStage;
	}

	draw() {
		this.stage.draw();
		this.panel.draw(this.stage.bottomMargin);
	}
}
