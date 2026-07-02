import "../../displayErrors";
import p5 from "p5";
import { Navigator, Page } from "../../pages";
import { Protagonist, type ProtagonistEntity } from "./characters/protagonist";
import { EntityArt } from "./entity/art";
import { Stage } from "./stage";

class GamePage extends Page {
	exampleStage!: Stage;
	exampleEntity!: ProtagonistEntity;

	async preload(p: p5) {
		this.exampleStage = await Stage.fromName(p, "example");

		this.exampleEntity = await Protagonist(p, [
			this.exampleStage.width / 2,
			this.exampleStage.height / 2,
		]);
		this.exampleStage.addEntity(this.exampleEntity);
	}

	setup(p: p5) {
		p.noStroke();
	}

	draw(p: p5) {
		p.clear();
		this.exampleStage.draw();
		this.respondToKeyboard(p);
	}

	mouseClicked() {}

	respondToKeyboard(p: p5) {
		if (p.keyIsDown(p.UP_ARROW)) {
			this.exampleEntity.up();
		}

		if (p.keyIsDown(p.DOWN_ARROW)) {
			this.exampleEntity.down();
		}

		if (p.keyIsDown(p.LEFT_ARROW)) {
			this.exampleEntity.left();
		}

		if (p.keyIsDown(p.RIGHT_ARROW)) {
			this.exampleEntity.right();
		}
	}
}

const navigator = new Navigator(GamePage, []);

const canvasParent = document.getElementById("canvas-container");
if (!canvasParent) {
	throw new Error();
}

new p5(navigator.sketch, canvasParent);
p5.disableFriendlyErrors = true; // demasiados falsos positivos
