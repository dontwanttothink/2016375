import p5 from 'p5';
import 'p5.quadrille';
import targetDimensions from "../dimensions";

declare const createQuadrille: any;
declare const drawQuadrille: any;
declare const Quadrille: any;

const x = 'X';
const o = 'O';
const cols = 4;
const rows = 4;

let game1: any, game2: any;
let patterns1: any[] = [];
let patterns2: any[] = [];
let winner: string | undefined;

const canvasParent = document.getElementById("canvas-container");
if (!canvasParent) throw new Error();

new p5(function (p: p5) {
	p.setup = function () {
		// p5.quadrille v3 necesita cellLength antes de crear el canvas
		(p as any).Quadrille = (window as any).Quadrille;
		(window as any).Quadrille.cellLength = 100;

		const [w, h] = targetDimensions();
		p.createCanvas(w, h);
		p.textAlign(p.CENTER, p.CENTER);

		resetGame(p);

		const resetBtn = p.createButton('Reset');
		resetBtn.parent(canvasParent);
		resetBtn.mousePressed(() => resetGame(p));

		const win1 = (p as any).createQuadrille([
			[x],
			[null, x],
			[null, null, x],
			[null, null, null, x]
		]);
		const win2 = (p as any).createQuadrille([[x, x, x, x]]);

		patterns1.push(win1, win2, win1.clone().reflect(), win2.clone().transpose());

		const win3 = win1.clone().replace(x, o);
		const win4 = win2.clone().replace(x, o);
		patterns2.push(win3, win4, win3.clone().reflect(), win4.clone().transpose());
	};

	p.draw = function () {
		p.background(220);
		(p as any).drawQuadrille(game1);
		(p as any).drawQuadrille(game2);

		if (winner) {
			p.textSize(32);
			p.text(`${winner} ganó!!`, p.width / 2, p.height / 2);
			p.noLoop();
		}
	};

	p.mousePressed = function () {
		if (winner) return;

		const current = game1.order <= game2.order ? game1 : game2;
		const row = current.mouseRow;
		const col = current.mouseCol;
		const opponent = current === game1 ? game2 : game1;

		if (
			current.isValid(row, col) &&
			current.isEmpty(row, col) &&
			opponent.isEmpty(row, col)
		) {
			const symbol = current === game1 ? x : o;
			current.fill(row, col, symbol);
			winner = winGame();
			if (!winner && game1.order + game2.order === cols * rows) {
				resetGame(p);
			}
		}
	};

	p.windowResized = function () {
		const [w, h] = targetDimensions();
		p.resizeCanvas(w, h);
	};
}, canvasParent);

function resetGame(p: p5) {
	game1 = (p as any).createQuadrille(cols, rows);
	game2 = (p as any).createQuadrille(cols, rows);
	winner = undefined;
	p.loop();
}

function winGame(): string | undefined {
	if (patterns1.some(pat => game1.search(pat, false).length > 0)) return 'Player 1';
	if (patterns2.some(pat => game2.search(pat, false).length > 0)) return 'Player 2';
	return undefined;
}