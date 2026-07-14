import { Entity } from "../entity";

enum CombatantInteractions {
    Atacar,
}
/* Funciones de atacar */
export class CombatantEntity extends Entity {
    health = 3;
    maxHealth = 3;

    energy = 3;

    get reach() {
        return this.energy;
    }

    isInteractive: boolean = true;
    isMovable: boolean = true;

    interactionOptions(): Map<number, string> {
        return new Map([[CombatantInteractions.Atacar, "Atacar"]]);
    }

    interacted(option: number) {
        if (option === CombatantInteractions.Atacar) {
            this.stage.interaction.startTargeting(this);
        }
    }
}