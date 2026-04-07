window.onload = () => {
  createInputs(1, 5);
  createInputs(2, 6);
  createInputs(3, 6);

  // URL'den dönem belirle, yoksa ilk dönemi göster
  const params = new URLSearchParams(location.search);
  const hashDonem = location.hash.replace("#", "");
  if (hashDonem && document.getElementById(hashDonem)) {
    showTab(hashDonem);
  } else {
    showTab("donem1");
  }

  // URL'den notları yükle (createInputs'tan sonra olmalı)
  urldenNotlariYukle();

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

  [1, 2, 3].forEach((donem) => {
    gosterGecmis(donem);
    ekleGeriYukleButonu(donem, donem === 1 ? 5 : 6);
  });

  addClearLocalStorageButton();
  addClearFieldsButton();
};

function showTab(tabId) {
  document
    .querySelectorAll(".tab-content")
    .forEach((tab) => (tab.style.display = "none"));

  // Aktif tab butonunu vurgula
  document.querySelectorAll(".tabs button").forEach((btn) => {
    btn.classList.remove("active-tab");
  });

  document.getElementById(tabId).style.display = "block";

  // İlgili tab butonuna aktif sınıf ekle
  const tabIndex = { donem1: 0, donem2: 1, donem3: 2 };
  const buttons = document.querySelectorAll(".tabs button");
  if (tabIndex[tabId] !== undefined && buttons[tabIndex[tabId]]) {
    buttons[tabIndex[tabId]].classList.add("active-tab");
  }
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

    // Enter tuşuyla hesaplama
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        hesapla(donem, count);
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

  let sonucMetni = `Dönem ${donem} Kurul Ortalaması: ${yuvarlanmisOrtalama}\n`;

  if (yuvarlanmisOrtalama >= 75 && herKuruldan60) {
    sonucDiv.innerHTML = `
      <b>Kurul Ortalamanız: ${yuvarlanmisOrtalama}</b><br>
      🎉 Finalsiz geçtiniz! (Her komiteden ≥60, ortalama ≥75)<br>
      <img src="finalsiz-gectiniz.jpg" alt="Finalsiz geçtiniz" style="width:200px;">
      <canvas id="confetti${donem}"></canvas>
    `;
    konfetiYagdir(`confetti${donem}`);
    sonucMetni += "Finalsiz geçtiniz! 🎉";

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
    sonucMetni += `Uyarı: ${altindakiKurullar} için 60 altı. Final gerekiyor.`;

  } else {
    sonucDiv.innerHTML = `
      <b>Kurul Ortalamanız: ${yuvarlanmisOrtalama}</b><br>
      ${olusturFinalBolumleme(donem, yuvarlanmisOrtalama)}
    `;
    sonucMetni += `Kurul ort: ${yuvarlanmisOrtalama}`;
  }

  kaydetGecmis(donem, sonucMetni, notlar);
  gosterGecmis(donem);
  eklePaylasButonu(sonucDiv, sonucMetni);
  ekleUrlPaylasButonu(sonucDiv, donem, komiteSayisi);
  ekleGeriYukleButonu(donem, komiteSayisi);
}

function olusturFinalBolumleme(donem, yuvarlanmisOrtalama) {
  const yuzde60 = yuvarlanmisOrtalama * 0.6;
  const matematikselMinFinal = (60 - yuzde60) / 0.4;
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
    const donemSonuIfMin = Math.round(yuvarlanmisOrtalama * 0.6 + minFinalYuvarlanmis * 0.4);
    bilgiHtml = `
      <div style="margin-top: 8px;">
        Finalden geçmek için en az <b>${minFinalYuvarlanmis}</b> almanız gerekiyor.
        (${minFinalYuvarlanmis} aldığınızda dönem sonu başarı notunuz: <b>${donemSonuIfMin}</b>)
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

// ── YENİ: URL ile paylaşım ──────────────────────────────────────────────────

function ekleUrlPaylasButonu(sonucDiv, donem, komiteSayisi) {
  let eskiButon = sonucDiv.querySelector(".urlPaylasBtn");
  if (eskiButon) eskiButon.remove();

  const btn = document.createElement("button");
  btn.className = "urlPaylasBtn";
  btn.textContent = "🔗 Link ile Paylaş";
  btn.style.marginTop = "15px";
  btn.style.marginLeft = "10px";
  btn.style.padding = "8px 16px";
  btn.style.cursor = "pointer";

  btn.onclick = () => {
    let notlar = [];
    for (let i = 1; i <= komiteSayisi; i++) {
      let val = document.getElementById(`d${donem}_k${i}`).value;
      notlar.push(val || 0);
    }
    const params = new URLSearchParams();
    params.set(`d${donem}`, notlar.join(","));
    const url = `${location.origin}${location.pathname}?${params.toString()}#donem${donem}`;
    navigator.clipboard
      .writeText(url)
      .then(() => alert("Link kopyalandı! Arkadaşınıza gönderebilirsiniz."))
      .catch(() => alert("Kopyalama başarısız oldu."));
  };

  sonucDiv.appendChild(btn);
}

function urldenNotlariYukle() {
  const params = new URLSearchParams(location.search);
  let yuklenenDonem = null;

  [1, 2, 3].forEach((donem) => {
    const deger = params.get(`d${donem}`);
    if (!deger) return;

    const notlar = deger.split(",");
    notlar.forEach((n, i) => {
      const input = document.getElementById(`d${donem}_k${i + 1}`);
      if (input) input.value = n;
    });

    yuklenenDonem = donem;
  });

  // URL'de hangi dönem varsa onu aç
  if (yuklenenDonem) {
    showTab(`donem${yuklenenDonem}`);
  }
}

// ── YENİ: Son notları geri yükle butonu ────────────────────────────────────

function ekleGeriYukleButonu(donem, komiteSayisi) {
  const container = document.getElementById(`donem${donem}`);
  if (!container) return;

  // Varsa eskisini sil
  const eskiButon = container.querySelector(".geriYukleBtn");
  if (eskiButon) eskiButon.remove();

  let key = `odunot_gecmis_donem${donem}`;
  let gecmis = JSON.parse(localStorage.getItem(key)) || [];
  if (gecmis.length === 0) return; // geçmiş yoksa butonu gösterme

  const btn = document.createElement("button");
  btn.className = "geriYukleBtn";
  btn.textContent = "↩️ Son Notları Geri Yükle";
  btn.style.marginTop = "8px";
  btn.style.cursor = "pointer";

  btn.onclick = () => {
    const sonNotlar = gecmis[0].notlar; // en son hesaplanan
    sonNotlar.forEach((n, i) => {
      const input = document.getElementById(`d${donem}_k${i + 1}`);
      if (input) input.value = n;
    });
  };

  // Hesapla butonunun hemen arkasına ekle
  const hesaplaBtn = container.querySelector(`button[onclick^="hesapla"]`);
  if (hesaplaBtn) {
    hesaplaBtn.insertAdjacentElement("afterend", btn);
  }
}

// ── Mevcut: Geçmişi / Alanları temizle butonları ──────────────────────────

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
        // Sadece bu döneme ait geçmişi sil
        const donemNo = donem.replace("donem", "");
        localStorage.removeItem(`odunot_gecmis_donem${donemNo}`);
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
