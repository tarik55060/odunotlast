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
    container.appendChild(input);

    // Düzeltme #3: 100 girilebilmesi için max 3 karakter (0-100 arası)
    input.addEventListener("input", () => {
      if (input.value.length > 3) {
        input.value = input.value.slice(0, 3);
      }
      // 100'ü aşmasın
      if (parseFloat(input.value) > 100) {
        input.value = 100;
      }
    });
  }

  // Bütünleme notu alanı
  const butunlemeLabel = document.createElement("label");
  butunlemeLabel.style.display = "block";
  butunlemeLabel.style.marginTop = "12px";
  butunlemeLabel.style.fontSize = "0.9em";
  butunlemeLabel.style.color = "#888";
  butunlemeLabel.textContent = "Bütünleme notu (opsiyonel — girersen final yerine kullanılır):";
  butunlemeLabel.htmlFor = `d${donem}_butunleme`;
  container.appendChild(butunlemeLabel);

  const butunlemeInput = document.createElement("input");
  butunlemeInput.type = "number";
  butunlemeInput.min = 0;
  butunlemeInput.max = 100;
  butunlemeInput.placeholder = "Bütünleme notu";
  butunlemeInput.id = `d${donem}_butunleme`;
  butunlemeInput.style.marginTop = "4px";
  container.appendChild(butunlemeInput);

  butunlemeInput.addEventListener("input", () => {
    if (butunlemeInput.value.length > 3) {
      butunlemeInput.value = butunlemeInput.value.slice(0, 3);
    }
    if (parseFloat(butunlemeInput.value) > 100) {
      butunlemeInput.value = 100;
    }
  });
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

  // Bütünleme notu varsa al
  const butunlemeInput = document.getElementById(`d${donem}_butunleme`);
  let butunlemeNotu = null;
  if (butunlemeInput && butunlemeInput.value !== "") {
    let bVal = parseFloat(butunlemeInput.value);
    if (!isNaN(bVal) && bVal >= 0 && bVal <= 100) {
      butunlemeNotu = bVal;
    }
  }

  // Düzeltme #5: Her kurul notu önce tek tek yuvarlanır (yönetmelik md. 20/3)
  let yuvarlanmisNotlar = notlar.map((n) => Math.round(n));

  // Ortalama: yuvarlanmış notların ortalaması, sonra tekrar yuvarla (md. 20/5)
  let hamOrtalama = yuvarlanmisNotlar.reduce((a, b) => a + b, 0) / komiteSayisi;
  let yuvarlanmisOrtalama = Math.round(hamOrtalama);

  const sonucDiv = document.getElementById(`sonuc${donem}`);
  sonucDiv.innerHTML = "";

  let sonucMetni = `Dönem ${donem} Kurul Ortalaması: ${yuvarlanmisOrtalama}\n`;

  // Düzeltme #1: Finalsiz geçme — hem ortalama >= 75 HEM DE her kuruldan >= 60 (md. 20/7)
  const herKuruldan60 = yuvarlanmisNotlar.every((n) => n >= 60);

  if (yuvarlanmisOrtalama >= 75 && herKuruldan60) {
    // Finalsiz geçti
    sonucDiv.innerHTML = `
      <b>Kurul Ortalamanız: ${yuvarlanmisOrtalama}</b><br>
      🎉 Finalsiz geçtiniz! (Her komiteden ≥60, ortalama ≥75)<br>
      <img src="finalsiz-gectiniz.jpg" alt="Finalsiz geçtiniz" style="width:200px;">
      <canvas id="confetti${donem}"></canvas>
    `;
    konfetiYagdir(`confetti${donem}`);
    sonucMetni += "Finalsiz geçtiniz! 🎉";

  } else if (yuvarlanmisOrtalama >= 75 && !herKuruldan60) {
    // Ortalama 75+ ama bazı kurullardan 60 altı var — finalsiz geçemiyor, uyarı ver
    let altindakiKurullar = yuvarlanmisNotlar
      .map((n, i) => (n < 60 ? `Komite ${i + 1} (${n})` : null))
      .filter(Boolean)
      .join(", ");

    // Yine de final gerekiyor, hesapla
    const { mesaj, detay } = finalHesapla(yuvarlanmisOrtalama, butunlemeNotu);

    sonucDiv.innerHTML = `
      <b>Kurul Ortalamanız: ${yuvarlanmisOrtalama}</b><br>
      ⚠️ Ortalama 75 ve üzeri <b>ama</b> şu komite(ler)den 60 altı not aldınız: <b>${altindakiKurullar}</b><br>
      Yönetmelik gereği finalsiz geçme hakkı yok — finale girmeniz gerekiyor.<br><br>
      ${mesaj}
    `;
    sonucMetni += `Uyarı: ${altindakiKurullar} için 60 altı. ${detay}`;

  } else {
    // Normal final / bütünleme hesabı
    const { mesaj, detay, html } = finalHesapla(yuvarlanmisOrtalama, butunlemeNotu);
    sonucDiv.innerHTML = `<b>Kurul Ortalamanız: ${yuvarlanmisOrtalama}</b><br>${html || mesaj}`;
    sonucMetni += detay;
  }

  kaydetGecmis(donem, sonucMetni, notlar);
  gosterGecmis(donem);
  cizBarChart(donem, notlar);
  eklePaylasButonu(sonucDiv, sonucMetni);
}

/**
 * Final veya bütünleme notu gereksinimini hesaplar.
 * Yönetmelik md. 20/6:
 *   dönem sonu başarı notu = kurul_ort * 0.6 + final * 0.4
 *   geçmek için: final >= 50 VE dönem sonu başarı notu >= 60
 *
 * Düzeltme #2: Gereken final notu <= 50 ise "50 alsan yeterli" demek YANLIŞ
 * çünkü öğrenci 50'nin altında alamaz, doğrusu "50 alman yeterli, geçersin" demek.
 */
function finalHesapla(yuvarlanmisOrtalama, butunlemeNotu = null) {
  const etiket = butunlemeNotu !== null ? "Bütünleme" : "Final";

  // Geçmek için gereken minimum final notu:
  // dönem_sonu = ort*0.6 + final*0.4 >= 60  →  final >= (60 - ort*0.6) / 0.4
  // Ayrıca final >= 50 zorunlu (md. 20/6)
  const yuzde60 = yuvarlanmisOrtalama * 0.6;
  const matematikselMinFinal = (60 - yuzde60) / 0.4;
  // Gerçek minimum: ikisinin büyüğü (hem 50 barajı hem formül gereği)
  const minFinal = Math.max(50, matematikselMinFinal);
  // Yukarı yuvarla (yarım sayıya değil, tam sayıya — öğrenci lehine değil, kesin eşik)
  const minFinalYuvarlanmis = Math.ceil(minFinal);

  if (butunlemeNotu !== null) {
    // Bütünleme notu girilmiş — sonucu hesapla
    const donemSonuBaşariNotu = yuvarlanmisOrtalama * 0.6 + butunlemeNotu * 0.4;
    // Dönem sonu başarı notu yuvarlaması (md. 20/6): .5 ve üzeri → yukarı
    const yuvarlanmisDSBN = Math.round(donemSonuBaşariNotu);

    if (butunlemeNotu >= 50 && yuvarlanmisDSBN >= 60) {
      const mesaj = `✅ Bütünleme notunuz ${butunlemeNotu} → Dönem sonu başarı notunuz: <b>${yuvarlanmisDSBN}</b> — <b>Geçtiniz!</b>`;
      return { mesaj, detay: `Bütünleme: ${butunlemeNotu}, DSBN: ${yuvarlanmisDSBN} Geçti.`, html: mesaj };
    } else {
      let sebep = [];
      if (butunlemeNotu < 50) sebep.push(`Bütünleme barajı olan 50'nin altında (${butunlemeNotu})`);
      if (yuvarlanmisDSBN < 60) sebep.push(`Dönem sonu başarı notu 60'ın altında (${yuvarlanmisDSBN})`);
      const mesaj = `❌ Bütünleme notunuz ${butunlemeNotu} → Dönem sonu başarı notunuz: <b>${yuvarlanmisDSBN}</b> — <b>Başarısız.</b><br>Sebep: ${sebep.join(", ")}`;
      return { mesaj, detay: `Bütünleme: ${butunlemeNotu}, DSBN: ${yuvarlanmisDSBN} Başarısız.`, html: mesaj };
    }
  }

  // Final notu girilmemiş — ne kadar alması gerektiğini söyle
  if (minFinalYuvarlanmis > 100) {
    // Matematiksel olarak imkânsız
    const mesaj = `
      <div style="font-size: 22px; color: #d9534f; margin-top: 10px;">
        😢 Ne yazık ki finalden <b>${minFinalYuvarlanmis}</b> almanız gerekiyor.<br>
        Bu mümkün değil, <b>sınıfta kaldınız.</b>
      </div>
      <div style="font-size: 18px; margin-top: 15px; color: #a94442;">
        📚 Yeni bir yıl, yeni bir başlangıç seni bekliyor...<br>
        <i>Kendini toparla, seneye çok daha iyi olacak!</i>
      </div>
      <img src="uzgun-kedi.jpg" alt="Üzgün kedi" style="margin-top: 15px; width: 200px; border-radius: 8px; box-shadow: 0 0 10px rgba(0,0,0,0.1);">
    `;
    return { mesaj, detay: "Geçme imkânsız, sınıfta kaldınız.", html: mesaj };
  }

  // minFinalYuvarlanmis == 50 → tam barajda, 50 alması yeterli
  // minFinalYuvarlanmis > 50 → daha yüksek puan lazım
  const donemSonuIf50 = Math.round(yuvarlanmisOrtalama * 0.6 + 50 * 0.4);

  if (minFinalYuvarlanmis <= 50) {
    const mesaj = `
      🎉 Finalden <b>50</b> almanız yeterli!<br>
      (50 aldığınızda dönem sonu başarı notunuz: <b>${donemSonuIf50}</b>)
    `;
    return { mesaj, detay: `Finalden minimum 50 yeterli. DSBN: ${donemSonuIf50}`, html: mesaj };
  } else {
    const donemSonuIfMin = Math.round(yuvarlanmisOrtalama * 0.6 + minFinalYuvarlanmis * 0.4);
    const mesaj = `
      ${etiket} sınavından geçmek için minimum <b>${minFinalYuvarlanmis}</b> almanız gerekiyor.<br>
      (${minFinalYuvarlanmis} aldığınızda dönem sonu başarı notunuz: <b>${donemSonuIfMin}</b>)
    `;
    return { mesaj, detay: `${etiket} min: ${minFinalYuvarlanmis}, DSBN: ${donemSonuIfMin}`, html: mesaj };
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
