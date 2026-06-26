import "../../displayErrors";
import p5 from "p5";
import { Navigator, Page } from "../../pages";
import { Art } from "./pixel-art";

// nota: iterar sobre entidades para dibujar, en vez de tener un arreglo
// bidimensional

class WelcomePage extends Page {
	exampleArt!: Art;

	async preload(p: p5) {
		this.exampleArt = await Art.fromName(p, "protagonist");
		await this.exampleArt.loadAnimation("blink");
	}

	setup(p: p5) {
		p.noStroke();
		p.fill("rebeccapurple");
	}

	draw(p: p5) {
		p.clear();
		p.circle(p.width / 2, p.height / 2, 200);
		this.exampleArt.draw(
			[p.mouseX, p.mouseY],
			100,
			100 + Math.sin(p.millis() / 200) * 30,
			{ fit: false },
		);
	}

	mouseClicked(_: p5) {
		this.exampleArt.animate("blink", true);
	}
}

const navigator = new Navigator(WelcomePage, []);

const canvasParent = document.getElementById("canvas-container");
if (!canvasParent) {
	throw new Error();
}

new p5(navigator.sketch, canvasParent);
p5.disableFriendlyErrors = true; // demasiados falsos positivos
