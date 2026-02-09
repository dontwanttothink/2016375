import p5 from "p5";
import targetDimensions from "../dimensions";

// Estado
const solution: boolean[][] = [];
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
function drawGrid(p: p5, count: number) {
	p.push();
	const LINE_WIDTH = 2;

	const size = Math.min(p.height, p.width) - LINE_WIDTH;

	const startX = p.width / 2 - size / 2;
	const startY = p.height / 2 - size / 2;

	const deltaRow = size / count;
	const deltaColumn = size / count;

	p.strokeWeight(LINE_WIDTH);
	p.noFill();

	// Bordes
	p.rect(startX, startY, size, size);

	// Separadores
	for (let i = 1; i < count; ++i) {
		const x = startX + deltaColumn * i;
		p.line(x, startY, x, startY + size);
	}
	for (let i = 1; i < count; ++i) {
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
	drawGrid(p, 3);

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
