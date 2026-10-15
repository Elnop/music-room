/** A promise with its resolve exposed, to answer a request when the test decides. */
export function deferred<T>() {
	let resolve!: (value: T) => void;
	const promise = new Promise<T>(r => {
		resolve = r;
	});
	return { promise, resolve };
}
