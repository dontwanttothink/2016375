import p5 from "p5";
import "p5.quadrille";
import type Quadrille from "p5.quadrille";
import targetDimensions from "../dimensions";

// Utilidades
const cellLength = (p: p5) => Math.min(p.height / ROWS, p.width / COLS) - 3;

// Constantes
const COLS = 7;
const ROWS = 6;

// Estado
let game: Quadrille;

// Configuración del lienzo
function setup(p: p5) {
	const [width, height] = targetDimensions();
	p.createCanvas(width, height);

	game = p.createQuadrille(COLS, ROWS);
}

function windowResized(p: p5) {
	const [width, height] = targetDimensions();
	p.resizeCanvas(width, height);
}

// Dibujo (cada fotograma)
function draw(p: p5) {
	p.clear();
	const cl = cellLength(p);
	const width = cl * COLS;
	const height = cl * ROWS;

	p.drawQuadrille(game, {
		outline: p.color(200),
		cellLength: cl,
		x: p.width / 2 - width / 2,
		y: p.height / 2 - height / 2,
	});
	const pos: [number, number] = [
		game.screenRow(p.mouseY),
		game.screenCol(p.mouseX),
	];
	if (game.isValid(...pos)) {
		p.cursor(p.HAND);
	} else {
		p.cursor(p.ARROW);
	}
}

function ficha(color: p5.Color, p: p5) {
	const margin = 10;

	return () => {
		p.ellipseMode(p.CORNER);
		p.stroke(80);
		p.strokeWeight(2);
		p.fill(color);
		p.circle(margin, margin, cellLength(p) - margin * 2);
	};
}

// Interactividad
function mouseClicked(p: p5) {
	const color =
		game.order % 2 === 0 ? ficha(p.color("blue"), p) : ficha(p.color("red"), p);

	const x = p.mouseX;
	const col = game.screenCol(x);

	if (!game.isValid(0, col)) {
		return;
	}

	for (let i = ROWS - 1; i >= 0; --i) {
		if (game.isEmpty(i, col)) {
			game.fill(i, col, color);
			return;
		}
	}
}

function estadoGanador() {
	// game.search();
}

// Inicializar el bosquejo p5
const canvasParent = document.getElementById("canvas-container");
if (!canvasParent) {
	throw new Error();
}

new p5((p) => {
	p.setup = () => setup(p);
	p.draw = () => draw(p);
	p.windowResized = () => windowResized(p);
	p.mouseClicked = () => mouseClicked(p);
}, canvasParent);
