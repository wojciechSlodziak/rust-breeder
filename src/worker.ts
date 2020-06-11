const ctx: Worker = self as any;

ctx.postMessage({ foo: 'foo' });
ctx.addEventListener('message', (event) => console.log('in worker', event));

// let counter = 1;
// while (counter) {
//   if (counter % 5000 === 0) {
//     ctx.postMessage({ counter });
//   }
//   counter++;
// }
