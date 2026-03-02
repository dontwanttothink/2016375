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
		p.colorMode(p.OKLCH);
		const out = p.color(80, 80, p.random(360));
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
	static LINE_WIDTH = 1.2;
	static LINE_BRIGHTNESS = 190;

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
		const size = Math.min(containerHeight, availableWidth) - Grid.LINE_WIDTH;

		if (size <= 0) {
			throw new Error(
				"Los márgenes son demasiado grandes; no hay espacio para la matriz.",
			);
		}

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

class Button {
	static ANIMATION_DURATION = 200;
	static DEFAULT_WIDTH = 200;
	static DEFAULT_HEIGHT = 50;

	#animationProgress = 0;

	baseColor: p5.Color;
	highlightColor: p5.Color;

	textFill: p5.Color;

	width: number = Button.DEFAULT_WIDTH;
	height: number = Button.DEFAULT_HEIGHT;

	label: string = "Click me";

	x: number;
	y: number;

	constructor(p: p5) {
		this.baseColor = p.color(50);
		this.highlightColor = p.color(0, 150, 255);
		this.textFill = p.color(255);
		this.x = p.width / 2;
		this.y = p.height / 2;
	}

	draw(p: p5) {
		p.push();
		const hovering = this.intersectsWith(p.mouseX, p.mouseY);

		const x = this.x;
		const y = this.y;

		// Actualizar estado de la animación
		if (hovering) {
			this.#advanceAnimation(p);
		} else {
			this.#reverseAnimation(p);
		}

		// Calcular color intermedio
		p.colorMode(p.OKLCH);
		const currentColor = p.lerpColor(
			this.baseColor,
			this.highlightColor,
			this.#animationProgress,
		);

		// Dibujar el rectángulo
		p.noStroke();
		p.fill(currentColor);
		p.rectMode(p.CENTER);
		p.rect(x, y, this.width, this.height, 10);

		// Dibujar el texto
		p.fill(this.textFill);
		p.textSize(20);
		p.text(this.label, x, y);

		p.pop();
	}

	intersectsWith(x: number, y: number) {
		return (
			Math.abs(x - this.x) < this.width / 2 &&
			Math.abs(y - this.y) < this.height / 2
		);
	}

	#advanceAnimation(p: p5) {
		this.#animationProgress = Math.min(
			this.#animationProgress + p.deltaTime / Button.ANIMATION_DURATION,
			1,
		);
	}

	#reverseAnimation(p: p5) {
		this.#animationProgress = Math.max(
			this.#animationProgress - p.deltaTime / Button.ANIMATION_DURATION,
			0,
		);
	}
}

// Páginas
/**
 * La página inicial.
 */
class WelcomePage extends Page {
	buttons: Button[] = [];

	setup(p: p5) {
		p.textFont("system-ui");
		p.textAlign(p.CENTER, p.CENTER);

		this.buttons = [];
		for (let i = 1; i <= 3; ++i) {
			const button = new Button(p);
			button.label = `Nivel ${i}`;
			this.buttons.push(button);
		}
	}

	draw(p: p5) {
		p.cursor(p.ARROW);
		this.#drawBackground(p);

		// Título
		p.fill(255);
		p.textSize(50);
		// p.text("SIMÓN DICE", p.width / 2, 100);
		this.drawButtons(p);
	}

	drawButtons(p: p5) {
		const BUTTON_MARGINS = 20;
		const marginHeight = (this.buttons.length - 1) * BUTTON_MARGINS;
		const totalHeight =
			this.buttons.length * Button.DEFAULT_HEIGHT + marginHeight;
		const buttonsStartY =
			(p.height - totalHeight) / 2 + Button.DEFAULT_HEIGHT / 2;

		p.cursor(p.ARROW);
		for (const [i, button] of this.buttons.entries()) {
			button.x = p.width / 2;
			button.y = buttonsStartY + (BUTTON_MARGINS + Button.DEFAULT_HEIGHT) * i;
			button.draw(p);

			// Mostrar una manito cuando el cursor está sobre un botón
			if (button.intersectsWith(p.mouseX, p.mouseY)) {
				p.cursor(p.HAND);
			}
		}
	}

	mouseClicked(p: p5) {
		for (const [i, button] of this.buttons.entries()) {
			// Encontrar si se hizo click en algún botón
			if (button.intersectsWith(p.mouseX, p.mouseY)) {
				p.cursor(p.ARROW);

				// Activar el juego, pasando el nivel correcto
				this.navigator.switchPage(p, Game, { level: i + 1 });

				return;
			}
		}
	}

	#drawBackground(p: p5) {
		p.background(255);
	}
}

/**
 * El juego.
 */
class Game extends Page<{ level: number }> {
	grid: Grid = new Grid(3);
	level = 1;

	receive({ level }: { level: number }) {
		this.level = level;
		this.grid = new Grid(2 + level);
	}

	setup(p: p5) {
		this.grid.marginBottom = 10;
		p.fill(0);
		p.textFont("system-ui");
		p.textAlign(p.CENTER);
	}

	draw(p: p5) {
		p.background(255);

		this.grid.draw(p);
		const { startY, size } = this.grid.properties(p);

		p.textSize((5 / 100) * p.height);
		p.text(`Nivel ${this.level}`, p.width / 2, startY + size + 0.1 * p.height);

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

	mouseClicked(p: p5) {
		this.navigator.switchPage(p, WelcomePage);
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

// Restaurar estado
//
// Durante el desarrollo (y solo durante el desarrollo), este
// código se encarga de que la página actual no cambie cuando
// Vite decide recargar el proyecto después de un cambio.
if (import.meta.hot) {
	const previousPageID = import.meta.hot.data?.currentPageID;
	if (previousPageID) {
		try {
			navigator.overridePage(previousPageID);
		} catch {}
	}
}

function registerHMR(p: p5) {
	if (import.meta.hot) {
		// Señalar que este módulo acepta HMR
		import.meta.hot.accept();

		// Guardar el ID de la página actual e invalidar el
		// bosquejo antiguo
		import.meta.hot.dispose((data) => {
			data.currentPageID = navigator.currentPageConstructor;
			p.remove();
		});
	}
}

// Inicializar el bosquejo p5
//
// Se crea el elemento del lienzo en la página, pasamos nuestras
// funciones, etc.
const canvasParent = document.getElementById("canvas-container");
if (!canvasParent) {
	throw new Error();
}

new p5((p) => {
	p.setup = () => setup(p);
	p.draw = () => draw(p);
	p.windowResized = () => windowResized(p);
	p.mouseClicked = () => mouseClicked(p);

	registerHMR(p);
}, canvasParent);
