(function () {
  "use strict";

  /* ---------- Mobile-Menü ---------- */
  var menuBtn = document.querySelector(".menu-btn");
  var nav = document.getElementById("nav");
  menuBtn.addEventListener("click", function () {
    var open = nav.classList.toggle("open");
    menuBtn.setAttribute("aria-expanded", String(open));
  });
  nav.addEventListener("click", function (e) {
    if (e.target.tagName === "A") { nav.classList.remove("open"); menuBtn.setAttribute("aria-expanded", "false"); }
  });

  /* ---------- Countdown ---------- */
  var START = new Date("2026-12-31T11:00:00+01:00").getTime();
  var END = new Date("2026-12-31T13:00:00+01:00").getTime();
  var el = {
    d: document.getElementById("cd-d"), h: document.getElementById("cd-h"),
    m: document.getElementById("cd-m"), s: document.getElementById("cd-s"),
    box: document.getElementById("countdown"), msg: document.getElementById("countdown-msg")
  };
  function pad(n) { return n < 10 ? "0" + n : String(n); }
  function tick() {
    var now = Date.now();
    var diff = START - now;
    if (diff <= 0) {
      el.box.hidden = true;
      el.msg.textContent = now < END ? "Der Lauf ist gestartet! Lauf, Forrest, lauf!" : "Geschafft! Danke fürs Mitlaufen und einen guten Rutsch ins neue Jahr.";
      el.msg.style.fontWeight = "700";
      return;
    }
    var s = Math.floor(diff / 1000);
    el.d.textContent = Math.floor(s / 86400);
    el.h.textContent = pad(Math.floor(s / 3600) % 24);
    el.m.textContent = pad(Math.floor(s / 60) % 60);
    el.s.textContent = pad(s % 60);
    setTimeout(tick, 1000 - (now % 1000));
  }
  tick();

  /* ---------- Karte ---------- */
  var R = window.ROUTE;
  var hoverMarker = null;
  var map = null;

  if (window.L && R) {
    map = L.map("map", { scrollWheelZoom: false, zoomSnap: 0.25 });
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>-Mitwirkende'
    }).addTo(map);

    var casing = L.polyline(R.points, { color: "#ffffff", weight: 9, opacity: .9 }).addTo(map);
    var line = L.polyline(R.points, { color: "#c4212f", weight: 5, opacity: .95 }).addTo(map);
    map.fitBounds(casing.getBounds(), { padding: [24, 24] });

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
    pin(R.points[0], "pin-start", "S/Z", [34, 34],
      "<strong>Start &amp; Ziel</strong><br>Parkplatz Falkenstraße (gebührenpflichtig)<br>Treffen 10:45 · Start 11:00");
    pin([47.5253, 10.2598], "pin-p", "P", [24, 24], "<strong>Ausweichparkplatz Illerstraße</strong><br>Bihlerdorf, direkt an der Strecke (km 5,5)");
    pin([47.5437, 10.2589], "pin-db", "DB", [28, 24], "<strong>Bahnhof Blaichach</strong><br>ca. 1,3 km zum Start");
    pin([47.5134, 10.2722], "pin-db", "DB", [28, 24], "<strong>Bahnhof Sonthofen</strong><br>ca. 2,2 km zum Start");

    hoverMarker = L.marker(R.points[0], {
      icon: L.divIcon({ className: "hover-dot", iconSize: [14, 14], iconAnchor: [7, 7] }),
      interactive: false, keyboard: false, opacity: 0, zIndexOffset: 1000
    }).addTo(map);

    // Strecke auf der Karte anfahren → Profil zeigt Position
    line.on("mousemove", function (e) { showAt(nearestPoint(e.latlng)); });
    line.on("mouseout", hideHover);

    // Mausrad-Zoom erst nach Klick in die Karte
    map.on("click", function () { map.scrollWheelZoom.enable(); });
    map.on("mouseout", function () { map.scrollWheelZoom.disable(); });
  } else {
    document.getElementById("map").innerHTML = '<p style="padding:20px">Die Karte konnte nicht geladen werden. Der GPX-Track funktioniert trotzdem.</p>';
  }

  function nearestPoint(latlng) {
    var best = 0, bd = Infinity;
    for (var i = 0; i < R.points.length; i++) {
      var dy = R.points[i][0] - latlng.lat, dx = (R.points[i][1] - latlng.lng) * 0.67;
      var d = dx * dx + dy * dy;
      if (d < bd) { bd = d; best = i; }
    }
    return best;
  }

  /* ---------- Höhenprofil ---------- */
  var svg = document.getElementById("profile");
  var readout = document.getElementById("profile-readout");
  var W = 1000, H = 220, YMIN = 700, YMAX = 780;
  var prof = R ? R.profile : [];
  var total = R ? R.lengthKm : 1;
  var cursor = null;

  function x(km) { return (km / total) * W; }
  function y(ele) { return H - ((ele - YMIN) / (YMAX - YMIN)) * H; }

  if (prof.length) {
    var NS = "http://www.w3.org/2000/svg";
    var grid = "";
    [720, 740, 760].forEach(function (v) { grid += '<line class="grid" x1="0" x2="' + W + '" y1="' + y(v) + '" y2="' + y(v) + '"/>'; });
    var d = prof.map(function (p, i) { return (i ? "L" : "M") + x(p[0]).toFixed(1) + " " + y(p[1]).toFixed(1); }).join(" ");
    svg.innerHTML = grid +
      '<path class="area" d="' + d + " L" + W + " " + H + " L0 " + H + ' Z"/>' +
      '<path class="line" d="' + d + '"/>' +
      '<line class="cursor" x1="0" x2="0" y1="0" y2="' + H + '" visibility="hidden"/>';
    cursor = svg.querySelector(".cursor");

    // Achsenbeschriftung
    var axis = document.createElement("div");
    axis.className = "profile-axis";
    var labels = "";
    for (var k = 0; k <= 10; k += 2) labels += "<span>" + k + " km</span>";
    axis.innerHTML = labels + "<span>" + String(total).replace(".", ",") + " km</span>";
    svg.after(axis);

    var minE = Math.min.apply(null, prof.map(function (p) { return p[1]; }));
    var maxE = Math.max.apply(null, prof.map(function (p) { return p[1]; }));
    readout.dataset.default = Math.round(minE) + "–" + Math.round(maxE) + " m ü. NN · praktisch flach";
    readout.textContent = readout.dataset.default;

    function fromEvent(e) {
      var r = svg.getBoundingClientRect();
      var cx = (e.touches ? e.touches[0].clientX : e.clientX) - r.left;
      var km = Math.max(0, Math.min(total, (cx / r.width) * total));
      var best = 0;
      for (var i = 0; i < prof.length; i++) { if (Math.abs(prof[i][0] - km) < Math.abs(prof[best][0] - km)) best = i; }
      showAt(best);
    }
    svg.addEventListener("mousemove", fromEvent);
    svg.addEventListener("touchmove", fromEvent, { passive: true });
    svg.addEventListener("mouseleave", hideHover);
    svg.addEventListener("touchend", hideHover);
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

  function bindForm(form, preview, fill) {
    function update() { fill(new FormData(form), preview); }
    form.addEventListener("input", update);
    form.addEventListener("change", update);
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      update();
      printEl(preview);
    });
    update();
  }

  function setText(root, key, val) { root.querySelector('[data-bind="' + key + '"]').textContent = val; }

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
