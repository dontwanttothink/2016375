import p5 from "p5";
import targetDimensions from "../dimensions";
import { Navigator, Page } from "../pages";

// Utilidades
/**
 * @returns El punto en el tiempo actual, medido en milisegundos.
 */
function currentTime() {
	return Number(document.timeline.currentTime);
}

/**
 * @returns Un número entero al azar en el intervalo [0, n).
 */
function randomInt(n: number) {
	return Math.floor(Math.random() * n);
}

// Estructuras
/**
 * Una celda dentro de la matriz.
 */
class Cell {
	/**
	 * La duración de la animación de aparición y desaparición en
	 * milisegundos.
	 */
	static ANIMATION_DURATION = 900;

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

	/**
	 * Un punto en el tiempo, medido en milisegundos.
	 */
	#highlightBegin: number | null = null;

	constructor(color?: p5.Color) {
		this.color = color;
	}

	/**
	 * El progreso de la animación que se usa para resaltar una celda.
	 * @returns Un número entre 0 y 1.
	 */
	get #progress() {
		if (!this.#highlightBegin) {
			return 0;
		}

		const rawProgress =
			(currentTime() - this.#highlightBegin) / Cell.ANIMATION_DURATION;
		return Math.min(1, Math.max(0, rawProgress));
	}

	get isBeingHighlighted() {
		if (!this.#highlightBegin) {
			return false;
		}

		const timeSince = currentTime() - this.#highlightBegin;
		return timeSince >= 0 && timeSince <= Cell.ANIMATION_DURATION;
	}

	/**
	 * Resalta la celda. Si se llama este método mientras que la animación de
	 * resalto está en curso, la animación inmediatamente empieza de nuevo desde
	 * el principio.
	 */
	highlight() {
		this.#highlightBegin = currentTime();
	}

	/**
	 * Dadas las coordenadas de su esquina superior izquierda y su
	 * tamaño, dibuja la celda.
	 */
	draw(p: p5, x: number, y: number, size: number) {
		// Esta función define una animación para la aparición y desaparición
		// de la celda. Cuando la visibilidad es 0, la celda es invisible.
		// Cuando la visibilidad es 1, la celda se muestra del todo.
		const drawCell = (visibility: number) => {
			// Hacemos que estos valores sean proporcionales al tamaño de la
			// celda para que su apariencia sea igual sin importar qué tan
			// grande la dibujamos.
			const PADDING = size * (3 / 100);
			const GROWTH_AMOUNT = size * (5 / 100);

			// El espacio negativo disminuye a medida que la animación transcurre.
			const currentPadding = PADDING + GROWTH_AMOUNT * (1 - visibility);
			// El tamaño aumenta a medida que la animación transcurre.
			const currentSize = size - currentPadding * 2;

			const fillColor = this.color ? p.color(this.color) : p.color(100);
			fillColor.setAlpha(visibility * 255);

			p.fill(fillColor);
			p.noStroke();

			p.rect(
				x + currentPadding,
				y + currentPadding,
				currentSize,
				currentSize,
				currentSize * (9 / 100),
			);
		};

		const APPEAR_UNTIL = 0.35;
		const HOLD_UNTIL = 0.75;

		const DISAPPEAR_FOR = 1 - HOLD_UNTIL;

		p.push();
		if (this.#progress <= APPEAR_UNTIL) {
			drawCell(this.#progress * (1 / APPEAR_UNTIL));
		} else if (this.#progress <= HOLD_UNTIL) {
			drawCell(1);
		} else {
			const v = 1 - (this.#progress - HOLD_UNTIL) / DISAPPEAR_FOR;
			drawCell(v);
		}
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
	 * de la matriz, en pixeles.
	 */
	marginTop = 0;

	/**
	 * La cantidad mínima de espacio que debe haber por debajo
	 * de la matriz, en pixeles.
	 */
	marginBottom = 0;

	/**
	 * La cantidad mínima de espacio que debe haber a la izquierda de la matriz,
	 * en pixeles.
	 */
	marginLeft = 0;

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
		const naturalSize = Math.min(p.width, p.height) - Grid.LINE_WIDTH;
		const naturalHorizontalMargin = (p.width - naturalSize) / 2;
		const naturalVerticalMargin = (p.height - naturalSize) / 2;

		const missingTopMargin = Math.max(
			0,
			this.marginTop - naturalVerticalMargin,
		);
		const missingBottomMargin = Math.max(
			0,
			this.marginBottom - naturalVerticalMargin,
		);
		const missingLeftMargin = Math.max(
			0,
			this.marginLeft - naturalHorizontalMargin,
		);

		const containerTop = naturalVerticalMargin + missingTopMargin;
		const containerBottom =
			p.height - (naturalVerticalMargin + missingBottomMargin);
		const containerLeft = naturalHorizontalMargin + missingLeftMargin;
		const containerRight = p.width - naturalHorizontalMargin;

		const containerHeight = containerBottom - containerTop;
		const containerWidth = containerRight - containerLeft;

		const size = Math.min(containerHeight, containerWidth);

		if (size <= 0) {
			throw new Error(
				"Los márgenes son demasiado grandes; no hay espacio para la matriz.",
			);
		}

		const startX = containerLeft + containerWidth / 2 - size / 2;
		const startY = containerTop + containerHeight / 2 - size / 2;
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

	/**
	 * @returns El índice de la columna y el índice de la fila de la celda que
	 * tiene una intersección con el punto dado, o `null` si no hay ninguna.
	 */
	intersection(p: p5, x: number, y: number): [number, number] | null {
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

		return [column, row];
	}

	randomizeColors(p: p5) {
		for (const row of this.#matrix) {
			for (const cell of row) {
				cell.color = Cell.randomColor(p);
			}
		}
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
		p.rect(startX, startY, size, size, 3);

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
	static PADDING = 12;
	static TEXT_SIZE = 20;
	static ANIMATION_DURATION = 200;

	#animationProgress = 0;

	baseColor: p5.Color;
	highlightColor: p5.Color;

	textFill: p5.Color;

	minWidth: number = 70;
	minHeight: number = 30;

	#height: number = 0;
	get height() {
		return this.#height;
	}
	#width: number = 0;
	get width() {
		return this.#width;
	}

	#label: string = "Oprímeme";
	get label() {
		return this.#label;
	}
	setLabel(p: p5, l: string) {
		this.#label = l;
		this.#refreshDimensions(p);
	}

	x: number;
	y: number;

	constructor(p: p5) {
		this.#refreshDimensions(p);
		this.baseColor = p.color(50);
		this.highlightColor = p.color(0, 150, 255);
		this.textFill = p.color(255);
		this.x = p.width / 2;
		this.y = p.height / 2;
	}

	#refreshDimensions(p: p5) {
		const contentHeight =
			p.textAscent(this.#label) + p.textDescent(this.#label);
		const targetHeight = contentHeight + Button.PADDING * 1.7;
		const height = Math.max(targetHeight, this.minHeight);

		const contentWidth = p.textWidth(this.#label);
		const targetWidth = contentWidth + Button.PADDING * 2;
		const width = Math.max(targetWidth, this.minWidth);

		this.#height = height;
		this.#width = width;
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

		p.textSize(Button.TEXT_SIZE);

		// Dibujar el rectángulo
		p.noStroke();
		p.fill(currentColor);
		p.rectMode(p.CENTER);
		p.rect(x, y, this.width, this.height, 10);

		// Dibujar el texto
		p.fill(this.textFill);
		p.textAlign(p.CENTER, p.CENTER);
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

class Ball {
	static RADIUS = 20;
	static MASS = 1;

	color: p5.Color;
	position: [number, number];
	velocity: [number, number];
	acceleration = [0, -0.5];

	constructor(x: number, y: number, color: p5.Color) {
		this.position = [x - Ball.RADIUS * 2, y - Ball.RADIUS * 2];
		this.velocity = [Math.random() * 5 - 2.5, 0];
		this.color = color;
		console.debug(x, y);
	}

	tick(width: number, height: number) {
		width -= 2 * Ball.RADIUS;
		height -= 2 * Ball.RADIUS;

		this.position[0] += this.velocity[0];
		this.position[1] += this.velocity[1];

		this.position[0] = Math.max(0, Math.min(width, this.position[0]));
		this.position[1] = Math.max(0, Math.min(height, this.position[1]));

		this.velocity[0] += this.acceleration[0];
		this.velocity[1] += this.acceleration[1];

		// Esto es un intento de aliviar los efectos de tener
		// errores de precisión
		const correctionFactor = 0.95;
		if (this.position[0] === width || this.position[0] === 0) {
			this.velocity[0] *= -1 * correctionFactor;
		}
		if (this.position[1] === height || this.position[1] === 0) {
			this.velocity[1] *= -1 * correctionFactor;
		}
	}

	draw(p: p5) {
		const x = this.position[0];
		const y = p.height - this.position[1];

		p.noStroke();
		p.fill(this.color);
		p.circle(x + Ball.RADIUS, y - Ball.RADIUS, Ball.RADIUS);
	}
}

// Páginas
/**
 * La página inicial.
 */
class WelcomePage extends Page {
	static BUTTON_WIDTH = 200;
	static BUTTON_HEIGHT = 50;

	buttons: Button[] = [];
	balls: Ball[] = [];

	setup(p: p5) {
		p.textFont("system-ui");

		this.buttons = [];
		for (const label of ["Fácil", "Medio", "Difícil"]) {
			const button = new Button(p);
			button.minWidth = WelcomePage.BUTTON_WIDTH;
			button.minHeight = WelcomePage.BUTTON_HEIGHT;
			button.setLabel(p, label);
			this.buttons.push(button);
		}

		this.balls = [];
		for (let i = 0; i < 10; ++i) {
			const ball = new Ball(
				p.random(p.width),
				p.random(p.height),
				Cell.randomColor(p),
			);
			this.balls.push(ball);
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
			this.buttons.length * WelcomePage.BUTTON_HEIGHT + marginHeight;
		const buttonsStartY =
			(p.height - totalHeight) / 2 + WelcomePage.BUTTON_HEIGHT / 2;

		p.cursor(p.ARROW);
		for (const [i, button] of this.buttons.entries()) {
			button.x = p.width / 2;
			button.y =
				buttonsStartY + (BUTTON_MARGINS + WelcomePage.BUTTON_HEIGHT) * i;
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
				this.navigator.switchPage(p, Game, { difficulty: i + 1 });

				return;
			}
		}
	}

	#drawBackground(p: p5) {
		p.background(255);
		for (const ball of this.balls) {
			ball.tick(p.width, p.height);
			ball.acceleration = [
				(p.mouseX - p.width / 2) / (50 * p.width),
				-p.mouseY / p.height,
			];
			ball.draw(p);
		}
	}
}

class GameOverPage extends Page {
	setup(p: p5) {
		p.textFont("system-ui");
		p.textAlign(p.CENTER);
	}

	draw(p: p5) {
		p.background(255);
		p.text("Perdiste :(", p.width / 2, p.height / 2);
	}
}

/**
 * Tres partes posibles de una interacción con el juego.
 */
enum GamePhase {
	PlayingPattern,
	WatchingAttempt,
	AttemptCompleted,
}

class GamePhaseManager {
	#since: number | null = null;
	#phase: GamePhase | null = null;

	set(phase: GamePhase) {
		this.#phase = phase;
		this.#since = currentTime();
	}

	/**
	 * @returns La fase actual y el punto en el tiempo en que empezó.
	 * @throws Si no hay una fase actual.
	 */
	get(): [GamePhase, number] {
		if (this.#phase === null || this.#since === null) {
			throw new ReferenceError("No se ha establecido una fase.");
		}

		return [this.#phase, this.#since];
	}
}

/**
 * Un elemento de interfaz que muestra un mensaje efímero. Se utiliza para
 * indicar al jugador si logró repetir correctamente el patrón.
 */
class GameFeedback {
	static ANIMATION_DURATION = 900;

	label: string = "";
	color: p5.Color | null = null;

	#animatingSince: number | null = null;

	get isAnimating() {
		return (
			!!this.#animatingSince &&
			currentTime() - this.#animatingSince < GameFeedback.ANIMATION_DURATION
		);
	}

	get progress() {
		if (!this.#animatingSince) {
			return 0;
		}

		const raw =
			(currentTime() - this.#animatingSince) / GameFeedback.ANIMATION_DURATION;
		return Math.max(0, Math.min(1, raw));
	}

	show() {
		this.#animatingSince = currentTime();
	}

	static #ease(x: number) {
		return Math.sin(x * (Math.PI / 2));
	}

	draw(p: p5, x: number, y: number) {
		p.push();
		p.textSize(64);

		const scaleFactor = GameFeedback.#ease(this.progress);
		p.scale(scaleFactor);

		const opacity = -Math.abs(this.progress - 0.5) * 2 + 0.9;
		const color = this.color ? p.color(this.color) : p.color(0);
		color.setAlpha(opacity * 255);

		p.stroke(255, opacity);
		p.strokeWeight(4);
		p.fill(color);
		p.textAlign(p.CENTER, p.CENTER);
		p.text(this.label, x / scaleFactor, y / scaleFactor);

		p.pop();
	}
}

/**
 * El juego.
 */
class Game extends Page<{ difficulty: number }> {
	static FONT_SIZE = 21;
	static MARGIN_SIZE = 10;
	static PATTERN_HIGHLIGHT_INTERVAL = 500;

	grid: Grid = new Grid(3);
	difficulty = 1;
	level = 1;

	feedback = new GameFeedback();

	#phase = new GamePhaseManager();

	#currentPattern: [number, number][] = [];
	#userPattern: [number, number][] = [];

	receive({ difficulty }: { difficulty: number }) {
		this.difficulty = difficulty;
		this.grid.count = 2 + difficulty;
	}

	#getNewPattern() {
		const gridCount = this.grid.count;
		const cellCount = gridCount * gridCount;
		const pattern: [number, number][] = [];
		const length = 3 + this.difficulty;

		for (let i = 0; i < length; ++i) {
			let cellIndex: number;
			if (i > 0) {
				// Obtener una celda distinta a la última en el patrón
				const [lastColumn, lastRow] = pattern[i - 1];
				const lastCellIndex = lastRow * gridCount + lastColumn;

				cellIndex = randomInt(cellCount - 1);
				if (cellIndex >= lastCellIndex) {
					++cellIndex;
				}
			} else {
				cellIndex = randomInt(cellCount);
			}

			const column = cellIndex % gridCount;
			const row = Math.floor(cellIndex / gridCount);
			pattern.push([column, row]);
		}

		return pattern;
	}

	setup(p: p5) {
		this.grid.marginBottom = Game.FONT_SIZE + Game.MARGIN_SIZE;
		this.grid.randomizeColors(p);

		this.#currentPattern = this.#getNewPattern();
		this.#phase.set(GamePhase.PlayingPattern);

		p.fill(0);
		p.textFont("system-ui");
		p.textAlign(p.CENTER);
	}

	/**
	 * Resalta la celda apropiada según el patrón actual y el momento en que se
	 * empezó a reproducir el patrón.
	 */
	#highlightPatternCell(start: number) {
		const index = Math.floor(
			(currentTime() - start) / Game.PATTERN_HIGHLIGHT_INTERVAL,
		);

		if (index >= this.#currentPattern.length) {
			// Terminamos.
			this.#phase.set(GamePhase.WatchingAttempt);
			return;
		}

		if (index >= 0) {
			const [column, row] = this.#currentPattern[index];
			const cell = this.grid.get(column, row);
			if (!cell.isBeingHighlighted) {
				cell.highlight();
			}
		}
	}

	/**
	 * Revisa si el patrón introducido por el jugador es correcto. Si lo es,
	 * continúa al siguiente nivel. Si no lo es, acaba el juego.
	 */
	#handleCompletedAttempt(p: p5, start: number) {
		if (this.feedback.isAnimating) {
			return;
		}

		if (currentTime() - start > Cell.ANIMATION_DURATION) {
			const userSucceeded = this.#currentPattern.every(([col, row], i) => {
				const [ucol, urow] = this.#userPattern[i];
				return ucol === col && urow === row;
			});

			if (userSucceeded) {
				++this.level;
			} else {
				this.level = 1;
			}

			this.#currentPattern = this.#getNewPattern();
			this.#userPattern = [];
			this.#phase.set(GamePhase.PlayingPattern);
			return;
		}

		if (currentTime() - start < GameFeedback.ANIMATION_DURATION) {
			const userSucceeded = this.#currentPattern.every(([col, row], i) => {
				const [ucol, urow] = this.#userPattern[i];
				return ucol === col && urow === row;
			});

			if (userSucceeded) {
				this.feedback.label = "¡bien!";
				this.feedback.color = p.color("green");
				this.feedback.show();
			} else {
				this.feedback.label = "oops";
				this.feedback.color = p.color("red");
				this.feedback.show();
			}
		}
	}

	draw(p: p5) {
		const { startY, startX, size } = this.grid.properties(p);
		const [phase, start] = this.#phase.get();

		// Establecer figura del puntero
		if (
			phase === GamePhase.WatchingAttempt &&
			this.grid.intersection(p, p.mouseX, p.mouseY)
		) {
			p.cursor(p.HAND);
		} else {
			p.cursor(p.ARROW);
		}

		// Limpiar el lienzo
		p.background(255);

		// Dibujar la matriz y sus celdas
		this.grid.draw(p);

		// Dibujar el mensaje de retroalimentación al jugador, que en general
		// es invisible
		this.feedback.draw(p, startX + size / 2, startY + size / 2);

		// Si es apropiado, resaltar la celda que corresponde para mostrar el
		// patrón a memorizar
		if (phase === GamePhase.PlayingPattern) {
			this.#highlightPatternCell(start);
		}

		// Si es apropiado, iniciar un nuevo patrón y mostrarlo.
		if (phase === GamePhase.AttemptCompleted) {
			this.#handleCompletedAttempt(p, start);
		}

		// Texto del nivel
		p.textSize(Game.FONT_SIZE);
		p.text(
			`Nivel ${this.level}`,
			p.width / 2,
			startY + size + Game.MARGIN_SIZE + Game.FONT_SIZE,
		);
	}

	mouseClicked(p: p5) {
		const intersected = this.grid.intersection(p, p.mouseX, p.mouseY);
		if (intersected) {
			this.#handleUserInput(intersected);
		}
	}

	#handleUserInput([column, row]: [number, number]) {
		const [phase] = this.#phase.get();

		if (phase !== GamePhase.WatchingAttempt) {
			return;
		}

		const cell = this.grid.get(column, row);
		cell.highlight();

		this.#userPattern.push([column, row]);
		if (this.#userPattern.length === this.#currentPattern.length) {
			this.#phase.set(GamePhase.AttemptCompleted);
		}
	}
}

// Estado global
const navigator = new Navigator(WelcomePage, [Game, GameOverPage]);

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
function keyPressed(p: p5) {
	navigator.currentPage.keyPressed(p);
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
			data.currentPageID = navigator.currentPageName;
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
	p.keyPressed = () => keyPressed(p);

	registerHMR(p);
}, canvasParent);
