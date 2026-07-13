export function expect<T>(x: T, msg?: string): NonNullable<T> {
	if (x === null || x === undefined) {
		throw new Error(msg ?? "expected non-null value");
	}
	return x;
}

/**
 * Esta clase solo es necesaria porque JavaScript siempre está siendo saboteado: https://github.com/tc39/proposal-record-tuple
 */
export class IntegerPairMap<T> {
	#data: Map<string, T> = new Map();

	static #intoKey(pair: [number, number]) {
		return pair.map((n) => n.toString(36)).join(":");
	}

	static #intoPair(key: string) {
		return key.split(":").map((s) => parseInt(s, 36)) as [number, number];
	}

	get size() {
		return this.#data.size;
	}

	get(key: [number, number]) {
		if (!key.every((n) => Number.isSafeInteger(n))) {
			throw new TypeError();
		}

		return this.#data.get(IntegerPairMap.#intoKey(key));
	}

	has(key: [number, number]) {
		return this.#data.has(IntegerPairMap.#intoKey(key));
	}

	set(key: [number, number], value: T) {
		if (!key.every((n) => Number.isSafeInteger(n))) {
			throw new TypeError();
		}

		this.#data.set(IntegerPairMap.#intoKey(key), value);
		return this;
	}

	delete(key: [number, number]) {
		if (!key.every((n) => Number.isSafeInteger(n))) {
			throw new TypeError();
		}

		return this.#data.delete(IntegerPairMap.#intoKey(key));
	}

	getOrInsert(key: [number, number], or: T) {
		if (!key.every((n) => Number.isSafeInteger(n))) {
			throw new TypeError();
		}
		return this.#data.getOrInsert(IntegerPairMap.#intoKey(key), or);
	}

	entries() {
		return this.#data
			.entries()
			.map(([k, v]): [[number, number], T] => [IntegerPairMap.#intoPair(k), v]);
	}

	*[Symbol.iterator]() {
		for (const entry of this.entries()) {
			yield entry;
		}
	}
}
