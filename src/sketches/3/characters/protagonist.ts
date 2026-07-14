import type p5 from "p5";
import { EntityArt } from "../entity/art";
import { CombatantEntity } from "./combatant";

enum ProtagonistInteractions {
	Example,
	Example2,
}

export class ProtagonistEntity extends CombatantEntity {
	constructor(p: p5, art: EntityArt, position: [number, number]) {
		super(p, art, position);
		this.name = "Protagonista";
		this.hitbox = {
			height: 14,
			center: [0, 4],
		};
	}

	isMovable: boolean = true;

	interactionOptions(): Map<number, string> {
		return new Map([
			[ProtagonistInteractions.Example, "Ejemplo"],
			[ProtagonistInteractions.Example2, "Ejemplo 2"],
		]);
	}

	onMovingDownward() {
		this.art.animate("walk_forward", true);
	}

	onMovingLeft() {
		this.art.animate("walk_left", true);
	}

	onMovingRight(): void {
		this.art.animate("walk_right", true);
	}

	onMovingUpward(): void {
		this.art.animate("walk_backward", true);
	}

	onStoppedMoving(): void {
		this.art.immediatelyStopAnimating();
	}
}

export async function Protagonist(p: p5, position: [number, number] = [0, 0]) {
	const art = await EntityArt.fromName(p, "protagonist");
	await Promise.all([
		art.loadAnimation("walk_forward"),
		art.loadAnimation("walk_backward"),
		art.loadAnimation("walk_left"),
		art.loadAnimation("walk_right"),
	]);

	return new ProtagonistEntity(p, art, position);
}
