/**
 * Utilitário de congelamento/selamento recursivo de objetos.
 *
 * `deepFreeze` torna o grafo inteiro imutável — nenhuma propriedade pode
 * ser adicionada, removida ou reatribuída em qualquer nível.
 *
 * `deepSeal` impede adição/remoção de propriedades em todo o grafo,
 * mas permite reatribuição de valores existentes.
 */

/**
 * Recursively applies `Object.freeze` to {@link target} and every reachable
 * nested object/array.  Primitives and already-frozen nodes are skipped.
 *
 * @returns The same reference, now deeply frozen.
 */
export function deepFreeze<T>(target: T): T {
  if (target === null || target === undefined) return target;
  if (typeof target !== "object" && typeof target !== "function") return target;

  if (Object.isFrozen(target)) return target;
  Object.freeze(target);

  const values: unknown[] =
    Array.isArray(target)
      ? (target as unknown[])
      : Object.values(target as Record<string, unknown>);

  for (const value of values) deepFreeze(value);

  return target;
}

/**
 * Recursively applies `Object.seal` to {@link target} and every reachable
 * nested object/array.  Existing properties remain writable, but no
 * properties can be added or removed at any depth.
 *
 * @returns The same reference, now deeply sealed.
 */
export function deepSeal<T>(target: T): T {
  if (target === null || target === undefined) return target;
  if (typeof target !== "object" && typeof target !== "function") return target;

  if (Object.isSealed(target)) return target;
  Object.seal(target);

  const values: unknown[] =
    Array.isArray(target)
      ? (target as unknown[])
      : Object.values(target as Record<string, unknown>);

  for (const value of values) deepSeal(value);

  return target;
}
