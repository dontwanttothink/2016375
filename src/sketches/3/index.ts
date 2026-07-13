import "../../displayErrors";
import p5 from "p5";
import { Navigator, Page } from "../../pages";
import { Protagonist, type ProtagonistEntity } from "./characters/protagonist";
import { Entrada } from "./scenes/entrada";
import { World } from "./world";

class GamePage extends Page {
	world!: World;
	protagonist!: ProtagonistEntity;

	async preload(p: p5) {
		this.protagonist = await Protagonist(p);
		this.world = new World(p, await Entrada(p, this.protagonist));
	}

	setup(p: p5) {
		p.frameRate(Infinity);
		p.noStroke();
	}

	draw(p: p5) {
		p.clear();
		this.world.draw();
		this.updateCursor(p);
	}

	updateCursor(p: p5) {
		if (this.world.interactiveAt([p.mouseX, p.mouseY])) {
			p.cursor(p.HAND);
		} else {
			p.cursor(p.ARROW);
		}
	}

	mouseClicked(p: p5) {
		this.world.clickedAt([p.mouseX, p.mouseY]);
	}
}

const navigator = new Navigator(GamePage, []);

const canvasParent = document.getElementById("canvas-container");
if (!canvasParent) {
	throw new Error();
}

new p5(navigator.sketch, canvasParent);
p5.disableFriendlyErrors = true; // demasiados falsos positivos
