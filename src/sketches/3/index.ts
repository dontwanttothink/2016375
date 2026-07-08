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
		p.noStroke();
	}

	draw(p: p5) {
		p.clear();
		this.world.draw();
		this.respondToKeyboard(p);
	}

	mouseClicked() {}

	respondToKeyboard(p: p5) {
		if (p.keyIsDown(p.UP_ARROW)) {
			this.protagonist.up();
		}

		if (p.keyIsDown(p.DOWN_ARROW)) {
			this.protagonist.down();
		}

		if (p.keyIsDown(p.LEFT_ARROW)) {
			this.protagonist.left();
		}

		if (p.keyIsDown(p.RIGHT_ARROW)) {
			this.protagonist.right();
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
