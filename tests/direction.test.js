const test = require("node:test");
const assert = require("node:assert/strict");
const D = require("../direction.js");
require("../data/airports.js");

const pos = (code) => ({ lat: AIRPORTS[code][3], lon: AIRPORTS[code][4] });

test("classifyCourse uses the 000-179 / 180-359 split", () => {
  assert.equal(D.classifyCourse(0), "EASTBOUND");
  assert.equal(D.classifyCourse(179.9), "EASTBOUND");
  assert.equal(D.classifyCourse(180), "WESTBOUND");
  assert.equal(D.classifyCourse(359.9), "WESTBOUND");
});

test("initialCourse cardinal directions", () => {
  assert.ok(Math.abs(D.initialCourse(0, 0, 0, 10) - 90) < 1e-9);
  assert.ok(Math.abs(D.initialCourse(0, 0, 0, -10) - 270) < 1e-9);
  assert.ok(Math.abs(D.initialCourse(0, 0, 10, 0) - 0) < 1e-9);
  assert.ok(Math.abs(D.initialCourse(10, 0, 0, 0) - 180) < 1e-9);
});

test("longitudeDelta wraps across the antimeridian", () => {
  assert.equal(D.longitudeDelta(170, -170), 20);
  assert.equal(D.longitudeDelta(-170, 170), -20);
});

test("normalizeIcao", () => {
  assert.equal(D.normalizeIcao(" egll "), "EGLL");
  assert.equal(D.normalizeIcao("EGL"), null);
  assert.equal(D.normalizeIcao("EG-L"), null);
});

test("real-world checks from Istanbul (LTFM)", () => {
  const ist = pos("LTFM");
  const cases = {
    EGLL: "WESTBOUND", // London
    KJFK: "WESTBOUND", // New York
    LFPG: "WESTBOUND", // Paris
    OMDB: "EASTBOUND", // Dubai
    VHHH: "EASTBOUND", // Hong Kong
    UUEE: "EASTBOUND", // Moscow
  };
  for (const [code, expected] of Object.entries(cases)) {
    assert.equal(D.checkDirection(ist, pos(code)).direction, expected, code);
  }
});

test("distance LTFM-EGLL is about 1340 NM", () => {
  const d = D.distanceNm(...Object.values(pos("LTFM")), ...Object.values(pos("EGLL")));
  assert.ok(d > 1300 && d < 1380, String(d));
});
