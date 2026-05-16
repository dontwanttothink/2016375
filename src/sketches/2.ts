import p5 from "p5";
import "p5.quadrille";
import "../displayErrors";
import { Navigator, Page } from "../pages";

function currentTime(): number {
	return Number(document.timeline.currentTime);
}

type ThemeColor = (p: p5) => p5.Color;

function isDark() {
	// mira si el usuario utiliza el tema oscuro
	return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function randomThemeColor(): ThemeColor {
	// Elegir un color aleatoriamente
	const hue = Math.floor(Math.random() * 360);
	return themeColor(hue);
}

function themeColor(hue: number): ThemeColor {
	//Les coloca especificaciones al color
	// Constantes escogidas usando https://oklch.com/ :)
	const lightness = 0.65;
	const chroma = 0.212;

	return (p: p5) => p.color(`oklch(${lightness} ${chroma} ${hue})`);
}

const themeColors = {
	// Define colores
	foreground: (p: p5) => (isDark() ? p.color(200) : p.color(105)),
	subtler: (p: p5) => (isDark() ? p.color(150) : p.color(155)),
	red: themeColor(0),
	yellow: themeColor(100),
	blue: themeColor(230),
	green: themeColor(140),
	orange: themeColor(63),
} satisfies Record<string, ThemeColor>;

interface Rectangle {
	//constructor de rectangulo
	top: number;
	bottom: number;
	left: number;
	right: number;
}

/**
 * Interacción del usuario
 */

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
		p.push();
		p.textSize(Button.TEXT_SIZE);
		const contentHeight =
			p.textAscent(this.#label) + p.textDescent(this.#label);
		const targetHeight = contentHeight + Button.PADDING * 1.7;
		const height = Math.max(targetHeight, this.minHeight);

		const contentWidth = p.textWidth(this.#label);
		const targetWidth = contentWidth + Button.PADDING * 2;
		const width = Math.max(targetWidth, this.minWidth);
		p.pop();

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

/**
 * Lógica
 */

//tipos de estados para las celdas
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

//clase para representar cada celda del tablero
class Cell {
	constructor(
		public readonly type: CellType,
		public readonly color: ThemeColor,
		public readonly direction: CellDirection | null = null,
		public readonly isFrozen: boolean = false,
	) {}

	draw(p: p5, cellLength: number) {
		p.push();
		const color = this.color(p);

		p.noStroke();
		p.fill(color);

		const diameter = cellLength * 0.7;
		p.circle(0, 0, diameter);

		p.stroke(color);
		p.strokeWeight(diameter * 0.5);
		if (this.direction === CellDirection.Right) {
			p.line(0, 0, cellLength, 0);
		}
		if (this.direction === CellDirection.Left) {
			p.line(0, 0, -cellLength, 0);
		}
		if (this.direction === CellDirection.Up) {
			p.line(0, 0, 0, -cellLength);
		}
		if (this.direction === CellDirection.Down) {
			p.line(0, 0, 0, cellLength);
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
		return new Cell(this.type, this.color, direction, this.isFrozen);
	}

	asSealed() {
		if (this.type !== CellType.Endpoint) {
			throw new Error(
				"Solo los puntos finales pueden denotarse como sellados.",
			);
		}
		return new Cell(CellType.SealedEndpoint, this.color, this.direction);
	}
}

type CellRow = (Cell | null)[];
type CellMatrix = CellRow[];

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

	draw(p: p5, paths: Map<[number, number], Path>, container: Rectangle) {
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

interface TimelineItem {
	grid: Grid;
	addedPath: { root: [number, number]; length: number } | null;
}

class Path {
	length: number;

	progress: number = 0;
	velocity: number = 0;

	get acceleration() {
		return (this.length - this.progress) / this.length;
	}

	constructor(length: number) {
		this.length = length;
	}

	tick() {}
}

interface PullState {
	/**
	 * La raíz del camino
	 */
	from: [number, number];

	length: number;
}

//clase para recibir endpoints y manejar la lógica del juego
/**
 * Representa una partida individual del juego.
 */
class Game {
	/**
	 * Indica si hay cambios sin guardar.
	 */
	#dirty: boolean = false;

	#timeline: TimelineItem[] = [];
	#timelineIndex: number = -1;

	/**
	 * Asocia raíces con datos sobre los caminos de los que hacen parte.
	 */
	#paths: Map<[number, number], Path> = new Map();
	#grid: Grid;

	#pulling: PullState | null = null;
	get pulling() {
		return !!this.#pulling;
	}

	container: (p: p5) => Rectangle;

	constructor(
		level: LevelData,
		container: (p: p5) => Rectangle,
		onWin: () => unknown,
	) {
		this.#grid = new Grid(level);
		this.container = container;
		this.#checkpoint();
	}

	//para añadir los puntos de colores de cada nivel
	setEndpoint(
		row: number,
		col: number,
		row2: number,
		col2: number,
		color: ThemeColor,
	) {
		this.#grid.set(row, col, new Cell(CellType.Endpoint, color));
		this.#grid.set(row2, col2, new Cell(CellType.Endpoint, color));
	}

	getCellFromMouse(p: p5): [number, number] | null {
		return this.#grid.getCellFromPosition(
			p.mouseX,
			p.mouseY,
			this.container(p),
		);
	}

	isInteractive([row, col]: [number, number]): boolean {
		const cell = this.#grid.get(row, col);
		const pullColor = (
			this.#pulling?.from && this.#grid.get(...this.#pulling.from)
		)?.color;

		return (
			!!cell &&
			cell.direction !== null &&
			(!pullColor || pullColor === cell.color)
		);
	}

	// verifica si se pueden conectar dos celdas adyacentes
	#canPull(
		fromRow: number,
		fromCol: number,
		toRow: number,
		toCol: number,
	): boolean {
		if (!this.#pulling) {
			return false;
		}

		const targetCell = this.#grid.get(toRow, toCol);
		const fromCell = this.#grid.get(fromRow, fromCol);
		const rootCell = this.#grid.get(...this.#pulling.from);

		if (
			fromCell === null ||
			rootCell === null ||
			fromCell.type === CellType.SealedEndpoint ||
			fromCell.color !== rootCell.color
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

	startPulling(root: [number, number]) {
		this.#pulling = { from: root, length: 0 };
	}

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

		if (
			fromCell !== null &&
			fromCell.direction === null && // solo se permiten caminos simples
			!(toCell && toCell.direction !== null) && // ditto
			this.#canPull(fromRow, fromCol, toRow, toCol)
		) {
			// anotar que toRow, toCol es el hijo de fromRow, fromCol
			this.#grid.set(
				fromRow,
				fromCol,
				fromCell.withDirection(Cell.delta([fromRow, fromCol], [toRow, toCol])),
			);

			if (
				toCell &&
				toCell.type === CellType.Endpoint &&
				toCell.color === fromCell.color
			) {
				// Indicamos el fin de este camino
				this.#grid.set(toRow, toCol, toCell.asSealed());

				// Guardamos el estado del tablero cada vez que el jugador
				// completa un movimiento.
				this.#checkpoint({
					root: this.#pulling.from,
					length: this.#pulling.length,
				});
			} else {
				// Establecemos un nodo intermedio
				this.#grid.set(toRow, toCol, new Cell(CellType.Path, fromCell.color));
			}
		}
	}

	stopPulling() {
		this.#pulling = null;
	}

	#checkpoint(path: TimelineItem["addedPath"] = null) {
		this.#timeline.splice(this.#timelineIndex + 1);
		this.#timeline.push({ addedPath: path, grid: this.#grid.clone() });
		++this.#timelineIndex;
	}

	/**
	 * Eliminar los cambios sin guardar.
	 */
	clean() {
		this.#grid = this.#timeline[this.#timelineIndex].grid.clone();
	}

	undo() {
		if (this.#dirty) {
			this.clean();
			return;
		}

		this.#timelineIndex = Math.max(0, this.#timelineIndex - 1);

		const { grid, addedPath } = this.#timeline[this.#timelineIndex];

		this.#grid = grid.clone();

		if (addedPath) {
			const path = this.#paths.get(addedPath.root);
			if (!path) {
				throw new TypeError(
					`Se intentó deshacer un cambio que no estaba reflejado en el estado actual. En particular, no hay registro de un camino con una raíz en ${addedPath.root}.`,
				);
			}
			path.length = 0;
		}
	}

	redo() {
		if (this.#dirty) {
			return;
		}

		this.#timelineIndex = Math.min(
			this.#timeline.length - 1,
			this.#timelineIndex + 1,
		);

		const { grid, addedPath } = this.#timeline[this.#timelineIndex];

		this.#grid = grid.clone();

		if (addedPath) {
			this.#paths.set(addedPath.root, new Path(addedPath.length));
		}
	}

	draw(p: p5) {
		this.#grid.draw(p, this.#paths, this.container(p));
	}
}

/**
 * Transiciones
 *
 * Esta sección se encarga de la lógica entre partidas. Por ejemplo, iniciar
 * un nuevo nivel cuando el usuario gana.
 */

/**
 * Una partida.
 */
class GamePage extends Page {
	static GameContainer(p: p5) {
		return {
			bottom: p.height - 40,
			top: 0,
			left: 0,
			right: p.width,
		};
	}

	lastPosition: [number, number] | null = null;

	undoButton!: Button;
	redoButton!: Button;

	game!: Game;

	setup(p: p5) {
		p.textFont("system-ui");

		this.game = new Game(
			levels[0],
			GamePage.GameContainer,
			this.onWin.bind(this),
		);

		this.undoButton = new Button(p);
		this.undoButton.setLabel(p, "Deshacer");
		this.redoButton = new Button(p);
		this.redoButton.setLabel(p, "Rehacer");
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
	}

	mouseClicked(p: p5) {
		if (this.undoButton.intersectsWith(p.mouseX, p.mouseY)) {
			this.game.undo();
		}
		if (this.redoButton.intersectsWith(p.mouseX, p.mouseY)) {
			this.game.redo();
		}
	}

	mouseReleased(_: p5) {
		if (this.game.pulling) {
			this.game.stopPulling();
			this.game.clean();
		}
	}

	mouseDragged(p: p5) {
		const target = this.game.getCellFromMouse(p);
		if (!target) return;
		const [row, col] = target;

		if (!this.game.pulling) {
			this.game.startPulling(target);
		}

		if (this.lastPosition) {
			const [lastRow, lastCol] = this.lastPosition;
			this.game.pull(lastRow, lastCol, row, col);
		}

		this.lastPosition = target;
	}

	onWin() {}
}

class WelcomePage extends Page {
	draw(p: p5) {
		p.clear();
		p.fill(themeColors.foreground(p));
		p.text("haz click lol", p.width / 2, p.height / 2);
	}

	mouseClicked(p: p5) {
		this.navigator.switchPage(p, GamePage);
	}
}

const navigator = new Navigator(WelcomePage, [GamePage]);
//Niveles arreglados (Esto entendi)

interface EndpointConfig {
	row0: number;
	col0: number;
	row1: number;
	col1: number;
	color: ThemeColor;
}

interface LevelData {
	size: number;
	endpoints: EndpointConfig[];
}

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
			{ row0: 2, col0: 1, row1: 1, col1: 4, color: themeColors.red },
			{ row0: 0, col0: 2, row1: 0, col1: 4, color: themeColors.green },
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
			{ row0: 3, col0: 4, row1: 2, col1: 5, color: themeColors.blue },
		],
	},
];

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
			navigator.overridePage(previousPageID);
		} catch {}
	}

	// Guardar el ID de la página actual e invalidar el
	// bosquejo antiguo
	import.meta.hot.dispose((data) => {
		data.currentPageID = navigator.currentPageName;
		s.remove();
	});
}
