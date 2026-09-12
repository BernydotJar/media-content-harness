const errorKey=Symbol.for('media-factory.ProductError.v1')
export const ProductError=globalThis[errorKey]||(globalThis[errorKey]=class ProductError extends Error {
  constructor(code,message,status=400){super(message);this.name='ProductError';this.code=code;this.status=status}
})
export function invariant(condition, code, message, status = 400) { if (!condition) throw new ProductError(code, message, status) }
export function safeId(value, label = 'ID') { invariant(typeof value === 'string' && /^[a-zA-Z0-9][a-zA-Z0-9_-]{0,127}$/.test(value), 'INVALID_ID', label + ' is invalid'); return value }
export function fields(value, allowed) { invariant(value && typeof value === 'object' && !Array.isArray(value), 'INVALID_INPUT', 'Expected an object'); for (const key of Object.keys(value)) invariant(allowed.includes(key), 'INVALID_INPUT', 'Unexpected input field: ' + key); return value }
export function boundedText(value, label, max = 500) { invariant(typeof value === 'string' && value.trim().length > 0 && value.length <= max, 'INVALID_INPUT', label + ' is required and must fit its length limit'); return value.trim() }
