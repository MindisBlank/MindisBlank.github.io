/* Travel map — animated "Indiana Jones" journey line on the About page.
   Works with _includes/world-map.svg (equirectangular projection).
   Projection constants must match the generator: lon -130..150, lat 16..72, 4 px/deg. */
(function () {
  "use strict";

  var svg = document.getElementById("travel-map");
  if (!svg) return;

  var NS = "http://www.w3.org/2000/svg";
  var LON_MIN = -130, LAT_MAX = 72, SCALE = 4;

  function project(lat, lon) {
    return { x: (lon - LON_MIN) * SCALE, y: (LAT_MAX - lat) * SCALE };
  }
  function r1(n) { return Math.round(n * 10) / 10; }
  function mk(tag, attrs) {
    var el = document.createElementNS(NS, tag);
    for (var k in attrs) el.setAttribute(k, attrs[k]);
    return el;
  }
  function sleep(ms) { return new Promise(function (res) { setTimeout(res, ms); }); }

  /* ------------------------------ Data ------------------------------ */

  var LIVED = [
    { name: "Boston", years: "until 2008", lat: 42.36, lon: -71.06,
      label: { dx: 10, dy: 2, anchor: "start" } },
    { name: "Reykjavík", years: "2008–2023", lat: 64.15, lon: -21.94,
      label: { dx: 0, dy: -19, anchor: "middle" } },
    { name: "Copenhagen", years: "2024–2026", lat: 55.68, lon: 12.57,
      label: { dx: -9, dy: 3, anchor: "end" } },
    { name: "Stockholm", years: "2026 –", lat: 59.33, lon: 18.07,
      label: { dx: 6, dy: -16, anchor: "start" } }
  ];

  /* from: index into LIVED (home base the trip started from) */
  var TRIPS = [
    { id: "toronto",      from: 0, stops: [[43.65, -79.38]] },
    { id: "philadelphia", from: 0, stops: [[39.95, -75.17]] },
    { id: "nyc",          from: 0, stops: [[40.71, -74.01]] },
    { id: "colorado",     from: 0, stops: [[39.74, -104.99]] },
    { id: "berlin",       from: 1, stops: [[52.52, 13.40]] },
    { id: "prague",       from: 1, stops: [[50.08, 14.44]] },
    { id: "copenhagen",   from: 1, stops: [[55.68, 12.57]], noDot: true },
    { id: "london",       from: 1, stops: [[51.51, -0.13]] },
    { id: "alicante",     from: 1, stops: [[38.35, -0.48]] },
    { id: "portugal",     from: 1, stops: [[38.72, -9.14], [37.10, -8.67]] },
    { id: "italy",        from: 1, stops: [[45.46, 9.19], [45.44, 12.34], [44.49, 11.34],
                                           [43.77, 11.26], [41.90, 12.50], [40.85, 14.27],
                                           [37.50, 15.09], [38.12, 13.36]] },
    { id: "japan",        from: 1, stops: [[35.68, 139.69], [35.01, 135.77],
                                           [34.69, 135.50], [43.70, 7.27]] },
    { id: "poland",       from: 2, stops: [[54.35, 18.65], [52.23, 21.01]] },
    { id: "tallinn",      from: 2, stops: [[59.44, 24.75]] },
    { id: "marrakesh",    from: 2, stops: [[31.63, -7.99]] },
    { id: "tampa",        from: 2, stops: [[27.95, -82.46]] }
  ];

  /* --------------------------- Geometry ----------------------------- */

  /* Quadratic curve through points, each segment bowing gently upward
     like a flight-route map. */
  function curveD(pts) {
    var d = "M" + r1(pts[0].x) + " " + r1(pts[0].y);
    for (var i = 1; i < pts.length; i++) {
      var a = pts[i - 1], b = pts[i];
      var dx = b.x - a.x, dy = b.y - a.y;
      var dist = Math.sqrt(dx * dx + dy * dy) || 1;
      var off = Math.min(6 + dist * 0.16, 55);
      var px = -dy / dist, py = dx / dist;
      if (py > 0) { px = -px; py = -py; }
      d += "Q" + r1((a.x + b.x) / 2 + px * off) + " " + r1((a.y + b.y) / 2 + py * off) +
           " " + r1(b.x) + " " + r1(b.y);
    }
    return d;
  }

  /* --------------------------- Build layers ------------------------- */

  var gTrips  = mk("g", { class: "wm-trips" });
  var gRoute  = mk("g", { class: "wm-route" });
  var gCities = mk("g", { class: "wm-cities" });
  var meas    = mk("path", { fill: "none", stroke: "none" }); // invisible, for measuring
  var plane   = mk("path", { class: "wm-plane", d: "M10 0L-6 5L-2.5 0L-6 -5Z" });
  svg.appendChild(gTrips);
  svg.appendChild(gRoute);
  svg.appendChild(gCities);
  svg.appendChild(meas);
  svg.appendChild(plane);

  var livedPts = LIVED.map(function (c) { return project(c.lat, c.lon); });
  var legDs = [];
  for (var i = 0; i < livedPts.length - 1; i++) {
    legDs.push(curveD([livedPts[i], livedPts[i + 1]]));
  }

  var cityEls = LIVED.map(function (c) {
    var p = project(c.lat, c.lon);
    var g = mk("g", { class: "wm-city",
                      transform: "translate(" + r1(p.x) + " " + r1(p.y) + ")" });
    g.appendChild(mk("circle", { r: 3.2 }));
    var t = mk("text", { x: c.label.dx, y: c.label.dy, "text-anchor": c.label.anchor });
    var name = document.createElementNS(NS, "tspan");
    name.textContent = c.name;
    var yrs = mk("tspan", { x: c.label.dx, dy: 11, class: "wm-years" });
    yrs.textContent = c.years;
    t.appendChild(name);
    t.appendChild(yrs);
    g.appendChild(t);
    gCities.appendChild(g);
    return g;
  });

  var tripPaths = [], tripDots = [];
  TRIPS.forEach(function (trip) {
    var home = LIVED[trip.from];
    var pts = [project(home.lat, home.lon)].concat(
      trip.stops.map(function (s) { return project(s[0], s[1]); }));
    var path = mk("path", { class: "wm-trip", "data-trip": trip.id, d: curveD(pts) });
    gTrips.appendChild(path);
    var len = path.getTotalLength();
    path.style.strokeDasharray = len;
    path.style.strokeDashoffset = len;
    tripPaths.push(path);
    if (!trip.noDot) {
      trip.stops.forEach(function (s) {
        var p = project(s[0], s[1]);
        var dot = mk("circle", { class: "wm-tripdot", "data-trip": trip.id,
                                 cx: r1(p.x), cy: r1(p.y), r: 1.8 });
        gTrips.appendChild(dot);
        tripDots.push(dot);
      });
    }
  });

  /* --------------------------- Animation ---------------------------- */

  function easeInOut(p) {
    return p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
  }

  /* Reveal a leg by growing its dashed path; the plane rides the tip. */
  function animateLeg(d, dur) {
    return new Promise(function (resolve) {
      meas.setAttribute("d", d);
      var total = meas.getTotalLength();
      var path = mk("path", { class: "wm-route-leg" });
      gRoute.appendChild(path);
      var t0 = performance.now();
      function frame(now) {
        var p = Math.min(1, (now - t0) / dur);
        var len = easeInOut(p) * total;
        var partial = "", step = 6;
        for (var l = 0; l < len; l += step) {
          var pt = meas.getPointAtLength(l);
          partial += (l === 0 ? "M" : "L") + r1(pt.x) + " " + r1(pt.y);
        }
        var tip = meas.getPointAtLength(len);
        partial += (partial ? "L" : "M") + r1(tip.x) + " " + r1(tip.y);
        path.setAttribute("d", partial);
        var back = meas.getPointAtLength(Math.max(0, len - 2));
        var ang = Math.atan2(tip.y - back.y, tip.x - back.x) * 180 / Math.PI;
        plane.setAttribute("transform",
          "translate(" + r1(tip.x) + " " + r1(tip.y) + ") rotate(" + r1(ang) + ")");
        if (p < 1) { requestAnimationFrame(frame); } else { resolve(); }
      }
      requestAnimationFrame(frame);
    });
  }

  function showTrips(instant) {
    tripPaths.forEach(function (path, i) {
      path.style.transition = instant ? "none"
        : "stroke-dashoffset 0.9s ease " + (i * 0.09) + "s";
      path.getBoundingClientRect(); // flush so the transition runs
      path.style.strokeDashoffset = "0";
    });
    tripDots.forEach(function (dot, i) {
      dot.style.transitionDelay = instant ? "0s" : (0.5 + i * 0.03) + "s";
      dot.classList.add("shown");
    });
  }

  function resetAll() {
    gRoute.textContent = "";
    cityEls.forEach(function (g) { g.classList.remove("on"); });
    tripPaths.forEach(function (path) {
      path.style.transition = "none";
      path.style.strokeDashoffset = path.style.strokeDasharray;
    });
    tripDots.forEach(function (dot) {
      dot.style.transitionDelay = "0s";
      dot.classList.remove("shown");
    });
    plane.classList.remove("flying");
    svg.getBoundingClientRect(); // flush resets before the next run
  }

  var replayBtn = document.getElementById("travel-replay");
  var running = false;

  function run() {
    if (running) return;
    running = true;
    if (replayBtn) replayBtn.hidden = true;
    resetAll();

    var start = livedPts[0];
    plane.setAttribute("transform", "translate(" + r1(start.x) + " " + r1(start.y) + ")");
    plane.classList.add("flying");
    cityEls[0].classList.add("on");

    var chain = sleep(500);
    legDs.forEach(function (d, i) {
      chain = chain
        .then(function () {
          meas.setAttribute("d", d);
          var dur = 900 + meas.getTotalLength() * 3.2;
          return animateLeg(d, Math.min(dur, 2400));
        })
        .then(function () {
          cityEls[i + 1].classList.add("on");
          return sleep(420);
        });
    });
    chain
      .then(function () {
        plane.classList.remove("flying");
        return sleep(250);
      })
      .then(function () {
        showTrips(false);
        return sleep(TRIPS.length * 90 + 1000);
      })
      .then(function () {
        if (replayBtn) replayBtn.hidden = false;
        running = false;
      });
  }

  function showFinal() {
    legDs.forEach(function (d) {
      gRoute.appendChild(mk("path", { class: "wm-route-leg", d: d }));
    });
    cityEls.forEach(function (g) { g.classList.add("on"); });
    showTrips(true);
  }

  /* ----------------------- Triggers & interaction -------------------- */

  var reduced = window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (reduced) {
    svg.classList.add("wm-still");
    showFinal();
  } else if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      if (entries.some(function (e) { return e.isIntersecting; })) {
        io.disconnect();
        run();
      }
    }, { threshold: 0.35 });
    io.observe(svg);
  } else {
    run();
  }

  if (replayBtn) replayBtn.addEventListener("click", run);

  /* Trip list <-> map highlighting */
  function setHl(id, state) {
    var sel = '[data-trip="' + id + '"]';
    var nodes = svg.querySelectorAll(sel);
    for (var i = 0; i < nodes.length; i++) nodes[i].classList.toggle("hl", state);
    var li = document.querySelector(".travel-era li" + sel);
    if (li) li.classList.toggle("hl", state);
  }
  var pinned = null;
  var items = document.querySelectorAll(".travel-era li[data-trip]");
  Array.prototype.forEach.call(items, function (li) {
    var id = li.getAttribute("data-trip");
    li.addEventListener("mouseenter", function () { setHl(id, true); });
    li.addEventListener("mouseleave", function () { if (pinned !== id) setHl(id, false); });
    li.addEventListener("click", function () {
      if (pinned && pinned !== id) setHl(pinned, false);
      pinned = (pinned === id) ? null : id;
      setHl(id, pinned === id);
    });
  });
})();
