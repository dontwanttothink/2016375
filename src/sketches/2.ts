import p5 from "p5";

const canvasParent = document.getElementById("p");
if (!canvasParent) {
	throw Error();
}

new p5((p) => {
	let dy = 0;

	p.setup = () => {
		p.createCanvas(800, 600);
		p.background(200);
	};

	p.draw = () => {
		p.fill(0);
		p.ellipse(p.width / 2, p.height / 2 + dy, 100, 100);
		if (p.keyIsDown(p.UP_ARROW)) {
			dy -= 20;
			console.debug(dy);
		}
		if (p.keyIsDown(p.DOWN_ARROW)) {
			dy += 20;
			console.debug(dy);
		}
	};
}, canvasParent);
