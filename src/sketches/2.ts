import p5 from "p5";
import "p5.quadrille";
import "../displayErrors";
import { Navigator, Page } from "../pages";

type ThemeColor = (p: p5) => p5.Color;

function isDark() {
	// mira si el usuario utiliza el tema oscuro
	return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function randomThemeColor(): ThemeColor {
	// Crea un color aleatoriamente
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

/**
 * Lógica
 */

//tipos de estados para las celdas
enum CellType {
	Empty,
	Endpoint,
	Path,
}

//reset (No funciona por el momento)
function resetGame(p: p5) {
	const game = new Game(5);
	Grid.initMatrix();
	const winner = undefined;
	p.loop();
}

//clase para representar cada celda del tablero
class FlowCell {
	constructor(
		public readonly type: CellType = CellType.Empty,
		public readonly color: ThemeColor,
	) {}

	draw(p: p5, cellLength: number) {
		if (this.type === CellType.Empty) {
			return;
		}
		p.push();
		p.noStroke();
		p.fill(this.color(p));
		p.circle(0, 0, cellLength * 0.7);
		p.pop();
	}
}

class Grid {
	#grid: FlowCell[][] = [];
	size: number;
	timeline: FlowCell[][][] = [];
	timelineIndex = 0;
	constructor(size: number) {
		this.size = size;
		//inicializa la matriz con celdas vacías
		this.#grid = [];
		for (let r = 0; r < this.size; r++) {
			const row: FlowCell[] = [];
			for (let c = 0; c < this.size; c++) {
				row.push(new FlowCell(CellType.Empty, randomThemeColor()));
			}
			this.#grid.push(row);
		}
	}
	get(row: number, col: number) {
		return this.#grid[row][col];
	}

	set(row: number, col: number, cell: FlowCell) {
		this.#grid[row][col] = cell;
	}

	saveTimeline() {
		this.timeline.push(this.#grid.map((row) => [...row]));
		this.timelineIndex++;
	}

	timelinePrev() {
		this.#grid = this.timeline[this.timelineIndex];
		if (this.timelineIndex >= 0) {
			this.timelineIndex--;
		}
	}

	timelinePost() {
		if (this.timelineIndex < this.timeline.length) {
			this.timelineIndex--;
		}
		this.#grid = this.timeline[this.timelineIndex];
	}

	draw(p: p5, container: Rectangle) {
		p.push();
		const containerWidth = container.right - container.left;
		const containerHeight = container.bottom - container.top;

		const vertexLength = Math.min(containerWidth, containerHeight) - 10;
		const cellLength = vertexLength / this.size;
		const originX = container.left + (containerWidth - vertexLength) / 2;
		const originY = container.top + (containerHeight - vertexLength) / 2;

		p.noFill();
		p.stroke(themeColors.subtler(p));
		for (let i = 1; i < this.size; ++i) {
			const y = originY + cellLength * i;
			p.line(originX, y, originX + vertexLength, y);

			const x = originX + cellLength * i;
			p.line(x, originY, x, originY + vertexLength);
		}
		p.square(originX, originY, vertexLength, 10);

		for (const [i, row] of this.#grid.entries()) {
			for (const [j, cell] of row.entries()) {
				const cellY = originY + cellLength * (i + 0.5);
				const cellX = originX + cellLength * (j + 0.5);

				p.push();
				p.translate(cellX, cellY);
				cell.draw(p, cellLength);
				p.pop();
			}
		}
		p.pop();
	}
	getCellFromPosition(
		x: number,
		y: number,
		canvasWidth: number,
		canvasHeight: number,
	) {
		const boardSize = Math.min(canvasWidth, canvasHeight) - 10;

		const cellSize = boardSize / this.size;

		const originX = (canvasWidth - boardSize) / 2;
		const originY = (canvasHeight - boardSize) / 2;

		const localX = x - originX;
		const localY = y - originY;

		const col = Math.floor(localX / cellSize);
		const row = Math.floor(localY / cellSize);

		if (row < 0 || row >= this.size || col < 0 || col >= this.size) {
			return null;
		}

		return { row, col };
	}
}

//clase para recibir endpoints y manejar la lógica del juego
class Game {
	grid: Grid;

	constructor(size: number) {
		this.grid = new Grid(size);
		this.grid.saveTimeline();
	}

	//para añadir los puntos de colores de cada nivel
	setEndpoint(
		row: number,
		col: number,
		row2: number,
		col2: number,
		color: ThemeColor,
	) {
		if (
			row >= 0 &&
			row < this.grid.size &&
			col >= 0 &&
			col < this.grid.size &&
			row2 >= 0 &&
			row2 < this.grid.size &&
			col2 >= 0 &&
			col2 < this.grid.size
		) {
			this.grid.set(row, col, new FlowCell(CellType.Endpoint, color));
			this.grid.set(row2, col2, new FlowCell(CellType.Endpoint, color));
		}
	}
	// verifica si se puede conectar dos celdas adyacentes
	getCellFromMouse(
		mouseX: number,
		mouseY: number,
		canvasWidth: number,
		canvasHeight: number,
	) {
		return this.grid.getCellFromPosition(
			mouseX,
			mouseY,
			canvasWidth,
			canvasHeight,
		);
	}
	canConnect(
		fromRow: number,
		fromCol: number,
		toRow: number,
		toCol: number,
	): boolean {
		if (
			Math.abs(fromRow - toRow) + Math.abs(fromCol - toCol) !== 1 ||
			toRow < 0 ||
			toRow >= this.grid.size ||
			toCol < 0 ||
			toCol >= this.grid.size
		) {
			return false;
		}

		const targetCell = this.grid.get(toRow, toCol);
		const fromCell = this.grid.get(fromRow, fromCol);

		if (
			targetCell.color === fromCell.color &&
			targetCell.type === CellType.Endpoint
		) {
			// de pronto puede fallar, q opinan?
			return true;
		}

		return targetCell.type === CellType.Empty;
	}

	moveTo(fromRow: number, fromCol: number, toRow: number, toCol: number) {
		if (this.canConnect(fromRow, fromCol, toRow, toCol)) {
			const fromCell = this.grid.get(fromRow, fromCol);

			if (this.grid.get(toRow, toCol).type === CellType.Empty) {
				this.grid.set(
					toRow,
					toCol,
					new FlowCell(CellType.Path, fromCell.color),
				);
			}

			if (
				this.grid.get(toRow, toCol).type === CellType.Endpoint &&
				this.grid.get(toRow, toCol).color === fromCell.color
			) {
				this.grid.saveTimeline();
			}
		}
	}

	getGrid() {
		return this.grid;
	}

	draw(p: p5) {
		this.grid.draw(p, {
			bottom: p.height,
			top: 0,
			left: 0,
			right: p.width,
		});
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
let game = new Game(5);

class GamePage extends Page {
	draw(p: p5) {
		p.clear();
		game.draw(p);
	}
	mouseClicked(p: p5) {
		const target = game.getCellFromMouse(p.mouseX, p.mouseY, p.width, p.height);

		if (!target) return;

		const { row, col } = target;
		const cell = game.getGrid().get(row, col);

		if (cell.type === CellType.Empty) {
			// Empty a Path
			game.getGrid().set(row, col, new FlowCell(CellType.Path, cell.color));
		} else if (cell.type === CellType.Path) {
			// Path a Empty
			game.getGrid().set(row, col, new FlowCell(CellType.Empty, cell.color));
		}

		p.redraw(); // Redibujar tras el cambio
	}
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
	row: number;
	col: number;
	row2: number;
	col2: number;
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
			{ row: 0, col: 0, row2: 3, col2: 0, color: themeColors.green },
			{ row: 0, col: 3, row2: 3, col2: 3, color: themeColors.blue },
			{ row: 1, col: 1, row2: 2, col2: 2, color: themeColors.red },
		],
	},

	{
		size: 5,
		endpoints: [
			{ row: 0, col: 0, row2: 4, col2: 4, color: themeColors.blue },
			{ row: 0, col: 4, row2: 4, col2: 0, color: themeColors.yellow },
			{ row: 1, col: 2, row2: 3, col2: 2, color: themeColors.red },
			{ row: 2, col: 1, row2: 2, col2: 3, color: themeColors.green },
		],
	},

	{
		size: 6,
		endpoints: [
			{ row: 0, col: 0, row2: 5, col2: 1, color: themeColors.red },
			{ row: 0, col: 5, row2: 4, col2: 5, color: themeColors.blue },
			{ row: 1, col: 2, row2: 4, col2: 2, color: themeColors.green },
			{ row: 2, col: 3, row2: 5, col2: 4, color: themeColors.yellow },
			{ row: 1, col: 4, row2: 3, col2: 5, color: themeColors.orange },
		],
	},
];

// Inicializar el bosquejo p5
const canvasParent = document.getElementById("canvas-container");
if (!canvasParent) {
	throw new Error();
}

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
