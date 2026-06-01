import p5 from "p5";
import "p5.quadrille";
import Quadrille from "p5.quadrille";
import targetDimensions from "../dimensions";

/**
 * Una función que acelera y decelera naturalmente.
 * @param x Un número en el intervalo [0, 1].
 * @returns Un número dentro del mismo intervalo.
 */
function ease(x: number) {
	return Math.sin(x * (Math.PI / 2));
}

const currentTime = () => Number(document.timeline.currentTime);
const isDark = () => window.matchMedia("(prefers-color-scheme: dark)").matches;
const cellLength = (p: p5) => Math.min(p.height / ROWS, p.width / COLS) - 3;

class Cell {
	p: p5;
	quadrille: Quadrille;

	constructor(quadrille: Quadrille, p: p5) {
		this.p = p;
		this.quadrille = quadrille;
	}
}

class HighlightCell extends Cell {
	highlightingSince: null | number = null;

	display() {
		const cl = cellLength(this.p);

		if (this.highlightingSince !== null) {
			const ANIMATION_DURATION = 300;

			this.p.push();
			this.p.fill(
				`rgba(251, 62, 78, ${0.1 * Math.min(1, (currentTime() - this.highlightingSince) / ANIMATION_DURATION)})`,
			);
			this.p.square(0, 0, cl);
			this.p.pop();
		}
	}

	highlight() {
		this.highlightingSince = currentTime();
	}
}

class Warrior extends Cell {
	max_health = 30;
	health = this.max_health;

	location: [number, number];

	#movingSince: number | null = null;
	#initialDelta: [number, number] | null = null;

	constructor(quadrille: Quadrille, p: p5, location: [number, number]) {
		super(quadrille, p);
		this.location = location;
	}

	get delta(): [number, number] {
		if (!this.#initialDelta || this.#movingSince === null) {
			return [0, 0];
		}

		const cl = cellLength(this.p);
		const ANIMATION_DURATION = 500;

		const progress =
			ease(
				1 -
					Math.min(1, (currentTime() - this.#movingSince) / ANIMATION_DURATION),
			) * cl;

		return [this.#initialDelta[0] * progress, this.#initialDelta[1] * progress];
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

		this.p.translate(this.delta[1], this.delta[0]);
	}

	canReach(from: [number, number], cell: [number, number]): boolean {
		return from[0] === cell[0] || from[1] === cell[1];
	}

	move(to: [number, number]) {
		this.#movingSince = currentTime();
		this.#initialDelta = [this.location[0] - to[0], this.location[1] - to[1]];

		this.quadrille.fill(...to, this);
		this.quadrille.fill(...this.location, new Cell(this.quadrille, this.p));

		this.location = to;
	}
}

class Protagonist extends Warrior {
	max_health = 50;
	health = this.max_health;

	display() {
		super.display();

		const cl = cellLength(this.p);
		this.p.noStroke();
		isDark() ? this.p.fill("#172133") : this.p.fill("lightblue");
		this.p.circle(cl / 2, cl / 2, cl * 0.6);

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
}

const ROWS = 6;
const COLS = 6;

let highlightQuadrille: Quadrille;

let quadrille: Quadrille;
let protagonist: Protagonist;

function initialState(rows: number, cols: number, p: p5) {
	const r = (n: number) => Math.floor(Math.random() * n);

	const matrix: Cell[][] = [];

	for (let i = 0; i < rows; ++i) {
		const row = [];
		for (let j = 0; j < cols; ++j) {
			if (Math.random() < 0.2) {
				const picks: Warrior[] = [
					new Sergio(quadrille, p, [i, j]),
					new Pingüino(quadrille, p, [i, j]),
					new Andrés(quadrille, p, [i, j]),
				];
				row.push(picks[r(3)]);
			} else {
				row.push(new Cell(quadrille, p));
			}
		}
		matrix.push(row);
	}

	const pRow = r(rows);
	const pCol = r(cols);
	protagonist = new Protagonist(quadrille, p, [pRow, pCol]);
	matrix[pRow][pCol] = protagonist;

	return matrix;
}

function setup(p: p5) {
	p.createCanvas(...targetDimensions());

	// esto se puede limpiar
	quadrille = p.createQuadrille(ROWS, COLS);
	quadrille.memory2D = initialState(ROWS, COLS, p);

	highlightQuadrille = p.createQuadrille(ROWS, COLS);
	highlightQuadrille.replace(
		null,
		Quadrille.factory(() => {
			return new HighlightCell(highlightQuadrille, p);
		}),
	);
}

function windowResized(p: p5) {
	p.resizeCanvas(...targetDimensions());
}

enum Phase {
	Waiting,
	Selected,
	Attacking,
	Responding,
}

const state: { phase: Phase; since: number } = {
	phase: Phase.Waiting,
	since: 0,
};

function mouseClicked(p: p5) {
	const currentCoords: [number, number] = [
		quadrille.mouseRow,
		quadrille.mouseCol,
	];
	const currentCell: Cell = quadrille.read(...currentCoords);

	if (!currentCell) {
		return;
	}

	if (state.phase === Phase.Waiting && currentCell instanceof Protagonist) {
		state.phase = Phase.Selected;
		highlightQuadrille.visit(
			({ value: cell }: { value: Cell }) => cell.highlight(),
			({ row, col }: { row: number; col: number; value: Cell }) =>
				currentCell.canReach(currentCoords, [row, col]),
		);
	}

	if (state.phase === Phase.Selected) {
		if (!(currentCell instanceof Protagonist)) {
			protagonist.move(currentCoords);
		}
	}
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

	updateCursor(p);
}

function updateCursor(p: p5) {
	if (
		state.phase === Phase.Waiting &&
		quadrille.read(quadrille.mouseRow, quadrille.mouseCol) instanceof
			Protagonist
	) {
		p.cursor(p.HAND);
	} else {
		p.cursor(p.ARROW);
	}
}

const canvas = document.getElementById("canvas-container");
if (!canvas) {
	throw new TypeError();
}

new p5((p) => {
	p.setup = () => setup(p);
	p.windowResized = () => windowResized(p);
	p.draw = () => draw(p);
	p.mouseClicked = () => mouseClicked(p);
}, canvas);
