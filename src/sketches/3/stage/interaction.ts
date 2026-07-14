import type { Entity } from "../entity";
import type { Textbox } from "../textbox";
import { StageComponent } from "./component";

enum Phase {
	Idle,
	Selected,
	Targeting,
}

type PhaseState =
	| {
		kind: Phase.Idle;
	}
	| { kind: Phase.Selected; entity: Entity }
	| { kind: Phase.Targeting; attacker: Entity };

export class StageInteraction extends StageComponent {
	phase: PhaseState = { kind: Phase.Idle };

	/**
	 * Indica si hay algo con lo que interactuar en este momento en esta ubicación.
	 *
	 * @param location en el espacio del escenario
	 */
	enabledAt(location: [number, number]): boolean {
		const entity = this.stage.intersectsWithEntityAt(location);
		if (this.phase.kind === Phase.Targeting) {
			if (entity === this.phase.attacker) return true;

			if (entity) {
				const attackerCell = this.stage.grid.fromStageSpace(
					this.phase.attacker.position,
				);
				const targetCell = this.stage.grid.fromStageSpace(location);
				return this.stage.grid.attackable(
					this.phase.attacker.reach,
					attackerCell,
					targetCell,
				);
			}
			return false;
		}
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
	startTargeting(attacker: Entity) {
		this.phase = { kind: Phase.Targeting, attacker };
		this.stage.grid.highlight(
			attacker.reach,
			this.stage.grid.fromStageSpace(attacker.position),
			this.p.color("orange"),
			"attack",
		);
	}

	/**
	 * @param location en términos del espacio del escenario
	 */
	clickedAt(location: [number, number], textbox: Textbox) {
		const entity = this.stage.intersectsWithEntityAt(location);
		if (this.phase.kind === Phase.Targeting) {
			const { attacker } = this.phase;

			if (!entity || entity === attacker) {
				// cancelamos el ataque
				this.phase = { kind: Phase.Idle };
				this.stage.grid.stopHighlighting();
				textbox.hide();
				return;
			}

			const attackerCell = this.stage.grid.fromStageSpace(attacker.position);
			const targetCell = this.stage.grid.fromStageSpace(location);

			if (this.stage.grid.attackable(attacker.reach, attackerCell, targetCell)) {
				entity.health = (entity.health ?? 0) - 1;

				this.phase = { kind: Phase.Idle };
				this.stage.grid.stopHighlighting();

				if (entity.health <= 0) {
					entity.isInteractive = false;
					entity.isMovable = false;
					textbox.showMessage(`${entity.name} ha muerto.`);
				} else {
					textbox.hide();
				}
			}
			return;
		}

		if (this.phase.kind === Phase.Idle && entity?.isMovable) {
			// se seleccionó una entidad
			this.phase = { kind: Phase.Selected, entity };
			this.stage.grid.highlight(
				entity.reach,
				this.stage.grid.fromStageSpace(entity.position),
				this.p.color("red"),
			);

			textbox.show(entity.interactionOptions(), entity);
			return;
		}

		if (this.phase.kind === Phase.Selected && entity === this.phase.entity) {
			// cancelamos la interacción
			this.phase = { kind: Phase.Idle };
			this.stage.grid.stopHighlighting();
			textbox.hide();
			return;
		}

		if (
			this.phase.kind === Phase.Selected &&
			!entity &&
			this.stage.grid.reachable(
				this.phase.entity.reach,
				this.stage.grid.fromStageSpace(this.phase.entity.position),
				this.stage.grid.fromStageSpace(location),
			)
		) {
			// movemos la entidad y acabamos la interacción
			this.phase.entity.position = this.stage.grid.normalizeStageSpace(location);

			this.phase = { kind: Phase.Idle };
			this.stage.grid.stopHighlighting();
			textbox.hide();
		}
	}
}
