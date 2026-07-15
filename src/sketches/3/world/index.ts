import type p5 from "p5";
import type { ProtagonistEntity } from "../characters/protagonist";
import type { Stage } from "../stage";
import { Textbox } from "../textbox";

export class World {
	p: p5;
	stage: Stage;
	textbox: Textbox;

	protagonist: ProtagonistEntity;

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
		// TODO: animación
		this.stage = newStage;
	}

	/**
	 * @param location en términos del espacio de la pantalla
	 */
	clickedAt(location: [number, number]) {
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
		return (
			this.stage.interaction.enabledAt(this.stage.fromScreenSpace(location)) ||
			this.textbox.interactiveAt(location)
		);
	}

	draw() {
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
}
