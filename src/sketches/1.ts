import p5 from "p5";

const canvasParent = document.getElementById("p");
if (!canvasParent) {
	throw Error();
}

let dy = 0;
let dx = 0;

function setup(p: p5) {
	p.createCanvas(800, 600);
}

function draw(p: p5) {
	p.background(0);
	p.fill(255);
	p.ellipse(p.width / 2 + dx, p.height / 2 + dy, 100, 100);

	handleInput(p);
}

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

new p5((p) => {
	p.setup = () => setup(p);
	p.draw = () => draw(p);
}, canvasParent);
