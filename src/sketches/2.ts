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
 */

// Dibujo (cada fotograma)
function draw(p: p5) {
	p.background(100);
	p.fill(105);
	p.ellipse(p.width / 2, p.height / 2, 200, 200);
}

/**
 * Interacción del usuario
 */

/**
 * Transiciones
 */

/**
 * Lógica
 */
//tipos de estados para las celdas
enum cellType { EMPTY, ENDPOINT, PATH }

//clase para representar cada celda del tablero
class FlowCell {
	constructor(
	public row : number,
	public col : number,
	public type : cellType = cellType.EMPTY,
	public color :string | null = null
	){
	}
}

//clase para crear la grid, recibir endpoints y manejar la lógica del juego
class Game {
	grid : FlowCell[][] = [];
	size : number

	constructor(size : number){
	this.size = size;
	this.initMatrix();
	}
	//inicializa la matriz con celdas vacías
	initMatrix(){
		this.grid = [];
		for (let r = 0; r < this.size; r++){
			const row : FlowCell[] = [];
			for (let c = 0; c < this.size; c++){
				row.push(new FlowCell(r, c));
			}
			this.grid.push(row);
		}
	}
	//para añadir los puntos de colores de cada nivel
	setEndpoint(row : number, col : number, color : string){
		if (row >= 0 && row < this.size &&col >= 0 && col < this.size){
			const cell = this.grid[row][col]
			if(cell.type === cellType.EMPTY){
				cell.type = cellType.ENDPOINT;
				cell.color = color;}
		}
	}
	//verifica si se puede conectar dos celdas adyacentes
	canConnect(fromRow : number, fromCol : number, toRow : number, toCol : number) : boolean{
		if(Math.abs(fromRow - toRow) + Math.abs(fromCol - toCol) !== 1||
		toRow < 0 || toRow >= this.size || toCol < 0 || toCol >= this.size){
			return false;}
		const targetCell = this.grid[toRow][toCol];
		const fromCell = this.grid[fromRow][fromCol];
		if(targetCell.color === fromCell.color && targetCell.type === cellType.ENDPOINT){//depronto puede fallar, q opinan?
			return true;}
		return targetCell.type === cellType.EMPTY;
	}

}
