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
 * Una función que acelera y decelera naturalmente.
 * @param x Un número en el intervalo [0, 1].
 * @returns Un número dentro del mismo intervalo.
 */
function ease(x: number) {
	return Math.sin(x * (Math.PI / 2));
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

	alpha: number = 255;

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
		currentColor.setAlpha(this.alpha);

		p.textSize(Button.TEXT_SIZE);

		// Dibujar el rectángulo
		p.noStroke();
		p.fill(currentColor);
		p.rectMode(p.CENTER);
		p.rect(x, y, this.width, this.height, 10);

		// Dibujar el texto
		const textFill = p.color(this.textFill);
		textFill.setAlpha(this.alpha);

		p.fill(textFill);
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

/**
 * Un rayo colorido que aparece cuando el usuario va a jugar otra vez después
 * de haber perdido.
 */
class GameOverRay {
	speed = 15;

	x = 0;
	y = 0;

	length: number;
	color: p5.Color;
	angle: number;
	since: number;

	constructor(color: p5.Color) {
		this.length = 90;
		this.color = color;
		this.angle = Math.random() * 2 * Math.PI;
		this.since = currentTime();
	}

	draw(p: p5, originX: number, originY: number) {
		this.x += Math.cos(this.angle) * this.speed;
		this.y += Math.sin(this.angle) * this.speed;

		let x0 = this.x - Math.cos(this.angle) * this.length;
		let y0 = this.y - Math.sin(this.angle) * this.length;

		// Evitar que el origen de las líneas cruce el botón
		if (this.x * x0 < 0) {
			x0 = 0;
		}
		if (this.y * y0 < 0) {
			y0 = 0;
		}

		p.push();

		const c = p.color(this.color);

		const left = -originX;
		const right = left + p.width;
		const top = -originY;
		const bottom = top + p.height;

		const distances = [
			this.x - left,
			right - this.x,
			this.y - top,
			bottom - this.y,
		];
		const minimumDistance = Math.min(...distances);

		c.setAlpha(p.constrain(minimumDistance / 100, 0, 0.8) * 255);

		p.stroke(c);
		p.strokeWeight(10);
		p.translate(originX, originY);
		p.line(x0, y0, this.x, this.y);
		p.pop();

		this.speed = Math.max(5, this.speed - 0.5);
	}
}

class GameOverPage extends Page<{ points: number }> {
	static SIZE_LARGE = 30;
	static SIZE_MEDIUM = 20;
	static SIZE_SMALL = 16;
	static MARGIN = 5;

	static MAX_RAYS = 100;

	#presentedSince = 0;
	#points = 0;

	#rays: GameOverRay[] = [];
	#rayHead: number = 0;

	#h = 0;

	#button: Button | null = null;
	#buttonHoveredSince: number | null = null;

	setup(p: p5) {
		p.textFont("system-ui");
		p.textAlign(p.CENTER);
		this.#presentedSince = currentTime();

		this.#button = new Button(p);
		this.#button.alpha = 0;
		this.#buttonHoveredSince = null;

		const button_height = this.#button.minHeight;

		this.#h =
			GameOverPage.SIZE_LARGE +
			GameOverPage.SIZE_MEDIUM +
			button_height +
			GameOverPage.MARGIN * 8;

		this.#rays = [];
		this.#rayHead = 0;
	}

	receive({ points }: { points: number }): void {
		this.#points = points;
	}

	draw(p: p5) {
		p.background(255);

		if (!this.#button) {
			throw new ReferenceError();
		}

		for (const r of this.#rays) {
			r.draw(p, this.#button.x, this.#button.y);
		}

		if (
			this.#button.intersectsWith(p.mouseX, p.mouseY) &&
			this.#button.alpha === 255
		) {
			p.cursor(p.HAND);

			if (!this.#buttonHoveredSince) {
				this.#buttonHoveredSince = currentTime();
			}

			if (currentTime() - this.#buttonHoveredSince < 300) {
				this.#addRay(p);
			}
		} else {
			p.cursor(p.ARROW);
			this.#buttonHoveredSince = null;
		}

		const startY = (p.height - this.#h) / 2;
		let y = startY;

		const tFirst = Math.min(1, (currentTime() - this.#presentedSince) / 500);

		p.fill(0, 255 * tFirst);
		p.textSize(GameOverPage.SIZE_LARGE);
		p.text("¡Perdiste!", p.width / 2, y);

		const tSecond = p.constrain(
			(currentTime() - this.#presentedSince - 600) / 500,
			0,
			1,
		);

		p.fill(0, tSecond * 255);
		y += GameOverPage.SIZE_LARGE + GameOverPage.MARGIN;
		p.textSize(GameOverPage.SIZE_MEDIUM);
		p.text(
			`Obtuviste ${this.#points} punto${this.#points === 1 ? "" : "s"}.`,
			p.width / 2,
			y,
		);

		y += GameOverPage.SIZE_MEDIUM + GameOverPage.MARGIN * 5;
		this.#button.x = p.width / 2;
		this.#button.alpha = tSecond * 255;
		this.#button.y = y;
		this.#button.setLabel(p, "Jugar de nuevo");
		this.#button.draw(p);

		p.textSize(GameOverPage.SIZE_SMALL);
		p.text(
			"Gracias por jugar.",
			p.width / 2,
			p.height - GameOverPage.SIZE_SMALL - GameOverPage.MARGIN,
		);
	}

	#addRay(p: p5) {
		const ray = new GameOverRay(Cell.randomColor(p));

		if (this.#rayHead === this.#rays.length) {
			this.#rays.push(ray);
		} else {
			this.#rays[this.#rayHead] = ray;
		}

		++this.#rayHead;
		this.#rayHead = this.#rayHead % GameOverPage.MAX_RAYS;
	}

	mouseClicked(p: p5) {
		if (this.#button?.intersectsWith(p.mouseX, p.mouseY)) {
			this.navigator.switchPage(p, WelcomePage);
		}
	}
}

/**
 * Tres partes posibles de una interacción con el juego.
 */
enum GamePhase {
	PlayingPattern,
	WatchingAttempt,
	AttemptCompleted,
	Lost,
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

	#drawPrimary(p: p5, x: number, y: number) {
		p.push();
		p.textSize(64);

		const scaleFactor = ease(this.progress);
		if (scaleFactor === 0) {
			return;
		}

		p.scale(scaleFactor);

		const opacity = Math.max(0, -Math.abs(this.progress - 0.5) * 2 + 0.9);
		const color = this.color ? p.color(this.color) : p.color(0);
		color.setAlpha(opacity * 255);

		p.stroke(255, opacity);
		p.strokeWeight(4);
		p.fill(color);
		p.textAlign(p.CENTER, p.CENTER);
		p.text(this.label, x / scaleFactor, y / scaleFactor);

		p.pop();
	}

	#drawSecondary(_p: p5, _x: number, _y: number) {
		// Quizá en el futuro agregar partículas o algo así :)
	}

	draw(p: p5, x: number, y: number) {
		this.#drawSecondary(p, x, y);
		this.#drawPrimary(p, x, y);
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
	lives = 1;

	feedback = new GameFeedback();

	#phaseData: { since: number | null; phase: GamePhase | null } = {
		since: null,
		phase: null,
	};

	#getPhase(): [GamePhase, number] {
		if (this.#phaseData.phase === null || this.#phaseData.since === null) {
			throw new ReferenceError("No se ha establecido una fase.");
		}

		return [this.#phaseData.phase, this.#phaseData.since];
	}
	#setPhase(val: GamePhase) {
		this.#phaseData.phase = val;
		this.#phaseData.since = currentTime();
	}

	#currentPattern: [number, number][] = [];
	#userPattern: [number, number][] = [];

	receive({ difficulty }: { difficulty: number }) {
		this.difficulty = difficulty;
		this.grid.count = 2 + difficulty;
		this.lives = 6 - difficulty;
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
		this.level = 1;
		this.#userPattern = [];

		p.fill(0);
		p.textFont("system-ui");
		p.textAlign(p.CENTER);

		this.grid.marginBottom = Game.FONT_SIZE * 2.5 + 2 * Game.MARGIN_SIZE;
		this.grid.marginTop = Game.MARGIN_SIZE * 1.3;

		this.grid.randomizeColors(p);

		this.#currentPattern = this.#getNewPattern();
		this.#setPhase(GamePhase.PlayingPattern);
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
			this.#setPhase(GamePhase.WatchingAttempt);
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
				--this.lives;
			}

			this.#userPattern = [];

			if (this.lives === 0) {
				this.#setPhase(GamePhase.Lost);
				return;
			}

			this.#currentPattern = this.#getNewPattern();
			this.#setPhase(GamePhase.PlayingPattern);
			this.grid.randomizeColors(p);
			return;
		}

		if (currentTime() - start < GameFeedback.ANIMATION_DURATION) {
			const userSucceeded = this.#currentPattern.every(([col, row], i) => {
				const [ucol, urow] = this.#userPattern[i];
				return ucol === col && urow === row;
			});

			if (userSucceeded) {
				this.feedback.label = "¡bien!";
				this.feedback.color = p.color("oklch(0.8003 0.2618 133.42)");
				this.feedback.show();
			} else {
				this.feedback.label = "ups";
				this.feedback.color = p.color("oklch(0.7 0.2316 23.16)");
				this.feedback.show();
			}
		}
	}

	draw(p: p5) {
		const { startY, startX, size } = this.grid.properties(p);
		const [phase, since] = this.#getPhase();

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
			this.#highlightPatternCell(since);
		}

		// Si es apropiado, iniciar un nuevo patrón y mostrarlo.
		if (phase === GamePhase.AttemptCompleted) {
			this.#handleCompletedAttempt(p, since);
		}

		// Texto del nivel
		p.textSize(Game.FONT_SIZE);
		p.fill(0);
		p.text(
			`Nivel ${this.level}`,
			p.width / 2,
			startY + size + Game.MARGIN_SIZE + Game.FONT_SIZE,
		);
		p.textSize(Game.FONT_SIZE * 0.9);
		p.fill(90);
		p.text(
			`${this.lives} vida${this.lives === 1 ? "" : "s"} restante${this.lives === 1 ? "" : "s"}`,
			p.width / 2,
			startY + size + Game.MARGIN_SIZE + Game.FONT_SIZE * 2.2,
		);

		// Fade out en caso de que el jugador haya perdido
		if (phase === GamePhase.Lost) {
			p.noStroke();

			const t = ease(Math.min(1, (currentTime() - since) / 900));
			p.fill(255, t * 255);
			p.rect(0, 0, p.width, p.height);

			if (t === 1) {
				this.navigator.switchPage(p, GameOverPage, { points: this.level - 1 });
			}
		}
	}

	mouseClicked(p: p5) {
		const intersected = this.grid.intersection(p, p.mouseX, p.mouseY);
		if (intersected) {
			this.#handleUserInput(intersected);
		}
	}

	#handleUserInput([column, row]: [number, number]) {
		const [phase] = this.#getPhase();

		if (phase !== GamePhase.WatchingAttempt) {
			return;
		}

		const cell = this.grid.get(column, row);
		cell.highlight();

		this.#userPattern.push([column, row]);
		if (this.#userPattern.length === this.#currentPattern.length) {
			this.#setPhase(GamePhase.AttemptCompleted);
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
function mouseClicked(p: p5, e: MouseEvent) {
	navigator.currentPage.mouseClicked(p, e);
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

p5.disableFriendlyErrors = true; // demasiados falsos positivos en la consola
