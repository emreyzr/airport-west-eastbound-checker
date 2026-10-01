// Core logic: decide whether a flight from a Turkish (LTxx) airport to a
// destination is eastbound or westbound.
//
// Convention (same as the semicircular cruising-level rule):
//   initial course 000°–179° -> EASTBOUND
//   initial course 180°–359° -> WESTBOUND
// The course used is the initial great-circle (true) course from the origin.
(function (root) {
  "use strict";

  const toRad = (d) => (d * Math.PI) / 180;
  const toDeg = (r) => (r * 180) / Math.PI;
  const EARTH_RADIUS_NM = 3440.065;

  // Initial great-circle course from point 1 to point 2, in degrees [0, 360).
  function initialCourse(lat1, lon1, lat2, lon2) {
    const p1 = toRad(lat1);
    const p2 = toRad(lat2);
    const dl = toRad(lon2 - lon1);
    const y = Math.sin(dl) * Math.cos(p2);
    const x = Math.cos(p1) * Math.sin(p2) - Math.sin(p1) * Math.cos(p2) * Math.cos(dl);
    return (toDeg(Math.atan2(y, x)) + 360) % 360;
  }

  // Great-circle distance in nautical miles (haversine).
  function distanceNm(lat1, lon1, lat2, lon2) {
    const dp = toRad(lat2 - lat1);
    const dl = toRad(lon2 - lon1);
    const a =
      Math.sin(dp / 2) ** 2 +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dl / 2) ** 2;
    return 2 * EARTH_RADIUS_NM * Math.asin(Math.min(1, Math.sqrt(a)));
  }

  // Signed longitude difference (destination - origin), normalised to (-180, 180].
  function longitudeDelta(lonFrom, lonTo) {
    let d = (lonTo - lonFrom) % 360;
    if (d > 180) d -= 360;
    if (d <= -180) d += 360;
    return d;
  }

  function classifyCourse(course) {
    return course < 180 ? "EASTBOUND" : "WESTBOUND";
  }

  // How close the course is to due north/south, where the east/west call flips.
  function marginFromNorthSouth(course) {
    return Math.min(course, Math.abs(180 - course), 360 - course);
  }

  // origin/dest: { lat, lon }
  function checkDirection(origin, dest) {
    const course = initialCourse(origin.lat, origin.lon, dest.lat, dest.lon);
    return {
      direction: classifyCourse(course),
      course,
      distanceNm: distanceNm(origin.lat, origin.lon, dest.lat, dest.lon),
      longitudeDelta: longitudeDelta(origin.lon, dest.lon),
      margin: marginFromNorthSouth(course),
    };
  }

  // Normalise user input to an upper-case 4-letter ICAO code, or null.
  function normalizeIcao(input) {
    const code = String(input || "").trim().toUpperCase();
    return /^[A-Z0-9]{4}$/.test(code) ? code : null;
  }

  const api = {
    initialCourse,
    distanceNm,
    longitudeDelta,
    classifyCourse,
    marginFromNorthSouth,
    checkDirection,
    normalizeIcao,
  };

  if (typeof module === "object" && module.exports) module.exports = api;
  else root.Direction = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
