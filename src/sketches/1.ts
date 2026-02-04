import p5 from "p5";

const canvasParent = document.getElementById("p");
if (!canvasParent) {
	throw Error();
}

new p5((p) => {
	let dy = 0;
	let dx = 0;

	p.setup = () => {
		p.createCanvas(800, 600);
	};

	p.draw = () => {
		p.background(0);
		p.fill(255);
		p.ellipse(p.width / 2 + dx, p.height / 2 + dy, 100, 100);

		handleInput(p);
	};

	function handleInput(p: p5) {
		if (p.keyIsDown(p.UP_ARROW)) {
			dy -= 20;
			console.debug(dy);
		}
		if (p.keyIsDown(p.DOWN_ARROW)) {
			dy += 20;
			console.debug(dy);
		}
		if (p.keyIsDown(p.LEFT_ARROW)) {
			dx -= 20;
		}
		if (p.keyIsDown(p.RIGHT_ARROW)) {
			dx += 20;
		}
	}
}, canvasParent);
