import p5 from "p5";

const canvasParent = document.getElementById("p");
if (!canvasParent) {
	throw Error();
}

new p5((p) => {
	let dx = 0;

	p.setup = () => {
		p.createCanvas(800, 600);
		p.background(0);
	};

	p.draw = () => {
		p.fill(255);
		p.ellipse(p.width / 2 + dx, p.height / 2, 100, 100);
		if (p.keyIsDown(p.UP_ARROW)) {
			dx -= 20;
			console.debug(dx);
		}
		if (p.keyIsDown(p.DOWN_ARROW)) {
			dx += 20;
			console.debug(dx);
		}
	};
}, canvasParent);
