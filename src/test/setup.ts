import "@testing-library/jest-dom";

// Minimal ResizeObserver polyfill for jsdom tests
class RO {
	private cb: ResizeObserverCallback;
	constructor(cb: ResizeObserverCallback) {
		this.cb = cb;
	}
	observe(target: Element) {
		// fire once synchronously to approximate initial measure
		const entry = [{ target } as ResizeObserverEntry] as unknown as ResizeObserverEntry[];
		this.cb(entry, this as unknown as ResizeObserver);
	}
	// No-op for tests (non-empty to satisfy lint)
	unobserve(): void {
		return;
	}
	disconnect(): void {
		return;
	}
}

	declare global {
		var ResizeObserver: {
			new (cb: ResizeObserverCallback): ResizeObserver;
			prototype: ResizeObserver;
		};
	}

	if (typeof globalThis.ResizeObserver === "undefined") {
		globalThis.ResizeObserver = RO as unknown as typeof ResizeObserver;
	}
