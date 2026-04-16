/**
 * @returns Un tamaño mínimo, o las coordenadas más grandes posibles para el lienzo sin exceder
 * el tamaño de la ventana.
 */
export default function targetDimensions(): [number, number] {
	const MIN_WIDTH = 200;
	const MAX_WIDTH = 1000;
	const MIN_HEIGHT = 200;
	const MAX_HEIGHT = 1000;

	const main = document.getElementsByTagName("main")[0];
	const body = document.getElementsByTagName("body")[0];
	const canvasContainer = document.getElementById("canvas-container");

	if (!main || !body || !canvasContainer) {
		throw new Error();
	}

	const availableWidth = main.clientWidth;
	const availableHeight =
		window.innerHeight - (body.scrollHeight - canvasContainer.scrollHeight);

	return [
		Math.max(Math.min(availableWidth, MAX_WIDTH), MIN_WIDTH),
		Math.max(Math.min(availableHeight, MAX_HEIGHT), MIN_HEIGHT),
	];
}
