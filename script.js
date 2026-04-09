window.onload = () => {
  createInputs(1, 5);
  createInputs(2, 6);
  createInputs(3, 6);
  showTab("donem1");

  const darkModeToggle = document.getElementById("darkModeToggle");

  darkModeToggle.addEventListener("click", () => {
    document.body.classList.toggle("dark-mode");
    if (document.body.classList.contains("dark-mode")) {
      darkModeToggle.textContent = "☀️ Gece Modu Kapat";
      localStorage.setItem("darkMode", "enabled");
    } else {
      darkModeToggle.textContent = "🌙 Gece Modu Aç";
      localStorage.setItem("darkMode", "disabled");
    }
  });

  if (localStorage.getItem("darkMode") === "enabled") {
    document.body.classList.add("dark-mode");
    darkModeToggle.textContent = "☀️ Gece Modu Kapat";
  }

  [1, 2, 3].forEach((donem) => gosterGecmis(donem));
};

function showTab(tabId) {
  document
    .querySelectorAll(".tab-content")
    .forEach((tab) => (tab.style.display = "none"));
  document.getElementById(tabId).style.display = "block";
}

function createInputs(donem, count) {
  const container = document.getElementById(`inputs${donem}`);
  container.innerHTML = "";

  for (let i = 1; i <= count; i++) {
    const input = document.createElement("input");
    input.type = "number";
    input.min = 0;
    input.max = 100;
    input.placeholder = `Komite ${i}`;
    input.id = `d${donem}_k${i}`;
    input.style.width = "90px";
    container.appendChild(input);

    input.addEventListener("input", () => {
      if (input.value.length > 3) {
        input.value = input.value.slice(0, 3);
      }
      if (parseFloat(input.value) > 100) {
        input.value = 100;
      }
    });
  }
}

function hesapla(donem, komiteSayisi) {
  let notlar = [];
  for (let i = 1; i <= komiteSayisi; i++) {
    let val = parseFloat(document.getElementById(`d${donem}_k${i}`).value);
    if (isNaN(val) || val < 0 || val > 100) {
      alert(`Komite ${i} için geçerli bir not girin (0-100 arası)`);
      return;
    }
    notlar.push(val);
  }

  let yuvarlanmisNotlar = notlar.map((n) => Math.round(n));
  let hamOrtalama = yuvarlanmisNotlar.reduce((a, b) => a + b, 0) / komiteSayisi;
  let yuvarlanmisOrtalama = Math.round(hamOrtalama);

  const sonucDiv = document.getElementById(`sonuc${donem}`);
  sonucDiv.innerHTML = "";

  const herKuruldan60 = yuvarlanmisNotlar.every((n) => n >= 60);

  // Zengin kopyalama metni
  const _notlarStr = notlar.map((n, i) => `Komite ${i + 1}: ${Math.round(n)}`).join("\n");
  const _yuzde60 = yuvarlanmisOrtalama * 0.6;
  const _minFinalHam = (59.5 - _yuzde60) / 0.4;
  const _minFinal = Math.max(50, _minFinalHam);
  const _minFinalYuv = Math.ceil(_minFinal);
  let _durumStr = "";
  if (yuvarlanmisOrtalama >= 75 && herKuruldan60) {
    _durumStr = "Sonuç: FİNALSİZ GEÇTİNİZ 🎉";
  } else if (_minFinalYuv > 100) {
    _durumStr = "Sonuç: Geçme imkânsız 😢";
  } else if (_minFinalYuv <= 50) {
    const _d50 = Math.round(_yuzde60 + 50 * 0.4);
    _durumStr = `Finalden 50 almanız yeterli. (50 aldığınızda dönem sonu başarı notu: ${_d50})`;
  } else {
    const _hamD = _yuzde60 + _minFinalYuv * 0.4;
    const _d = Math.round(_hamD);
    const _dStr = _hamD % 1 === 0 ? `${_d}` : `${_hamD.toFixed(1)} → ${_d}`;
    _durumStr = `Finalden geçmek için en az ${_minFinalYuv} almanız gerekiyor. (Dönem sonu başarı notu: ${_dStr})`;
  }
  let sonucMetni = [
    `📊 ODÜ Tıp Dönem ${donem} Sonuçları`,
    `━━━━━━━━━━━━━━━━━━━━`,
    _notlarStr,
    `━━━━━━━━━━━━━━━━━━━━`,
    `Kurul Ortalaması: ${yuvarlanmisOrtalama}`,
    _durumStr,
    `━━━━━━━━━━━━━━━━━━━━`,
    `odutipnot.com.tr`
  ].join("\n");

  if (yuvarlanmisOrtalama >= 75 && herKuruldan60) {
    sonucDiv.innerHTML = `
      <b>Kurul Ortalamanız: ${yuvarlanmisOrtalama}</b><br>
      🎉 Finalsiz geçtiniz! (Her komiteden ≥60, ortalama ≥75)<br>
      <img src="finalsiz-gectiniz.jpg" alt="Finalsiz geçtiniz" style="width:200px;">
      <canvas id="confetti${donem}"></canvas>
    `;
    konfetiYagdir(`confetti${donem}`);


  } else if (yuvarlanmisOrtalama >= 75 && !herKuruldan60) {
    let altindakiKurullar = yuvarlanmisNotlar
      .map((n, i) => (n < 60 ? `Komite ${i + 1} (${n})` : null))
      .filter(Boolean)
      .join(", ");

    sonucDiv.innerHTML = `
      <b>Kurul Ortalamanız: ${yuvarlanmisOrtalama}</b><br>
      ⚠️ Ortalama 75 ve üzeri <b>ama</b> şu komite(ler)den 60 altı not aldınız: <b>${altindakiKurullar}</b><br>
      Yönetmelik gereği finalsiz geçme hakkı yok — finale girmeniz gerekiyor.<br><br>
      ${olusturFinalBolumleme(donem, yuvarlanmisOrtalama)}
    `;


  } else {
    sonucDiv.innerHTML = `
      <b>Kurul Ortalamanız: ${yuvarlanmisOrtalama}</b><br>
      ${olusturFinalBolumleme(donem, yuvarlanmisOrtalama)}
    `;

  }

  kaydetGecmis(donem, sonucMetni, notlar);
  gosterGecmis(donem);
  eklePaylasButonu(sonucDiv, sonucMetni);
  ekleAciklamaButonu(sonucDiv, donem, notlar, yuvarlanmisOrtalama);
}

function olusturFinalBolumleme(donem, yuvarlanmisOrtalama) {
  const yuzde60 = yuvarlanmisOrtalama * 0.6;

  // DÜZELTİLDİ: 60 yerine 59.5 kullanılıyor.
  // Yönetmeliğe göre dönem sonu başarı notu virgülden sonra ≥5 ise yukarı yuvarlanır.
  // Yani Math.round(ham) >= 60 olması için ham >= 59.5 yeterli.
  const matematikselMinFinal = (59.5 - yuzde60) / 0.4;
  const minFinal = Math.max(50, matematikselMinFinal);
  const minFinalYuvarlanmis = Math.ceil(minFinal);
  const donemSonuIf50 = Math.round(yuvarlanmisOrtalama * 0.6 + 50 * 0.4);

  let bilgiHtml = "";
  if (minFinalYuvarlanmis > 100) {
    bilgiHtml = `
      <div style="font-size: 16px; color: var(--danger, #d9534f); margin-top: 8px;">
        😢 Geçme imkânsız — <b>sınıfta kaldınız.</b>
      </div>
    `;
  } else if (minFinalYuvarlanmis <= 50) {
    const dsbn = donemSonuIf50;
    bilgiHtml = `
      <div style="margin-top: 8px;">
        Finalden <b>50</b> almanız yeterli.
        (50 aldığınızda dönem sonu başarı notunuz: <b>${dsbn}</b>)
      </div>
    `;
  } else {
    const hamDsbnMin = yuvarlanmisOrtalama * 0.6 + minFinalYuvarlanmis * 0.4;
    const donemSonuIfMin = Math.round(hamDsbnMin);
    bilgiHtml = `
      <div style="margin-top: 8px;">
        Finalden geçmek için en az <b>${minFinalYuvarlanmis}</b> almanız gerekiyor.
        (${minFinalYuvarlanmis} aldığınızda dönem sonu başarı notunuz: <b>${hamDsbnMin % 1 === 0 ? donemSonuIfMin : hamDsbnMin.toFixed(1)} → ${donemSonuIfMin}</b>)
      </div>
    `;
  }

  return `
    ${bilgiHtml}
    <div style="margin-top: 16px; padding: 12px; border: 1px solid #ccc; border-radius: 8px; background: rgba(0,0,0,0.03);">
      <b>Final veya Bütünleme notunuzu girin:</b><br><br>
      <label>
        <input type="radio" name="finalTur_${donem}" value="final" checked onchange="guncelleFinalSonuc(${donem}, ${yuvarlanmisOrtalama})">
        Final
      </label>
      &nbsp;&nbsp;
      <label>
        <input type="radio" name="finalTur_${donem}" value="butunleme" onchange="guncelleFinalSonuc(${donem}, ${yuvarlanmisOrtalama})">
        Bütünleme
      </label>
      <br><br>
      <input
        type="number" min="0" max="100"
        id="finalNotu_${donem}"
        placeholder="Notunuzu girin (0-100)"
        style="width: 160px;"
        oninput="guncelleFinalSonuc(${donem}, ${yuvarlanmisOrtalama})"
      >
      <div id="finalSonucDetay_${donem}" style="margin-top: 10px;"></div>
    </div>
  `;
}

function guncelleFinalSonuc(donem, yuvarlanmisOrtalama) {
  const input = document.getElementById(`finalNotu_${donem}`);
  if (!input) return;

  if (input.value.length > 3) input.value = input.value.slice(0, 3);
  if (parseFloat(input.value) > 100) input.value = 100;

  const detayDiv = document.getElementById(`finalSonucDetay_${donem}`);
  if (!detayDiv) return;

  const val = parseFloat(input.value);
  if (isNaN(val)) {
    detayDiv.innerHTML = "";
    return;
  }

  const turRadio = document.querySelector(`input[name="finalTur_${donem}"]:checked`);
  const tur = turRadio ? turRadio.value : "final";
  const etiket = tur === "butunleme" ? "Bütünleme" : "Final";

  const dsbn = Math.round(yuvarlanmisOrtalama * 0.6 + val * 0.4);

  if (val >= 50 && dsbn >= 60) {
    detayDiv.innerHTML = `✅ ${etiket} notunuz ${val} → Dönem sonu başarı notunuz: <b>${dsbn}</b> — <b>Geçtiniz!</b>`;
  } else {
    let sebep = [];
    if (val < 50) sebep.push(`${etiket} barajı olan 50'nin altında (${val})`);
    if (dsbn < 60) sebep.push(`Dönem sonu başarı notu 60'ın altında (${dsbn})`);
    detayDiv.innerHTML = `❌ ${etiket} notunuz ${val} → Dönem sonu başarı notunuz: <b>${dsbn}</b> — <b>Başarısız.</b><br><small>${sebep.join(", ")}</small>`;
  }
}

function konfetiYagdir(canvasId) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  canvas.width = 300;
  canvas.height = 200;
  const ctx = canvas.getContext("2d");

  let confetti = Array.from({ length: 100 }, () => ({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    color: `hsl(${Math.random() * 360}, 70%, 60%)`,
    size: Math.random() * 5 + 2,
  }));

  let gravity = 1;
  let angle = 0;

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    confetti.forEach((p) => {
      p.y += gravity;
      p.x += Math.sin(angle) * 2;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      if (p.y > canvas.height) p.y = -10;
    });
    angle += 0.01;
    requestAnimationFrame(draw);
  }
  draw();
}

function toggleDestek() {
  const kutu = document.getElementById("destekKutusu");
  kutu.style.display = kutu.style.display === "block" ? "none" : "block";
}

// ───────────────────────────────────────────────
// HESAPLAMA AÇIKLAMA POPUP
// ───────────────────────────────────────────────

function aciklamaGoster(donem, notlar, yuvarlanmisOrtalama) {
  const eskiOverlay = document.getElementById("aciklamaOverlay");
  if (eskiOverlay) eskiOverlay.remove();

  const yuvarlanmisNotlar = notlar.map((n) => Math.round(n));
  const komiteSayisi = notlar.length;
  const hamOrtalama = yuvarlanmisNotlar.reduce((a, b) => a + b, 0) / komiteSayisi;
  const herKuruldan60 = yuvarlanmisNotlar.every((n) => n >= 60);

  // Adım 1: Her notun yuvarlanması
  const adim1Satirlar = notlar
    .map((n, i) => {
      const yuv = Math.round(n);
      return `<tr>
        <td style="padding:4px 10px;"">Komite ${i + 1}</td>
        <td style="padding:4px 10px;">${n}</td>
        <td style="padding:4px 10px;"><b>${yuv}</b></td>
      </tr>`;
    })
    .join("");

  // Adım 2: Ortalama
  const toplamStr = yuvarlanmisNotlar.join(" + ");
  const toplam = yuvarlanmisNotlar.reduce((a, b) => a + b, 0);
  const adim2 = `
    <p>(${toplamStr}) = <b>${toplam}</b><br>
    ${toplam} ÷ ${komiteSayisi} = <b>${hamOrtalama.toFixed(4)}…</b><br>
    Yuvarlanır → <b>${yuvarlanmisOrtalama}</b></p>`;

  // Adım 3: Finalsiz geçme
  let adim3Html = "";
  if (yuvarlanmisOrtalama >= 75 && herKuruldan60) {
    adim3Html = `
      <p>✅ Kurul ortalaması <b>≥75</b> <em>ve</em> her komiteden <b>≥60</b> alındığı için
      yönetmelik gereği (Madde 20/7) finale girmeden başarılı sayılırsınız.<br>
      Kurul ortalamanız (<b>${yuvarlanmisOrtalama}</b>) dönem sonu başarı notunuz olarak kabul edilir.</p>`;
  } else if (yuvarlanmisOrtalama >= 75 && !herKuruldan60) {
    const altindakiler = yuvarlanmisNotlar
      .map((n, i) => (n < 60 ? `Komite ${i + 1} (${n})` : null))
      .filter(Boolean)
      .join(", ");
    adim3Html = `
      <p>⚠️ Ortalama <b>≥75</b> ama şu komite(ler)den 60 altı not var: <b>${altindakiler}</b><br>
      Yönetmelik Madde 20/7 gereği <u>her komiteden ≥60 şartı</u> sağlanmadığından
      finalsiz geçme hakkı yoktur → finale girilmesi gerekir.</p>`;
  } else {
    adim3Html = `
      <p>Kurul ortalaması <b>${yuvarlanmisOrtalama}</b> — 75'in altında olduğundan
      finale girilmesi gerekiyor.</p>`;
  }

  // Adım 4: Dönem sonu başarı notu formülü
  const adim4 = `
    <p><b>Dönem Sonu Başarı Notu</b> = Kurul Ortalaması × %60 + Final Notu × %40</p>
    <p>= ${yuvarlanmisOrtalama} × 0.60 + Final × 0.40</p>
    <p>= <b>${(yuvarlanmisOrtalama * 0.6).toFixed(1)}</b> + Final × 0.40</p>
    <p>Geçebilmek için bu sonucun <b>≥60</b> olması <em>ve</em> finalden <b>≥50</b> alınması gerekir (Madde 20/6).</p>`;

  // Adım 5: Minimum final hesabı
  const yuzde60 = yuvarlanmisOrtalama * 0.6;
  const matematikselMinFinal = (59.5 - yuzde60) / 0.4;
  const minFinal = Math.max(50, matematikselMinFinal);
  const minFinalYuvarlanmis = Math.ceil(minFinal);

  let adim5Html = "";
  if (!(yuvarlanmisOrtalama >= 75 && herKuruldan60)) {
    if (minFinalYuvarlanmis > 100) {
      adim5Html = `
        <p>Hesap: (59.5 − ${yuzde60.toFixed(1)}) ÷ 0.40 = <b>${matematikselMinFinal.toFixed(2)}</b><br>
        Bu değer 100'ün üzerinde olduğundan geçmek <b>mümkün değildir</b>.</p>`;
    } else {
      const hamDsbnMin = yuvarlanmisOrtalama * 0.6 + minFinalYuvarlanmis * 0.4;
      const donemSonuIfMin = Math.round(hamDsbnMin);
      adim5Html = `
        <p>Dönem sonu başarı notunun ≥60 olması için:<br>
        ${yuzde60.toFixed(1)} + Final × 0.40 ≥ 59.5<br>
        Final × 0.40 ≥ ${(59.5 - yuzde60).toFixed(1)}<br>
        Final ≥ ${matematikselMinFinal.toFixed(2)}<br>
        50 barajı ile karşılaştır → max(50, ${matematikselMinFinal.toFixed(2)}) = ${minFinal.toFixed(2)}<br>
        Yukarı yuvarla → <b>${minFinalYuvarlanmis}</b><br><br>
        Kontrol: ${yuvarlanmisOrtalama} × 0.60 + ${minFinalYuvarlanmis} × 0.40
        = ${yuzde60.toFixed(1)} + ${(minFinalYuvarlanmis * 0.4).toFixed(1)}
        = <b>${hamDsbnMin % 1 === 0 ? donemSonuIfMin : hamDsbnMin.toFixed(1)} → ${donemSonuIfMin}</b> ✅</p>
        <p style="color:#888;font-size:13px;">💡 Neden 59.5? Yönetmeliğe göre ondalık kısmı ≥0.5 olan not yukarı yuvarlanır.
        Bu yüzden 59.5 → 60 olur ve geçer sayılırsınız.</p>`;
    }
  }

  // Adım 6: Yuvarlama kuralı
  const adim6 = `
    <p>Yönetmelik Madde 20/6:<br>
    <em>"Dönem sonu başarı notu virgülden sonraki ilk rakam 5 ve üzerinde ise bir üst,
    5'ten küçük ise bir alt en yakın tam sayıya tamamlanır."</em></p>
    <table style="border-collapse:collapse;">
      <tr><td style="padding:3px 12px;">59.5</td><td>→</td><td style="padding:3px 12px;color:green;"><b>60 ✅ Geçer</b></td></tr>
      <tr><td style="padding:3px 12px;">59.4</td><td>→</td><td style="padding:3px 12px;color:red;"><b>59 ❌ Geçmez</b></td></tr>
      <tr><td style="padding:3px 12px;">62.0</td><td>→</td><td style="padding:3px 12px;color:green;"><b>62 ✅ Geçer</b></td></tr>
    </table>`;

  const adimSayisi = adim5Html ? 6 : 5;

  const icerik = `
    <div id="aciklamaOverlay" style="
      position: fixed; inset: 0; background: rgba(0,0,0,0.55);
      z-index: 9999; display: flex; align-items: center; justify-content: center;
      padding: 16px; box-sizing: border-box;">
      <div style="
        background: var(--bg, #fff); color: var(--text, #222);
        border-radius: 12px; max-width: 620px; width: 100%;
        max-height: 85vh; overflow-y: auto;
        padding: 28px; box-shadow: 0 8px 32px rgba(0,0,0,0.3);
        position: relative; font-size: 15px; line-height: 1.6;">

        <button onclick="document.getElementById('aciklamaOverlay').remove()"
          style="position:absolute;top:12px;right:16px;background:none;border:none;
          font-size:22px;cursor:pointer;line-height:1;opacity:0.6;" title="Kapat">✕</button>

        <h3 style="margin-top:0;border-bottom:2px solid #4a90e2;padding-bottom:8px;">
          📐 Hesaplama Nasıl Yapılıyor?
        </h3>

        <h4>1. Her Komite Notu Yuvarlanır</h4>
        <table style="border-collapse:collapse;width:auto;margin-bottom:8px;border:1px solid #ccc;">
          <thead>
            <tr style="background:rgba(0,0,0,0.07);">
              <th style="padding:5px 10px;text-align:left;border:1px solid #ccc;">Komite</th>
              <th style="padding:5px 10px;text-align:left;border:1px solid #ccc;">Girilen Not</th>
              <th style="padding:5px 10px;text-align:left;border:1px solid #ccc;">Yuvarlanmış</th>
            </tr>
          </thead>
          <tbody>${adim1Satirlar}</tbody>
        </table>

        <h4>2. Kurul Ortalaması Hesaplanır</h4>
        ${adim2}

        <h4>3. Finalsiz Geçme Kontrolü (Madde 20/7)</h4>
        ${adim3Html}

        <h4>4. Dönem Sonu Başarı Notu Formülü (Madde 20/6)</h4>
        ${adim4}

        ${adim5Html ? `<h4>5. Minimum Final Notu Hesabı</h4>${adim5Html}` : ""}

        <h4>${adim5Html ? "6" : "5"}. Yuvarlama Kuralı</h4>
        ${adim6}

        <div style="text-align:right;margin-top:20px;">
          <button onclick="document.getElementById('aciklamaOverlay').remove()"
            style="padding:8px 22px;cursor:pointer;border-radius:6px;
            background:#4a90e2;color:#fff;border:none;font-size:14px;font-weight:bold;">
            Kapat
          </button>
        </div>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML("beforeend", icerik);

  document.getElementById("aciklamaOverlay").addEventListener("click", function (e) {
    if (e.target === this) this.remove();
  });
}

function ekleAciklamaButonu(sonucDiv, donem, notlar, yuvarlanmisOrtalama) {
  const eskiBtn = sonucDiv.querySelector(".aciklama-btn");
  if (eskiBtn) eskiBtn.remove();

  const btn = document.createElement("button");
  btn.className = "aciklama-btn";
  btn.innerHTML = "❓ Nasıl hesaplandı?";
  btn.title = "Hesaplama adımlarını göster";
  btn.style.cssText = `
    margin-top: 10px; margin-left: 8px; padding: 5px 12px;
    cursor: pointer; border-radius: 6px; border: 1px solid #4a90e2;
    background: transparent; color: #4a90e2; font-size: 13px;
  `;
  btn.onclick = () => aciklamaGoster(donem, notlar, yuvarlanmisOrtalama);
  sonucDiv.appendChild(btn);
}

function kopyala(id) {
  const yazi = document.getElementById(id).innerText;
  navigator.clipboard
    .writeText(yazi)
    .then(() => alert("Kopyalandı: " + yazi))
    .catch((err) => alert("Kopyalama başarısız: " + err));
}

function kaydetGecmis(donem, sonucMetni, notlar) {
  let key = `odunot_gecmis_donem${donem}`;
  let gecmis = JSON.parse(localStorage.getItem(key)) || [];
  gecmis.unshift({
    tarih: new Date().toLocaleString(),
    sonuc: sonucMetni,
    notlar: notlar,
  });
  if (gecmis.length > 5) gecmis.pop();
  localStorage.setItem(key, JSON.stringify(gecmis));
}

function gosterGecmis(donem) {
  const sonucDiv = document.getElementById(`sonuc${donem}`);
  let key = `odunot_gecmis_donem${donem}`;
  let gecmis = JSON.parse(localStorage.getItem(key)) || [];

  let eskiListe = sonucDiv.querySelector(".gecmis-listesi");
  if (eskiListe) eskiListe.remove();

  if (gecmis.length === 0) return;

  let ul = document.createElement("ul");
  ul.className = "gecmis-listesi";
  ul.style.textAlign = "left";
  ul.style.marginTop = "20px";
  ul.style.maxHeight = "200px";
  ul.style.overflowY = "auto";
  ul.style.paddingLeft = "15px";
  ul.style.borderTop = "1px solid #ccc";

  gecmis.forEach((item) => {
    let li = document.createElement("li");
    li.style.marginBottom = "8px";
    li.className = "gecmis-item";
    li.innerHTML = `<b>${item.tarih}</b>: ${item.sonuc.replace(/\n/g, "<br>")} <br> <i>${item.notlar.join("<br> ")}</i>`;
    ul.appendChild(li);
  });

  sonucDiv.appendChild(ul);
}

function eklePaylasButonu(sonucDiv, sonucMetni) {
  let eskiButon = document.getElementById("paylasButon");
  if (eskiButon) eskiButon.remove();

  const btn = document.createElement("button");
  btn.id = "paylasButon";
  btn.textContent = "Sonucu Kopyala / Paylaş";
  btn.style.marginTop = "15px";
  btn.style.padding = "8px 16px";
  btn.style.cursor = "pointer";

  btn.onclick = () => {
    navigator.clipboard
      .writeText(sonucMetni)
      .then(() => alert("Sonuç kopyalandı, istediğiniz platformda paylaşabilirsiniz!"))
      .catch(() => alert("Kopyalama başarısız oldu."));
  };

  sonucDiv.appendChild(btn);
}

const donemler = ["donem1", "donem2", "donem3"];

function addClearLocalStorageButton() {
  donemler.forEach((donem) => {
    const container = document.getElementById(donem);
    const hesaplaBtn = container.querySelector('button[onclick^="hesapla"]');
    if (!hesaplaBtn) return;

    const existingBtn = container.querySelector("#clearLocalStorageBtn");
    if (existingBtn) existingBtn.remove();

    const btn = document.createElement("button");
    btn.id = "clearLocalStorageBtn";
    btn.textContent = "Geçmişi Temizle";
    btn.style.marginLeft = "15px";
    btn.style.cursor = "pointer";
    btn.onclick = () => {
      if (confirm("Geçmiş sonuçlarınızı temizlemek istediğinize emin misiniz?")) {
        localStorage.clear();
        alert("Geçmiş başarıyla temizlendi.");
        location.reload();
      }
    };

    hesaplaBtn.insertAdjacentElement("afterend", btn);
  });
}

function addClearFieldsButton() {
  donemler.forEach((donem) => {
    const container = document.getElementById(donem);
    const hesaplaBtn = container.querySelector('button[onclick^="hesapla"]');
    if (!hesaplaBtn) return;

    const existingBtn = container.querySelector("#clearFieldsBtn");
    if (existingBtn) existingBtn.remove();

    const btn = document.createElement("button");
    btn.id = "clearFieldsBtn";
    btn.textContent = "Alanları Temizle";
    btn.style.marginLeft = "15px";
    btn.style.cursor = "pointer";
    btn.onclick = () => {
      if (confirm("Tüm alanları temizlemek istediğinize emin misiniz?")) {
        const inputs = container.querySelectorAll("input[type='text'], input[type='number']");
        inputs.forEach((input) => (input.value = ""));
      }
    };

    hesaplaBtn.insertAdjacentElement("afterend", btn);
  });
}

addClearLocalStorageButton();
addClearFieldsButton();
