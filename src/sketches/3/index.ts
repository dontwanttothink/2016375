import "../../displayErrors";
import p5 from "p5";
import { Navigator, Page } from "../../pages";
import { EntityArt } from "./entity/art";
import { Stage } from "./stage";

class WelcomePage extends Page {
	exampleArt!: EntityArt;
	exampleStage!: Stage;

	async preload(p: p5) {
		this.exampleArt = await EntityArt.fromName(p, "example");
		await this.exampleArt.loadAnimation("blink");

		this.exampleStage = await Stage.fromName(p, "example");
	}

	setup(p: p5) {
		p.noStroke();
	}

	draw(p: p5) {
		p.clear();

		this.exampleStage.draw();

		this.exampleArt.draw(
			[p.mouseX, p.mouseY],
			100,
			100 + Math.sin(p.millis() / 200) * 30,
			{ fit: false },
		);
	}

	mouseClicked() {
		this.exampleArt.animate("blink", false);
	}

	keyPressed() {
		this.exampleArt.animate("blink", false);
	}
}

const navigator = new Navigator(WelcomePage, []);

const canvasParent = document.getElementById("canvas-container");
if (!canvasParent) {
	throw new Error();
}

new p5(navigator.sketch, canvasParent);
p5.disableFriendlyErrors = true; // demasiados falsos positivos
