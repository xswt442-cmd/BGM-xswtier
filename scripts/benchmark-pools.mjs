import { performance } from 'node:perf_hooks';

const SIZE = 500;
const ROUNDS = 5;
const BUDGET_MS = 50;
const items = Array.from({ length: SIZE }, (_, index) => ({ id: `subject:${index}`, name: `Subject ${index}` }));
const incoming = [...items.slice(SIZE / 2), ...Array.from({ length: SIZE / 2 }, (_, index) => ({ id: `fresh:${index}` }))];
const removed = new Set(items.filter((_, index) => index % 3 === 0).map((item) => item.id));

const benchmarks = {
	dedupe() {
		const ids = new Set(items.map((item) => item.id));
		return incoming.filter((item) => !ids.has(item.id));
	},
	difference() {
		return items.filter((item) => !removed.has(item.id));
	},
	filter() {
		return items.filter((_, index) => index % 2 === 0);
	}
};

const medians = {};
for (const [name, operation] of Object.entries(benchmarks)) {
	const samples = [];
	for (let round = 0; round < ROUNDS; round += 1) {
		const start = performance.now();
		operation();
		samples.push(performance.now() - start);
	}
	samples.sort((a, b) => a - b);
	medians[name] = samples[Math.floor(samples.length / 2)];
}

console.log(`Pool compute benchmark (${SIZE} items, ${ROUNDS} rounds)`);
for (const [name, median] of Object.entries(medians)) console.log(`${name}: ${median.toFixed(3)}ms median`);

const slow = Object.entries(medians).filter(([, median]) => median > BUDGET_MS);
if (slow.length > 0) {
	console.error(`Worker threshold exceeded (${BUDGET_MS}ms): ${slow.map(([name]) => name).join(', ')}`);
	process.exitCode = 1;
} else {
	console.log(`Worker not required: all pure computations are under ${BUDGET_MS}ms.`);
}
