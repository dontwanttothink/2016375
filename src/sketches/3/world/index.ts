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

	constructor(p: p5, protagonist: ProtagonistEntity, stage: Stage) {
		this.p = p;
		this.stage = stage;
		this.textbox = new Textbox(p);

		protagonist.assignToWorld(this);
		this.protagonist = protagonist;
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
