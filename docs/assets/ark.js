/* Arbeidsarkene: lagring i nettleseren, eksport og utskrift.
   Alt ligger i localStorage under én nøkkel. Ingenting sendes noe sted. */
(function () {
  "use strict";
  var LS = "ssb-dashbordkurs-v1";
  var REKKEFOLGE = ["A1", "A2", "A3", "B1", "B2", "B3", "C1", "C2", "D1", "D2", "D3", "E1"];

  function les() {
    try { return JSON.parse(window.localStorage.getItem(LS)) || {}; } catch (e) { return {}; }
  }
  function skriv(d) {
    try { window.localStorage.setItem(LS, JSON.stringify(d)); return true; } catch (e) { return false; }
  }
  function alle(rot, sel) { return Array.prototype.slice.call(rot.querySelectorAll(sel)); }

  function setningTekst(div) {
    var p = div.querySelector("p");
    var ut = "";
    p.childNodes.forEach(function (n) {
      if (n.nodeType === 3) ut += n.textContent;
      else if (n.tagName === "INPUT") ut += n.value.trim() ? n.value.trim() : "___";
    });
    return ut.replace(/\s+/g, " ").replace(/\s+\./g, ".").trim();
  }
  function setningUtfylt(div) {
    return alle(div, "input").some(function (i) { return i.value.trim(); });
  }

  function verdi(el) {
    if (el.tagName === "FIELDSET") {
      var v = el.querySelector("input:checked");
      return v ? v.value : "";
    }
    if (el.type === "checkbox") return el.checked;
    return el.value;
  }

  function fyll(ark, d) {
    alle(ark, "input[data-k], textarea[data-k]").forEach(function (el) {
      var v = d[el.dataset.k];
      if (v === undefined) return;
      if (el.type === "checkbox") el.checked = !!v; else el.value = v;
    });
    alle(ark, "fieldset[data-k]").forEach(function (fs) {
      var v = d[fs.dataset.k];
      alle(fs, "input").forEach(function (i) { i.checked = (i.value === v); });
    });
    alle(ark, ".ark-hent").forEach(function (h) {
      var p = h.querySelector("p");
      var v = d[h.dataset.fra];
      p.textContent = v ? v : p.dataset.tom;
      p.classList.toggle("ark-tomt", !v);
    });
  }

  function tilMarkdown(ark, d) {
    var linjer = ["# Arbeidsark " + ark.dataset.ark + ": " + ark.dataset.tittel, ""];
    var stat = d["felles.statistikk"];
    if (stat) linjer.push("Min statistikk: " + stat, "");
    alle(ark, ".ark-del").forEach(function (del) {
      linjer.push("## " + del.querySelector("h3").textContent, "");
      alle(del, "h4, .ark-under, input[data-k]:not(.ark-hull), textarea[data-k], fieldset[data-k], .ark-setning, .ark-hent")
        .forEach(function (el) {
          if (el.tagName === "H4") { linjer.push("", "### " + el.textContent); return; }
          if (el.classList.contains("ark-under")) return;
          if (el.classList.contains("ark-hent")) {
            var v = d[el.dataset.fra];
            linjer.push("- **" + el.querySelector(".ark-lbl").textContent + ":** " + (v || "–"));
            return;
          }
          if (el.classList.contains("ark-setning")) {
            linjer.push("- **" + el.dataset.l + ":** " + (setningUtfylt(el) ? setningTekst(el) : "–"));
            return;
          }
          var val = verdi(el);
          if (el.type === "checkbox") { linjer.push("- [" + (val ? "x" : " ") + "] " + el.dataset.l); return; }
          var t = String(val || "").trim();
          if (t.indexOf("\n") >= 0) t = "\n  " + t.replace(/\n/g, "\n  ");
          linjer.push("- **" + el.dataset.l + ":** " + (t || "–"));
        });
      linjer.push("");
    });
    return linjer.join("\n").replace(/\n{3,}/g, "\n\n");
  }

  function lagre(ark, status) {
    var d = les();
    alle(ark, "input[data-k], textarea[data-k], fieldset[data-k]").forEach(function (el) {
      if (el.tagName === "INPUT" && el.type === "radio") return;
      d[el.dataset.k] = verdi(el);
    });
    alle(ark, ".ark-setning").forEach(function (s) {
      d[s.dataset.k] = setningUtfylt(s) ? setningTekst(s) : "";
    });
    alle(ark, "[data-samle]").forEach(function (g) {
      d[g.dataset.samle] = alle(g, "input:checked").map(function (i) { return i.dataset.l; }).join(", ");
    });
    d["_md." + ark.dataset.ark] = tilMarkdown(ark, d);
    d["_t." + ark.dataset.ark] = new Date().toISOString();
    var ok = skriv(d);
    if (status) {
      var t = new Date();
      status.textContent = ok
        ? "Lagret i denne nettleseren kl. " + String(t.getHours()).padStart(2, "0") + ":" + String(t.getMinutes()).padStart(2, "0")
        : "Kunne ikke lagre i nettleseren. Last ned svarene før du lukker siden.";
    }
    return d;
  }

  function lastNed(navn, tekst, type) {
    var blob = new Blob([tekst], { type: type || "text/markdown;charset=utf-8" });
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = navn;
    document.body.appendChild(a);
    a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  }

  function kopier(tekst, status) {
    function reserve() {
      var ta = document.createElement("textarea");
      ta.value = tekst; document.body.appendChild(ta); ta.select();
      try { document.execCommand("copy"); status.textContent = "Kopiert."; } catch (e) { status.textContent = "Kunne ikke kopiere."; }
      ta.remove();
    }
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(tekst).then(function () { status.textContent = "Kopiert."; }, reserve);
    } else reserve();
  }

  function startArk(ark) {
    var status = ark.querySelector(".ark-status");
    fyll(ark, les());
    var tid;
    ark.addEventListener("input", function () { clearTimeout(tid); tid = setTimeout(function () { lagre(ark, status); }, 300); });
    ark.addEventListener("change", function () { lagre(ark, status); });
    alle(ark, "input.ark-hull").forEach(function (h) {
      var bredde = function () { h.style.width = Math.max(h.placeholder.length + 2, h.value.length + 2) + "ch"; };
      h.addEventListener("input", bredde); bredde();
    });
    alle(ark, "textarea").forEach(function (t) {
      var vokse = function () { t.style.height = "auto"; t.style.height = (t.scrollHeight + 2) + "px"; };
      t.addEventListener("input", vokse); vokse();
    });
    ark.querySelector(".ark-verktoy").addEventListener("click", function (ev) {
      var b = ev.target.closest("button"); if (!b) return;
      var d = lagre(ark, status);
      var md = d["_md." + ark.dataset.ark];
      if (b.dataset.gjor === "kopier") kopier(md, status);
      if (b.dataset.gjor === "lastned") lastNed("arbeidsark-" + ark.dataset.ark + ".md", md);
      if (b.dataset.gjor === "skrivut") window.print();
      if (b.dataset.gjor === "tom" && window.confirm("Tømme alle feltene på arbeidsark " + ark.dataset.ark + "?")) {
        var dd = les();
        Object.keys(dd).forEach(function (k) {
          if (k.indexOf(ark.dataset.ark + ".") === 0 || k === "_md." + ark.dataset.ark || k === "_t." + ark.dataset.ark) delete dd[k];
        });
        skriv(dd);
        alle(ark, "input, textarea").forEach(function (el) { if (el.type === "checkbox" || el.type === "radio") el.checked = false; else if (el.dataset.k !== "felles.statistikk") el.value = ""; });
        status.textContent = "Arket er tømt.";
      }
    });
  }

  function startOversikt(rot) {
    var d = les();
    alle(document, "[data-status-ark]").forEach(function (el) {
      var t = d["_t." + el.dataset.statusArk];
      el.textContent = t ? "påbegynt " + new Date(t).toLocaleDateString("nb-NO") : "ikke påbegynt";
      el.classList.toggle("ark-pabegynt", !!t);
    });
    var status = rot.querySelector(".ark-status");
    rot.addEventListener("click", function (ev) {
      var b = ev.target.closest("button"); if (!b) return;
      var dd = les();
      if (b.dataset.gjor === "alle") {
        var deler = REKKEFOLGE.filter(function (k) { return dd["_md." + k]; }).map(function (k) { return dd["_md." + k]; });
        if (!deler.length) { status.textContent = "Du har ikke fylt ut noen arbeidsark ennå."; return; }
        lastNed("arbeidsark-alle.md", deler.join("\n\n---\n\n"));
      }
      if (b.dataset.gjor === "kopi") lastNed("arbeidsark-sikkerhetskopi.json", JSON.stringify(dd, null, 1), "application/json");
      if (b.dataset.gjor === "hent") rot.querySelector("input[type=file]").click();
      if (b.dataset.gjor === "slett" && window.confirm("Slette alle svarene på alle arbeidsarkene i denne nettleseren?")) {
        try { window.localStorage.removeItem(LS); } catch (e) { /* ingenting å gjøre */ }
        status.textContent = "Alle svar er slettet."; startOversikt(rot);
      }
    });
    var fil = rot.querySelector("input[type=file]");
    if (fil && !fil.dataset.koblet) {
      fil.dataset.koblet = "1";
      fil.addEventListener("change", function () {
        var f = fil.files[0]; if (!f) return;
        f.text().then(function (t) {
          try {
            var inn = JSON.parse(t), dd = les();
            Object.keys(inn).forEach(function (k) { dd[k] = inn[k]; });
            skriv(dd); status.textContent = "Svarene er hentet fra filen."; startOversikt(rot);
          } catch (e) { status.textContent = "Filen kunne ikke leses."; }
        });
      });
    }
  }

  function start() {
    alle(document, ".ark").forEach(startArk);
    var o = document.querySelector(".ark-oversikt");
    if (o) startOversikt(o);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start); else start();
})();
