import type p5 from "p5";
import type { Stage } from "../stage";
import type { EntityArt } from "./art";

/**
 * Una entidad es algo con una ubicación, una apariencia, y que pertenece a un
 * escenario.
 */
export class Entity {
	#p: p5;

	#art: EntityArt;
	#stage?: Stage;

	get stage(): Stage {
		if (!this.#stage) {
			throw new Error("Esta entidad no se ha asignado a un escenario.");
		}
		return this.#stage;
	}

	/**
	 * La ubicación objetivo de esta entidad, en el espacio de escenario. Por
	 * ejemplo, la entidad podría estar en proceso de desplazarse a esta
	 * ubicación.
	 */
	target?: [number, number];

	/**
	 * La ubicación actual de esta entidad, en el espacio de escenario.
	 */
	position?: [number, number];

	hitbox?: {
		width: number;
		height: number;
	};

	constructor(p: p5, art: EntityArt) {
		this.#p = p;
		this.#art = art;
	}

	draw() {
		this.#art.draw(this.position);
	}

	/**
	 * Intentar mover la entidad. Se comprueba la colisión.
	 */
	move(delta: [number, number]) {
		// hacer un rayo
	}

	assignToStage(stage: Stage) {
		if (this.#stage) {
			throw new Error(
				"una entidad solo se puede asignar a un escenario una vez.",
			);
		}

		this.#stage = stage;
	}
}
