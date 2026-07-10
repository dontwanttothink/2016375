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

		if (import.meta.env.MODE !== "DEBUG") {
			return;
		}

		if (p.keyIsDown(p.UP_ARROW)) {
			this.protagonist.displace([0, -0.5]);
		}

		if (p.keyIsDown(p.DOWN_ARROW)) {
			this.protagonist.displace([0, 0.5]);
		}

		if (p.keyIsDown(p.LEFT_ARROW)) {
			this.protagonist.displace([-0.5, 0]);
		}

		if (p.keyIsDown(p.RIGHT_ARROW)) {
			this.protagonist.displace([0.5, 0]);
		}
	}

	mouseClicked(p: p5) {
		if (
			this.protagonist.intersects(
				this.world.currentStage.fromScreenSpace([p.mouseX, p.mouseY]),
			)
		) {
			this.protagonist.userInteracted();
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
