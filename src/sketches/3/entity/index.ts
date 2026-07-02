import type p5 from "p5";
import type { Stage } from "../stage";
import type { EntityArt } from "./art";

/**
 * Una entidad es algo con una ubicación, una apariencia, y que pertenece a un
 * escenario.
 */
export class Entity {
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

	constructor(art: EntityArt, position: [number, number]) {
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
		this.#art.draw(
			this.stage.toScreenSpace(this.position),
			this.width * this.stage.scale,
			this.height * this.stage.scale,
			{ fit: this.fit },
		);
	}

	/**
	 * Intentar mover la entidad instantáneamente. Se comprueba la colisión.
	 *
	 * @argument delta El vector por el que la entidad se quiere mover, en
	 * términos del espacio de coordenadas del escenario.
	 */
	displace(delta: [number, number]) {
		// TODO: comprobar hitboxes de las otras entidades
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
