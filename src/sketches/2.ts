import p5 from "p5";
import "p5.quadrille";
import "../displayErrors";
import { Navigator, Page } from "../pages";

/**
 * Una función que acelera y decelera naturalmente.
 * @param x Un número en el intervalo [0, 1].
 * @returns Un número dentro del mismo intervalo.
 */
function ease(x: number) {
	return Math.sin(x * (Math.PI / 2));
}

/**
 * @returns La longitud de la ascensión de la tipofaz actual, dado un
 * tamaño.
 */
function ascent(p: p5, size: number) {
	p.push();
	p.textSize(size);
	const out = p.textAscent();
	p.pop();
	return out;
}

/**
 * El tiempo transcurrido desde algún punto constante arbitrario en
 * milisegundos.
 */
function currentTime(): number {
	return Number(document.timeline.currentTime);
}

type ThemeColor = (p: p5) => p5.Color;

/**
 * @returns Si el usuario prefiere el modo oscuro.
 */
function isDark() {
	return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

/**
 * @returns Un color elegido aleatoriamente.
 *
 * Esta función se usa(rá) en el modo infinito.
 */
function randomThemeColor(): ThemeColor {
	const hue = Math.floor(Math.random() * 360);
	return themeColor(hue);
}

function themeColor(hue: number): ThemeColor {
	// Constantes elegidas usando oklch.com :)
	const lightness = 0.65;
	const chroma = 0.212;

	return (p: p5) => p.color(`oklch(${lightness} ${chroma} ${hue})`);
}

/**
 * Algunos colores reutilizables.
 */
const themeColors = {
	foreground: (p: p5) => (isDark() ? p.color(220 / 255) : p.color(70 / 255)),
	subtler: (p: p5) => (isDark() ? p.color(150 / 255) : p.color(155 / 255)),
	subtlest: (p: p5) => (isDark() ? p.color(70 / 255) : p.color(240 / 255)),
	overlay: (p: p5) => (isDark() ? p.color(60 / 255) : p.color(250 / 255)),
	red: themeColor(0),
	yellow: themeColor(100),
	blue: themeColor(230),
	green: themeColor(140),
	orange: themeColor(63),
	purple: themeColor(290),
	cyan: themeColor(200),
	pink: themeColor(330),
} satisfies Record<string, ThemeColor>;

/**
 * Un rectángulo. Esto se usa para representar áreas.
 */
interface Rectangle {
	top: number;
	bottom: number;
	left: number;
	right: number;
}

/*
 * Niveles
 */

/**
 * Una pareja de puntos iniciales/finales.
 */
interface EndpointConfig {
	row0: number;
	col0: number;
	row1: number;
	col1: number;
	color: ThemeColor;
}

/**
 * Un nivel individual.
 */
interface LevelData {
	size: number;
	endpoints: EndpointConfig[];
}

/**
 * Los niveles creados por Andrés.
 */
const levels: LevelData[] = [
	{
		size: 4,
		endpoints: [
			{ row0: 0, col0: 0, row1: 3, col1: 3, color: themeColors.green },
			{ row0: 1, col0: 1, row1: 0, col1: 3, color: themeColors.blue },
			{ row0: 0, col0: 1, row1: 1, col1: 2, color: themeColors.red },
		],
	},

	{
		size: 4,
		endpoints: [
			{ row0: 0, col0: 0, row1: 2, col1: 1, color: themeColors.green },
			{ row0: 1, col0: 0, row1: 3, col1: 2, color: themeColors.blue },
			{ row0: 1, col0: 3, row1: 3, col1: 3, color: themeColors.red },
		],
	},
	{
		size: 4,
		endpoints: [
			{ row0: 0, col0: 0, row1: 2, col1: 1, color: themeColors.green },
			{ row0: 1, col0: 0, row1: 3, col1: 2, color: themeColors.blue },
			{ row0: 0, col0: 3, row1: 3, col1: 3, color: themeColors.red },
			{ row0: 0, col0: 2, row1: 2, col1: 2, color: themeColors.yellow },
		],
	},

	{
		size: 5,
		endpoints: [
			{ row0: 0, col0: 0, row1: 3, col1: 1, color: themeColors.blue },
			{ row0: 0, col0: 4, row1: 4, col1: 4, color: themeColors.yellow },
			{ row0: 1, col0: 0, row1: 4, col1: 3, color: themeColors.red },
			{ row0: 1, col0: 3, row1: 1, col1: 4, color: themeColors.green },
		],
	},
	{
		size: 5,
		endpoints: [
			{ row0: 0, col0: 1, row1: 4, col1: 4, color: themeColors.blue },
			{ row0: 1, col0: 1, row1: 2, col1: 3, color: themeColors.yellow },
			{ row0: 3, col0: 1, row1: 1, col1: 4, color: themeColors.red },
			{ row0: 0, col0: 2, row1: 0, col1: 4, color: themeColors.green },
		],
	},
	{
		size: 5,
		endpoints: [
			{ row0: 0, col0: 0, row1: 1, col1: 3, color: themeColors.blue },
			{ row0: 0, col0: 4, row1: 1, col1: 1, color: themeColors.yellow },
			{ row0: 1, col0: 0, row1: 3, col1: 1, color: themeColors.red },
			{ row0: 3, col0: 0, row1: 4, col1: 1, color: themeColors.green },
			{ row0: 4, col0: 2, row1: 3, col1: 4, color: themeColors.cyan },
		],
	},
	{
		size: 6,
		endpoints: [
			{ row0: 0, col0: 0, row1: 5, col1: 2, color: themeColors.red },
			{ row0: 0, col0: 5, row1: 5, col1: 5, color: themeColors.blue },
			{ row0: 0, col0: 1, row1: 4, col1: 2, color: themeColors.green },
			{ row0: 1, col0: 3, row1: 4, col1: 5, color: themeColors.yellow },
			{ row0: 1, col0: 4, row1: 3, col1: 5, color: themeColors.orange },
		],
	},
	{
		size: 6,
		endpoints: [
			{ row0: 0, col0: 0, row1: 4, col1: 3, color: themeColors.red },
			{ row0: 0, col0: 5, row1: 5, col1: 2, color: themeColors.blue },
			{ row0: 0, col0: 3, row1: 3, col1: 3, color: themeColors.green },
			{ row0: 0, col0: 4, row1: 2, col1: 2, color: themeColors.yellow },
			{ row0: 2, col0: 3, row1: 4, col1: 4, color: themeColors.orange },
		],
	},
	{
		size: 6,
		endpoints: [
			{ row0: 0, col0: 2, row1: 4, col1: 1, color: themeColors.red },
			{ row0: 1, col0: 1, row1: 4, col1: 3, color: themeColors.blue },
			{ row0: 1, col0: 2, row1: 3, col1: 3, color: themeColors.green },
			{ row0: 5, col0: 2, row1: 5, col1: 5, color: themeColors.yellow },
			{ row0: 2, col0: 4, row1: 1, col1: 5, color: themeColors.orange },
			{ row0: 3, col0: 4, row1: 2, col1: 5, color: themeColors.pink },
		],
	},
	{
		size: 7,
		endpoints: [
			{ row0: 0, col0: 2, row1: 5, col1: 1, color: themeColors.red },
			{ row0: 1, col0: 1, row1: 4, col1: 1, color: themeColors.blue },
			{ row0: 0, col0: 4, row1: 2, col1: 3, color: themeColors.green },
			{ row0: 0, col0: 6, row1: 3, col1: 3, color: themeColors.yellow },
			{ row0: 1, col0: 6, row1: 4, col1: 3, color: themeColors.orange },
			{ row0: 6, col0: 2, row1: 5, col1: 6, color: themeColors.pink },
		],
	},
	{
		size: 7,
		endpoints: [
			{ row0: 0, col0: 0, row1: 2, col1: 6, color: themeColors.red },
			{ row0: 1, col0: 0, row1: 1, col1: 3, color: themeColors.blue },
			{ row0: 4, col0: 0, row1: 4, col1: 2, color: themeColors.green },
			{ row0: 4, col0: 3, row1: 6, col1: 3, color: themeColors.yellow },
			{ row0: 6, col0: 5, row1: 6, col1: 6, color: themeColors.orange },
		],
	},
	{
		size: 8,
		endpoints: [
			{ row0: 0, col0: 0, row1: 1, col1: 3, color: themeColors.red },
			{ row0: 2, col0: 3, row1: 2, col1: 7, color: themeColors.blue },
			{ row0: 3, col0: 0, row1: 3, col1: 5, color: themeColors.green },
			{ row0: 3, col0: 6, row1: 4, col1: 7, color: themeColors.yellow },
			{ row0: 4, col0: 2, row1: 7, col1: 0, color: themeColors.orange },
			{ row0: 4, col0: 3, row1: 5, col1: 5, color: themeColors.cyan },
			{ row0: 5, col0: 3, row1: 7, col1: 7, color: themeColors.purple },
		],
	},
	{
		size: 8,
		endpoints: [
			{ row0: 0, col0: 0, row1: 7, col1: 7, color: themeColors.red },
			{ row0: 0, col0: 7, row1: 6, col1: 1, color: themeColors.blue },
			{ row0: 1, col0: 2, row1: 3, col1: 7, color: themeColors.green },
			{ row0: 6, col0: 4, row1: 4, col1: 7, color: themeColors.yellow },
			{ row0: 6, col0: 3, row1: 2, col1: 2, color: themeColors.orange },
		],
	},
	{
		size: 9,
		endpoints: [
			{ row0: 0, col0: 0, row1: 1, col1: 0, color: themeColors.red },
			{ row0: 0, col0: 6, row1: 4, col1: 8, color: themeColors.blue },
			{ row0: 4, col0: 5, row1: 5, col1: 8, color: themeColors.green },
			{ row0: 4, col0: 0, row1: 6, col1: 1, color: themeColors.yellow },
			{ row0: 4, col0: 2, row1: 4, col1: 4, color: themeColors.orange },
			{ row0: 7, col0: 0, row1: 8, col1: 2, color: themeColors.cyan },
			{ row0: 7, col0: 4, row1: 7, col1: 7, color: themeColors.pink },
			{ row0: 5, col0: 4, row1: 7, col1: 3, color: themeColors.purple },
		],
	},
	{
		size: 9,
		endpoints: [
			{ row0: 1, col0: 1, row1: 3, col1: 3, color: themeColors.red },
			{ row0: 1, col0: 4, row1: 1, col1: 7, color: themeColors.blue },
			{ row0: 2, col0: 0, row1: 4, col1: 1, color: themeColors.green },
			{ row0: 3, col0: 0, row1: 4, col1: 8, color: themeColors.yellow },
			{ row0: 5, col0: 8, row1: 7, col1: 7, color: themeColors.orange },
			{ row0: 7, col0: 0, row1: 8, col1: 4, color: themeColors.cyan },
		],
	},
	{
		size: 10,
		endpoints: [
			{ row0: 2, col0: 2, row1: 2, col1: 4, color: themeColors.red },
			{ row0: 1, col0: 3, row1: 0, col1: 6, color: themeColors.blue },
			{ row0: 0, col0: 7, row1: 2, col1: 9, color: themeColors.green },
			{ row0: 2, col0: 7, row1: 4, col1: 8, color: themeColors.yellow },
			{ row0: 4, col0: 5, row1: 8, col1: 7, color: themeColors.orange },
			{ row0: 5, col0: 0, row1: 8, col1: 8, color: themeColors.cyan },
			{ row0: 7, col0: 1, row1: 7, col1: 4, color: themeColors.purple },
		],
	},
	{
		size: 10,
		endpoints: [
			{ row0: 0, col0: 0, row1: 9, col1: 9, color: themeColors.red },
			{ row0: 0, col0: 2, row1: 0, col1: 4, color: themeColors.blue },
			{ row0: 0, col0: 8, row1: 2, col1: 6, color: themeColors.green },
			{ row0: 1, col0: 0, row1: 3, col1: 2, color: themeColors.yellow },
			{ row0: 4, col0: 9, row1: 6, col1: 9, color: themeColors.orange },
			{ row0: 5, col0: 2, row1: 7, col1: 7, color: themeColors.cyan },
			{ row0: 7, col0: 2, row1: 7, col1: 4, color: themeColors.pink },
		],
	},
	{
		size: 10,
		endpoints: [
			{ row0: 0, col0: 0, row1: 0, col1: 9, color: themeColors.red },
			{ row0: 1, col0: 2, row1: 4, col1: 1, color: themeColors.blue },
			{ row0: 2, col0: 2, row1: 4, col1: 5, color: themeColors.green },
			{ row0: 5, col0: 7, row1: 7, col1: 7, color: themeColors.yellow },
			{ row0: 6, col0: 0, row1: 8, col1: 3, color: themeColors.orange },
			{ row0: 7, col0: 0, row1: 6, col1: 2, color: themeColors.cyan },
		],
	},
];

/*
 * Interacción del usuario
 */

/**
 * Un botón. Reutilizamos esto del primer proyecto.
 */
class Button {
	static PADDING = 12;
	static TEXT_SIZE = 20;
	static ANIMATION_DURATION = 200;

	#animationProgress = 0;

	baseColor: ThemeColor;
	highlightColor: ThemeColor;

	alpha: number = 255;

	textFill: ThemeColor;

	minWidth: number = 70;
	minHeight: number = 30;

	#height: number = 0;
	get height() {
		return Math.max(this.#height, this.minHeight);
	}
	#width: number = 0;
	get width() {
		return Math.max(this.#width, this.minWidth);
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
		this.baseColor = () => p.color("oklch(0.20 0 230)");
		this.highlightColor = () =>
			isDark()
				? p.color("oklch(0.45 0.17 230)")
				: p.color("oklch(0.70 0.17 230)");
		this.textFill = () =>
			isDark() ? p.color("oklch(0.85 0 230)") : p.color("oklch(1 0 230)");
		this.x = p.width / 2;
		this.y = p.height / 2;
	}

	#refreshDimensions(p: p5) {
		p.push();
		p.textSize(Button.TEXT_SIZE);
		const contentHeight =
			p.textAscent(this.#label) + p.textDescent(this.#label);
		const targetHeight = contentHeight + Button.PADDING * 1.7;

		const contentWidth = p.textWidth(this.#label);
		const targetWidth = contentWidth + Button.PADDING * 2;
		p.pop();

		this.#height = targetHeight;
		this.#width = targetWidth;
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
			this.baseColor(p),
			this.highlightColor(p),
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
		const textFill = p.color(this.textFill(p));
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

/*
 * Lógica
 */

/**
 * Una enumeración para distinguir los tres tipos posibles de celda.
 */
enum CellType {
	Endpoint,
	SealedEndpoint,
	Path,
}

enum CellDirection {
	Right,
	Left,
	Up,
	Down,
}

/**
 * Una celda de la matriz.
 */
class Cell {
	static ANIMATION_DURATION = 80;

	get opacity() {
		const progress = Math.max(
			0,
			Math.min(
				1,
				(currentTime() - this.animatingSince) / Cell.ANIMATION_DURATION,
			),
		);

		if (this.isDisappearing) {
			return 1 - progress;
		} else {
			return progress;
		}
	}

	get isStale() {
		return this.isDisappearing && this.opacity === 0;
	}

	constructor(
		public readonly type: CellType,
		public readonly color: ThemeColor,
		public readonly direction: CellDirection | null = null,
		public readonly isDisappearing: boolean = false,
		public readonly animatingSince = currentTime(),
	) {}

	draw(p: p5, cellLength: number) {
		p.push();
		const color = this.color(p);
		color.setAlpha(this.opacity * 255);

		p.noStroke();
		p.fill(color);

		const diameter = cellLength * 0.7;
		p.circle(0, 0, diameter);

		p.pop();
	}

	drawConnector(p: p5, cellLength: number, progress: number) {
		p.push();
		const color = this.color(p);
		const length = cellLength * progress;

		console.assert(length <= cellLength);

		p.stroke(color);
		p.strokeWeight(cellLength * 0.5);
		if (this.direction === CellDirection.Right) {
			p.line(0, 0, length, 0);
		}
		if (this.direction === CellDirection.Left) {
			p.line(0, 0, -length, 0);
		}
		if (this.direction === CellDirection.Up) {
			p.line(0, 0, 0, -length);
		}
		if (this.direction === CellDirection.Down) {
			p.line(0, 0, 0, length);
		}
		p.pop();
	}

	static delta(
		[row0, col0]: [number, number],
		[row1, col1]: [number, number],
	): CellDirection {
		if (row0 === row1) {
			if (col0 + 1 === col1) {
				return CellDirection.Right;
			}
			if (col0 - 1 === col1) {
				return CellDirection.Left;
			}
		}

		if (col0 === col1) {
			if (row0 + 1 === row1) {
				return CellDirection.Down;
			}
			if (row0 - 1 === row1) {
				return CellDirection.Up;
			}
		}

		throw new Error(
			"Se intentó encontrar la dirección de dos celdas no-adyacentes.",
		);
	}

	/*
	 * Utilidades para la modificación.
	 *
	 * Las instancias de esta clase son inmutables para simplificar la gerencia
	 * del historial, i.e., deshacer-rehacer.
	 *
	 * Como resultado, es común querer hacer una copia de una celda que se
	 * diferencia de la original en alguna propiedad específica.
	 *
	 * Estas funciones ayudan a crear copias que difieren en una sola propiedad.
	 * Nunca modifican la instancia original.
	 */

	withDirection(direction: CellDirection | null) {
		return new Cell(
			this.type,
			this.color,
			direction,
			this.isDisappearing,
			this.animatingSince,
		);
	}

	asSealed() {
		if (this.type !== CellType.Endpoint) {
			throw new Error(
				"Solo los puntos finales pueden denotarse como sellados.",
			);
		}
		return new Cell(
			CellType.SealedEndpoint,
			this.color,
			this.direction,
			this.isDisappearing,
			this.animatingSince,
		);
	}

	asDisappearing() {
		return new Cell(
			this.type,
			this.color,
			this.direction,
			true,
			this.animatingSince,
		);
	}

	asAnimating() {
		return new Cell(
			this.type,
			this.color,
			this.direction,
			this.isDisappearing,
			currentTime(),
		);
	}
}

type CellRow = (Cell | null)[];
type CellMatrix = CellRow[];

/**
 * Una matriz.
 */
class Grid {
	#matrix: CellMatrix;
	get size() {
		return this.#matrix.length;
	}

	constructor(level?: LevelData) {
		if (!level) {
			this.#matrix = [];
			return;
		}

		//inicializa la matriz con celdas vacías
		this.#matrix = [];
		for (let r = 0; r < level.size; ++r) {
			const row: CellRow = [];
			for (let c = 0; c < level.size; ++c) {
				row.push(null);
			}
			this.#matrix.push(row);
		}

		for (const { row0, col0, row1, col1, color } of level.endpoints) {
			this.#matrix[row0][col0] = new Cell(CellType.Endpoint, color);
			this.#matrix[row1][col1] = new Cell(CellType.Endpoint, color);
		}
	}

	withinBounds(row: number, col: number): boolean {
		return row >= 0 && row < this.size && col >= 0 && col < this.size;
	}

	clone(): Grid {
		const grid = new Grid();
		grid.#matrix = this.#matrix.map((row) => [...row]);
		return grid;
	}

	get(row: number, col: number) {
		if (!this.withinBounds(row, col)) {
			throw new Error(
				`Las coordenadas ${row} ${col} exceden las dimensiones de la matriz.`,
			);
		}

		return this.#matrix[row][col];
	}

	set(row: number, col: number, cell: Cell) {
		if (!this.withinBounds(row, col)) {
			throw new Error(
				`Las coordenadas ${row} ${col} exceden las dimensiones de la matriz.`,
			);
		}

		this.#matrix[row][col] = cell;
	}

	/**
	 * @returns La cantidad de celdas que satisfacen el predicado.
	 */
	count(test: (cell: Cell | null) => boolean) {
		let out = 0;
		for (const row of this.#matrix) {
			for (const cell of row) {
				if (test(cell)) {
					++out;
				}
			}
		}
		return out;
	}

	properties(container: Rectangle) {
		const containerWidth = container.right - container.left;
		const containerHeight = container.bottom - container.top;

		const vertexLength = Math.min(containerWidth, containerHeight) - 10;
		const cellLength = vertexLength / this.size;
		const originX = container.left + (containerWidth - vertexLength) / 2;
		const originY = container.top + (containerHeight - vertexLength) / 2;

		return { vertexLength, cellLength, originX, originY };
	}

	getCellFromPosition(
		x: number,
		y: number,
		container: Rectangle,
	): [number, number] | null {
		const { originX, originY, cellLength } = this.properties(container);

		const localX = x - originX;
		const localY = y - originY;

		const col = Math.floor(localX / cellLength);
		const row = Math.floor(localY / cellLength);

		if (row < 0 || row >= this.size || col < 0 || col >= this.size) {
			return null;
		}

		return [row, col];
	}

	drawOverlays(
		p: p5,
		container: Rectangle,
		paths: Map<[number, number], Path>,
		phantoms: Map<[number, number], Cell>,
	) {
		p.push();
		const { cellLength, originX, originY } = this.properties(container);

		for (const [[rootRow, rootCol], path] of paths.entries()) {
			const current: [number, number] = [rootRow, rootCol];

			const grid = path.externalGrid ?? this;
			let currentCell = grid.get(...current);

			for (let i = 0; !currentCell || currentCell.direction !== null; ++i) {
				if (!currentCell) {
					throw new TypeError("El camino incluye una celda vacía.");
				}

				const cellY = originY + cellLength * (current[0] + 0.5);
				const cellX = originX + cellLength * (current[1] + 0.5);

				p.push();
				p.translate(cellX, cellY);

				if (path.progress - i > 0) {
					const connectorProgress = Math.min(1, path.progress - i);
					currentCell?.drawConnector(p, cellLength, connectorProgress);
				}

				p.pop();

				if (currentCell.direction === CellDirection.Right) {
					++current[1];
				} else if (currentCell.direction === CellDirection.Left) {
					--current[1];
				} else if (currentCell.direction === CellDirection.Up) {
					--current[0];
				} else if (currentCell.direction === CellDirection.Down) {
					++current[0];
				}
				currentCell = grid.get(...current);
			}
		}

		for (const [phantom, phantomCell] of phantoms.entries()) {
			const cellY = originY + cellLength * (phantom[0] + 0.5);
			const cellX = originX + cellLength * (phantom[1] + 0.5);

			p.push();
			p.translate(cellX, cellY);
			phantomCell.draw(p, cellLength);
			p.pop();
		}

		p.pop();
	}

	draw(p: p5, container: Rectangle) {
		p.push();
		const { vertexLength, cellLength, originX, originY } =
			this.properties(container);

		p.noFill();
		p.stroke(themeColors.subtler(p));
		for (let i = 1; i < this.size; ++i) {
			const y = originY + cellLength * i;
			p.line(originX, y, originX + vertexLength, y);

			const x = originX + cellLength * i;
			p.line(x, originY, x, originY + vertexLength);
		}
		p.square(originX, originY, vertexLength, 10);

		for (const [i, row] of this.#matrix.entries()) {
			for (const [j, cell] of row.entries()) {
				const cellY = originY + cellLength * (i + 0.5);
				const cellX = originX + cellLength * (j + 0.5);

				p.push();
				p.translate(cellX, cellY);
				cell?.draw(p, cellLength);
				p.pop();
			}
		}

		p.pop();
	}
}

/**
 * Un elemento del historial.
 */
interface TimelineItem {
	grid: Grid;
	addedPath: { root: [number, number]; length: number } | null;
}

/**
 * Datos relacionados a un camino.
 *
 * Un `Path`, en sí, no incluye la secuencia de elementos que forman el
 * camino. En cambio, registra la raíz y algunos datos de animación.
 *
 * Si el camino pertenece a una versión de la matriz distinta a la matriz
 * actual, se establece la propiedad `externalGrid`. De esa forma, se puede
 * recuperar la secuencia de celdas que correspondan a un camino que se ha
 * eliminado. Esto es importante visualmente: la desaparición de los caminos
 * está animada.
 *
 * Para avanzar el estado de la animación, se llama `.tick()`.
 */
class Path {
	/**
	 * Opcionalmente, una matriz que asociar con este camino. Si esta propiedad
	 * no está establecida, se usará el estado de la matriz actual.
	 */
	externalGrid: Grid | null;
	target: number;

	progress: number = 0;

	get #velocity() {
		return (this.target - this.progress) / 9;
	}

	constructor(length: number, grid: Grid | null = null) {
		this.target = length;
		this.externalGrid = grid;
	}

	/**
	 * Avanzar el estado de la animación.
	 * @returns Si este camino está añejo; es decir, si se puede eliminar
	 * (porque no es visible y corresponde a un punto de guardado distinto al
	 * actual).
	 */
	tick() {
		this.progress += this.#velocity;
		this.progress = Math.max(0, this.progress);

		const isStale = this.progress === 0 && !!this.externalGrid;
		return isStale;
	}
}

/**
 * Datos sobre una sesión durante la que el usuario determina algún camino.
 */
interface PullingState {
	/**
	 * La raíz del camino
	 */
	root: [number, number];

	/**
	 * La cabeza actual del camino
	 */
	head: [number, number];
}

/**
 * Representa una partida individual del juego.
 */
class Game {
	#wonAt: number | null = null;
	get wonAt() {
		return this.#wonAt;
	}

	/**
	 * Celdas que se han eliminado.
	 *
	 * Esto se necesita para darles una animación a las celdas cuando se
	 * eliminan.
	 *
	 * Funciona más o menos como una matriz superpuesta. En este caso, la matriz
	 * es dispersa: se anticipa que la gran mayoría de los elementos sean nulos.
	 * Un mapa permite solo almacenar las celdas no nulas.
	 *
	 * Dado que las matrices del juego son muy pequeñas, esta representación de
	 * una matriz dispersa no ofrece beneficios de rendimiento. Sin embargo, es
	 * quizá un poco más cómoda de usar.
	 */
	#phantoms: Map<[number, number], Cell> = new Map();

	/**
	 * Indica si hay cambios sin guardar.
	 */
	#dirty: boolean = false;

	#timeline: TimelineItem[] = [];
	#timelineIndex: number = -1;

	/**
	 * El número de parejas de puntos finales en este nivel.
	 */
	#endpointCount: number;

	/**
	 * Asocia raíces con datos sobre los caminos de los que hacen parte.
	 */
	#paths: Map<[number, number], Path> = new Map();
	#grid: Grid;

	#pulling: PullingState | null = null;
	get pulling() {
		return !!this.#pulling;
	}

	/**
	 * @returns El contenedor dentro del que se dibujará la cuadrícula.
	 */
	container: (p: p5) => Rectangle;

	constructor(level: LevelData, container: (p: p5) => Rectangle) {
		this.#endpointCount = level.endpoints.length;
		this.#grid = new Grid(level);
		this.container = container;
		this.#checkpoint();
	}

	getCellFromMouse(p: p5): [number, number] | null {
		return this.#grid.getCellFromPosition(
			p.mouseX,
			p.mouseY,
			this.container(p),
		);
	}

	#updateWinningState() {
		const hasWon =
			this.#grid.count(
				(cell) => !!cell && cell.type === CellType.SealedEndpoint,
			) === this.#endpointCount &&
			this.#grid.count((cell) => cell === null) === 0;

		if (hasWon) {
			this.#wonAt = currentTime();
		}
	}

	isInteractive([row, col]: [number, number]): boolean {
		const cell = this.#grid.get(row, col);
		const pullColor = (this.#pulling && this.#grid.get(...this.#pulling.root))
			?.color;

		return (
			!!cell &&
			cell.direction === null &&
			cell.type !== CellType.SealedEndpoint &&
			(!pullColor || pullColor === cell.color)
		);
	}

	/**
	 * Indica si dos celdas se pueden conectar.
	 */
	#canPull(
		fromRow: number,
		fromCol: number,
		toRow: number,
		toCol: number,
	): boolean {
		if (!this.#pulling) {
			return false;
		}

		const [headRow, headCol] = this.#pulling.head;

		if (headRow !== fromRow || headCol !== fromCol) {
			return false;
		}

		const targetCell = this.#grid.get(toRow, toCol);
		const fromCell = this.#grid.get(fromRow, fromCol);

		if (
			fromCell === null ||
			fromCell.type === CellType.SealedEndpoint ||
			fromCell.direction !== null || // solo se permiten caminos simples
			(targetCell && targetCell.direction !== null) // ditto
		) {
			return false;
		}

		if (Math.abs(fromRow - toRow) + Math.abs(fromCol - toCol) !== 1) {
			return false;
		}

		if (
			targetCell &&
			targetCell.color === fromCell.color &&
			targetCell.type === CellType.Endpoint
		) {
			// de pronto puede fallar, q opinan?
			return true;
		}

		return targetCell === null;
	}

	/**
	 * Iniciar una 'sesión' durante la que se determina algún camino.
	 */
	startPulling(root: [number, number]) {
		if (this.#pulling) {
			throw new Error(
				"No se puede empezar a jalar si nunca se terminó de jalar.",
			);
		}

		if (!this.isInteractive(root)) {
			throw new Error(
				"No se puede empezar a jalar desde una celda no-interactiva.",
			);
		}

		this.#pulling = { root, head: root };
		this.#paths.set(root, new Path(0));
	}

	/**
	 * Si es apropiado, unir una celda con otra. Esta función actualiza
	 * internamente los estados relevantes al juego, como, por ejemplo, si se
	 * completó un camino.
	 */
	pull(fromRow: number, fromCol: number, toRow: number, toCol: number) {
		if (!this.#pulling) {
			throw new Error(
				"No se puede jalar un camino sin haber empezado a jalar.",
			);
		}

		if (
			!this.#grid.withinBounds(fromRow, fromCol) ||
			!this.#grid.withinBounds(toRow, toCol)
		) {
			return;
		}

		const fromCell = this.#grid.get(fromRow, fromCol);
		const toCell = this.#grid.get(toRow, toCol);

		const pullingPath = this.#paths.get(this.#pulling.root);
		if (!pullingPath) {
			throw new TypeError();
		}

		if (fromCell && this.#canPull(fromRow, fromCol, toRow, toCol)) {
			this.#dirty = true;

			// Anotar que toRow, toCol es el hijo de fromRow, fromCol
			this.#grid.set(
				fromRow,
				fromCol,
				fromCell.withDirection(Cell.delta([fromRow, fromCol], [toRow, toCol])),
			);

			++pullingPath.target;
			this.#pulling.head = [toRow, toCol];

			if (
				toCell &&
				toCell.type === CellType.Endpoint &&
				toCell.color === fromCell.color
			) {
				// Sellamos la hoja.
				this.#grid.set(toRow, toCol, toCell.asSealed());

				// Guardamos el estado del tablero cada vez que el jugador
				// completa un movimiento.
				this.#checkpoint({
					root: this.#pulling.root,
					length: pullingPath.target,
				});

				// Como el usuario acaba de terminar un camino nuevo, vale
				// la pena revisar si ganó.
				this.#updateWinningState();
			} else {
				// Establecemos un nodo intermedio
				this.#grid.set(toRow, toCol, new Cell(CellType.Path, fromCell.color));
			}
		}
	}

	/**
	 * Terminar una sesión durante la que el usuario determinó un camino.
	 *
	 * Si el camino no se terminó, la matriz se restaura a su punto de guardado
	 * anterior más reciente.
	 */
	stopPulling() {
		if (!this.#pulling) {
			throw new Error("No se puede dejar de jalar si no se empezó a jalar.");
		}

		const pullingPath = this.#paths.get(this.#pulling.root);

		if (!pullingPath) {
			throw new TypeError();
		}

		if (this.#dirty) {
			pullingPath.externalGrid = this.#grid.clone();
			pullingPath.target = 0;
			this.clean();
		}

		this.#pulling = null;
	}

	/**
	 * Reemplaza la matriz actual con una copia de `grid`. Se actualizan los
	 * fantasmas (`this.phantoms`) y los puntos de inicio de animación.
	 */
	#applyGrid(grid: Grid) {
		const currentGrid = this.#grid.clone();
		const newGrid = grid.clone();
		for (let i = 0; i < newGrid.size; ++i) {
			for (let j = 0; j < newGrid.size; ++j) {
				if (this.#grid.withinBounds(i, j)) {
					const newCell = grid.get(i, j);
					const currentCell = currentGrid.get(i, j);
					if (newCell === null && currentCell !== null) {
						this.#phantoms.set(
							[i, j],
							currentCell.asAnimating().asDisappearing(),
						);
					}
					if (newCell !== null && currentCell === null) {
						newGrid.set(i, j, newCell.asAnimating());
					}
				}
			}
		}
		this.#grid = newGrid;
	}

	/**
	 * Agrega el estado actual al historial.
	 */
	#checkpoint(path: TimelineItem["addedPath"] = null) {
		this.#dirty = false;
		this.#timeline.splice(this.#timelineIndex + 1);
		this.#timeline.push({ addedPath: path, grid: this.#grid.clone() });
		++this.#timelineIndex;
	}

	/**
	 * Elimina los cambios sin guardar.
	 */
	clean() {
		this.#applyGrid(this.#timeline[this.#timelineIndex].grid);
		this.#dirty = false;
	}

	undo() {
		if (this.#dirty) {
			this.clean();
			return;
		}

		const { addedPath } = this.#timeline[this.#timelineIndex];

		if (addedPath) {
			const path = this.#paths.get(addedPath.root);
			if (!path) {
				throw new TypeError(
					`Se intentó deshacer un cambio que no estaba reflejado en el estado actual. En particular, no hay registro de un camino con una raíz en ${addedPath.root}.`,
				);
			}
			path.externalGrid = this.#grid.clone();
			path.target = 0;
		}

		this.#timelineIndex = Math.max(0, this.#timelineIndex - 1);
		const { grid } = this.#timeline[this.#timelineIndex];
		this.#applyGrid(grid);
	}

	redo() {
		if (this.#dirty) {
			return;
		}

		if (this.#timelineIndex === this.#timeline.length - 1) {
			return;
		}

		++this.#timelineIndex;

		const { grid, addedPath } = this.#timeline[this.#timelineIndex];

		this.#applyGrid(grid);

		if (addedPath) {
			this.#paths.set(addedPath.root, new Path(addedPath.length));
		}
	}

	draw(p: p5) {
		for (const [root, path] of this.#paths.entries()) {
			const isStale = path.tick();
			if (isStale) {
				this.#paths.delete(root);
			}
		}

		for (const [phantom, phantomCell] of this.#phantoms.entries()) {
			if (phantomCell.isStale) {
				this.#phantoms.delete(phantom);
			}
		}

		this.#grid.draw(p, this.container(p));
		this.#grid.drawOverlays(p, this.container(p), this.#paths, this.#phantoms);
	}
}

/*
 * Transiciones
 *
 * Esta sección se encarga de la lógica entre partidas. Por ejemplo, iniciar
 * un nuevo nivel cuando el usuario gana.
 */

/**
 * La página de una partida.
 */
class GamePage extends Page<{
	level: LevelData;
	index: number;
	isProcedural: boolean;
}> {
	static GameContainer(p: p5) {
		return {
			bottom: p.height - 40,
			top: 0,
			left: 0,
			right: p.width,
		};
	}

	static highlightColor: ThemeColor = (p: p5) =>
		isDark() ? p.color("oklch(0.35 0.1 230)") : p.color("oklch(0.9 0.05 230)");
	static baseColor: ThemeColor = (p: p5) =>
		isDark() ? p.color("oklch(0.22 0 230)") : p.color("oklch(0.96 0 230)");

	/**
	 * La posición anterior durante una interacción de arrastrar.
	 */
	lastPosition: [number, number] | null = null;

	undoButton!: Button;
	redoButton!: Button;

	/**
	 * La partida individual actual.
	 */
	game!: Game;
	/**
	 * El índice correspondiendo a este nivel, si existe.
	 */
	levelIndex!: number;

	/**
	 * Indica si el nivel fue generado.
	 */
	isProcedural!: boolean;

	/**
	 * Los datos del nivel son enviados por la página precedente.
	 */
	receive({
		level,
		index,
		isProcedural,
	}: {
		level: LevelData;
		index: number;
		isProcedural: boolean;
	}): void {
		this.game = new Game(level, GamePage.GameContainer);
		this.levelIndex = index;
		this.isProcedural = isProcedural;
	}

	setup(p: p5) {
		p.textFont("system-ui");
		p.colorMode(p.OKLCH); // necesario debido a https://github.com/processing/p5.js/issues/8806

		this.undoButton = new Button(p);
		this.undoButton.setLabel(p, "Deshacer");
		this.undoButton.baseColor = GamePage.baseColor;
		this.undoButton.highlightColor = GamePage.highlightColor;
		this.undoButton.textFill = themeColors.foreground;

		this.redoButton = new Button(p);
		this.redoButton.setLabel(p, "Rehacer");
		this.redoButton.baseColor = GamePage.baseColor;
		this.redoButton.highlightColor = GamePage.highlightColor;
		this.redoButton.textFill = themeColors.foreground;
	}

	draw(p: p5) {
		p.clear();

		this.game.draw(p);

		const PADDING = 10;

		this.undoButton.y = p.height - 20;
		this.undoButton.x = (p.width - PADDING - this.undoButton.width) / 2;
		this.undoButton.draw(p);

		this.redoButton.y = p.height - 20;
		this.redoButton.x = (p.width + PADDING + this.undoButton.width) / 2;
		this.redoButton.draw(p);

		p.cursor(p.ARROW);

		const target = this.game.getCellFromMouse(p);
		if (target && this.game.isInteractive(target)) {
			p.cursor(p.HAND);
		}

		if (
			this.undoButton.intersectsWith(p.mouseX, p.mouseY) ||
			this.redoButton.intersectsWith(p.mouseX, p.mouseY)
		) {
			p.cursor(p.HAND);
		}

		if (this.game.wonAt) {
			this.drawWin(p, this.game.wonAt);
		}
	}

	/**
	 * Una función que se llama cada fotograma mientras que el jugador ha
	 * ganado.
	 */
	drawWin(p: p5, at: number): void {
		const DELAY = 200;
		const ANIMATION_DURATION = 300;
		const elapsed = currentTime() - at - DELAY;
		const t = ease(p.constrain(elapsed / ANIMATION_DURATION, 0, 1));

		p.push();
		const c = themeColors.overlay(p);
		c.setAlpha(t * 255);
		p.noStroke();
		p.fill(c);
		p.rect(0, 0, p.width, p.height);
		p.pop();

		if (elapsed > ANIMATION_DURATION) {
			this.navigator.switchPage(p, WonPage, {
				levelIndex: this.levelIndex,
				wasProcedural: this.isProcedural,
			});
		}
	}

	mouseClicked(p: p5) {
		if (this.undoButton.intersectsWith(p.mouseX, p.mouseY)) {
			this.game.undo();
		}
		if (this.redoButton.intersectsWith(p.mouseX, p.mouseY)) {
			this.game.redo();
		}
	}

	mouseReleased() {
		if (this.game.pulling) {
			this.game.stopPulling();
		}
	}

	mouseDragged(p: p5) {
		const target = this.game.getCellFromMouse(p);
		if (!target) return;

		if (!this.game.pulling) {
			if (!this.game.isInteractive(target)) {
				return;
			}

			this.game.startPulling(target);
		}

		if (this.lastPosition) {
			const [row, col] = target;
			const [lastRow, lastCol] = this.lastPosition;
			this.game.pull(lastRow, lastCol, row, col);
		}

		this.lastPosition = target;
	}
}

class WonPage extends Page<{ levelIndex: number; wasProcedural: boolean }> {
	levelIndex!: number;
	wasProcedural!: boolean;

	/**
	 * El momento en el tiempo en que se empezó a mostrar esta página.
	 */
	appearedAt!: number;

	button!: Button;

	receive({
		levelIndex,
		wasProcedural,
	}: {
		levelIndex: number;
		wasProcedural: boolean;
	}) {
		this.levelIndex = levelIndex;
		this.wasProcedural = wasProcedural;
	}

	setup(p: p5) {
		p.colorMode(p.OKLCH); // necesario debido a https://github.com/processing/p5.js/issues/8806
		p.textFont("system-ui");
		this.appearedAt = currentTime();
		this.button = new Button(p);
	}

	draw(p: p5) {
		const ANIMATION_DURATION = 300;
		const SECONDARY_DELAY = 270;

		const elapsed_0 = currentTime() - this.appearedAt;
		const elapsed_1 = currentTime() - this.appearedAt - SECONDARY_DELAY;
		const t_0 = p.constrain(elapsed_0 / ANIMATION_DURATION, 0, 1);
		const t_1 = p.constrain(elapsed_1 / ANIMATION_DURATION, 0, 1);

		const PRIMARY_SIZE = 34;
		const SECONDARY_SIZE = 20;
		const MARGIN = 30;

		let primaryMessage: string;
		let secondaryMessage: string;

		if (this.levelIndex && this.levelIndex + 1 === levels.length) {
			primaryMessage = "¡Has completado el juego!";
			secondaryMessage = "No quedan más niveles.";
			this.button.setLabel(p, "Regresar al inicio");
		} else {
			primaryMessage = "¡Nivel completado!";
			secondaryMessage = "Puedes avanzar al siguiente nivel.";
			this.button.setLabel(p, "Siguiente nivel");
		}

		const totalHeight =
			this.button.height +
			ascent(p, PRIMARY_SIZE) +
			ascent(p, SECONDARY_SIZE) +
			MARGIN * 2.5;
		const primaryY = (p.height - totalHeight + ascent(p, PRIMARY_SIZE)) / 2;
		const secondaryY =
			primaryY +
			MARGIN +
			ascent(p, PRIMARY_SIZE) / 2 +
			ascent(p, SECONDARY_SIZE) / 2;
		const buttonY =
			secondaryY +
			MARGIN * 1.5 +
			ascent(p, SECONDARY_SIZE) / 2 +
			this.button.height / 2;

		p.background(themeColors.overlay(p));

		// mensaje principal
		p.noStroke();
		p.textAlign(p.CENTER, p.CENTER);
		const c = themeColors.foreground(p);
		c.setAlpha(t_0 * 255);
		p.fill(c);
		p.textSize(PRIMARY_SIZE);
		p.text(primaryMessage, p.width / 2, primaryY);

		// mensaje secundario
		c.setAlpha(t_1 * 255);
		p.fill(c);
		p.textSize(SECONDARY_SIZE);
		p.text(secondaryMessage, p.width / 2, secondaryY);

		// botón
		this.button.alpha = t_1 * 255;
		this.button.x = p.width / 2;
		this.button.y = buttonY;
		this.button.draw(p);

		if (this.button.intersectsWith(p.mouseX, p.mouseY)) {
			p.cursor(p.HAND);
		} else {
			p.cursor(p.ARROW);
		}
	}

	mouseClicked(p: p5) {
		if (this.button.intersectsWith(p.mouseX, p.mouseY)) {
			const index = this.levelIndex + 1;
			if (index >= levels.length) {
				this.navigator.switchPage(p, WelcomePage);
			} else {
				this.navigator.switchPage(p, GamePage, {
					level: levels[index],
					index,
					isProcedural: false,
				});
			}
		}
	}
}

/**
 * La página de bienvenida; es decir, la que siempre aparece primero.
 */
class WelcomePage extends Page {
	handMadeLevelsButton!: Button;
	proceduralLevelsButton!: Button;

	setup(p: p5) {
		p.textFont("system-ui");

		this.handMadeLevelsButton = new Button(p);
		this.handMadeLevelsButton.setLabel(p, "Niveles Lineales");

		this.proceduralLevelsButton = new Button(p);
		this.proceduralLevelsButton.setLabel(p, "Modo infinito");

		const width =
			Math.max(
				this.handMadeLevelsButton.width,
				this.proceduralLevelsButton.width,
			) + 40;

		const height = 40;

		this.handMadeLevelsButton.minWidth = width;
		this.proceduralLevelsButton.minWidth = width;

		this.handMadeLevelsButton.minHeight = height;
		this.proceduralLevelsButton.minHeight = height;
	}

	draw(p: p5) {
		p.clear();
		p.fill(themeColors.foreground(p));

		const MARGIN = 60;

		const totalHeight =
			this.handMadeLevelsButton.height +
			this.proceduralLevelsButton.height +
			MARGIN;
		const startY =
			(p.height - totalHeight + this.handMadeLevelsButton.height) / 2;

		this.handMadeLevelsButton.x = p.width / 2;
		this.handMadeLevelsButton.y = startY;
		this.handMadeLevelsButton.draw(p);

		this.proceduralLevelsButton.x = p.width / 2;
		this.proceduralLevelsButton.y =
			startY + MARGIN + this.handMadeLevelsButton.height / 2;
		this.proceduralLevelsButton.draw(p);

		if (
			[this.handMadeLevelsButton, this.proceduralLevelsButton].some((button) =>
				button.intersectsWith(p.mouseX, p.mouseY),
			)
		) {
			p.cursor(p.HAND);
		} else {
			p.cursor(p.ARROW);
		}
	}

	mouseClicked(p: p5) {
		if (this.handMadeLevelsButton.intersectsWith(p.mouseX, p.mouseY)) {
			this.navigator.switchPage(p, GamePage, {
				level: levels[0],
				index: 0,
				isProcedural: false,
			});
		}

		if (this.proceduralLevelsButton.intersectsWith(p.mouseX, p.mouseY)) {
			this.navigator.switchPage(p, GamePage, {
				level: levels[0],
				index: 0,
				isProcedural: false,
			});
		}
	}
}

/**
 * El 'navegador' gestiona las transiciones entre 'páginas'.
 *
 * En este contexto, tanto el navegador como las páginas se refieren a
 * conceptos originales. No se refieren al navegador web o a páginas web.
 */
const navigator = new Navigator(WelcomePage, [GamePage, WonPage]);

// Inicializar el bosquejo p5
const canvasParent = document.getElementById("canvas-container");
if (!canvasParent) {
	throw new Error();
}

// demasiados falsos positivos en la consola
p5.disableFriendlyErrors = true;

const s = new p5(navigator.sketch, canvasParent);

// HMR
//
// Durante el desarrollo (y solo durante el desarrollo), este
// código se encarga de que la página actual no cambie cuando
// Vite decide recargar el proyecto después de un cambio.
// Señalar que este módulo acepta HMR
if (import.meta.hot) {
	import.meta.hot.accept();

	// Restaurar estado
	const previousPageID = import.meta.hot.data?.currentPageID;

	if (previousPageID) {
		try {
			navigator.overridePage(previousPageID, { level: levels[0] });
		} catch {}
	}

	// Guardar el ID de la página actual e invalidar el
	// bosquejo antiguo
	import.meta.hot.dispose((data) => {
		data.currentPageID = navigator.currentPageName;
		s.remove();
	});
}
