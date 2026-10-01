(function () {
  "use strict";

  const { checkDirection, normalizeIcao } = window.Direction;
  const DEFAULT_ORIGIN = "LTFM";
  const NEAR_NS_DEGREES = 10;

  const $ = (id) => document.getElementById(id);
  const form = $("form");
  const icaoInput = $("icao");
  const originSelect = $("origin");
  const resultEl = $("result");
  const allEl = $("all");
  const rowsEl = $("rows");
  const summaryEl = $("summary");
  const showAll = $("show-all");

  function airport(code) {
    const a = window.AIRPORTS[code];
    if (!a) return null;
    return { code, name: a[0], city: a[1], country: a[2], lat: a[3], lon: a[4], scheduled: !!a[5] };
  }

  const ltAirports = Object.keys(window.AIRPORTS)
    .filter((code) => code.startsWith("LT"))
    .map(airport);

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  }

  const fmtCourse = (c) => String(Math.round(c) % 360).padStart(3, "0") + "°";
  const fmtNm = (d) => Math.round(d).toLocaleString() + " NM";
  const label = (a) => [a.city, a.country].filter(Boolean).join(", ");

  function populateOrigins() {
    const options = ltAirports
      .filter((a) => a.scheduled)
      .sort((a, b) => (a.city || a.name).localeCompare(b.city || b.name, "tr"));
    originSelect.innerHTML = options
      .map((a) => `<option value="${a.code}">${a.code} – ${escapeHtml(a.city || a.name)}</option>`)
      .join("");
    originSelect.value = DEFAULT_ORIGIN;
  }

  function renderError(message) {
    resultEl.classList.remove("hidden");
    resultEl.innerHTML = `<p class="error">${escapeHtml(message)}</p>`;
    allEl.classList.add("hidden");
  }

  function renderMain(origin, dest) {
    const r = checkDirection(origin, dest);
    const lonText =
      Math.abs(r.longitudeDelta) < 0.05
        ? "same longitude"
        : `${Math.abs(r.longitudeDelta).toFixed(1)}° ${r.longitudeDelta > 0 ? "east" : "west"}`;
    const warn =
      origin.code === dest.code
        ? `<div class="warn">Destination is the same as the origin.</div>`
        : r.margin < NEAR_NS_DEGREES
          ? `<div class="warn">Course is within ${NEAR_NS_DEGREES}° of due ${
              r.course > 90 && r.course < 270 ? "south" : "north"
            } — the east/west call can flip with routing or magnetic variation.</div>`
          : "";

    resultEl.classList.remove("hidden");
    resultEl.innerHTML = `
      <div class="muted">${origin.code} → ${dest.code}</div>
      <div class="verdict ${r.direction}">${r.direction}</div>
      <div class="dest-name">${escapeHtml(dest.name)}</div>
      <div class="muted">${escapeHtml(label(dest))}</div>
      <div class="stats">
        <div class="stat"><span class="muted">Initial true course</span><b>${fmtCourse(r.course)}</b></div>
        <div class="stat"><span class="muted">Distance</span><b>${fmtNm(r.distanceNm)}</b></div>
        <div class="stat"><span class="muted">Longitude vs ${origin.code}</span><b>${lonText}</b></div>
      </div>
      ${warn}`;
  }

  function renderTable(dest) {
    const origins = ltAirports
      .filter((a) => (showAll.checked || a.scheduled) && a.code !== dest.code)
      .map((a) => ({ a, r: checkDirection(a, dest) }))
      .sort((x, y) => x.a.code.localeCompare(y.a.code));

    const east = origins.filter((o) => o.r.direction === "EASTBOUND").length;
    const west = origins.length - east;
    const scope = showAll.checked ? "LT airfields" : "LT airports with scheduled service";
    summaryEl.textContent =
      east === 0
        ? `Westbound from all ${west} ${scope}`
        : west === 0
          ? `Eastbound from all ${east} ${scope}`
          : `Mixed: ${east} eastbound, ${west} westbound (${scope})`;

    rowsEl.innerHTML = origins
      .map(
        ({ a, r }) => `<tr>
          <td><b>${a.code}</b></td>
          <td>${escapeHtml(a.city || a.name)}</td>
          <td><span class="pill ${r.direction}">${r.direction}</span></td>
          <td class="num">${fmtCourse(r.course)}</td>
          <td class="num">${fmtNm(r.distanceNm)}</td>
        </tr>`
      )
      .join("");
    allEl.classList.remove("hidden");
  }

  function run() {
    const code = normalizeIcao(icaoInput.value);
    if (!code) return renderError("Please enter a 4-character ICAO code (e.g. EGLL).");
    const dest = airport(code);
    if (!dest) return renderError(`Airport ${code} not found in the database.`);
    const origin = airport(originSelect.value);
    renderMain(origin, dest);
    renderTable(dest);
    history.replaceState(null, "", `#${code}${origin.code !== DEFAULT_ORIGIN ? "/" + origin.code : ""}`);
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    run();
  });
  originSelect.addEventListener("change", () => icaoInput.value && run());
  showAll.addEventListener("change", run);

  populateOrigins();

  // Support shareable links: #EGLL or #EGLL/LTAI
  function loadFromHash() {
    const [hashDest, hashOrigin] = location.hash.slice(1).toUpperCase().split("/");
    if (hashOrigin && hashOrigin.startsWith("LT") && airport(hashOrigin)) {
      if (![...originSelect.options].some((o) => o.value === hashOrigin)) {
        originSelect.add(new Option(hashOrigin, hashOrigin));
      }
      originSelect.value = hashOrigin;
    }
    if (hashDest) {
      icaoInput.value = hashDest;
      run();
    }
  }
  window.addEventListener("hashchange", loadFromHash);
  loadFromHash();
  icaoInput.focus();
})();
