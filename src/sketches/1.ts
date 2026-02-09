import p5 from "p5";
import targetDimensions from "../dimensions";

// Estado
let dy = 0;
let dx = 0;

// Configuración del lienzo
function setup(p: p5) {
	const [width, height] = targetDimensions();
	p.createCanvas(width, height);
}
function windowResized(p: p5) {
	const [width, height] = targetDimensions();
	p.resizeCanvas(width, height);
}

// Utilidades
function drawGrid(p: p5, rows: number, columns: number) {
	p.push();
	const deltaRow = p.height / rows;
	const deltaColumn = p.width / rows;

	const LINE_WIDTH = 10;
	p.strokeWeight(LINE_WIDTH);

	for (let i = 1; i < columns; ++i) {
		p.line(deltaColumn * i, 0, deltaColumn * i, p.height);
	}
	for (let i = 1; i < rows; ++i) {
		p.line(0, deltaRow * i, p.width, deltaRow * i);
	}
	p.pop();
}

// Dibujo (cada fotograma)
function draw(p: p5) {
	p.background(0);
	p.fill(255);
	p.ellipse(p.width / 2 + dx, p.height / 2 + dy, 100, 100);

	p.stroke(200);
	drawGrid(p, 5, 5);

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
const canvasParent = document.getElementById("canvas-container");
if (!canvasParent) {
	throw new Error();
}

new p5((p) => {
	p.setup = () => setup(p);
	p.draw = () => draw(p);
	p.windowResized = () => windowResized(p);
}, canvasParent);
