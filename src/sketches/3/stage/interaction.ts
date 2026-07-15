import { EnemyEntity } from "../characters/enemy";
import type { Entity } from "../entity";
import type { Textbox } from "../textbox";
import { StageComponent } from "./component";

export enum Phase {
	Idle,
	Selected,
	Attacking,
	BeingAttacked,
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
			return entity.isInteractive();
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
	 * Esta función se encarga de transicionar los estados de interacción.
	 *
	 * @param location en términos del espacio del escenario
	 */
	clickedAt(location: [number, number], textbox: Textbox) {
		const entity = this.stage.intersectsWithEntityAt(location);

		// se seleccionó una entidad controlable, así que iniciamos la interacción
		if (this.phase.kind === Phase.Idle && entity?.isPlayerControlled) {
			this.phase = { kind: Phase.Selected, entity };
			this.stage.grid.highlight(
				entity.reach,
				this.stage.grid.fromStageSpace(entity.position),
				this.p.color("red"),
			);

			if (this.stage.isExhausting) {
				textbox.showEnergy();
			}

			return;
		}

		// se hizo clic en la entidad activa, así que cancelamos la interacción
		if (this.phase.kind === Phase.Selected && entity === this.phase.entity) {
			this.phase = { kind: Phase.Idle };
			this.stage.grid.stopHighlighting();
			textbox.hide();
			return;
		}

		// se hizo clic en un espacio libre válido, así que movemos la entidad y
		// acabamos la interacción
		if (
			this.phase.kind === Phase.Selected &&
			!entity &&
			this.stage.grid.reachable(
				this.phase.entity.reach,
				this.stage.grid.fromStageSpace(this.phase.entity.position),
				this.stage.grid.fromStageSpace(location),
			)
		) {
			this.phase.entity.move(this.stage.grid.normalizeStageSpace(location));

			this.phase = { kind: Phase.Idle };
			this.stage.grid.stopHighlighting();
			textbox.hide();
			return;
		}

		// se hizo clic en una entidad enemiga y hay algún personaje seleccionado,
		// así que efectuamos el ataque
		if (
			this.phase.kind === Phase.Selected &&
			entity instanceof EnemyEntity &&
			entity.attackable(this.phase.entity)
		) {
		}
	}
}
