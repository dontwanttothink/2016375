import type p5 from "p5";
import type { ProtagonistEntity } from "../characters/protagonist";
import type { Stage } from "../stage";
import { Textbox } from "../textbox";

enum TransitionStep {
	FadingOut,
	FadingIn,
}

export class World {
	/** Duración de cada mitad (salida y entrada) de la transición, en ms. */
	static FADE_DURATION = 300;

	p: p5;
	stage: Stage;
	textbox: Textbox;

	protagonist: ProtagonistEntity;

	#transitionState: {
		step: TransitionStep;
		nextStage: Stage;
		opacity: number;
	} | null = null;

	/**
	 * El escenario activo actual.
	 */

	private constructor(
		p: p5,
		protagonist: ProtagonistEntity,
		stage: Stage,
		textbox: Textbox,
	) {
		this.p = p;
		this.stage = stage;
		this.textbox = textbox;

		protagonist.assignToWorld(this);
		this.protagonist = protagonist;
	}

	public static async create(
		p: p5,
		protagonist: ProtagonistEntity,
		stage: Stage,
	): Promise<World> {
		const textbox = await Textbox.create(p);
		return new World(p, protagonist, stage, textbox);
	}

	transitionTo(newStage: Stage) {
		this.#transitionState = {
			step: TransitionStep.FadingOut,
			nextStage: newStage,
			opacity: 0,
		};
	}

	/**
	 * Avanza la transición entre escenarios.
	 */
	#tickTransition() {
		if (!this.#transitionState) {
			return;
		}

		const rate = this.p.deltaTime / World.FADE_DURATION;

		if (this.#transitionState.step === TransitionStep.FadingOut) {
			this.#transitionState.opacity += rate;
			if (this.#transitionState.opacity >= 1) {
				this.#transitionState.opacity = 1;
				this.stage = this.#transitionState.nextStage;
				this.#transitionState.step = TransitionStep.FadingIn;
			}
		} else {
			this.#transitionState.opacity -= rate;
			if (this.#transitionState.opacity <= 0) {
				this.#transitionState = null;
			}
		}
	}

	/**
	 * @param location en términos del espacio de la pantalla
	 */
	clickedAt(location: [number, number]) {
		// durante una transición no se puede interactuar
		if (this.#transitionState) {
			return;
		}

		this.stage.interaction.clickedAt(
			this.stage.fromScreenSpace(location),
			this.textbox,
		);
		this.textbox.clickedAt(location);
	}

	/**
	 * @param location en términos del espacio de la pantalla
	 */
	interactiveAt(location: [number, number]) {
		if (this.#transitionState) {
			return false;
		}

		return (
			this.stage.interaction.enabledAt(this.stage.fromScreenSpace(location)) ||
			this.textbox.interactiveAt(location)
		);
	}

	draw() {
		this.#tickTransition();

		const ctx = this.p.drawingContext as CanvasRenderingContext2D;

		if (this.#transitionState) {
			ctx.globalAlpha = 1 - this.#transitionState.opacity;
		}

		this.stage.interaction.tick(this.textbox);

		this.stage.draw();

		const origin = this.stage.screenOrigin();
		const dimensions = this.stage.screenDimensions();

		this.textbox.draw(
			[origin[0], origin[1] + dimensions[1]],
			dimensions[0],
			this.stage.bottomMargin,
		);

		if (this.#transitionState) {
			ctx.globalAlpha = 1;
		}
	}
}
