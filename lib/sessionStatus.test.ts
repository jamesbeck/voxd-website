import assert from "node:assert/strict";
import test from "node:test";
import { getSessionStatus } from "./sessionStatus";

test("prioritises deleted by user over other session states", () => {
  const result = getSessionStatus({
    deletedByUser: true,
    closedAt: new Date(),
    paused: true,
  });

  assert.deepEqual(result, {
    key: "deleted-by-user",
    label: "Deleted by user",
    badgeClassName: "bg-red-500",
    dataCardVariant: "danger",
    isClosedLike: true,
  });
});

test("marks closed sessions as closed-like", () => {
  const result = getSessionStatus({
    closedAt: new Date(),
    paused: true,
  });

  assert.equal(result.key, "closed");
  assert.equal(result.label, "Closed");
  assert.equal(result.isClosedLike, true);
});

test("keeps paused sessions distinct from closed-like states", () => {
  const result = getSessionStatus({ paused: true });

  assert.equal(result.key, "paused");
  assert.equal(result.label, "Paused");
  assert.equal(result.dataCardVariant, "warning");
  assert.equal(result.isClosedLike, false);
});

test("defaults to active when no terminal flags are set", () => {
  const result = getSessionStatus({});

  assert.equal(result.key, "active");
  assert.equal(result.label, "Active");
  assert.equal(result.dataCardVariant, "success");
  assert.equal(result.isClosedLike, false);
});
