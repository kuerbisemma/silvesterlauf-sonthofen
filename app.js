(function () {
  "use strict";

  var R = window.ROUTE;
  var ACCENT = "#ff5a1f";
  var dark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;

  /* ---------- Mobile-Menü ---------- */
  var menuBtn = document.querySelector(".menu-btn");
  var nav = document.getElementById("nav");
  function setMenu(open) {
    nav.classList.toggle("open", open);
    menuBtn.setAttribute("aria-expanded", String(open));
    menuBtn.setAttribute("aria-label", open ? "Menü schließen" : "Menü öffnen");
  }
  menuBtn.addEventListener("click", function () { setMenu(!nav.classList.contains("open")); });
  nav.addEventListener("click", function (e) { if (e.target.tagName === "A") setMenu(false); });

  /* ---------- Countdown ---------- */
  var START = new Date("2026-12-31T11:00:00+01:00").getTime();
  var END = new Date("2026-12-31T13:00:00+01:00").getTime();
  var cd = {
    d: document.getElementById("cd-d"), h: document.getElementById("cd-h"),
    m: document.getElementById("cd-m"), s: document.getElementById("cd-s"),
    box: document.getElementById("countdown"), msg: document.getElementById("countdown-msg")
  };
  function pad(n) { return n < 10 ? "0" + n : String(n); }
  function tick() {
    var now = Date.now();
    var diff = START - now;
    if (diff <= 0) {
      cd.box.hidden = true;
      cd.msg.hidden = false;
      cd.msg.textContent = now < END ? "Läuft! Wir sind unterwegs." : "Geschafft. Danke fürs Mitlaufen und guten Rutsch!";
      return;
    }
    var s = Math.floor(diff / 1000);
    cd.d.textContent = Math.floor(s / 86400);
    cd.h.textContent = pad(Math.floor(s / 3600) % 24);
    cd.m.textContent = pad(Math.floor(s / 60) % 60);
    cd.s.textContent = pad(s % 60);
    setTimeout(tick, 1000 - (now % 1000));
  }
  tick();

  /* ---------- Streckenform im Hero ---------- */
  (function heroRoute() {
    var svg = document.getElementById("hero-route");
    if (!svg || !R) return;
    var W = 300, H = 560, P = 34;
    var lats = R.points.map(function (p) { return p[0]; });
    var lons = R.points.map(function (p) { return p[1]; });
    var maxLat = Math.max.apply(null, lats), minLat = Math.min.apply(null, lats);
    var minLon = Math.min.apply(null, lons), maxLon = Math.max.apply(null, lons);
    var k = Math.cos(((maxLat + minLat) / 2) * Math.PI / 180);
    var w = (maxLon - minLon) * k, h = maxLat - minLat;
    var sc = Math.min((W - 2 * P) / w, (H - 2 * P) / h);
    var ox = (W - w * sc) / 2, oy = (H - h * sc) / 2;
    function pt(lat, lon) { return [ox + (lon - minLon) * k * sc, oy + (maxLat - lat) * sc]; }

    var d = R.points.map(function (p, i) { var q = pt(p[0], p[1]); return (i ? "L" : "M") + q[0].toFixed(1) + " " + q[1].toFixed(1); }).join("");
    var s = pt(R.points[0][0], R.points[0][1]);
    var html = '<path class="r-path" pathLength="1" d="' + d + '"/>';
    R.kmMarks.forEach(function (m) {
      if (m[0] % 2) return;
      var q = pt(m[1], m[2]);
      html += '<circle class="r-kmdot" cx="' + q[0] + '" cy="' + q[1] + '" r="4"/>' +
              '<text class="r-km" x="' + (q[0] + 9) + '" y="' + (q[1] + 3.5) + '">' + m[0] + '</text>';
    });
    var a = pt(47.5341, 10.2643), b = pt(47.5185, 10.2605);
    html += '<text class="r-label" x="' + (a[0] + 28) + '" y="' + a[1] + '">ORTWANGER</text>' +
            '<text class="r-label" x="' + (a[0] + 28) + '" y="' + (a[1] + 14) + '">WEIHER</text>' +
            '<text class="r-label" text-anchor="end" x="' + (b[0] - 34) + '" y="' + b[1] + '">SONTHOFER</text>' +
            '<text class="r-label" text-anchor="end" x="' + (b[0] - 34) + '" y="' + (b[1] + 14) + '">SEE</text>' +
            '<circle class="r-start-ring" cx="' + s[0] + '" cy="' + s[1] + '" r="13"/>' +
            '<circle class="r-start" cx="' + s[0] + '" cy="' + s[1] + '" r="6"/>' +
            '<text class="r-label" x="' + (s[0] - 20) + '" y="' + (s[1] + 4) + '" text-anchor="end" style="fill:var(--on-night)">START</text>';
    svg.innerHTML = html;
  })();

  /* ---------- Karte ---------- */
  var hoverMarker = null;

  if (window.L && R) {
    var map = L.map("map", { scrollWheelZoom: false, zoomSnap: 0.25 });
    L.tileLayer("https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png", {
      maxZoom: 17,
      subdomains: "abc",
      attribution: 'Karte: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>-Mitwirkende, SRTM | Stil: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)'
    }).addTo(map);

    var casing = L.polyline(R.points, { color: dark ? "#0e0f12" : "#ffffff", weight: 10, opacity: .95 }).addTo(map);
    var line = L.polyline(R.points, { color: ACCENT, weight: 5, opacity: 1 }).addTo(map);
    map.fitBounds(casing.getBounds(), { padding: [28, 28] });

    R.kmMarks.forEach(function (k) {
      L.marker([k[1], k[2]], {
        icon: L.divIcon({ className: "km-icon", html: String(k[0]), iconSize: [22, 22], iconAnchor: [11, 11] }),
        title: "km " + k[0], keyboard: false
      }).addTo(map);
    });

    function pin(latlng, cls, label, size, popup) {
      return L.marker(latlng, {
        icon: L.divIcon({ className: "pin-icon " + cls, html: label, iconSize: size, iconAnchor: [size[0] / 2, size[1] / 2] }),
        zIndexOffset: 500
      }).addTo(map).bindPopup(popup);
    }
    pin(R.points[0], "pin-start", "S/Z", [36, 36], "<strong>Start &amp; Ziel</strong><br>Parkplatz Falkenstraße (gebührenpflichtig)<br>Treffen 10:45 · Start 11:00");
    pin([47.5253, 10.2598], "pin-p", "P", [26, 26], "<strong>Ausweichparkplatz Illerstraße</strong><br>Bihlerdorf, direkt an der Strecke (km 5,5)");
    pin([47.5437, 10.2589], "pin-db", "DB", [30, 26], "<strong>Bahnhof Blaichach</strong><br>ca. 1,3 km zum Start");
    pin([47.5134, 10.2722], "pin-db", "DB", [30, 26], "<strong>Bahnhof Sonthofen</strong><br>ca. 2,2 km zum Start");

    hoverMarker = L.marker(R.points[0], {
      icon: L.divIcon({ className: "hover-dot", iconSize: [16, 16], iconAnchor: [8, 8] }),
      interactive: false, keyboard: false, opacity: 0, zIndexOffset: 1000
    }).addTo(map);

    line.on("mousemove", function (e) { showAt(nearestPoint(e.latlng)); });
    line.on("mouseout", hideHover);
    map.on("click", function () { map.scrollWheelZoom.enable(); });
    map.on("mouseout", function () { map.scrollWheelZoom.disable(); });
  } else {
    document.getElementById("map").innerHTML = '<p style="padding:20px">Die Karte konnte nicht geladen werden. Der GPX-Track funktioniert trotzdem.</p>';
  }

  function nearestPoint(latlng) {
    var best = 0, bd = Infinity;
    for (var i = 0; i < R.points.length; i++) {
      var dy = R.points[i][0] - latlng.lat, dx = (R.points[i][1] - latlng.lng) * 0.67;
      var dd = dx * dx + dy * dy;
      if (dd < bd) { bd = dd; best = i; }
    }
    return best;
  }

  /* ---------- Höhenprofil ---------- */
  var svgP = document.getElementById("profile");
  var readout = document.getElementById("profile-readout");
  var W = 1000, H = 220, YMIN = 700, YMAX = 780;
  var prof = R ? R.profile : [];
  var total = R ? R.lengthKm : 1;
  var cursor = null;
  function x(km) { return (km / total) * W; }
  function y(ele) { return H - ((ele - YMIN) / (YMAX - YMIN)) * H; }

  if (prof.length) {
    var grid = "";
    [720, 740, 760].forEach(function (v) { grid += '<line class="grid" x1="0" x2="' + W + '" y1="' + y(v) + '" y2="' + y(v) + '"/>'; });
    var d = prof.map(function (p, i) { return (i ? "L" : "M") + x(p[0]).toFixed(1) + " " + y(p[1]).toFixed(1); }).join(" ");
    svgP.innerHTML = grid +
      '<path class="area" d="' + d + " L" + W + " " + H + " L0 " + H + ' Z"/>' +
      '<path class="line" d="' + d + '"/>' +
      '<line class="cursor" x1="0" x2="0" y1="0" y2="' + H + '" visibility="hidden"/>';
    cursor = svgP.querySelector(".cursor");

    var axis = document.createElement("div");
    axis.className = "profile-axis";
    var labels = "";
    for (var k = 0; k <= 10; k += 2) labels += "<span>" + k + "</span>";
    axis.innerHTML = labels + "<span>" + String(total).replace(".", ",") + " km</span>";
    svgP.after(axis);

    var eles = prof.map(function (p) { return p[1]; });
    readout.dataset.default = Math.round(Math.min.apply(null, eles)) + "–" + Math.round(Math.max.apply(null, eles)) + " m ü. NN · praktisch flach";
    readout.textContent = readout.dataset.default;

    var fromEvent = function (e) {
      var r = svgP.getBoundingClientRect();
      var cx = (e.touches ? e.touches[0].clientX : e.clientX) - r.left;
      var km = Math.max(0, Math.min(total, (cx / r.width) * total));
      var best = 0;
      for (var i = 0; i < prof.length; i++) { if (Math.abs(prof[i][0] - km) < Math.abs(prof[best][0] - km)) best = i; }
      showAt(best);
    };
    svgP.addEventListener("mousemove", fromEvent);
    svgP.addEventListener("touchmove", fromEvent, { passive: true });
    svgP.addEventListener("mouseleave", hideHover);
    svgP.addEventListener("touchend", hideHover);
  }

  function showAt(i) {
    if (!prof.length) return;
    var p = prof[i];
    if (cursor) { cursor.setAttribute("x1", x(p[0])); cursor.setAttribute("x2", x(p[0])); cursor.setAttribute("visibility", "visible"); }
    readout.textContent = "km " + p[0].toFixed(1).replace(".", ",") + " · " + Math.round(p[1]) + " m ü. NN";
    if (hoverMarker) { hoverMarker.setLatLng(R.points[i]); hoverMarker.setOpacity(1); }
  }
  function hideHover() {
    if (cursor) cursor.setAttribute("visibility", "hidden");
    if (readout.dataset.default) readout.textContent = readout.dataset.default;
    if (hoverMarker) hoverMarker.setOpacity(0);
  }

  /* ---------- Startnummer & Urkunde ---------- */
  var randomNr = String(Math.floor(Math.random() * 998) + 2);
  function setText(root, key, val) { root.querySelector('[data-bind="' + key + '"]').textContent = val; }

  function bindForm(form, preview, fill) {
    function update() { fill(new FormData(form), preview); }
    form.addEventListener("input", update);
    form.addEventListener("change", update);
    form.addEventListener("submit", function (e) { e.preventDefault(); update(); printEl(preview); });
    update();
  }

  bindForm(document.getElementById("bib-form"), document.getElementById("bib-preview"), function (f, p) {
    var nr = String(f.get("nr") || "").replace(/\D/g, "").slice(0, 4);
    setText(p, "nr", nr || randomNr);
    setText(p, "name", (f.get("name") || "").trim() || "Dein Name");
  });
  bindForm(document.getElementById("cert-form"), document.getElementById("cert-preview"), function (f, p) {
    setText(p, "name", (f.get("name") || "").trim() || "Dein Name");
    setText(p, "time", (f.get("time") || "").trim() || "–:––");
    setText(p, "cat", f.get("cat"));
  });

  var printArea = document.getElementById("print-area");
  function printEl(node) {
    printArea.innerHTML = "";
    var clone = node.cloneNode(true);
    clone.removeAttribute("id");
    printArea.appendChild(clone);
    document.body.classList.add("printing");
    window.print();
  }
  window.addEventListener("afterprint", function () {
    document.body.classList.remove("printing");
    printArea.innerHTML = "";
  });
})();
