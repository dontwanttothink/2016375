import type { Entity } from "../entity";
import type { Textbox } from "../textbox";
import { StageComponent } from "./component";

enum Phase {
	Idle,
	Selected,
}

type PhaseState =
	| {
			kind: Phase.Idle;
	  }
	| { kind: Phase.Selected; entity: Entity };

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
			this.phase.kind === Phase.Selected &&
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
	clickedAt(location: [number, number], textbox: Textbox) {
		const entity = this.stage.intersectsWithEntityAt(location);
		if (this.phase.kind === Phase.Idle && entity?.isMovable) {
			// se seleccionó una entidad
			this.phase = { kind: Phase.Selected, entity };
			this.stage.grid.highlight(
				entity.reach,
				this.stage.grid.fromStageSpace(entity.position),
				this.p.color("red"),
			);

			// le preguntamos a la entidad qué opciones quiere ofrecer
			textbox.show(entity.interactionOptions(), entity);
		} else if (
			this.phase.kind === Phase.Selected &&
			entity === this.phase.entity
		) {
			// cancelamos la interacción
			this.phase = { kind: Phase.Idle };
			this.stage.grid.stopHighlighting();
			textbox.hide();
		} else if (
			this.phase.kind === Phase.Selected &&
			!entity &&
			this.stage.grid.reachable(
				this.phase.entity.reach,
				this.stage.grid.fromStageSpace(this.phase.entity.position),
				this.stage.grid.fromStageSpace(location),
			)
		) {
			// movemos la entidad y acabamos la interacción

			this.phase.entity.position =
				this.stage.grid.normalizeStageSpace(location);

			this.phase = { kind: Phase.Idle };
			this.stage.grid.stopHighlighting();
			textbox.hide();
		}

		textbox.clickedAt(location);
	}
}
