import p5 from "p5";
import "p5.quadrille";
import Quadrille from "p5.quadrille";
import targetDimensions from "../dimensions";

// Utilidades
const cellLength = (p: p5) => Math.min(p.height / ROWS, p.width / COLS) - 3;

// Constantes
const COLS = 7;
const ROWS = 6;

// Estado
let game: Quadrille;
let ganó = false; // usado solo por economía

let últimaInteracción: number = -Infinity; // usado para las animaciones

// Configuración del lienzo
function setup(p: p5) {
	p.createCanvas(...targetDimensions());

	game = p.createQuadrille(COLS, ROWS);
}

function windowResized(p: p5) {
	p.resizeCanvas(...targetDimensions());
}

// Dibujo (cada fotograma)
function draw(p: p5) {
	p.clear();

	// Calcular el tamaño que queremos dar a la cuadrícula.
	const cl = cellLength(p);
	const ancho = cl * COLS;
	const alto = cl * ROWS;

	// Dibujar la cuadrícula en el centro.
	p.drawQuadrille(game, {
		outline: p.color(200),
		cellLength: cl,
		x: p.width / 2 - ancho / 2,
		y: p.height / 2 - alto / 2,
	});

	// Establecer el estilo del cursor
	const pos: [number, number] = [
		game.screenRow(p.mouseY),
		game.screenCol(p.mouseX),
	];
	if (game.isValid(...pos)) {
		p.cursor(p.HAND);
	} else {
		p.cursor(p.ARROW);
	}

	if (game.order === 0) {
		// Una animación sutil para cuando inicia una nueva partida.
		const progreso = p.constrain(
			1 - (p.millis() - últimaInteracción) / 500,
			0,
			1,
		);
		p.noStroke();
		p.fill(p.color(255, progreso * 230));
		p.rect(0, 0, p.width, p.height);
	} else if (ganó || game.order === game.size) {
		// El juego acabó.
		p.cursor(p.HAND);

		const tamañoAnuncio = 32;
		const tamañoInstrucción = 16;

		const instrucción = "Haz clic en cualquier parte para volver a jugar.";
		const anuncio = ganó
			? `¡${game.order % 2 === 0 ? "Azul" : "Rojo"} ganó!`
			: "¡Empate!";

		const progreso = p.constrain((p.millis() - últimaInteracción) / 500, 0, 1);

		// Dibujamos un rectángulo blanco translúcido para traer la atención al
		// mensaje.
		p.noStroke();
		p.fill(p.color(255, progreso * 230));
		p.rect(0, 0, p.width, p.height);

		p.fill(p.color(0, progreso * 255));
		p.textFont("system-ui, sans-serif");

		// Dibujamos el mensaje.
		p.textSize(tamañoAnuncio);
		p.textAlign(p.CENTER, p.BOTTOM);
		p.text(anuncio, p.width / 2, p.height / 2 - 10);

		p.textSize(tamañoInstrucción);
		p.textAlign(p.CENTER, p.TOP);
		p.text(instrucción, p.width / 2, p.height / 2);
	}
}

class Ficha {
	esRoja: boolean;
	p: p5;

	#velocity: number = 10;
	#delta: number | null = null;

	constructor(roja: boolean, p: p5) {
		this.esRoja = roja;
		this.p = p;
	}

	#tick(row: number) {
		if (this.#delta === null) {
			this.#delta = cellLength(this.p) * (row + 1);
		} else {
			this.#delta -= this.#velocity;
			if (this.#delta < 0) {
				this.#velocity *= -0.5;
				this.#delta = 0;
			}
		}
		this.#velocity += 2;
		return this.#delta;
	}

	display({ row }: { row: number }) {
		const d = this.#tick(row);

		const color = this.esRoja ? this.p.color("red") : this.p.color("blue");

		const MARGEN = 7;
		this.p.ellipseMode(this.p.CORNER);
		this.p.stroke(80);
		this.p.strokeWeight(2);
		this.p.fill(color);
		this.p.circle(MARGEN, MARGEN - d, cellLength(this.p) - MARGEN * 2);
	}
}

// Interactividad
function mouseClicked(p: p5) {
	if (ganó || game.order === game.size) {
		// Si el juego ya se acabó, empezamos uno nuevo cuando el usuario hace
		// click.

		if (p.millis() - últimaInteracción > 1000) {
			// Ignoramos los clicks por un segundo después de que el juego
			// termina porque podrían ser accidentales.

			últimaInteracción = p.millis();
			ganó = false;
			game.clear();
		}

		return;
	}

	const col = game.screenCol(p.mouseX);
	if (!game.isValid(0, col)) {
		return;
	}

	// Podemos inferir el turno correcto a partir del número de fichas que ya
	// se han agregado.
	const ficha = new Ficha(game.order % 2 === 0, p);

	// Buscamos la celda libre que esté más hacia abajo dentro de esta columna.
	for (let i = ROWS - 1; i >= 0; --i) {
		if (game.isEmpty(i, col)) {
			game.fill(i, col, ficha);
			break;
		}
	}

	ganó = estadoGanador(p);
	últimaInteracción = p.millis();
}

function estadoGanador(p: p5) {
	const horizontal = p.createQuadrille(["rojo", "rojo", "rojo", "rojo"]);
	const diagonal = p.createQuadrille([
		["rojo"],
		[null, "rojo"],
		[null, null, "rojo"],
		[null, null, null, "rojo"],
	]);

	const patrones = [
		horizontal,
		diagonal,
		diagonal.clone().reflect(),
		horizontal.clone().transpose(),
	];
	patrones.push(...patrones.map((p) => p.clone().replace("rojo", "azul")));

	return patrones.some(
		// Para verificar si alguien ganó, temporalmente creamos una cuadrícula
		// simplificada. Las `Fichas` se reemplazan por "rojo" y "azul" según
		// corresponde. La razón es que JavaScript no considera que ninguna
		// Ficha sea igual a otra. Dos Objetos solo son iguales si corresponden
		// a la misma posición en memoria.

		(patrón) =>
			game
				.clone()
				.replace(
					Quadrille.factory(({ row, col }: { row: number; col: number }) =>
						game.read(row, col).esRoja ? "rojo" : "azul",
					),
				)
				.search(patrón, true).length > 0,
	);
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
	p.mouseClicked = () => mouseClicked(p);
}, canvasParent);
