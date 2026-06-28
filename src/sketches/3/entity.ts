import type { Stage } from "./stage";

export class Entity {
	#stage?: Stage;

	/**
	 * La ubicación objetivo de esta entidad, en el espacio de escenario. Por
	 * ejemplo, la entidad podría estar en proceso de desplazarse a esta
	 * ubicación.
	 */
	target?: [number, number];

	/**
	 * La ubicación actual de esta entidad, en el espacio de escenario.
	 */
	location?: [number, number];

	get stage(): Stage {
		if (!this.#stage) {
			throw new Error("Esta entidad no se ha asignado a un escenario.");
		}
		return this.#stage;
	}

	/**
	 * Intentar mover la entidad. Se comprueba la colisión.
	 */
	move(delta: [number, number]) {}

	assignToStage(stage: Stage) {
		if (this.#stage) {
			throw new Error(
				"una entidad solo se puede asignar a un escenario una vez.",
			);
		}

		this.#stage = stage;
	}
}
