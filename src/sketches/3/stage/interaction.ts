import type { Entity } from "../entity";
import { StageComponent } from "./component";

export enum Phase {
	Idle,
	Selected,
	Moving,
}

type PhaseState =
	| { kind: Phase.Idle }
	| { kind: Phase.Selected; entity: Entity }
	| { kind: Phase.Moving; entity: Entity };

export class StageInteraction extends StageComponent {
	phase: PhaseState = { kind: Phase.Idle };
	enabledAt(location: [number, number]): boolean {
		const entity = this.stage.intersectsWithEntityAt(location);
		if (entity) {
			return entity.isInteractive;
		}
		return false;
	}

	get selectedEntity(): Entity | null {
		return this.phase.kind !== Phase.Idle ? this.phase.entity : null;
	}

	get isMoving(): boolean {
		return this.phase.kind === Phase.Moving;
	}

	startMoving() {
		if (this.phase.kind === Phase.Idle) {
			throw new Error("no hay ninguna entidad seleccionada.");
		}

		const { entity } = this.phase;
		this.phase = { kind: Phase.Moving, entity };
		this.stage.grid.highlight(
			entity.reach,
			this.stage.grid.fromStageSpace(entity.position),
			this.p.color("red"),
		);
	}

	deselect() {
		this.phase = { kind: Phase.Idle };
		this.stage.grid.stopHighlighting();
	}

	clickedAt(location: [number, number]) {
		const entity = this.stage.intersectsWithEntityAt(location);

		if (this.phase.kind === Phase.Idle && entity?.isMovable) {
			this.phase = { kind: Phase.Selected, entity };
			return;
		}

		if (this.phase.kind !== Phase.Idle && entity === this.phase.entity) {
			this.deselect();
			return;
		}

		if (this.phase.kind === Phase.Moving) {
			const gridLocation = this.stage.grid.fromStageSpace(location);

			if (this.stage.grid.isHighlighting(gridLocation)) {
				const { entity: selected } = this.phase;
				const destination = this.stage.grid.toStageSpace(gridLocation);

				selected.displace([
					destination[0] - selected.position[0],
					destination[1] - selected.position[1],
				]);

				this.deselect();
			}
		}
	}
}
