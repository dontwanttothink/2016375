import p5 from "p5";
import targetDimensions from "../dimensions";

// Estado
const solution: [number, number][] = [];
const difficulty = 1;

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

	const size = Math.min(p.height, p.width);

	const startX = p.width / 2 - size / 2;
	const startY = p.height / 2 - size / 2;

	const deltaRow = size / rows;
	const deltaColumn = size / rows;

	const LINE_WIDTH = 2;
	p.strokeWeight(LINE_WIDTH);

	for (let i = 1; i < columns; ++i) {
		const x = startX + deltaColumn * i;
		p.line(x, startY, x, startY + size);
	}
	for (let i = 1; i < rows; ++i) {
		const y = startY + deltaRow * i;
		p.line(startX, y, startX + size, y);
	}
	p.pop();
}

// Dibujo (cada fotograma)
function draw(p: p5) {
	p.background(255);
	p.fill(0);
	p.ellipse(p.width / 2, p.height / 2, 100, 100);

	p.stroke(200);
	drawGrid(p, 3, 3);

	handleInput(p);
}

// Responder a las entradas
function handleInput(p: p5) {}

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


