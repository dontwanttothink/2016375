import type p5 from "p5";
import { Entity } from "../entity";
import { EntityArt } from "../entity/art";
import { Phase } from "../stage/interaction";
import { expect } from "../utils";
import type { World } from "../world";

enum ProtagonistInteractions {
	Example,
	Example2,
}

export class ProtagonistEntity extends Entity {
	static MAX_ENERGY = 10;

	constructor(p: p5, art: EntityArt, position: [number, number]) {
		super(p, art, position);
		this.name = "Protagonista";
		this.hitbox = {
			height: 14,
			center: [0, 4],
		};
	}

	energy: number = ProtagonistEntity.MAX_ENERGY;

	get reach(): number {
		return Math.round(this.energy / 2);
	}

	isInteractive(): boolean {
		return (
			this.stage.interaction.phase.kind === Phase.Idle ||
			(this.stage.interaction.phase.kind === Phase.Selected &&
				this.stage.interaction.phase.entity === this)
		);
	}
	isPlayerControlled: boolean = true;

	#world?: World;
	get world() {
		return expect(this.#world);
	}

	assignToWorld(world: World) {
		if (this.#world) {
			throw new Error("El protagonista solo puede pertenecer a un mundo.");
		}
		this.#world = world;
	}

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

	async onStoppedMoving() {
		this.art.immediatelyStopAnimating();

		const newStage = this.stage.grid.transitions.get(
			this.stage.grid.fromStageSpace(this.position),
		);

		// nótese que si se tarda mucho tiempo en cargar la siguiente escena, puede
		// ser que el usuario tenga la oportunidad de interactuar con la escena
		// actual antes de ser teletransportado

		if (newStage) {
			this.world.transitionTo(await newStage(this.p, this));
		}
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
