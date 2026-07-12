import type p5 from "p5";
import type { Stage } from "./stage";
import { Panel } from "./Interaction/panel";

export class World {
	p: p5;
	stage: Stage;
	Panel: Panel;
	
	/**
	 * El escenario activo actual.
	 */

	constructor(p: p5, stage: Stage) {
		this.p = p;
		this.stage = stage;
		this.Panel = new Panel(p);
	}

	transitionTo(newStage: Stage) {
		// TODO: animación
		this.stage = newStage;
	}

	draw() {
		this.stage.draw();
		this.Panel.draw(this.stage.bottomMargin);
	}
}