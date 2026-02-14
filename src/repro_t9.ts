
import { T9Engine } from './core/T9Engine';

const engine = new T9Engine();

// sequence removed
console.log("Testing input 'hello' (43556)...");
// 3 (d,e,f) -> e
// 5 (j,k,l) -> l
// 5 (j,k,l) -> l
// 6 (m,n,o) -> o

console.log("Testing input 'hello' (43556)...");
[4, 3, 5, 5, 6].forEach(sign => engine.handleInput(sign));
console.log(`Result: ${engine.getState().currentCandidate}`);
engine.handleInput(11); // Space/Confirm

console.log("Testing input 'amazing' (2629464)...");
[2, 6, 2, 9, 4, 6, 4].forEach(sign => engine.handleInput(sign));
console.log(`Result: ${engine.getState().currentCandidate}`);
engine.handleInput(11);

console.log("Testing input 'ketsuin' (5387846)...");
[5, 3, 8, 7, 8, 4, 6].forEach(sign => engine.handleInput(sign));
console.log(`Result: ${engine.getState().currentCandidate}`);

