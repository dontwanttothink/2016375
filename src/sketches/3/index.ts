import p5 from "p5";
import { Navigator, Page } from "../../pages";

class WelcomePage extends Page {
	setup(p: p5) {
		p.noStroke();
		p.fill("rebeccapurple");
	}

	draw(p: p5) {
		p.clear();
		p.circle(p.width / 2, p.height / 2, 200);
	}
}

const navigator = new Navigator(WelcomePage, []);

const canvasParent = document.getElementById("canvas-container");
if (!canvasParent) {
	throw new Error();
}

new p5(navigator.sketch, canvasParent);
p5.disableFriendlyErrors = true; // falsos positivos
