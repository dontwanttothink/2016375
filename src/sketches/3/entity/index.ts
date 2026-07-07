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

	/**
	 * La caja de colisión actual, incluso si no se ha establecido una explícitamente
	 * con la propiedad pública `hitbox`.
	 */
	get #hitbox(): { width: number; height: number } {
		return (
			this.hitbox ?? {
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
		// Esto corrige problemas causados por imprecisión, creo
		const FORCE_FIELD = 0.1;

		const target: [number, number] = [
			this.position[0] + delta[0],
			this.position[1] + delta[1],
		];

		const pixels: [number, number] = [
			Math.abs(
				Math.floor(this.position[0]) - Math.floor(this.position[0] + delta[0]),
			),
			Math.abs(
				Math.floor(this.position[1]) - Math.floor(this.position[1] + delta[1]),
			),
		];

		let wall: [number, number] = target;

		ray: for (let i = 0; i <= pixels[0]; ++i) {
			const k =
				Math.floor(
					this.position[0] + Math.sign(delta[0]) * (this.#hitbox.width / 2),
				) +
				Math.sign(delta[0]) * i;

			let x = k - Math.sign(delta[0]) * (this.#hitbox.width / 2);
			if (Math.sign(delta[0]) === -1) {
				x = x + 1 + FORCE_FIELD;
			}

			const y =
				this.position[1] +
				(i !== 0 ? (x - this.position[0]) * (delta[1] / delta[0]) : 0);

			for (
				let j = Math.floor(y - this.#hitbox.height / 2);
				j < y + this.#hitbox.height / 2;
				++j
			) {
				if (this.stage.collidesAt([k, j], this)) {
					this.stage.debug.highlight([k, j]);
					wall = [x, y];
					break ray;
				}
			}
		}

		let ceiling: [number, number] = target;

		ray: for (let i = 0; i <= pixels[1]; ++i) {
			// La fila que vamos a probar
			const k =
				Math.floor(
					this.position[1] + Math.sign(delta[1]) * (this.#hitbox.height / 2),
				) +
				Math.sign(delta[1]) * i;

			let y = k - Math.sign(delta[1]) * (this.#hitbox.height / 2);
			if (Math.sign(delta[1]) === -1) {
				y = y + 1 + FORCE_FIELD;
			}

			const x =
				this.position[0] +
				(i !== 0 ? (this.position[1] - y) * (delta[0] / delta[1]) : 0);

			for (
				let j = Math.floor(x - this.#hitbox.width / 2);
				j < x + this.#hitbox.width / 2;
				++j
			) {
				if (this.stage.collidesAt([j, k], this)) {
					this.stage.debug.highlight([j, k]);
					ceiling = [x, y];
					break ray;
				}
			}
		}

		const wallNormSquared =
			(wall[0] - this.position[0]) ** 2 + (wall[1] - this.position[1]) ** 2;

		const ceilingNormSquared =
			(ceiling[0] - this.position[0]) ** 2 +
			(ceiling[1] - this.position[1]) ** 2;

		if (wallNormSquared > ceilingNormSquared) {
			this.position = ceiling;
		} else {
			this.position = wall;
		}
		console.log(this.position);
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
