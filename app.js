(function () {
  const esc = (s) => String(s == null ? "" : s)
    .replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");

  function pageHTML(p) {
    let body = "";
    if (p.type === "cover") {
      body = `<div class="card">
        <h1 class="cover-title">${esc(p.title)}</h1>
        <p class="cover-sub">${esc(p.sub)}</p>
        <div class="rule"></div>
        <p class="ar" dir="rtl" lang="ar">${esc(p.ar)}</p>
        <p class="cover-en">&ldquo;${esc(p.en)}&rdquo;</p>
        <p class="cover-ref">${esc(p.ref)}</p>
      </div>`;
    } else if (p.type === "foreword") {
      const paras = p.paras.map(x => `<p>${esc(x)}</p>`).join("");
      body = `<div class="card fw"><h2>Foreword</h2>${paras}</div>`;
    } else if (p.type === "index") {
      const secs = p.sections.map(s => {
        const items = s.items.map(it =>
          `<li class="idx-item" data-num="${it.num}"><span class="idx-n">${it.num}</span>${esc(it.title)}</li>`
        ).join("");
        return `<div class="idx-sec"><h3>${esc(s.section)}</h3><ul>${items}</ul></div>`;
      }).join("");
      body = `<div class="card idx"><h2>Contents</h2><div class="idx-wrap">${secs}</div></div>`;
    } else if (p.type === "divider") {
      body = `<div class="card"><h2>${esc(p.name)}</h2></div>`;
    } else if (p.type === "closing") {
      body = `<div class="card"><p class="ct">&ldquo;${esc(p.text)}&rdquo;</p>
        <p class="ca">&mdash; ${esc(p.attr)}</p></div>`;
    } else { // dua
      const translit = p.translit ? `<p class="translit">${esc(p.translit)}</p>` : "";
      const note = p.note ? `<p class="note">${esc(p.note)}</p>` : "";
      const ref = p.url
        ? `<p class="ref"><a href="${esc(p.url)}" target="_blank" rel="noopener">${esc(p.ref)} &#8599;</a></p>`
        : `<p class="ref"><span>${esc(p.ref)}</span></p>`;
      body = `<div class="card">
        <div class="num">${p.num}</div>
        <div class="title">${esc(p.title)}</div>
        <div class="rule"></div>
        <p class="ar" dir="rtl" lang="ar">${esc(p.ar)}</p>
        ${translit}
        <p class="translation">${esc(p.translation)}</p>
        ${note}${ref}
      </div>`;
    }
    const cls = "pg " + (["divider","closing"].includes(p.type) ? p.type : "");
    return `<div class="${cls}"><div class="bg" style="background-image:url('${p.bg}')"></div><div class="wash"></div><div class="inner">${body}</div></div>`;
  }

  function dims() {
    // Portrait A5 ratio (148:210). Fit within viewport.
    const vw = window.innerWidth, vh = window.innerHeight - 70;
    const ratio = 148 / 210;
    let h = Math.min(vh * 0.96, 760);
    let w = h * ratio;
    if (w > vw * 0.96) { w = vw * 0.96; h = w / ratio; }
    return { w: Math.round(w), h: Math.round(h) };
  }

  const BOOK = window.BOOK || [];
  const el = document.getElementById("book");
  const { w, h } = dims();

  const pageFlip = new St.PageFlip(el, {
    width: w, height: h,
    size: "stretch",
    minWidth: 260, maxWidth: 760,
    minHeight: 360, maxHeight: 1080,
    maxShadowOpacity: 0.5,
    showCover: true,
    mobileScrollSupport: false,
    usePortrait: true,
    drawShadow: true,
    flippingTime: 700,
  });

  pageFlip.loadFromHTML ? null : null; // using fromHTML below
  const html = BOOK.map(pageHTML).join("");
  el.innerHTML = html;
  pageFlip.loadFromHTML(el.querySelectorAll(".pg"));

  const info = document.getElementById("pageinfo");
  function updateInfo() {
    const cur = pageFlip.getCurrentPageIndex() + 1;
    info.textContent = cur + " / " + BOOK.length;
  }
  updateInfo();
  pageFlip.on("flip", updateInfo);

  document.getElementById("prev").onclick = () => pageFlip.flipPrev();
  document.getElementById("next").onclick = () => pageFlip.flipNext();

  // Map dua number -> page index, so index entries can jump to the dua
  const numToPage = {};
  BOOK.forEach((p, i) => { if (p.type === "dua") numToPage[p.num] = i; });
  el.addEventListener("click", (e) => {
    const item = e.target.closest(".idx-item");
    if (item) {
      const n = parseInt(item.getAttribute("data-num"), 10);
      if (numToPage[n] != null) pageFlip.flip(numToPage[n]);
    }
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft") pageFlip.flipPrev();
    if (e.key === "ArrowRight") pageFlip.flipNext();
  });

  let rt;
  window.addEventListener("resize", () => {
    clearTimeout(rt);
    rt = setTimeout(() => { const d = dims(); pageFlip.update({ width: d.w, height: d.h }); }, 200);
  });
})();
