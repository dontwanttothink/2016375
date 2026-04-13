import p5 from "p5";
import targetDimensions from "../dimensions";

// Estado
// (nada)

// Configuración del lienzo
function setup(p: p5) {
	const [width, height] = targetDimensions();
	p.createCanvas(width, height);
}
function windowResized(p: p5) {
	const [width, height] = targetDimensions();
	p.resizeCanvas(width, height);
}

// Dibujo (cada fotograma)
function draw(p: p5) {
	p.background(100);
	p.fill(105);
	p.ellipse(p.width / 2, p.height / 2, 200, 200);

	handleInput(p);
}

// Responder a las entradas
function handleInput(_: p5) {}

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
