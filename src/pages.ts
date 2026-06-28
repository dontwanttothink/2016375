import type p5 from "p5";
import targetDimensions from "./dimensions";

function expect<T>(x: T, msg?: string): NonNullable<T> {
	if (x === null || x === undefined) {
		throw new Error(msg ?? "expected non-null value");
	}
	return x;
}

/**
 * Un objeto de argumentos posible para pasar a una página.
 */
type PageArgs = Record<string, unknown> | undefined;

/**
 * El tipo de una función que se puede usar para obtener una página.
 */
type PageConstructor<
	T extends PageArgs = PageArgs,
	P extends Page<T> = Page<T>,
> = new (navigator: Navigator) => P;

/**
 * Una página cualquiera, como la página de bienvenida con el botón
 * de jugar, o la página del juego con la matriz.
 *
 * Una página está compuesta de una cosa fundamental:
 * - una función (método), `draw`, que dibuja la página
 *
 * Hay otras funciones (métodos) adicionales que una página puede tener:
 * - `preload`, que se ejecuta inmediatamente cuando el proyecto empieza.
 * Esta función debe ser asincrónica y se puede usar, por ejemplo, para
 * cargar imágenes. Ninguna página empieza a dibujarse hasta que todas
 * las funciones `preload` hayan terminado.
 * - `setup`, que se ejecuta cuando la página se convierte en la
 * página actual. La página no empieza a dibujarse hasta que su `setup`
 * se haya ejecutado. Esta función no puede ser asincrónica.
 * - `mouseClicked`, que se ejecuta cuando el usuario oprime el botón
 * del ratón.
 * - `keyPressed`, que se ejecuta cuando el usuario oprime una tecla.
 * - una variedad de métodos similares a `mouseClicked` y `keyPressed` que
 * comparten su nombre y comportamiento con sus análogos de p5.
 *
 * Las páginas tienen acceso al objeto de navegación. Pueden usar
 * `this.navigator.switchPage(p: p5, id: string)`
 * para cambiar la página actual a otra. Por ejemplo, la página de
 * bienvenida puede usar esta función para activar la página del juego
 * cuando el usuario hace clic en el botón de jugar.
 *
 * Excepto por `preload`, solo se ejecutan métodos de la página actual.
 * Las otras páginas se mantienen en espera.
 */
export abstract class Page<TArgs extends PageArgs = undefined> {
	/**
	 * Un objeto que se puede usar para cambiar la página actual.
	 */
	navigator: Navigator;

	constructor(navigator: Navigator) {
		this.navigator = navigator;
	}

	abstract draw(p: p5): void;

	async preload(_p: p5) {}
	receive(_args: TArgs) {}
	setup(_p: p5): void {}

	mouseClicked(_p: p5, _event: MouseEvent) {}
	mousePressed(_p: p5, _event: MouseEvent) {}
	mouseReleased(_p: p5, _event: MouseEvent) {}
	mouseDragged(_p: p5, _event: MouseEvent) {}
	keyPressed(_p: p5, _event: KeyboardEvent) {}
}

/**
 * Un objeto que maneja las distintas páginas y se mantiene al tanto
 * de cuál es la actual.
 */
export class Navigator {
	#pages: Map<PageConstructor, Page<PageArgs>> = new Map();
	#currentPage: Page<PageArgs>;

	#preloadCompleted = false;

	constructor(
		InitialPage: PageConstructor,
		otherConstructors: PageConstructor[],
	) {
		const initialPage = new InitialPage(this);
		this.#pages.set(InitialPage, initialPage);
		this.#currentPage = initialPage;

		for (const PageConstructor of otherConstructors) {
			const page = new PageConstructor(this);
			this.#pages.set(PageConstructor, page);
		}
	}

	/**
	 * @deprecated
	 */
	async setup(p: p5) {
		return await this.#setup(p);
	}

	async #setup(p: p5) {
		await Promise.all([...this.#pages.values()].map((page) => page.preload(p)));
		p.push();
		this.#currentPage.setup(p);
		this.#preloadCompleted = true;
	}

	/**
	 * Permite cambiar la página actual.
	 */
	switchPage<P extends Page<undefined>>(
		p: p5,
		Constructor: PageConstructor<undefined, P>,
	): void;
	switchPage<T extends Record<string, unknown>>(
		p: p5,
		Constructor: PageConstructor<T>,
		args: T,
	): void;

	switchPage<T extends PageArgs, P extends Page<T>>(
		p: p5,
		PageConstructor: PageConstructor<T, P>,
		args?: T,
	): void {
		p.pop();
		p.push();

		const page = this.#pages.get(PageConstructor) as P | undefined;
		if (!page) {
			throw new ReferenceError(
				`Se especificó una página sin registrar: ${PageConstructor.name}`,
			);
		}

		page.receive(args as T);
		page.setup(p);
		this.#currentPage = page;
	}

	/**
	 * @deprecated
	 */
	get currentPage() {
		return this.#getCurrentPage();
	}

	#getCurrentPage() {
		if (this.#preloadCompleted) {
			return this.#currentPage;
		}
		throw new Error(
			"La página actual no está disponible hasta que `.setup(p)` haya terminado su ejecución por completo.",
		);
	}

	get sketch() {
		return (p: p5) => {
			p.setup = async () => {
				const [width, height] = targetDimensions();
				p.createCanvas(width, height);

				await this.#setup(p);
			};

			p.draw = () => {
				p.clear();
				this.#currentPage.draw(p);
			};

			p.keyPressed = (event) => {
				this.#currentPage.keyPressed(p, expect(event));
			};

			p.windowResized = () => {
				const [width, height] = targetDimensions();
				p.resizeCanvas(width, height);
			};

			p.mouseClicked = (event) => {
				this.#currentPage.mouseClicked(p, expect(event));
			};

			p.mouseDragged = (event) => {
				this.#currentPage.mouseDragged(p, expect(event));
			};

			p.mouseReleased = (event) => {
				this.#currentPage.mouseReleased(p, expect(event));
			};

			p.mousePressed = (event) => {
				this.#currentPage.mousePressed(p, expect(event));
			};
		};
	}

	// Las siguientes funciones son utilizadas para la restauración de estado de
	// Vite.

	/**
	 * Intenta obtener un nombre para la clase que corresponde a
	 * la página actual. Solo debe ser usado para el desarrollo.
	 */
	get currentPageName(): string {
		return this.#currentPage.constructor.name;
	}

	/**
	 * Permite cambiar la página actual sin aislar el
	 * estado de dibujo. Solo debe ser usado para el desarrollo.
	 */
	overridePage(name: string, args?: PageArgs) {
		const result = this.#pages.entries().find(([c]) => c.name === name);
		if (result) {
			const [_Page, page] = result;
			page.receive(args);
			this.#currentPage = page;
		}
	}
}
