import "../../displayErrors";
import p5 from "p5";
import { Navigator, Page } from "../../pages";
import { Protagonist, type ProtagonistEntity } from "./characters/protagonist";
import { Stage } from "./stage";
import { World } from "./world";

class GamePage extends Page {
	world!: World;
	protagonist!: ProtagonistEntity;

	async preload(p: p5) {
		const exampleStage = await Stage.fromName(p, "entrada");

		this.protagonist = await Protagonist(p, [
			exampleStage.width / 2,
			exampleStage.height / 2,
		]);
		exampleStage.addEntity(this.protagonist);
		this.world = new World(p, exampleStage);
	}

	setup(p: p5) {
		// quizá tener un máximo de 120 fotogramas por segundo
		p.frameRate(120);
		p.noStroke();
	}

	draw(p: p5) {
		p.clear();
		this.world.draw();
	}

	mouseClicked() {}

	keyPressed(p: p5, event: KeyboardEvent): void {}
}

const navigator = new Navigator(GamePage, []);

const canvasParent = document.getElementById("canvas-container");
if (!canvasParent) {
	throw new Error();
}

new p5(navigator.sketch, canvasParent);
p5.disableFriendlyErrors = true; // demasiados falsos positivos
