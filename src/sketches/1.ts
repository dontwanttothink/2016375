import p5 from "p5";
import targetDimensions from "../dimensions";

// Estructuras de datos
/**
 * Una celda dentro de la matriz.
 */
class Cell {
	static ANIMATION_DURATION = 400;
	static PADDING = 7;

	/**
	 * @returns El punto en el tiempo actual, medido en milisegundos,
	 * según el marco de referencia usado por las celdas.
	 */
	static currentTime() {
		return Number(document.timeline.currentTime) + Cell.ANIMATION_DURATION;
	}

	color: p5.Color;
	enabled = false;

	/**
	 * Un punto en el tiempo, medido en milisegundos.
	 */
	#lastToggled: number = 0;

	/**
	 * El progreso de la animación, que usamos al dibujar la celda.
	 * @returns Un número entre 0 y 1.
	 */
	get #progress() {
		const rawProgress =
			(Cell.currentTime() - this.#lastToggled) / Cell.ANIMATION_DURATION;

		if (this.enabled) {
			return Math.min(rawProgress, 1);
		}
		return Math.max(1 - rawProgress, 0);
	}

	/**
	 * Prende la celda si está apagada. Apaga la celda si está prendida.
	 */
	toggle() {
		this.enabled = !this.enabled;
		this.#lastToggled = Cell.currentTime();
	}

	/**
	 * Dadas las coordenadas de su esquina superior izquierda y su
	 * tamaño, dibuja la celda.
	 */
	draw(p: p5, x: number, y: number, size: number) {
		const GROWTH_AMOUNT = 5;
		const padding = Cell.PADDING + GROWTH_AMOUNT * (1 - this.#progress);
		size -= padding * 2;

		const fillColor = p.color(this.color);
		fillColor.setAlpha(this.#progress * 255);

		p.push();
		p.fill(fillColor);
		p.noStroke();

		p.rect(x + padding, y + padding, size, size, 10);

		p.pop();
	}

	constructor(color: p5.Color) {
		this.color = color;
	}
}

interface GridProperties {
	size: number;
	startX: number;
	startY: number;
	deltaColumn: number;
	deltaRow: number;
}

/**
 * Una matriz.
 */
class Grid {
	p: p5;
	count: number;
	#matrix: Cell[][] = [];

	constructor(count: number, p: p5, defaultColor: p5.Color) {
		this.p = p;
		this.count = count;

		for (let i = 0; i < count; ++i) {
			const row: Cell[] = [];
			for (let j = 0; j < count; ++j) {
				row.push(new Cell(defaultColor));
			}
			this.#matrix.push(row);
		}
	}

	static LINE_WIDTH = 2;
	static LINE_BRIGHTNESS = 200;

	properties(p: p5): GridProperties {
		const size = Math.min(p.height, p.width) - Grid.LINE_WIDTH;
		const startX = p.width / 2 - size / 2;
		const startY = p.height / 2 - size / 2;
		const deltaRow = size / this.count;
		const deltaColumn = size / this.count;

		return {
			size,
			startX,
			startY,
			deltaRow,
			deltaColumn,
		};
	}

	get(column: number, row: number) {
		return this.#matrix[row][column];
	}

	draw(p: p5) {
		p.push();

		const { size, startX, startY, deltaColumn, deltaRow } = this.properties(p);

		for (const [i, row] of this.#matrix.entries()) {
			for (const [j, cell] of row.entries()) {
				const y = startY + i * deltaRow;
				const x = startX + j * deltaColumn;

				cell.draw(p, x, y, size / this.count);
			}
		}
		this.#drawEdges(p);

		p.pop();
	}

	/**
	 * Dibuja los bordes de cada fila y columna.
	 */
	#drawEdges(p: p5) {
		p.push();

		p.strokeWeight(Grid.LINE_WIDTH);
		p.stroke(Grid.LINE_BRIGHTNESS);
		p.noFill();

		const { size, startX, startY, deltaColumn, deltaRow } = this.properties(p);

		// Bordes
		p.rect(startX, startY, size, size);

		// Separadores
		for (let i = 1; i < this.count; ++i) {
			const x = startX + deltaColumn * i;
			p.line(x, startY, x, startY + size);
		}
		for (let i = 1; i < this.count; ++i) {
			const y = startY + deltaRow * i;
			p.line(startX, y, startX + size, y);
		}

		p.pop();
	}
}

// Estado
const gridSize = 3;
let grid: Grid;

// Configuración
function setup(p: p5) {
	grid = new Grid(gridSize, p, p.color(100));

	const [width, height] = targetDimensions();
	p.createCanvas(width, height);
}
function windowResized(p: p5) {
	const [width, height] = targetDimensions();
	p.resizeCanvas(width, height);
}

// Dibujo (cada fotograma)
function draw(p: p5) {
	p.background(255);

	grid.draw(p);
	if (Math.random() <= 0.025) {
		const row = Math.floor(Math.random() * grid.count);
		const column = Math.floor(Math.random() * grid.count);
		grid.get(column, row).toggle();
	}

	handleInput(p);
}

// Responder a las entradas
function handleInput(p: p5) {}

function mouseClicked(p: p5) {}

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
	p.mouseClicked = () => mouseClicked(p);
}, canvasParent);
