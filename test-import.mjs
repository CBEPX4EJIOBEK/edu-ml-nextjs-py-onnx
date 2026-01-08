import * as ort from './node_modules/onnxruntime-web/dist/index.mjs';
console.log('Has InferenceSession:', typeof ort.InferenceSession);
console.log('Has default:', typeof ort.default);
if (ort.default) {
  console.log('Default has InferenceSession:', typeof ort.default.InferenceSession);
}
console.log('Keys:', Object.keys(ort).slice(0, 10));
