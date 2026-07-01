import type p5 from "p5";
import type { Stage } from "../stage";
import type { EntityArt } from "./art";

/**
 * Una entidad es algo con una ubicación, una apariencia, y que pertenece a un
 * escenario.
 */
export class Entity {
	#p: p5;

	#stage?: Stage;
	#art: EntityArt;

	/**
	 * Determina si la entidad debería dibujarse dentro de `width` y `height`
	 * mientras que mantiene su razón de aspecto, o si debería dibujarse con las
	 * dimensiones exactas dadas en `width` y `height` incluso si eso implica
	 * distorsionar la imagen.
	 */
	fit: boolean = true;

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
	position: [number, number];

	width: number;
	height: number;

	hitbox?: {
		width: number;
		height: number;
	};

	get #hitbox(): { width: number; height: number } {
		return (
			this.#hitbox ?? {
				width: this.width,
				height: this.height,
			}
		);
	}

	constructor(p: p5, art: EntityArt, position: [number, number]) {
		this.#p = p;
		this.#art = art;

		this.width = art.appearance.width;
		this.height = art.appearance.height;

		this.position = position;
	}

	/**
	 * Una función que se ejecuta cada vez que se dibuja un fotograma y que se
	 * puede usar para actualizar el estado.
	 */
	tick() {}

	draw() {
		this.tick();
		this.#art.draw(this.position, this.width, this.height, { fit: this.fit });
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
