export function notFound(): never {
  throw new Error('This archive entry could not be found in this test build.');
}
