import p5 from "p5";
import "p5.quadrille";
import targetDimensions from "../dimensions";
import { Navigator, Page } from "../pages";

function isDark() {
	return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function randomThemeColor(p: p5): () => p5.Color {
	const hue = p.random(360);
	return themeColor(p, hue);
}

function themeColor(p: p5, hue: number) {
	// Constantes escogidas usando https://oklch.com/ :)
	const lightness = 0.65;
	const chroma = 0.212;

	return () => p.color(`oklch(${lightness} ${chroma} ${hue})`);
}

function themeColors(p: p5) {
	return {
		foreground: isDark() ? p.color(200) : p.color(105),
	};
}

interface Rectangle {
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
enum cellType {
	EMPTY,
	ENDPOINT,
	PATH,
}
let timeline = [];
let timelineIndex = 0;

//reset
function resetGame(p: p5) {
	const game = new Game(5);
	game.initMatrix();
	timeline = [Grid.g];
	timelineIndex = 0;
	const winner = undefined;
	p.loop();
}

//clase para representar cada celda del tablero
class FlowCell {
	constructor(
		public readonly type: cellType = cellType.EMPTY,
		public readonly color: string | null = null,
	) {}

	draw(p: p5) {}
}

class Grid {
	grid: FlowCell[][] = [];
	size: number;

	constructor(size: number) {
		this.size = size;
		//inicializa la matriz con celdas vacías
		this.grid = [];
		for (let r = 0; r < this.size; r++) {
			const row: FlowCell[] = [];
			for (let c = 0; c < this.size; c++) {
				row.push(new FlowCell());
			}
			this.grid.push(row);
		}
	}

	get(row: number, col: number) {
		return this.grid[row][col];
	}

	set(row: number, col: number, cell: FlowCell) {
		this.grid[row][col] = cell;
	}

	draw(p: p5, container: Rectangle) {
		const containerWidth = container.right - container.left;
		const containerHeight = container.bottom - container.top;

		const vertexLength = Math.min(containerWidth, containerHeight) - 10;
		const originX = container.left + (containerWidth - vertexLength) / 2;
		const originY = container.top + (containerHeight - vertexLength) / 2;

		p.noFill();
		p.stroke(themeColors(p).foreground);
		for (let i = 1; i < this.size; ++i) {
			const y = originY + (vertexLength / this.size) * i;
			p.line(originX, y, originX + vertexLength, y);

			const x = originX + (vertexLength / this.size) * i;
			p.line(x, originY, x, originY + vertexLength);
		}
		p.square(originX, originY, vertexLength, 10);
	}
}

//clase para recibir endpoints y manejar la lógica del juego
class Game {
	grid: Grid;

	constructor(size: number) {
		this.grid = new Grid(size);
	}

	//para añadir los puntos de colores de cada nivel
	setEndpoint(
		row: number,
		col: number,
		row2: number,
		col2: number,
		color: string,
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
			this.grid.set(row, col, new FlowCell(cellType.ENDPOINT, color));
			this.grid.set(row2, col2, new FlowCell(cellType.ENDPOINT, color));
		}
	}
	//verifica si se puede conectar dos celdas adyacentes
	canConnect(
		fromRow: number,
		fromCol: number,
		toRow: number,
		toCol: number,
	): boolean {
		if (
			Math.abs(fromRow - toRow) + Math.abs(fromCol - toCol) !== 1 ||
			toRow < 0 ||
			toRow >= this.size ||
			toCol < 0 ||
			toCol >= this.size
		) {
			return false;
		}
		const targetCell = this.grid[toRow][toCol];
		const fromCell = this.grid[fromRow][fromCol];
		if (
			targetCell.color === fromCell.color &&
			targetCell.type === cellType.ENDPOINT
		) {
			//depronto puede fallar, q opinan?
			return true;
		}
		return targetCell.type === cellType.EMPTY;
	}

	moveTo(fromRow: number, fromCol: number, toRow: number, toCol: number) {
		if (this.canConnect(fromRow, fromCol, toRow, toCol)) {
			timeline.push(this.grid);
			timelineIndex++;
			const fromCell = this.grid[fromRow][fromCol];
			const toCell = this.grid[toRow][toCol];
			if (toCell.type === cellType.EMPTY) {
				toCell.type = cellType.PATH;
				toCell.color = fromCell.color;
			}
			if (
				toCell.type === cellType.ENDPOINT &&
				toCell.color === fromCell.color
			) {
				//victoria
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
class GamePage extends Page {
	draw(p: p5) {
		p.clear();
		game.draw(p);
	}
}

class WelcomePage extends Page {
	draw(p: p5) {
		p.clear();
		p.text("haz click lol", p.width / 2, p.height / 2);
	}

	mouseClicked(p: p5) {
		this.navigator.switchPage(p, GamePage);
	}
}

const navigator = new Navigator(WelcomePage, [GamePage]);
class LevelManager {
	public currentLevelIndex: number = 0;
	public isGameComplete: boolean = false;

	public loadLevel(levelIndex: number): void {
		this.currentLevelIndex = levelIndex;

		//Aquí dejamos como nueva la linea del tiempo
		timeline = [];
		timelineIndex = 0;

		switch (levelIndex) {
			case 0:
				// Nivel 1: Fácil
				game = new Game(4);
				game.setEndpoint(0, 0, 3, 0, "green");
				game.setEndpoint(0, 3, 3, 3, "blue");
				game.setEndpoint(1, 1, 2, 2, "red");
				break;

			case 1:
				// Nivel 2: Medio
				game = new Game(5);
				game.setEndpoint(0, 0, 4, 4, "blue");
				game.setEndpoint(0, 4, 4, 0, "yellow");
				game.setEndpoint(1, 2, 3, 2, "red");
				game.setEndpoint(2, 1, 2, 3, "green");
				break;

			case 2:
				// Nivel 3: Difícil
				game = new Game(6);
				game.setEndpoint(0, 0, 5, 1, "red");
				game.setEndpoint(0, 5, 4, 5, "blue");
				game.setEndpoint(1, 2, 4, 2, "green");
				game.setEndpoint(2, 3, 5, 4, "yellow");
				game.setEndpoint(1, 4, 3, 5, "orange");
				break;

			default:
				this.isGameComplete = true;
				break;
		}

		if (!this.isGameComplete) {
			// timeline.push(game.grid);
		}
	}

	public nextLevel(): void {
		this.loadLevel(this.currentLevelIndex + 1);
	}

	public restartLevel(): void {
		this.loadLevel(this.currentLevelIndex);
	}
}

const levelManager = new LevelManager();

/**
 * Una partida.
 */
let game = new Game(5);

/**
 * Visual
 *
 * Esta sección se encarga de representar el estado del juego en la pantalla.
 */
// Inicializar el bosquejo p5
const canvasParent = document.getElementById("canvas-container");
if (!canvasParent) {
	throw new Error();
}

new p5(navigator.sketch, canvasParent);
