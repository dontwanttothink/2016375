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
	stage: Stage | null;
	textbox: Textbox;

	protagonist: ProtagonistEntity;

	#transitionState: {
		step: TransitionStep;
		setNextStage: () => Promise<void>;
		transparency: number;
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

	transitionTo(
		newStage: (p: p5, protagonist: ProtagonistEntity) => Promise<Stage>,
		protagonist: ProtagonistEntity,
	) {
		this.#transitionState = {
			step: TransitionStep.FadingOut,
			setNextStage: async () => {
				this.stage = null;
				this.stage = await newStage(this.p, protagonist);
			},
			transparency: 0,
		};
	}

	/**
	 * Avanza la transición entre escenarios.
	 */
	#tickTransition() {
		if (!this.#transitionState || !this.stage) {
			return;
		}

		const rate = this.p.deltaTime / World.FADE_DURATION;

		if (this.#transitionState.step === TransitionStep.FadingOut) {
			this.#transitionState.transparency += rate;
			if (this.#transitionState.transparency >= 1) {
				this.#transitionState.transparency = 1;

				// esto es asincrónico pero no debería haber problema, creo.
				// debería ser relativamente instantáneo, especialmente con el caché

				// el if de arriba hace que la transición no avance mientras que no
				// haya stage todavía (nótese que setNextStage establece el stage
				// actual a null)
				this.#transitionState.setNextStage();

				this.#transitionState.step = TransitionStep.FadingIn;
			}
		} else {
			this.#transitionState.transparency -= rate;
			if (this.#transitionState.transparency <= 0) {
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

		if (!this.stage) {
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

		if (!this.stage) {
			return;
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
			ctx.globalAlpha = 1 - this.#transitionState.transparency;
		}

		if (this.stage) {
			this.stage.interaction.tick(this.textbox);

			this.stage.draw();

			const origin = this.stage.screenOrigin();
			const dimensions = this.stage.screenDimensions();

			this.textbox.draw(
				[origin[0], origin[1] + dimensions[1]],
				dimensions[0],
				this.stage.bottomMargin,
			);
		}

		if (this.#transitionState) {
			ctx.globalAlpha = 1;
		}
	}
}
