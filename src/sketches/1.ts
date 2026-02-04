import p5 from "p5";

// Estado
let dy = 0;
let dx = 0;

// Configuración del lienzo
function setup(p: p5) {
	p.createCanvas(Math.min(800, innerWidth - 64), 600);
}
function windowResized(p: p5) {
	p.resizeCanvas(Math.min(800, innerWidth - 64), 600);
}

// Dibujo (cada fotograma)
function draw(p: p5) {
	p.background(0);
	p.fill(255);
	p.ellipse(p.width / 2 + dx, p.height / 2 + dy, 100, 100);

	handleInput(p);
}

// Responder a las entradas
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

// Inicializar el bosquejo p5
//
// (se crea el elemento del lienzo en la página, pasamos nuestras
// funciones, etc.)
const canvasParent = document.getElementById("p");
if (!canvasParent) {
	throw Error();
}

new p5((p) => {
	p.setup = () => setup(p);
	p.draw = () => draw(p);
	p.windowResized = () => windowResized(p);
}, canvasParent);
