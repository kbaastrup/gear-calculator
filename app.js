(() => {
  const els = {
    chainrings: document.getElementById('chainrings'),
    cogs: document.getElementById('cogs'),
    cadence: document.getElementById('cadence'),
    wheelPreset: document.getElementById('wheelPreset'),
    bsdMm: document.getElementById('bsdMm'),
    tireMm: document.getElementById('tireMm'),
    note: document.getElementById('note'),
    btnCalc: document.getElementById('btnCalc'),
    btnReset: document.getElementById('btnReset'),
    btnCSV: document.getElementById('btnCSV'),
    status: document.getElementById('status'),
    table: document.getElementById('resultTable'),
    summaryPill: document.getElementById('summaryPill'),
  };

  const presets = {
    "700c-25": { bsd: 622, tire: 25 },
    "700c-28": { bsd: 622, tire: 28 },
    "700c-32": { bsd: 622, tire: 32 },
    "700c-35": { bsd: 622, tire: 35 },
    "650b-47": { bsd: 584, tire: 47 },
    "29-2.25": { bsd: 622, tire: 57 },     // ~2.25" ≈ 57mm
    "27.5-2.35": { bsd: 584, tire: 60 },   // ~2.35" ≈ 60mm
    "custom": null
  };

  let lastRows = [];
  let sortState = { key: null, dir: 1 };

  function setStatus(msg, type = "") {
    els.status.className = `status ${type}`.trim();
    els.status.textContent = msg || "";
  }

  function parseTeethList(raw) {
    const cleaned = String(raw || "")
      .split(/[,; ]+/)
      .map(s => s.trim())
      .filter(Boolean)
      .map(n => Number(n))
      .filter(n => Number.isFinite(n) && n > 0);

    // unique + sorted numeric
    return Array.from(new Set(cleaned)).sort((a, b) => a - b);
  }

  // Basic wheel model:
  // Diameter(mm) ≈ BSD + 2*tireWidth
  // Circumference(mm) = π * diameter
  function wheelMetrics(bsdMm, tireMm) {
    const diameterMm = bsdMm + 2 * tireMm;
    const circumferenceMm = Math.PI * diameterMm;
    const diameterIn = diameterMm / 25.4; // inches
    return {
      diameterMm,
      diameterIn,
      circumferenceM: circumferenceMm / 1000
    };
  }

  function fmt(n, decimals = 2) {
    if (!Number.isFinite(n)) return "—";
    return n.toFixed(decimals);
  }

  function buildRows(chainrings, cogs, cadenceRpm, wheel) {
    const rows = [];
    for (const ring of chainrings) {
      for (const cog of cogs) {
        const ratio = ring / cog;
        const devM = wheel.circumferenceM * ratio;
        const gearInches = wheel.diameterIn * ratio;
        const kmh = devM * cadenceRpm * 60 / 1000;

        rows.push({
          chainring: ring,
          cog,
          ratio,
          dev: devM,
          gi: gearInches,
          speed: kmh
        });
      }
    }
    return rows;
  }

  function renderTable(rows) {
    const tbody = els.table.querySelector('tbody');
    tbody.innerHTML = "";

    if (!rows.length) {
      const tr = document.createElement('tr');
      const td = document.createElement('td');
      td.colSpan = 6;
      td.className = "muted center";
      td.textContent = "Ingen data (tjek input)";
      tr.appendChild(td);
      tbody.appendChild(tr);
      return;
    }

    for (const r of rows) {
      const tr = document.createElement('tr');

      const cells = [
        r.chainring,
        r.cog,
        fmt(r.ratio, 3),
        fmt(r.dev, 3),
        fmt(r.gi, 1),
        fmt(r.speed, 1)
      ];

      for (const c of cells) {
        const td = document.createElement('td');
        td.textContent = String(c);
        tr.appendChild(td);
      }
      tbody.appendChild(tr);
    }
  }

  function updateSummary(chainrings, cogs, cadence, wheel, rows) {
    const label = `${chainrings.length} klinge(r) · ${cogs.length} tandhjul · ${cadence} rpm · ${Math.round(wheel.diameterMm)}mm dia`;
    els.summaryPill.textContent = label;

    // min/max speed + dev
    const speeds = rows.map(r => r.speed).filter(Number.isFinite);
    const devs = rows.map(r => r.dev).filter(Number.isFinite);

    if (!speeds.length || !devs.length) return;

    const minS = Math.min(...speeds);
    const maxS = Math.max(...speeds);
    const minD = Math.min(...devs);
    const maxD = Math.max(...devs);

    setStatus(
      `Spænd: udvikling ${fmt(minD, 2)}–${fmt(maxD, 2)} m pr. omgang · hastighed ${fmt(minS, 1)}–${fmt(maxS, 1)} km/t @ ${cadence} rpm`,
      "ok"
    );
  }

  function sortRows(rows, key) {
    if (!rows.length) return rows;

    if (sortState.key === key) sortState.dir *= -1;
    else {
      sortState.key = key;
      sortState.dir = 1;
    }

    const dir = sortState.dir;
    const sorted = [...rows].sort((a, b) => {
      const va = a[key];
      const vb = b[key];
      if (va < vb) return -1 * dir;
      if (va > vb) return 1 * dir;
      return 0;
    });

    return sorted;
  }

  function toCSV(rows, meta) {
    const lines = [];
    lines.push(`Note,${csvEscape(meta.note || "")}`);
    lines.push(`Chainrings,${csvEscape(meta.chainringsRaw)}`);
    lines.push(`Cogs,${csvEscape(meta.cogsRaw)}`);
    lines.push(`CadenceRPM,${meta.cadence}`);
    lines.push(`BSDmm,${meta.bsdMm}`);
    lines.push(`Tiremm,${meta.tireMm}`);
    lines.push(`WheelDiameterMm,${fmt(meta.wheel.diameterMm, 1)}`);
    lines.push(`WheelCircumferenceM,${fmt(meta.wheel.circumferenceM, 4)}`);
    lines.push("");

    lines.push("Chainring,Cog,Ratio,DevelopmentM,GearInches,SpeedKmhAtCadence");
    for (const r of rows) {
      lines.push([
        r.chainring,
        r.cog,
        fmt(r.ratio, 5),
        fmt(r.dev, 5),
        fmt(r.gi, 3),
        fmt(r.speed, 3)
      ].join(","));
    }
    return lines.join("\n");
  }

  function csvEscape(s) {
    const str = String(s ?? "");
    if (/[,"\n]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
    return str;
  }

  function download(filename, content, mime = "text/plain") {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  function calculate() {
    setStatus("");

    const chainringsRaw = els.chainrings.value;
    const cogsRaw = els.cogs.value;

    const chainrings = parseTeethList(chainringsRaw);
    const cogs = parseTeethList(cogsRaw);

    const cadence = Number(els.cadence.value);
    const bsdMm = Number(els.bsdMm.value);
    const tireMm = Number(els.tireMm.value);

    if (!chainrings.length) return setStatus("Ugyldige klinger. Skriv fx: 50,34", "error");
    if (!cogs.length) return setStatus("Ugyldig kassette. Skriv fx: 11,12,13,...", "error");
    if (!Number.isFinite(cadence) || cadence <= 0) return setStatus("Kadence skal være et tal > 0.", "error");
    if (!Number.isFinite(bsdMm) || bsdMm < 200) return setStatus("BSD virker forkert. 700C = 622, 650B = 584.", "error");
    if (!Number.isFinite(tireMm) || tireMm < 10) return setStatus("Dækbredde virker forkert (mm).", "error");

    const wheel = wheelMetrics(bsdMm, tireMm);

    let rows = buildRows(chainrings, cogs, cadence, wheel);

    // default sort: chainring desc, cog asc (giver lidt “gear-oversigt”-feeling)
    rows.sort((a, b) => {
      if (a.chainring !== b.chainring) return b.chainring - a.chainring;
      return a.cog - b.cog;
    });

    lastRows = rows;
    renderTable(rows);
    updateSummary(chainrings, cogs, cadence, wheel, rows);

    // stash meta for CSV
    lastRows._meta = {
      note: els.note.value,
      chainringsRaw,
      cogsRaw,
      cadence,
      bsdMm,
      tireMm,
      wheel
    };
  }

  function reset() {
    els.chainrings.value = "50,34";
    els.cogs.value = "11,12,13,14,15,17,19,21,23,25,28,32";
    els.cadence.value = "90";
    els.wheelPreset.value = "700c-25";
    els.bsdMm.value = "622";
    els.tireMm.value = "25";
    els.note.value = "";
    lastRows = [];
    sortState = { key: null, dir: 1 };
    els.summaryPill.textContent = "—";
    setStatus("");
    renderTable([]);
    const tbody = els.table.querySelector('tbody');
    tbody.innerHTML = `<tr><td colspan="6" class="muted center">Klik “Beregn”</td></tr>`;
  }

  function bindSorting() {
    const ths = els.table.querySelectorAll("thead th[data-sort]");
    ths.forEach(th => {
      th.addEventListener("click", () => {
        if (!lastRows.length) return;
        const key = th.getAttribute("data-sort");
        const sorted = sortRows(lastRows, key);
        lastRows = sorted;
        renderTable(sorted);
      });
    });
  }

  function bindPresets() {
    els.wheelPreset.addEventListener("change", () => {
      const key = els.wheelPreset.value;
      const p = presets[key];
      if (!p) return;
      els.bsdMm.value = String(p.bsd);
      els.tireMm.value = String(p.tire);
    });
  }

  function bindButtons() {
    els.btnCalc.addEventListener("click", calculate);
    els.btnReset.addEventListener("click", reset);
    els.btnCSV.addEventListener("click", () => {
      if (!lastRows.length) return setStatus("Der er ingen resultater at eksportere endnu.", "error");
      const meta = lastRows._meta || {};
      const csv = toCSV(lastRows, meta);
      const stamp = new Date().toISOString().slice(0, 10);
      download(`gear-calculator-${stamp}.csv`, csv, "text/csv");
      setStatus("CSV downloadet.", "ok");
    });
  }

  function init() {
    bindSorting();
    bindPresets();
    bindButtons();

    // sync preset -> fields on load
    const p = presets[els.wheelPreset.value];
    if (p) {
      els.bsdMm.value = String(p.bsd);
      els.tireMm.value = String(p.tire);
    }
  }

  init();
})();
