import { Entity } from "../entity";
import { Phase } from "../stage/interaction";

enum CombatantInteractions {
	Atacar,
}

export class CombatantEntity extends Entity {
	health = 3;
	maxHealth = 3;

	isInteractive() {
		// somos interactivos cuando alguien está seleccionado y estamos dentro de
		// su radio

		return (
			this.stage.interaction.phase.kind === Phase.Selected &&
			this.attackable(this.stage.interaction.phase.entity)
		);
	}
	energy = 3;

	get reach() {
		return this.energy;
	}

	interactionOptions(): Map<number, string> {
		return new Map([[CombatantInteractions.Atacar, "Atacar"]]);
	}

	onInteracted(option: number) {
		if (option === CombatantInteractions.Atacar) {
			this.stage.interaction.startTargeting(this);
		}
	}
}
