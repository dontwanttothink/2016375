import p5 from "p5";
import "p5.quadrille";
import targetDimensions from "../dimensions";

interface ThemeColors {
	foreground: p5.Color;
}

function getThemeColors(p: p5): ThemeColors {
	const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
	return {
		foreground: isDark ? p.color("white") : p.color("black"),
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
	timeline = [game.grid];
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

	get(row: number, col: number){
		return this.grid[row][col]
	}

	draw(p: p5, container: Rectangle) {
		const containerWidth = container.right - container.left;
		const containerHeight = container.bottom - container.top;

		const vertexLength = Math.min(containerWidth, containerHeight) - 10;
		const originX = container.left + (containerWidth - vertexLength) / 2;
		const originY = container.top + (containerHeight - vertexLength) / 2;

		p.noFill();
		p.stroke(getThemeColors(p).foreground);
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
			const cell = this.grid.get(row, col);
			const cell2 = this.grid[row2][col2];
			if (cell.type === cellType.EMPTY && cell2.type === cellType.EMPTY) {
				cell.type = cellType.ENDPOINT;
				cell2.type = cellType.ENDPOINT;
				cell.color = color;
				cell2.color = color;
			}
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
}

/**
 * Transiciones
 *
 * Esta sección se encarga de la lógica entre partidas. Por ejemplo, iniciar
 * un nuevo nivel cuando el usuario gana.
 */
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
			timeline.push(game.grid);
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

/**
 * Función de dibujo
 */
function draw(p: p5) {
	p.clear();
	game.draw(p, {
		top: 0,
		bottom: p.height,
		left: 0,
		right: p.width,
	});
}

// Configuración del lienzo
function setup(p: p5) {
	const [width, height] = targetDimensions();
	p.createCanvas(width, height);
}
function windowResized(p: p5) {
	const [width, height] = targetDimensions();
	p.resizeCanvas(width, height);
}

// Inicializar el bosquejo p5
const canvasParent = document.getElementById("canvas-container");
if (!canvasParent) {
	throw new Error();
}

new p5((p) => {
	p.setup = () => setup(p);
	p.draw = () => draw(p);
	p.windowResized = () => windowResized(p);
}, canvasParent);
