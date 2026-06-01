import p5 from "p5";
import "p5.quadrille";
import type Quadrille from "p5.quadrille";
import targetDimensions from "../dimensions";

const isDark = () => window.matchMedia("(prefers-color-scheme: dark)").matches;

const cellLength = (p: p5) => Math.min(p.height / ROWS, p.width / COLS) - 3;

class Warrior {
	max_health = 30;
	health = this.max_health;

	p: p5;

	constructor(p: p5) {
		this.p = p;
	}

	display() {
		const WEIGHT = 5;
		const MARGIN = 10;

		const portion = this.health / this.max_health;
		const c = this.p.lerpColor(
			this.p.color("red"),
			this.p.color("limegreen"),
			portion,
		);
		this.p.stroke(c);
		this.p.strokeWeight(WEIGHT);

		const cl = cellLength(this.p);
		this.p.line(MARGIN, cl - MARGIN, (cl - MARGIN) * portion, cl - MARGIN);
	}

	canReach(from: [number, number], cell: [number, number]): boolean {
		return from[0] === cell[0] || from[1] === cell[1];
	}
}

class Protagonist extends Warrior {
	max_health = 50;
	health = this.max_health;

	display() {
		const cl = cellLength(this.p);
		this.p.noStroke();
		isDark() ? this.p.fill("#172133") : this.p.fill("lightblue");
		this.p.circle(cl / 2, cl / 2, cl * 0.9);

		super.display();

		this.p.textAlign(this.p.CENTER, this.p.CENTER);
		this.p.textSize(cl * 0.7);
		this.p.text("🥷", cl / 2, cl / 2);
	}
}
class Andrés extends Warrior {
	display() {
		super.display();

		const cl = cellLength(this.p);
		this.p.textAlign(this.p.CENTER, this.p.CENTER);
		this.p.textSize(cl * 0.6);
		this.p.text("👨", cl / 2, cl / 2);
	}
}
class Sergio extends Warrior {
	display() {
		super.display();

		const cl = cellLength(this.p);
		this.p.textAlign(this.p.CENTER, this.p.CENTER);
		this.p.textSize(cl * 0.6);
		this.p.text("🙋", cl / 2, cl / 2);
	}
}
class Pingüino extends Warrior {
	radius = 1;

	display() {
		super.display();

		const cl = cellLength(this.p);
		this.p.textAlign(this.p.CENTER, this.p.CENTER);
		this.p.textSize(cl * 0.6);
		this.p.text("🐧", cl / 2, cl / 2);
	}

	hover() {
		this.radius += 0.1;
	}
}

const ROWS = 6;
const COLS = 6;

let quadrille: Quadrille;

function initialState(rows: number, cols: number, p: p5) {
	const r = (n: number) => Math.floor(Math.random() * n);

	const matrix: (null | Warrior)[][] = [];

	for (let i = 0; i < rows; ++i) {
		const row = [];
		for (let j = 0; j < cols; ++j) {
			if (Math.random() < 0.2) {
				const picks: Warrior[] = [
					new Andrés(p),
					new Sergio(p),
					new Pingüino(p),
				];
				row.push(picks[r(3)]);
			} else {
				row.push(null);
			}
		}
		matrix.push(row);
	}

	matrix[r(rows)][r(cols)] = new Protagonist(p);

	return matrix;
}

function setup(p: p5) {
	p.createCanvas(...targetDimensions());

	quadrille = p.createQuadrille(initialState(ROWS, COLS, p));
}

function windowResized(p: p5) {
	p.resizeCanvas(...targetDimensions());
}

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
