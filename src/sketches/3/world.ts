import type { Stage } from "./stage";

export class World {
	currentStage: Stage;

	constructor(stage: Stage) {
		this.currentStage = stage;
	}

	// TODO
	transitionTo(newStage: Stage) {}
}
