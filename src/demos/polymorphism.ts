import p5 from "p5";
import "p5.quadrille";
import type Quadrille from "p5.quadrille";
import targetDimensions from "../dimensions";

class Warrior {}

class Andrés extends Warrior {}
class Sergio extends Warrior {}

class Protagonist extends Warrior {}

const ROWS = 6;
const COLS = 6;

let quadrille: Quadrille;

function setup(p: p5) {
	p.createCanvas(...targetDimensions());
	quadrille = p.createQuadrille(ROWS, COLS);
}

function windowResized(p: p5) {
	p.resizeCanvas(...targetDimensions());
}

const cellLength = (p: p5) => Math.min(p.height / ROWS, p.width / COLS) - 3;

function draw(p: p5) {
	p.clear();

	// Calcular el tamaño que queremos dar a la cuadrícula.
	const cl = cellLength(p);
	const ancho = cl * COLS;
	const alto = cl * ROWS;

	// Dibujar la cuadrícula en el centro.
	p.drawQuadrille(quadrille, {
		outline: p.color(200),
		cellLength: cl,
		x: p.width / 2 - ancho / 2,
		y: p.height / 2 - alto / 2,
	});
}

const canvas = document.getElementById("canvas-container");
if (!canvas) {
	throw new TypeError();
}

new p5((p) => {
	p.setup = () => setup(p);
	p.windowResized = () => windowResized(p);
	p.draw = () => draw(p);
}, canvas);
