import type { Entity } from "../entity";
import { StageComponent } from "./component";

enum Phase {
	Idle,
	Selecting,
}

type PhaseState =
	| {
			kind: Phase.Idle;
	  }
	| { kind: Phase.Selecting; entity: Entity };

export class StageInteraction extends StageComponent {
	phase: PhaseState = { kind: Phase.Idle };

	/**
	 * Indica si hay algo con lo que interactuar en este momento en esta ubicación.
	 *
	 * @param location en el espacio del escenario
	 */
	enabledAt(location: [number, number]): boolean {
		const entity = this.stage.intersectsWithEntityAt(location);
		if (entity) {
			return entity.isInteractive;
		}

		if (
			this.phase.kind === Phase.Selecting &&
			this.stage.grid.reachable(
				this.phase.entity.reach,
				this.stage.grid.fromStageSpace(this.phase.entity.position),
				this.stage.grid.fromStageSpace(location),
			)
		) {
			return true;
		}

		return false;
	}

	/**
	 * @param location en términos del espacio del escenario
	 */
	clickedAt(location: [number, number]) {
		const entity = this.stage.intersectsWithEntityAt(location);
		if (this.phase.kind === Phase.Idle && entity?.isMovable) {
			this.phase = { kind: Phase.Selecting, entity };
			this.stage.grid.highlight(
				entity.reach,
				this.stage.grid.fromStageSpace(entity.position),
				this.p.color("red"),
			);
		} else if (
			this.phase.kind === Phase.Selecting &&
			entity === this.phase.entity
		) {
			// cancelamos la interacción
			this.phase = { kind: Phase.Idle };
			this.stage.grid.stopHighlighting();
		} else if (
			this.phase.kind === Phase.Selecting &&
			!entity &&
			this.stage.grid.reachable(
				this.phase.entity.reach,
				this.stage.grid.fromStageSpace(this.phase.entity.position),
				this.stage.grid.fromStageSpace(location),
			)
		) {
			this.phase.entity.position =
				this.stage.grid.normalizeStageSpace(location);

			this.phase = { kind: Phase.Idle };
			this.stage.grid.stopHighlighting();
		}
	}
}
