import { EnemyEntity } from "../characters/enemy";
import { ProtagonistEntity } from "../characters/protagonist";
import type { Textbox } from "../textbox";
import { expect } from "../utils";
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
	| { kind: Phase.Selected; entity: ProtagonistEntity };

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
			this.stage.grid.reachable(this.stage.grid.fromStageSpace(location))
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
		if (this.phase.kind === Phase.Idle && entity instanceof ProtagonistEntity) {
			this.phase = { kind: Phase.Selected, entity };
			this.stage.grid.highlight(
				entity.reach,
				this.stage.grid.fromStageSpace(entity.position),
				this.p.color("red"),
				entity,
			);

			if (this.stage.isExhausting) {
				textbox.showEnergy(entity);
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
			this.stage.grid.reachable(this.stage.grid.fromStageSpace(location))
		) {
			// la distancia recorrida (longitud de la ruta BFS) se lee antes de dejar
			// de resaltar, que es lo que borra el campo de distancias
			const distance = expect(
				this.stage.grid.reachDistance(this.stage.grid.fromStageSpace(location)),
			);

			this.phase.entity.move(this.stage.grid.normalizeStageSpace(location));

			if (this.stage.isExhausting) {
				this.phase.entity.energy = Math.max(
					0,
					this.phase.entity.energy - distance,
				);
			}

			this.phase = { kind: Phase.Idle };
			this.stage.grid.stopHighlighting();
			textbox.hide(this.p.millis() + 1000);
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
