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

  // Sayfa açılırken tercihi uygula
  if (localStorage.getItem("darkMode") === "enabled") {
    document.body.classList.add("dark-mode");
    darkModeToggle.textContent = "☀️ Gece Modu Kapat";
  }

  // Geçmiş sonuçları sayfa açılışında göster
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
    input.addEventListener("input", () => {
      // Sayıyı stringe çevirip uzunluk kontrol et
      if (input.value.length > 2) {
        input.value = input.value.slice(0, 2);
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

  let hamOrtalama = notlar.reduce((a, b) => a + b, 0) / komiteSayisi;
  let yuvarlanmisOrtalama = Math.round(hamOrtalama);

  const sonucDiv = document.getElementById(`sonuc${donem}`);
  sonucDiv.innerHTML = "";

  // Sonucu metin olarak hazırlayalım
  let sonucMetni = `Dönem ${donem} Not Ortalaması: ${hamOrtalama.toFixed(2)}\n`;

  if (yuvarlanmisOrtalama >= 75 ) {
    sonucDiv.innerHTML = `
      <b>Ortalamanız: ${hamOrtalama.toFixed(2)}</b><br>
      🎉 Finalsiz geçtiniz!<br>
      <img src="finalsiz-gectiniz.jpg" alt="Finalsiz geçtiniz" style="width:200px;">
      <canvas id="confetti${donem}"></canvas>
    `;
    konfetiYagdir(`confetti${donem}`);
    sonucMetni += "Finalsiz geçtiniz! 🎉";
  } else {
    const yuzde60 = yuvarlanmisOrtalama * 0.6;
    let gerekliFinal = (59.5 - yuzde60) / 0.4;
    let gerekliFinalYuvarlanmis = Math.ceil(gerekliFinal * 2) / 2;

    if (gerekliFinal > 100) {
      sonucDiv.innerHTML = `
        <b>Ortalamanız: ${hamOrtalama.toFixed(2)}</b><br>
        <div style="font-size: 22px; color: #d9534f; margin-top: 10px;">
          😢 Ne yazık ki finalden <b>${gerekliFinalYuvarlanmis}</b> almanız gerekiyor.<br>
          Bu mümkün değil, <b>sınıfta kaldınız.</b>
        </div>
        <div style="font-size: 18px; margin-top: 15px; color: #a94442;">
          📚 Yeni bir yıl, yeni bir başlangıç seni bekliyor...<br>
          <i>Kendini toparla, seneye çok daha iyi olacak!</i>
        </div>
        <img src="uzgun-kedi.jpg" alt="Üzgün kedi" style="margin-top: 15px; width: 200px; border-radius: 8px; box-shadow: 0 0 10px rgba(0,0,0,0.1);">
      `;
      sonucMetni += `Final notu çok yüksek: ${gerekliFinalYuvarlanmis}. Sınıfta kaldınız.`;
    } else if (gerekliFinalYuvarlanmis <= 50) {
      sonucDiv.innerHTML = `
        <b>Ortalamanız: ${hamOrtalama.toFixed(2)}</b><br>
        🎉 Tebrikler! Final notunuz <b>${gerekliFinalYuvarlanmis}</b>. Final barajı olan 50'yi geçerek dönemi geçebilirsiniz!
      `;
      sonucMetni += `Finalden almanız gereken not: ${gerekliFinalYuvarlanmis}. Final barajını geçtiniz!`;
    } else {
      sonucDiv.innerHTML = `
        <b>Ortalamanız: ${hamOrtalama.toFixed(2)}</b><br>
        Final sınavından geçmek için minimum <b>${gerekliFinalYuvarlanmis}</b> almanız gerekiyor.
      `;
      sonucMetni += `Finalden almanız gereken minimum not: ${gerekliFinalYuvarlanmis}.`;
    }
  }

  // Sonucu geçmişe kaydet
  kaydetGecmis(donem, sonucMetni, notlar);

  // Sonuçların geçmişini göster
  gosterGecmis(donem);

  // Grafiği çiz
  cizBarChart(donem, notlar);

  // Paylaş butonu ekle
  eklePaylasButonu(sonucDiv, sonucMetni);
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

// Geçmiş sonuçları localStorage'da sakla (her dönem için ayrı key)
function kaydetGecmis(donem, sonucMetni, notlar) {
  let key = `odunot_gecmis_donem${donem}`;
  let gecmis = JSON.parse(localStorage.getItem(key)) || [];

  // En son 5 kaydı tutalım
  gecmis.unshift({
    tarih: new Date().toLocaleString(),
    sonuc: sonucMetni,
    notlar: notlar,
  });

  if (gecmis.length > 5) gecmis.pop();

  localStorage.setItem(key, JSON.stringify(gecmis));
}

// Geçmiş sonuçları göster
function gosterGecmis(donem) {
  const sonucDiv = document.getElementById(`sonuc${donem}`);
  let key = `odunot_gecmis_donem${donem}`;
  let gecmis = JSON.parse(localStorage.getItem(key)) || [];

  // Eğer içerik tamamen boşsa (yeni sayfa yüklemesinde) temizle
  if (!sonucDiv.innerHTML.includes("Geçmiş Sonuçlar")) {
    // sadece geçmiş listesi değilse temizleme yok
  }

  // Geçmiş için ayrı bölüm oluştur
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
    li.innerHTML = `<b>${item.tarih}</b>: ${item.sonuc.replace(
      /\n/g,
      "<br>"
    )} <br> <i>${item.notlar.join("<br> ")}</i>`;
    ul.appendChild(li);
  });

  sonucDiv.appendChild(ul);
}

// Basit bar chart çizimi (canvas kullanarak)
function cizBarChart(donem, notlar) {
  const sonucDiv = document.getElementById(`sonuc${donem}`);
  // Önce varsa eski canvas kaldır
  let eskiCanvas = document.getElementById(`barChart${donem}`);
  if (eskiCanvas) eskiCanvas.remove();

  const canvas = document.createElement("canvas");
  canvas.id = `barChart${donem}`;
  canvas.width = 300;
  canvas.height = 150;
  canvas.style.marginTop = "15px";
  sonucDiv.appendChild(canvas);

  const ctx = canvas.getContext("2d");

  const barWidth = 40;
  const gap = 20;
  const maxHeight = 100; // Not max değeri 100, ölçekleme için

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Barları çiz
  notlar.forEach((not, i) => {
    let barHeight = (not / 100) * maxHeight;
    let x = gap + i * (barWidth + gap);
    let y = canvas.height - barHeight - 20;

    // Bar arka planı
    ctx.fillStyle = "#3498db";
    ctx.fillRect(x, y, barWidth, barHeight);

    // Komite numarası yazısı
    ctx.fillStyle = "#000";
    ctx.font = "14px Arial";
    ctx.fillText(`K${i + 1}`, x + 12, canvas.height - 5);

    // Not değeri üstünde
    ctx.fillStyle = "#000";
    ctx.font = "12px Arial";
    ctx.fillText(not.toFixed(1), x + 10, y - 5);
  });

  // Y ekseni çizgileri (0-100 arası 20 şer birim)
  ctx.strokeStyle = "#ccc";
  ctx.fillStyle = "#000";
  ctx.font = "12px Arial";
  for (let i = 0; i <= 100; i += 20) {
    let y = canvas.height - (i / 100) * maxHeight - 20;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
    ctx.fillText(i, 5, y - 2);
  }
}

// Paylaş butonu ekle
function eklePaylasButonu(sonucDiv, sonucMetni) {
  // Önce varsa eski paylaş butonu kaldır
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
      .then(() =>
        alert("Sonuç kopyalandı, istediğiniz platformda paylaşabilirsiniz!")
      )
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
      if (
        confirm("Geçmiş sonuçlarınızı temizlemek istediğinize emin misiniz?")
      ) {
        localStorage.clear();
        alert("Geçmiş başarıyla temizlendi.");
        location.reload();
      }
    };

    hesaplaBtn.insertAdjacentElement("afterend", btn);
  });
}

addClearLocalStorageButton();

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
        const inputs = container.querySelectorAll(
          "input[type='text'], input[type='number']"
        );
        inputs.forEach((input) => (input.value = ""));
      }
    };

    hesaplaBtn.insertAdjacentElement("afterend", btn);
  });
}

addClearFieldsButton();
