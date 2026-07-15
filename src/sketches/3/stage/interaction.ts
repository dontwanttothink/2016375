import { EnemyEntity } from "../characters/enemy";
import { ProtagonistEntity } from "../characters/protagonist";
import type { Textbox } from "../textbox";
import { expect } from "../utils";
import { StageComponent } from "./component";

export enum Phase {
	Idle,
	Selected,
	WillBeAttacked,
	Attacking,
	BeingAttacked,
	Resting,
}

enum RestingPhaseStep {
	Message,
	Reloading,
}

type PhaseState =
	| {
			kind: Phase.Idle;
	  }
	| { kind: Phase.Selected; entity: ProtagonistEntity }
	| { kind: Phase.WillBeAttacked; protagonist: ProtagonistEntity }
	| { kind: Phase.Attacking; protagonist: ProtagonistEntity; since: number }
	| {
			kind: Phase.BeingAttacked;
			protagonist: ProtagonistEntity;
			enemies: EnemyEntity[];
			index: number;
			moving: EnemyEntity | null;
	  }
	| {
			kind: Phase.Resting;
			protagonist: ProtagonistEntity;
			step: RestingPhaseStep;
			since: number;
	  };

export class StageInteraction extends StageComponent {
	static ATTACK_DURATION = 1000;
	static REST_MESSAGE_DURATION = 1000;
	static REST_RELOADING_DURATION = 2500;

	phase: PhaseState = { kind: Phase.Idle };

	/**
	 * Indica si hay algo con lo que interactuar en este momento en esta ubicación.
	 *
	 * @param location en el espacio del escenario
	 */
	enabledAt(location: [number, number]): boolean {
		const entity = this.stage.intersectsWithEntityAt(location);

		if (entity) {
			return entity.isInteractive();
		}

		if (
			this.phase.kind === Phase.Selected &&
			this.stage.grid.reachable(this.stage.grid.fromStageSpace(location))
		) {
			return true;
		}

		return false;
	}

	/**
	 * Esta función se encarga de transicionar los estados de interacción en
	 * respuesta a un clic. Hay otros eventos que transicionan el estado de
	 * interacción; para las transiciones basadas en condiciones verificadas cada
	 * fotograma, véase `.tick()`.
	 *
	 * @param location en términos del espacio del escenario
	 */
	clickedAt(location: [number, number], textbox: Textbox) {
		const entity = this.stage.intersectsWithEntityAt(location);

		// se seleccionó una entidad controlable, así que iniciamos la interacción
		if (
			this.phase.kind === Phase.Idle &&
			entity instanceof ProtagonistEntity &&
			!entity.isDead
		) {
			this.phase = { kind: Phase.Selected, entity };
			this.stage.grid.highlight(
				entity.reach,
				this.stage.grid.fromStageSpace(entity.position),
				this.p.color("red"),
				entity,
			);

			if (this.stage.isExhausting) {
				textbox.showEnergy(entity);
			}

			return;
		}

		// se hizo clic en la entidad activa, así que cancelamos la interacción
		if (this.phase.kind === Phase.Selected && entity === this.phase.entity) {
			this.phase = { kind: Phase.Idle };
			this.stage.grid.stopHighlighting();
			textbox.hide();
			return;
		}

		// se hizo clic en un espacio libre válido, así que movemos la entidad y
		// acabamos la interacción
		if (
			this.phase.kind === Phase.Selected &&
			!entity &&
			this.stage.grid.reachable(this.stage.grid.fromStageSpace(location))
		) {
			const distance = expect(
				this.stage.grid.reachDistance(this.stage.grid.fromStageSpace(location)),
			);

			const protagonist = this.phase.entity;
			protagonist.move(this.stage.grid.normalizeStageSpace(location));
			this.stage.grid.stopHighlighting();

			if (!this.stage.getEntities().some((e) => e instanceof EnemyEntity)) {
				textbox.hide();
				this.phase = { kind: Phase.Idle };
			} else {
				protagonist.energy = Math.max(0, protagonist.energy - distance);

				// mantenemos la energía visible un segundo para mostrar la
				// animación de descarga antes de que se desvanezca
				textbox.hide(this.p.millis() + 1000);

				// moverse también cede el turno a los enemigos, pero esperamos a que
				// termine la animación de movimiento (véase tick)
				this.phase = { kind: Phase.WillBeAttacked, protagonist };
			}
			return;
		}

		// se hizo clic en una entidad enemiga y hay algún personaje seleccionado,
		// así que efectuamos el ataque (instantáneo y telepático lol)
		if (
			this.phase.kind === Phase.Selected &&
			entity instanceof EnemyEntity &&
			entity.attackable(this.phase.entity)
		) {
			entity.health = Math.max(
				0,
				entity.health - this.phase.entity.attackPower,
			);

			this.stage.grid.stopHighlighting();
			textbox.hide();

			// pasamos a Attacking; tras una espera, tick() pasará a BeingAttacked
			this.phase = {
				kind: Phase.Attacking,
				protagonist: this.phase.entity,
				since: this.p.millis(),
			};
			return;
		}
	}

	/**
	 * Avanza las transiciones que no dependen de un clic (la espera de la fase de
	 * ataque, los turnos de los enemigos y la secuencia de descanso). Se llama en
	 * cada fotograma desde {@link World.draw}.
	 */
	tick(textbox: Textbox) {
		if (this.phase.kind === Phase.WillBeAttacked) {
			if (!this.phase.protagonist.isMoving) {
				this.#startBeingAttacked(this.phase.protagonist);
			}
			return;
		}

		if (this.phase.kind === Phase.Attacking) {
			if (
				this.p.millis() - this.phase.since >=
				StageInteraction.ATTACK_DURATION
			) {
				this.#startBeingAttacked(this.phase.protagonist);
			}
			return;
		}

		if (this.phase.kind === Phase.BeingAttacked) {
			this.#tickBeingAttacked(textbox);
			return;
		}

		if (this.phase.kind === Phase.Resting) {
			this.#tickResting(textbox);
		}
	}

	#startBeingAttacked(protagonist: ProtagonistEntity) {
		const enemies = [...this.stage.getEntities()].filter(
			(e): e is EnemyEntity => e instanceof EnemyEntity && e.health > 0,
		);

		this.phase = {
			kind: Phase.BeingAttacked,
			protagonist,
			enemies,
			index: 0,
			moving: null,
		};
	}

	#tickBeingAttacked(textbox: Textbox) {
		if (this.phase.kind !== Phase.BeingAttacked) {
			return;
		}

		const phase = this.phase;

		// esperamos a que termine la animación de movimiento del enemigo actual
		if (phase.moving) {
			if (phase.moving.isMoving) {
				return;
			}
			phase.moving = null;
			phase.index += 1;
			return;
		}

		// terminaron todos los enemigos: se acaba el turno
		if (phase.index >= phase.enemies.length) {
			this.#endTurn(textbox, phase.protagonist);
			return;
		}

		// el enemigo actúa; si inició un movimiento, esperamos a que termine
		const enemy = phase.enemies[phase.index];
		if (this.#actEnemy(enemy)) {
			phase.moving = enemy;
		} else {
			phase.index += 1;
		}
	}

	/**
	 * Termina el turno. Al comenzar Idle, si el protagonista se quedó sin
	 * energía, se inicia la secuencia de descanso (que bloquea la interacción);
	 * si no, se vuelve a Idle.
	 */
	#endTurn(textbox: Textbox, protagonist: ProtagonistEntity) {
		if (protagonist.energy === 0) {
			textbox.showMessage("¡Necesitas descansar!");
			this.phase = {
				kind: Phase.Resting,
				protagonist,
				step: RestingPhaseStep.Message,
				since: this.p.millis(),
			};
			return;
		}

		this.phase = { kind: Phase.Idle };
	}

	#tickResting(textbox: Textbox) {
		if (this.phase.kind !== Phase.Resting) {
			return;
		}

		const phase = this.phase;

		if (phase.step === RestingPhaseStep.Message) {
			if (
				this.p.millis() - phase.since >=
				StageInteraction.REST_MESSAGE_DURATION
			) {
				// recargamos al instante y mostramos la animación al mismo tiempo
				phase.protagonist.energy = ProtagonistEntity.MAX_ENERGY;
				textbox.showEnergy(phase.protagonist, { reloading: true });

				this.phase = {
					kind: Phase.Resting,
					protagonist: phase.protagonist,
					step: RestingPhaseStep.Reloading,
					since: this.p.millis(),
				};
			}
			return;
		}

		// step === "reloading"
		if (
			this.p.millis() - phase.since >=
			StageInteraction.REST_RELOADING_DURATION
		) {
			textbox.hide();
			this.phase = { kind: Phase.Idle };
		}
	}

	/**
	 * Hace que un enemigo actúe: con 50% de probabilidad ataca al protagonista si
	 * lo tiene a su alcance; si no, se acerca (si le queda más de la mitad de la
	 * vida) o huye. Devuelve si inició un movimiento animado que hay que esperar.
	 */
	#actEnemy(enemy: EnemyEntity): boolean {
		if (this.phase.kind !== Phase.BeingAttacked) {
			return false;
		}

		const protagonist = this.phase.protagonist;

		if (protagonist.attackable(enemy) && Math.random() < 0.5) {
			protagonist.health = Math.max(0, protagonist.health - enemy.attackPower);
			return false;
		}

		const approaching = enemy.health > enemy.maxHealth / 2;
		const target = this.#chooseEnemyMove(enemy, approaching);
		if (!target) {
			return false;
		}

		enemy.move(this.stage.grid.toStageSpace(target));
		return enemy.isMoving;
	}

	/**
	 * Elige al azar una celda alcanzable (dentro del alcance del enemigo) que lo
	 * acerque o aleje del protagonista, según `approaching`. Devuelve `null` si no
	 * hay ninguna.
	 */
	#chooseEnemyMove(
		enemy: EnemyEntity,
		approaching: boolean,
	): [number, number] | null {
		if (this.phase.kind !== Phase.BeingAttacked) {
			return null;
		}

		const grid = this.stage.grid;
		const enemyCell = grid.fromStageSpace(enemy.position);
		const protagonistCell = grid.fromStageSpace(
			this.phase.protagonist.position,
		);

		const currentDistance = StageInteraction.#taxicab(
			enemyCell,
			protagonistCell,
		);

		const field = grid.distanceField(enemyCell, {
			maxDistance: enemy.reach,
			except: enemy,
		});

		const candidates: [number, number][] = [];
		for (const [cell, distance] of field) {
			if (distance === 0) {
				continue; // la celda actual del enemigo
			}

			const d = StageInteraction.#taxicab(cell, protagonistCell);
			if (approaching ? d < currentDistance : d > currentDistance) {
				candidates.push(cell);
			}
		}

		if (candidates.length === 0) {
			return null;
		}

		return candidates[Math.floor(Math.random() * candidates.length)];
	}

	/**
	 * La métrica 1-norma.
	 */
	static #taxicab(a: [number, number], b: [number, number]): number {
		return Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]);
	}
}
