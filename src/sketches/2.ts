import p5 from "p5";
import "p5.quadrille";
import targetDimensions from "../dimensions";

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

/**
 * Visual
 *
 * Esta sección se encarga de representar el estado del juego en la pantalla.
 */

/**
 * Función de dibujo
 */
function draw(p: p5) {
	const grid = game.getGrid();
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
		public row: number,
		public col: number,
		public type: cellType = cellType.EMPTY,
		public color: string | null = null,
	) {}
}

//clase para crear la grid, recibir endpoints y manejar la lógica del juego
class Game {
	grid: FlowCell[][] = [];
	size: number;

	constructor(size: number) {
		this.size = size;
		this.initMatrix();
	}
	//inicializa la matriz con celdas vacías
	initMatrix() {
		this.grid = [];
		for (let r = 0; r < this.size; r++) {
			const row: FlowCell[] = [];
			for (let c = 0; c < this.size; c++) {
				row.push(new FlowCell(r, c));
			}
			this.grid.push(row);
		}
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
			row < this.size &&
			col >= 0 &&
			col < this.size &&
			row2 >= 0 &&
			row2 < this.size &&
			col2 >= 0 &&
			col2 < this.size
		) {
			const cell = this.grid[row][col];
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
		} //bro, recuerda que necesitas copiar bien la grid para timelines
		//ademas, mira gemini para ver las dos opciones
	}

	getGrid() {}
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
}




