import type p5 from "p5";
import type { Stage } from "../stage";
import type { Textbox } from "../textbox";
import { expect, IntegerPairMap } from "../utils";
import type { EntityArt } from "./art";

/**
 * Una entidad es algo con una ubicación, una apariencia, y que pertenece a un
 * escenario.
 */
export class Entity {
	p: p5;

	#stage?: Stage;
	protected art: EntityArt;

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
	get position() {
		return this.#position;
	}

	move(to: [number, number]) {
		if (!this.#stage) {
			this.#position = to;
			return;
		}

		const path = this.pathTo(this.#stage.grid.fromStageSpace(to));
		this.#position = to;

		if (path) {
			this.#positionAnimationState = {
				path,
				progress: 0,
			};
		} else {
			this.#positionAnimationState = null;
		}
	}

	#position: [number, number];
	#positionAnimationState: {
		path: [number, number][];
		progress: number;
	} | null = null;

	protected tick() {
		if (!this.#positionAnimationState) {
			return;
		}

		this.#positionAnimationState.progress = Math.min(
			1,
			this.#positionAnimationState.progress +
				((1 - this.#positionAnimationState.progress) / 130) * this.p.deltaTime,
		);
	}

	get #visiblePosition(): [number, number] {
		if (!this.#positionAnimationState) {
			return this.#position;
		}

		if (this.#positionAnimationState.progress > 0.99) {
			this.#positionAnimationState = null;
			this.onStoppedMoving();

			return this.#visiblePosition;
		}

		const cellProgress =
			this.#positionAnimationState.progress *
			(this.#positionAnimationState.path.length - 1);
		const newCellIndex = Math.floor(cellProgress);
		const intracellProgress = cellProgress - newCellIndex;

		const newCell = this.#positionAnimationState.path[newCellIndex];
		const newCellCoordinates = this.stage.grid.toStageSpace(newCell);

		// nótese que la única situación en que no existe un `nextCell` es cuando ya
		// se acabó la animación de todas formas

		const nextCell = this.#positionAnimationState.path.at(newCellIndex + 1);
		if (nextCell) {
			const nextCellCoordinates = this.stage.grid.toStageSpace(nextCell);
			newCellCoordinates[0] +=
				(nextCellCoordinates[0] - newCellCoordinates[0]) * intracellProgress;
			newCellCoordinates[1] +=
				(nextCellCoordinates[1] - newCellCoordinates[1]) * intracellProgress;

			// ¿en qué dirección nos estamos moviendo?
			if (nextCell[0] < newCell[0]) {
				this.onMovingLeft();
			} else if (nextCell[0] > newCell[0]) {
				this.onMovingRight();
			} else if (nextCell[1] > newCell[1]) {
				this.onMovingDownward();
			} else if (nextCell[1] < newCell[1]) {
				this.onMovingUpward();
			}
		}

		const normalizedTarget = this.stage.grid.normalizeStageSpace(
			this.#position,
		);
		const offset = [
			this.#position[0] - normalizedTarget[0],
			this.#position[1] - normalizedTarget[1],
		];

		newCellCoordinates[0] += this.#positionAnimationState.progress * offset[0];
		newCellCoordinates[1] += this.#positionAnimationState.progress * offset[1];

		return newCellCoordinates;
	}

	teleport(to: [number, number]) {
		this.#position = to;
		this.#positionAnimationState = null;
	}

	/**
	 * El ancho con que se debe dibujar la entidad, en términos del tamaño de un pixel
	 * del escenario.
	 */
	width: number;

	/**
	 * La altura con que se debe dibujar la entidad, en términos del tamaño de un pixel
	 * del escenario.
	 */
	height: number;

	/**
	 * El espacio ocupado por la entidad, en términos del tamaño de un pixel del
	 * escenario.
	 */
	hitbox: {
		width?: number;
		height?: number;

		/**
		 * El centro de la caja de colisión, como un delta desde el centro de la
		 * entidad y en términos de los pixeles del escenario.
		 */
		center?: [number, number];
	} = {};

	/**
	 * La caja de colisión actual, incluso si no se ha establecido una explícitamente
	 * con la propiedad pública `hitbox`.
	 */
	get #hitbox(): { width: number; height: number; center: [number, number] } {
		return {
			width: this.width,
			height: this.height,
			center: [0, 0],
			...this.hitbox,
		};
	}

	isInteractive() {
		return this.isMovable;
	}
	isMovable: boolean = false;

	name: string = "Entidad";

	maxHealth: number = 1;
	health: number = 1;

	get reach() {
		return 1;
	}

	constructor(p: p5, art: EntityArt, position: [number, number]) {
		this.p = p;

		this.art = art;

		this.width = art.appearance.width;
		this.height = art.appearance.height;

		this.#position = position;
	}

	/**
	 * Θ(n) con n = el número de celdas
	 */
	protected pathTo(position: [number, number]): [number, number][] | null {
		const neighborsOf = (location: [number, number]) =>
			[
				[location[0] + 1, location[1]],
				[location[0] - 1, location[1]],
				[location[0], location[1] + 1],
				[location[0], location[1] - 1],
			] as [number, number][];

		const root = this.#stage?.grid.fromStageSpace(this.#position);
		if (!root) {
			return null;
		}

		let sources = [root];

		const seen = new IntegerPairMap<{ from: [number, number] | null }>();
		seen.set(root, { from: null });

		bfs: while (sources.length > 0) {
			const newSources: [number, number][] = [];
			for (const source of sources) {
				if (source[0] === position[0] && source[1] === position[1]) {
					break bfs;
				}

				for (const neighbor of neighborsOf(source)) {
					if (seen.has(neighbor)) {
						continue;
					}

					if (
						this.stage.collidesAt(
							this.stage.grid.toStageSpace(neighbor, true),
							this,
						)
					) {
						continue;
					}

					seen.set(neighbor, { from: source });
					newSources.push(neighbor);
				}
			}
			sources = newSources;
		}

		const destination = seen.get(position);
		if (!destination) {
			return null;
		}

		const path: [number, number][] = [position];

		let current = destination;
		while (current.from) {
			path.push(current.from);

			const previous = expect(seen.get(current.from));
			current = previous;
		}

		return path.reverse();
	}

	draw() {
		this.tick();

		this.art.draw(
			this.stage.toScreenSpace(this.#visiblePosition),
			this.width * this.stage.scale,
			this.height * this.stage.scale,
			{ fit: this.fit },
		);

		this.#drawHealthBar();

		if (import.meta.env.MODE === "DEBUG") {
			this.p.push();
			this.p.stroke(255, 0, 0, 100);
			this.p.fill(200, 50);
			this.p.circle(...this.stage.toScreenSpace(this.#position), 10);

			this.p.noFill();
			this.p.rectMode(this.p.CENTER);
			this.p.rect(
				...this.stage.toScreenSpace([
					this.#position[0] + this.#hitbox.center[0],
					this.#position[1] + this.#hitbox.center[1],
				]),
				this.#hitbox.width * this.stage.scale,
				this.#hitbox.height * this.stage.scale,
			);

			this.p.pop();
		}
	}

	#drawHealthBar() {
		if (this.maxHealth <= 0) return;

		const screenPosition = this.stage.toScreenSpace(this.#visiblePosition);
		const barWidth = this.width * this.stage.scale;
		const barHeight = 4;
		const barY =
			screenPosition[1] + (this.height * this.stage.scale) / 2 - barHeight - 4;
		const barX = screenPosition[0] - barWidth / 2;

		const ratio = Math.max(0, Math.min(1, this.health / this.maxHealth));

		this.p.push();
		this.p.noStroke();
		this.p.rectMode(this.p.CORNER);

		this.p.fill(40);
		this.p.rect(barX, barY, barWidth, barHeight);

		this.p.fill(
			this.p.lerpColor(this.p.color("red"), this.p.color("limegreen"), ratio),
		);
		this.p.rect(barX, barY, barWidth * ratio, barHeight);

		this.p.pop();
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
			this.#position[0] + delta[0],
			this.#position[1] + delta[1],
		];

		const pixels: [number, number] = [
			Math.abs(
				Math.floor(this.#position[0]) -
					Math.floor(this.#position[0] + delta[0]),
			),
			Math.abs(
				Math.floor(this.#position[1]) -
					Math.floor(this.#position[1] + delta[1]),
			),
		];

		let wall: [number, number] = target;

		ray: for (let i = 0; i <= pixels[0]; ++i) {
			const d =
				this.#hitbox.center[0] + Math.sign(delta[0]) * (this.#hitbox.width / 2);

			const k = Math.floor(this.#position[0] + d) + Math.sign(delta[0]) * i;

			let x = k - d;
			if (Math.sign(delta[0]) === -1) {
				x = x + 1 + FORCE_FIELD;
			}

			const y =
				this.#position[1] +
				(i !== 0 ? (x - this.#position[0]) * (delta[1] / delta[0]) : 0);

			for (
				let j = Math.floor(
					y + this.#hitbox.center[1] - this.#hitbox.height / 2,
				);
				j < y + this.#hitbox.center[1] + this.#hitbox.height / 2;
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
			const d =
				this.#hitbox.center[1] +
				Math.sign(delta[1]) * (this.#hitbox.height / 2);

			// La fila que vamos a probar
			const k = Math.floor(this.#position[1] + d) + Math.sign(delta[1]) * i;

			let y = k - d;
			if (Math.sign(delta[1]) === -1) {
				y = y + 1 + FORCE_FIELD;
			}

			const x =
				this.#position[0] +
				(i !== 0 ? (this.#position[1] - y) * (delta[0] / delta[1]) : 0);

			for (
				let j = Math.floor(x + this.#hitbox.center[0] - this.#hitbox.width / 2);
				j < x + this.#hitbox.center[0] + this.#hitbox.width / 2;
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
			(wall[0] - this.#position[0]) ** 2 + (wall[1] - this.#position[1]) ** 2;

		const ceilingNormSquared =
			(ceiling[0] - this.#position[0]) ** 2 +
			(ceiling[1] - this.#position[1]) ** 2;

		if (wallNormSquared > ceilingNormSquared) {
			this.#position = ceiling;
		} else {
			this.#position = wall;
		}
	}

	assignToStage(stage: Stage) {
		this.#stage = stage;
	}

	/**
	 *	@param location Una ubicación absoluta en el espacio del escenario.
	 */
	intersects(location: [number, number]) {
		return (
			Math.abs(location[0] - this.#position[0]) < this.width / 2 &&
			Math.abs(location[1] - this.#position[1]) < this.height / 2
		);
	}

	/**
	 * Las opciones que deberían ofrecerse
	 */
	interactionOptions(): Map<number, string> {
		return new Map();
	}

	onInteracted(_option: number, _textbox: Textbox) {}

	onMovingDownward() {}
	onMovingUpward() {}
	onMovingLeft() {}
	onMovingRight() {}
	onStoppedMoving() {}
}
