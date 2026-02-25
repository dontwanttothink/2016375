import type p5 from "p5";

/**
 * El tipo de una función que se puede usar para cambiar la página actual.
 */
type SwitchPageFunction = (p: p5, id: string) => void;

/**
 * El tipo de una función que se puede usar para obtener una página.
 */
type PageConstructor = new (switchPage: SwitchPageFunction) => Page;

/**
 * Una página cualquiera, como la página de bienvenida con el botón
 * de jugar, o la página del juego con la matriz.
 *
 * Una página está compuesta de dos cosas fundamentales:
 * - un identificador, que puede ser una cadena cualquiera, como `"welcome"`
 * - una función (método), `draw`, que dibuja la página
 *
 * Hay cuatro funciones (métodos) adicionales que una página puede tener:
 * - `preload`, (TODO)
 * - `setup`, (TODO)
 * - `mouseClicked`, que se ejecuta cuando el usuario oprime el botón
 * del ratón
 * - `keyPressed`, que se ejecuta cuando el usuario oprime una tecla.
 *
 * Las páginas tienen acceso a una función, `this.switchPage(p: p5, id: string)`
 * para cambiar la página actual a otra. Por ejemplo, la página de
 * bienvenida puede usar esta función para activar la página del juego
 * cuando el usuario hace click en el botón de jugar.
 */
export abstract class Page {
	abstract id: string;

	/**
	 * Cambia la página actual. Esta función recibe un identificador.
	 * El programa se encarga de mostrar la página con el identificador
	 * suministrado en el siguiente fotograma.
	 */
	switchPage: SwitchPageFunction;

	constructor(switchPage: SwitchPageFunction) {
		this.switchPage = switchPage;
	}

	abstract draw(p: p5): void;

	async preload(_p: p5) {}
	setup(_p: p5): void {}

	mouseClicked(_p: p5) {}
	keyPressed(_p: p5) {}
}

/**
 * Un objeto que maneja las distintas páginas y se mantiene al tanto
 * de cuál es la actual.
 */
export class Navigator {
	#pages: Map<string, Page> = new Map();
	#currentPage: Page;

	#preloadCompleted = false;

	constructor(
		InitialPage: PageConstructor,
		otherConstructors: PageConstructor[],
	) {
		const initialPage = new InitialPage(this.switchPage.bind(this));
		this.#pages.set(initialPage.id, initialPage);
		this.#currentPage = initialPage;

		for (const PageConstructor of otherConstructors) {
			const page = new PageConstructor(this.switchPage.bind(this));
			this.#pages.set(page.id, page);
		}
	}

	async setup(p: p5) {
		await Promise.all([...this.#pages.values()].map((page) => page.preload(p)));
		p.push();
		this.#currentPage.setup(p);
		this.#preloadCompleted = true;
	}

	/**
	 * Permite cambiar la página actual.
	 */
	switchPage(p: p5, id: string) {
		p.pop();
		p.push();

		const page = this.#pages.get(id);
		if (!page) {
			throw new ReferenceError(`Se especificó un ID de página inválido: ${id}`);
		}

		page.setup(p);
		this.#currentPage = page;
	}

	/**
	 * Permite cambiar la página actual sin aislar el
	 * estado de dibujo.
	 */
	overridePage(id: string) {
		const page = this.#pages.get(id);
		if (!page) {
			throw new ReferenceError(`Se especificó un ID de página inválido: ${id}`);
		}

		this.#currentPage = page;
	}

	get currentPage() {
		if (this.#preloadCompleted) {
			return this.#currentPage;
		}
		throw new Error(
			"La página actual no está disponible hasta que `.setup(p)` haya terminado su ejecución por completo.",
		);
	}

	get currentPageID() {
		return this.#currentPage.id;
	}
}
