import type p5 from "p5";

/**
 * Una página cualquiera, como la página de bienvenida con el botón
 * de jugar, o la página del juego con la matriz.
 *
 * Una página está compuesta de dos cosas fundamentales:
 * - un identificador, que puede ser una cadena cualquiera, como `"welcome"`
 * - una función (método), `draw`, que dibuja la página
 *
 * Hay dos funciones (métodos) adicionales que una página puede tener:
 * - `mouseClicked`, que se ejecuta cuando el usuario oprime el botón
 * del ratón
 * - `keyPressed`, que se ejecuta cuando el usuario oprime una tecla.
 *
 * Las páginas tienen acceso a una función, `this.switchPage(id: string)`
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
	switchPage: (id: string) => void;

	constructor(switchPage: (id: string) => void) {
		this.switchPage = switchPage;
	}

	abstract draw(p: p5): void;

	/**
	 * Una función que se ejecuta una vez, después de que se
	 * crea el lienzo. Las funciones `setup` de cada página
	 * se ejecutan juntas, y no se vuelven a ejecutar cuando
	 * se cambia la página.
	 *
	 * Si una función `setup` es asincrónica (es decir, si
	 * devuelve una promesa), se empezará a dibujar solo
	 * cuando haya producido su resultado (es decir,
	 * cuando la promesa se resuelva).
	 *
	 * Por ejemplo, si existen dos páginas, A y B, y A es la
	 * página por defecto, una línea de tiempo posible es
	 * la siguiente:
	 *
	 * 1. El usuario abre nuestro proyecto en su navegador.
	 * 2. Se crea el lienzo.
	 * 3. Se ejecuta `A.setup()`
	 * 4. Se ejecuta `B.setup()`
	 * 5. Se empieza a dibujar A.
	 * 6. Se cambia la página a B.
	 * 7. No se ejecuta `B.setup()`. En cambio, directamente
	 *    se empieza a dibujar B.
	 */
	setup(_p: p5): void | Promise<void> {}

	mouseClicked(_p: p5) {}
	keyPressed(_p: p5) {}
}

/**
 * El tipo de una función que se puede usar para obtener una página.
 */
type PageConstructor = new (switchPage: (id: string) => void) => Page;

/**
 * Un objeto que maneja las distintas páginas y se mantiene al tanto
 * de cuál es la actual.
 */
export class Navigator {
	#pages: Map<string, Page> = new Map();
	#currentPage: Page;

	constructor(
		InitialPage: PageConstructor,
		otherConstructors: PageConstructor[],
	) {
		const switchPage = (id: string) => {
			const page = this.#pages.get(id);
			if (!page) {
				throw new Error(`Se especificó un ID de página inválido: ${id}`);
			}

			this.#currentPage = page;
		};

		const initialPage = new InitialPage(switchPage);
		this.#pages.set(initialPage.id, initialPage);
		this.#currentPage = initialPage;

		for (const PageConstructor of otherConstructors) {
			const page = new PageConstructor(switchPage);
			this.#pages.set(page.id, page);
		}
	}

	async setup(p: p5) {
		await Promise.all([...this.#pages.values()].map((page) => page.setup(p)));
	}

	get currentPage() {
		return this.#currentPage;
	}
}
