import { Entity } from "../entity";

enum CombatantInteractions {
	Atacar,
}

export class CombatantEntity extends Entity {
	health = 3;
	maxHealth = 3;

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
