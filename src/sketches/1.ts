import p5 from "p5";
import targetDimensions from "../dimensions";
import { Navigator, Page } from "../pages";

// Estructuras
/**
 * Una celda dentro de la matriz.
 */
class Cell {
	/**
	 * La duración de la animación de aparición y desaparición en
	 * milisegundos.
	 */
	static ANIMATION_DURATION = 400;

	/**
	 * @returns El punto en el tiempo actual, medido en milisegundos,
	 * según el marco de referencia usado por las celdas.
	 */
	static currentTime() {
		return Number(document.timeline.currentTime) + Cell.ANIMATION_DURATION;
	}

	color: p5.Color | undefined;
	enabled = false;

	/**
	 * Un punto en el tiempo, medido en milisegundos.
	 */
	#lastToggled: number = 0;

	constructor(color?: p5.Color) {
		this.color = color;
	}

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
		// Hacemos que estos valores sean proporcionales al tamaño de la
		// celda para que su apariencia sea igual sin importar qué tan
		// grande la dibujamos.
		const PADDING = size * (3 / 100);
		const GROWTH_AMOUNT = size * (5 / 100);

		// El espacio negativo disminuye a medida que la animación transcurre.
		const currentPadding = PADDING + GROWTH_AMOUNT * (1 - this.#progress);
		// El tamaño aumenta a medida que la animación transcurre.
		const currentSize = size - currentPadding * 2;

		const fillColor = this.color ? p.color(this.color) : p.color(100);
		fillColor.setAlpha(this.#progress * 255);

		p.push();
		p.fill(fillColor);
		p.noStroke();

		p.rect(
			x + currentPadding,
			y + currentPadding,
			currentSize,
			currentSize,
			currentSize * (9 / 100),
		);

		p.pop();
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
	static LINE_WIDTH = 2;
	static LINE_BRIGHTNESS = 200;

	#count: number;
	#matrix: Cell[][] = [];

	constructor(count: number) {
		this.#count = count;

		for (let i = 0; i < count; ++i) {
			const row: Cell[] = [];
			for (let j = 0; j < count; ++j) {
				row.push(new Cell());
			}
			this.#matrix.push(row);
		}
	}

	get count() {
		return this.#count;
	}

	set count(newCount: number) {
		while (this.#matrix.length < newCount) {
			this.#matrix.push([]);
		}
		this.#matrix.length = newCount;

		for (const row of this.#matrix) {
			while (row.length < newCount) {
				row.push(new Cell());
			}
			row.length = newCount;
		}

		this.#count = newCount;
	}

	properties(p: p5): GridProperties {
		const size = Math.min(p.height, p.width) - Grid.LINE_WIDTH;
		const startX = p.width / 2 - size / 2;
		const startY = p.height / 2 - size / 2;
		const deltaRow = size / this.#count;
		const deltaColumn = size / this.#count;

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

	intersection(x: number, y: number, p: p5): Cell | null {
		const { startX, startY, deltaColumn, deltaRow } = this.properties(p);

		const relativeX = x - startX;
		const relativeY = y - startY;

		const column = Math.floor(relativeX / deltaColumn);
		const row = Math.floor(relativeY / deltaRow);

		if (column < 0 || column >= this.count) {
			return null;
		}
		if (row < 0 || row >= this.count) {
			return null;
		}

		return this.get(column, row);
	}

	draw(p: p5) {
		p.push();

		const { size, startX, startY, deltaColumn, deltaRow } = this.properties(p);

		for (const [i, row] of this.#matrix.entries()) {
			for (const [j, cell] of row.entries()) {
				const y = startY + i * deltaRow;
				const x = startX + j * deltaColumn;

				cell.draw(p, x, y, size / this.#count);
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
		for (let i = 1; i < this.#count; ++i) {
			const x = startX + deltaColumn * i;
			p.line(x, startY, x, startY + size);
		}
		for (let i = 1; i < this.#count; ++i) {
			const y = startY + deltaRow * i;
			p.line(startX, y, startX + size, y);
		}

		p.pop();
	}
}

// Páginas
/**
 * La página inicial.
 */
class WelcomePage extends Page {
	id = "welcome";
	draw(p: p5) {
		p.background(255);
		p.textSize(30);
		p.textAlign(p.CENTER);

		if (Math.abs(p.mouseY - p.height / 2) <= 15) {
			p.fill("blue");
		} else {
			p.fill("black");
		}

		p.textFont("system-ui");
		p.text("haz click para jugar lol", p.width / 2, p.height / 2);
		p.textSize(16);
		p.text("la futura interfaz va aquí", p.width / 2, p.height / 2 + 30);
	}
	mouseClicked(_: p5) {
		this.switchPage("game");
	}
}

class GamePage extends Page {
	id = "game";

	grid: Grid = new Grid(3);

	draw(p: p5) {
		p.background(255);

		this.grid.draw(p);
		if (Math.random() <= 0.025) {
			const row = Math.floor(Math.random() * this.grid.count);
			const column = Math.floor(Math.random() * this.grid.count);
			this.grid.get(column, row).toggle();
		}
	}
}

// Estado global
const navigator = new Navigator(WelcomePage, [GamePage]);

// Configuración
function setup(p: p5) {
	const [width, height] = targetDimensions();
	p.createCanvas(width, height);
}
function windowResized(p: p5) {
	const [width, height] = targetDimensions();
	p.resizeCanvas(width, height);
}

// Dibujo (cada fotograma)
function draw(p: p5) {
	navigator.currentPage.draw(p);
}

// Responder a las entradas
function mouseClicked(p: p5) {
	navigator.currentPage.mouseClicked(p);
}

// Inicializar el bosquejo p5
//
// (se crea el elemento del lienzo en la página, pasamos nuestras
// funciones, etc.)
const canvasParent = document.getElementById("canvas-container");
if (!canvasParent) {
	throw new Error();
}

// Debemos desactivar esta función porque no es compatible
// actualmente (febrero 9, 2026) con algunas funciones de
// JavaScript modernas. Para más información: https://github.com/processing/p5.js/issues/8516
// @ts-expect-error: esta propiedad no está documentada.
p5.disableSketchChecker = true;

new p5((p) => {
	p.setup = () => setup(p);
	p.draw = () => draw(p);
	p.windowResized = () => windowResized(p);
	p.mouseClicked = () => mouseClicked(p);
}, canvasParent);
