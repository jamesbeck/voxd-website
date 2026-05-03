type JsonDeltaEntry = {
  path: string;
  before: unknown;
  after: unknown;
};

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isEqual(left: unknown, right: unknown): boolean {
  if (Object.is(left, right)) {
    return true;
  }

  if (Array.isArray(left) && Array.isArray(right)) {
    if (left.length !== right.length) {
      return false;
    }

    return left.every((value, index) => isEqual(value, right[index]));
  }

  if (isPlainObject(left) && isPlainObject(right)) {
    const leftKeys = Object.keys(left);
    const rightKeys = Object.keys(right);

    if (leftKeys.length !== rightKeys.length) {
      return false;
    }

    return leftKeys.every((key) => isEqual(left[key], right[key]));
  }

  return false;
}

function toPathSegment(key: string | number) {
  return typeof key === "number" ? `[${key}]` : `.${key}`;
}

function walkDelta(
  before: unknown,
  after: unknown,
  path: string,
): JsonDeltaEntry[] {
  if (isEqual(before, after)) {
    return [];
  }

  if (Array.isArray(before) && Array.isArray(after)) {
    const maxLength = Math.max(before.length, after.length);
    const entries: JsonDeltaEntry[] = [];

    for (let index = 0; index < maxLength; index += 1) {
      entries.push(
        ...walkDelta(
          before[index],
          after[index],
          `${path}${toPathSegment(index)}`,
        ),
      );
    }

    return entries.length > 0 ? entries : [{ path, before, after }];
  }

  if (isPlainObject(before) && isPlainObject(after)) {
    const keys = new Set([...Object.keys(before), ...Object.keys(after)]);
    const entries: JsonDeltaEntry[] = [];

    for (const key of keys) {
      entries.push(
        ...walkDelta(before[key], after[key], `${path}${toPathSegment(key)}`),
      );
    }

    return entries.length > 0 ? entries : [{ path, before, after }];
  }

  return [{ path, before, after }];
}

function buildJsonDelta(before: unknown, after: unknown): JsonDeltaEntry[] {
  return walkDelta(before, after, "$");
}

export { buildJsonDelta };
export type { JsonDeltaEntry };
