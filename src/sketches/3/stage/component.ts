import type p5 from "p5";
import type { Stage } from ".";

export class StageComponent {
	static UNASSIGNED_ERROR =
		"Este objeto tiene que asignarse a un escenario primero.";

	static ALREADY_ASSIGNED_ERROR = "Este objeto ya pertenece a un escenario.";

	#p?: p5;
	#stage?: Stage;

	protected get p(): p5 {
		if (!this.#p) {
			throw new ReferenceError(StageComponent.UNASSIGNED_ERROR);
		}
		return this.#p;
	}

	protected get stage(): Stage {
		if (!this.#stage) {
			throw new ReferenceError(StageComponent.UNASSIGNED_ERROR);
		}
		return this.#stage;
	}

	public assignToStage(p: p5, stage: Stage) {
		if (this.#p || this.#stage) {
			throw new Error(StageComponent.ALREADY_ASSIGNED_ERROR);
		}

		this.#p = p;
		this.#stage = stage;
	}
}
