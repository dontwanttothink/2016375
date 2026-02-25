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

	/**
	 * @returns Un color con un tono (hue) elegido al azar.
	 */
	static randomColor(p: p5) {
		p.push();
		p.colorMode(p.LCH);
		const out = p.color(70, 30, p.random(360));
		p.pop();
		return out;
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

	/**
	 * La cantidad mínima de espacio que debe haber por encima
	 * de la matriz, como porcentaje de la altura total del
	 * lienzo.
	 */
	marginTop = 0;

	/**
	 * La cantidad mínima de espacio que debe haber por debajo
	 * de la matriz, como porcentaje de la altura total del
	 * lienzo.
	 */
	marginBottom = 0;

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
		const availableHeight = p.height;
		const availableWidth = p.width;

		const marginBottom = (this.marginBottom / 100) * availableHeight;
		const marginTop = (this.marginTop / 100) * availableHeight;

		const containerHeight = availableHeight - marginBottom - marginTop;
		if (containerHeight <= 0) {
			throw new Error(
				"Los márgenes son demasiado grandes; no hay espacio para la matriz.",
			);
		}

		const size = Math.min(containerHeight, availableWidth) - Grid.LINE_WIDTH;

		const startX = p.width / 2 - size / 2;
		const startY = marginTop + containerHeight / 2 - size / 2;
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

/**
 * El juego.
 */
class Game extends Page {
	id = "game";

	grid: Grid = new Grid(3);
	level = 1;

	setup() {
		this.grid.marginBottom = 10;
	}

	draw(p: p5) {
		p.background(255);
		p.fill(0);

		this.grid.draw(p);
		p.textAlign(p.CENTER);
		p.textSize();
		p.text(`Nivel ${this.level}`, p.width / 2, p.height - 20);

		if (Math.random() <= 0.025) {
			const row = Math.floor(Math.random() * this.grid.count);
			const column = Math.floor(Math.random() * this.grid.count);

			const cell = this.grid.get(column, row);
			if (!cell.enabled) {
				cell.color = Cell.randomColor(p);
			}
			cell.toggle();
		}
	}
}

// Estado global
const navigator = new Navigator(WelcomePage, [Game]);

// Configuración
async function setup(p: p5) {
	const [width, height] = targetDimensions();
	p.createCanvas(width, height);

	await navigator.setup(p);
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

new p5((p) => {
	p.setup = () => setup(p);
	p.draw = () => draw(p);
	p.windowResized = () => windowResized(p);
	p.mouseClicked = () => mouseClicked(p);
}, canvasParent);
