import { Entity } from "../entity";
import { Phase } from "../stage/interaction";

export class EnemyEntity extends Entity {
	isInteractive() {
		// somos interactivos cuando alguien está seleccionado y estamos dentro de
		// su radio

		return (
			this.stage.interaction.phase.kind === Phase.Selected &&
			this.attackable(this.stage.interaction.phase.entity)
		);
	}
}
