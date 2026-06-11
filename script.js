const RELATIONSHIP_START = new Date(2026, 5, 5, 0, 0, 0);
const STORAGE_KEY = "henrique-vithoria-memories-v1";
const MIGRATION_KEY = "henrique-vithoria-supabase-migrated-v1";
const MEMORY_BUCKET = "memory-images";
let supabaseClient = null;
let currentUserId = null;
let remoteMemories = [];

const $ = (selector, scope = document) => scope.querySelector(selector);
const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];
const pad = (value) => String(value).padStart(2, "0");

function addMonths(date, amount) {
  return new Date(date.getFullYear(), date.getMonth() + amount, date.getDate(), date.getHours(), date.getMinutes(), date.getSeconds());
}

function calendarDuration(start, end) {
  if (end < start) return { years: 0, months: 0, days: 0, hours: 0, minutes: 0, seconds: 0 };

  let cursor = new Date(start);
  let years = end.getFullYear() - start.getFullYear();
  let candidate = new Date(start.getFullYear() + years, start.getMonth(), start.getDate(), start.getHours(), start.getMinutes(), start.getSeconds());
  if (candidate > end) {
    years -= 1;
    candidate = new Date(start.getFullYear() + years, start.getMonth(), start.getDate(), start.getHours(), start.getMinutes(), start.getSeconds());
  }
  cursor = candidate;

  let months = (end.getFullYear() - cursor.getFullYear()) * 12 + end.getMonth() - cursor.getMonth();
  candidate = addMonths(cursor, months);
  if (candidate > end) {
    months -= 1;
    candidate = addMonths(cursor, months);
  }
  cursor = candidate;

  let remainder = end - cursor;
  const days = Math.floor(remainder / 86400000);
  remainder -= days * 86400000;
  const hours = Math.floor(remainder / 3600000);
  remainder -= hours * 3600000;
  const minutes = Math.floor(remainder / 60000);
  remainder -= minutes * 60000;
  const seconds = Math.floor(remainder / 1000);

  return { years, months, days, hours, minutes, seconds };
}

function totalCompletedMonths(now) {
  let months = (now.getFullYear() - RELATIONSHIP_START.getFullYear()) * 12 + now.getMonth() - RELATIONSHIP_START.getMonth();
  if (now < addMonths(RELATIONSHIP_START, months)) months -= 1;
  return Math.max(0, months);
}

function updateCounter() {
  const now = new Date();
  const duration = calendarDuration(RELATIONSHIP_START, now);
  Object.entries(duration).forEach(([key, value]) => {
    const element = document.getElementById(key);
    if (element) element.textContent = pad(value);
  });

  const completeMonths = totalCompletedMonths(now);
  const nextDate = addMonths(RELATIONSHIP_START, completeMonths + 1);
  const previousDate = addMonths(RELATIONSHIP_START, completeMonths);
  const progress = Math.max(0, Math.min(100, ((now - previousDate) / (nextDate - previousDate)) * 100));
  const nextNumber = completeMonths + 1;
  const isYear = nextNumber % 12 === 0;
  const label = isYear
    ? `${nextNumber / 12} ${nextNumber === 12 ? "ano" : "anos"} de nós`
    : `Nosso ${nextNumber}º mês`;
  const remainingDays = Math.max(0, Math.ceil((nextDate - now) / 86400000));

  $("#nextMilestoneTitle").textContent = label;
  $("#milestoneProgress").style.width = `${progress}%`;
  $("#nextMilestoneText").textContent = remainingDays === 0
    ? "É hoje. Uma nova homenagem acaba de ser aberta para nós."
    : `Faltam ${remainingDays} ${remainingDays === 1 ? "dia" : "dias"} para uma nova página da nossa história.`;
}

const milestoneMessages = [
  "O primeiro de muitos. Em tão pouco tempo, você já transformou o meu jeito de enxergar o futuro.",
  "Dois meses escolhendo ficar, cuidar e construir. Meu coração continua encontrando casa em você.",
  "Três meses e tantas histórias que parecem ter vivido uma vida inteira dentro de nós.",
  "Quatro meses descobrindo novos motivos para amar cada detalhe seu.",
  "Cinco meses de cumplicidade, chamadas, saudade e a certeza cada vez maior de que é você.",
  "Meio ano de nós. Seis meses desde o sim que deixou o mundo muito mais bonito.",
  "Sete meses, e ainda sinto aquele frio bom quando penso que posso chamar você de meu amor.",
  "Oito meses fazendo planos onde a palavra futuro sempre significa nós dois.",
  "Nove meses aprendendo que amor também é paz, cuidado e vontade de permanecer.",
  "Dez meses de um amor que começou em mensagens e agora ocupa todos os meus sonhos.",
  "Onze meses. Quase um ano e, ainda assim, parece que a melhor parte está apenas começando.",
  "Um ano do nosso sim. 365 dias escolhendo um ao outro e uma vida inteira para continuar."
];

function renderMilestones() {
  const completed = totalCompletedMonths(new Date());
  const yearlyMessages = {
    24: "Dois anos de nós. O amor amadureceu, ganhou raízes e continua sendo o meu lugar favorito.",
    36: "Três anos colecionando versões nossas, superando distâncias e escolhendo o mesmo caminho.",
    48: "Quatro anos, milhares de lembranças e a certeza de que ainda quero viver todas as próximas com você.",
    60: "Cinco anos do nosso sim. O começo virou história, e a história continua sendo só nossa."
  };
  const displayMilestones = [...Array.from({ length: 12 }, (_, index) => index + 1), 24, 36, 48, 60];
  $("#milestoneCards").innerHTML = displayMilestones.map((month) => {
    const unlocked = completed >= month;
    const years = month / 12;
    const number = month >= 12
      ? `${years} ${years === 1 ? "ano" : "anos"}`
      : `${month} ${month === 1 ? "mês" : "meses"}`;
    const message = month <= 12 ? milestoneMessages[month - 1] : yearlyMessages[month];
    return `
      <article class="milestone-card ${unlocked ? "unlocked" : "locked"} reveal">
        <span class="lock">${unlocked ? "Aberto" : "Aguardando"}</span>
        <span class="card-number">${month >= 12 ? `${years}A` : pad(month)}</span>
        <div>
          <h3>${number} de nós</h3>
          <p>${unlocked ? message : `Esta declaração será revelada em ${addMonths(RELATIONSHIP_START, month).toLocaleDateString("pt-BR")}.`}</p>
        </div>
      </article>
    `;
  }).join("");
}

function setupRevealAnimations() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });
  $$(".reveal").forEach((element) => observer.observe(element));
}

function setupGallery() {
  const modal = $("#imageModal");
  const modalImage = $("#modalImage");
  $$(".gallery-item").forEach((item) => {
    item.addEventListener("click", () => {
      modalImage.src = item.dataset.full;
      modalImage.alt = $("img", item).alt;
      modal.showModal();
      document.body.classList.add("modal-open");
    });
  });
  const close = () => {
    modal.close();
    document.body.classList.remove("modal-open");
  };
  $("#closeModal").addEventListener("click", close);
  modal.addEventListener("click", (event) => {
    if (event.target === modal) close();
  });
}

const YOUTUBE_VIDEO_ID = "pa2lLxYSjQY";
let youtubePlayer;
let youtubeReady = false;
let playWhenReady = false;

function loadYouTubePlayer() {
  if (window.YT?.Player) {
    createYouTubePlayer();
    return;
  }

  window.onYouTubeIframeAPIReady = createYouTubePlayer;
  const apiScript = document.createElement("script");
  apiScript.src = "https://www.youtube.com/iframe_api";
  apiScript.async = true;
  document.head.appendChild(apiScript);
}

function createYouTubePlayer() {
  if (youtubePlayer) return;
  youtubePlayer = new YT.Player("youtubePlayer", {
    height: "1",
    width: "1",
    videoId: YOUTUBE_VIDEO_ID,
    playerVars: {
      autoplay: 0,
      controls: 0,
      disablekb: 1,
      loop: 1,
      playlist: YOUTUBE_VIDEO_ID,
      playsinline: 1,
      rel: 0
    },
    events: {
      onReady: () => {
        youtubeReady = true;
        youtubePlayer.setVolume(55);
        if (playWhenReady) youtubePlayer.playVideo();
      },
      onStateChange: (event) => {
        const playing = event.data === YT.PlayerState.PLAYING;
        const button = $("#soundButton");
        button.setAttribute("aria-pressed", String(playing));
        $("#soundLabel").textContent = playing ? "Pausar música" : "Nossa música";
      },
      onError: () => {
        playWhenReady = false;
        $("#soundButton").setAttribute("aria-pressed", "false");
        $("#soundLabel").textContent = "Nossa música";
        showToast("O YouTube não permitiu tocar essa música dentro do site.");
      }
    }
  });
}

function toggleAmbientSound() {
  const button = $("#soundButton");
  const active = button.getAttribute("aria-pressed") === "true";
  if (active) {
    playWhenReady = false;
    youtubePlayer?.pauseVideo();
    button.setAttribute("aria-pressed", "false");
    $("#soundLabel").textContent = "Nossa música";
    return;
  }

  playWhenReady = true;
  $("#soundLabel").textContent = youtubeReady ? "Pausar música" : "Carregando...";
  if (youtubeReady) youtubePlayer.playVideo();
}

function loadLocalMemories() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch (_) {
    return [];
  }
}

function isSupabaseConfigured() {
  const config = window.SUPABASE_CONFIG || {};
  return Boolean(
    window.supabase?.createClient &&
    config.url?.startsWith("https://") &&
    !config.url.includes("COLE_AQUI") &&
    config.publishableKey &&
    !config.publishableKey.includes("COLE_AQUI")
  );
}

function setStorageStatus(message, isError = false) {
  const status = $("#storageStatus");
  if (!status) return;
  status.textContent = message;
  status.style.color = isError ? "#a43d55" : "";
}

async function initializeSupabase() {
  if (!isSupabaseConfigured()) {
    remoteMemories = loadLocalMemories();
    renderSavedMemories();
    setStorageStatus("Configure o Supabase para sincronizar as memórias entre celulares.", true);
    $("#authForm").hidden = true;
    $("#memoryForm").hidden = false;
    return;
  }

  const config = window.SUPABASE_CONFIG;
  supabaseClient = window.supabase.createClient(config.url, config.publishableKey);

  try {
    const { data: sessionData, error: sessionError } = await supabaseClient.auth.getSession();
    if (sessionError) throw sessionError;
    await applySession(sessionData.session);
    supabaseClient.auth.onAuthStateChange((_event, session) => {
      setTimeout(() => applySession(session), 0);
    });
  } catch (error) {
    console.error("Supabase:", error);
    supabaseClient = null;
    currentUserId = null;
    remoteMemories = loadLocalMemories();
    renderSavedMemories();
    setStorageStatus("Não foi possível conectar ao Supabase. Confira a configuração e o SQL.", true);
  }
}

async function applySession(session) {
  currentUserId = session?.user?.id || null;
  const loggedIn = Boolean(currentUserId);
  $("#authForm").hidden = loggedIn;
  $("#memoryForm").hidden = !loggedIn;
  $("#logoutButton").hidden = !loggedIn;
  $("#exportButton").hidden = !loggedIn;
  $('label[for="importInput"]').hidden = !loggedIn;

  if (!loggedIn) {
    remoteMemories = [];
    renderSavedMemories();
    setStorageStatus("Entre com uma das contas de vocês para acessar as memórias.");
    return;
  }

  try {
    await migrateLocalMemories();
    await fetchMemories();
    setStorageStatus("Memórias sincronizadas com segurança entre os aparelhos de vocês.");
  } catch (error) {
    console.error("Sincronização:", error);
    setStorageStatus("Login realizado, mas não foi possível carregar as memórias. Confira o SQL.", true);
  }
}

function setupAuthentication() {
  $("#authForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!supabaseClient) return;
    const button = $('.primary-button', event.currentTarget);
    button.disabled = true;
    button.firstChild.textContent = "Entrando... ";
    $("#authStatus").textContent = "";
    const { error } = await supabaseClient.auth.signInWithPassword({
      email: $("#authEmail").value.trim(),
      password: $("#authPassword").value
    });
    if (error) {
      $("#authStatus").textContent = "E-mail ou senha incorretos.";
      button.disabled = false;
      button.firstChild.textContent = "Entrar no nosso cantinho ";
      return;
    }
    event.currentTarget.reset();
    button.disabled = false;
    button.firstChild.textContent = "Entrar no nosso cantinho ";
    showToast("Bem-vindo ao cantinho de vocês.");
  });

  $("#logoutButton").addEventListener("click", async () => {
    if (!supabaseClient) return;
    await supabaseClient.auth.signOut();
    showToast("Você saiu do cantinho.");
  });
}

async function fetchMemories() {
  const { data, error } = await supabaseClient
    .from("memories")
    .select("*")
    .order("memory_date", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) throw error;
  remoteMemories = await Promise.all((data || []).map(async (memory) => {
    if (!memory.image_path) return memory;
    const { data: signedData, error: signedError } = await supabaseClient.storage
      .from(MEMORY_BUCKET)
      .createSignedUrl(memory.image_path, 3600);
    return {
      ...memory,
      display_image_url: signedError ? "" : signedData.signedUrl
    };
  }));
  renderSavedMemories();
}

function dataUrlToBlob(dataUrl) {
  return fetch(dataUrl).then((response) => response.blob());
}

async function uploadMemoryImage(blob, originalName = "memoria.jpg") {
  if (!blob) return { imageUrl: "", imagePath: "" };
  const extension = originalName.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
  const imagePath = `${currentUserId}/${crypto.randomUUID()}.${extension === "jpeg" ? "jpg" : extension}`;
  const { error } = await supabaseClient.storage
    .from(MEMORY_BUCKET)
    .upload(imagePath, blob, { contentType: blob.type || "image/jpeg", upsert: false });
  if (error) throw error;
  return { imageUrl: "", imagePath };
}

async function migrateLocalMemories() {
  if (localStorage.getItem(MIGRATION_KEY) === "done") return;
  const localMemories = loadLocalMemories();
  for (const memory of localMemories) {
    let uploaded = { imageUrl: "", imagePath: "" };
    if (memory.image?.startsWith("data:")) {
      uploaded = await uploadMemoryImage(await dataUrlToBlob(memory.image));
    } else if (memory.image?.startsWith("http")) {
      uploaded.imageUrl = memory.image;
    }
    const { error } = await supabaseClient.from("memories").insert({
      owner_id: currentUserId,
      title: memory.title,
      body: memory.text,
      memory_date: memory.date,
      image_url: uploaded.imageUrl || null,
      image_path: uploaded.imagePath || null
    });
    if (error) throw error;
  }
  localStorage.setItem(MIGRATION_KEY, "done");
}

function escapeHtml(value) {
  const div = document.createElement("div");
  div.textContent = value;
  return div.innerHTML;
}

function renderSavedMemories() {
  const memories = remoteMemories;
  const section = $("#savedMemoriesSection");
  section.hidden = memories.length === 0;
  $("#savedMemories").innerHTML = memories.map((memory) => `
    <article class="saved-card">
      ${memory.owner_id === currentUserId || !supabaseClient ? `<button class="delete-memory" data-delete="${memory.id}" type="button" aria-label="Excluir ${escapeHtml(memory.title)}">×</button>` : ""}
      ${memory.display_image_url || memory.image_url || memory.image ? `<img src="${memory.display_image_url || memory.image_url || memory.image}" alt="">` : ""}
      <time>${new Date(`${memory.memory_date || memory.date}T12:00:00`).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}</time>
      <h3>${escapeHtml(memory.title)}</h3>
      <p>${escapeHtml(memory.body || memory.text)}</p>
    </article>
  `).join("");

  $$("[data-delete]").forEach((button) => {
    button.addEventListener("click", async () => {
      const memory = remoteMemories.find((item) => item.id === button.dataset.delete);
      try {
        if (supabaseClient) {
          const { error } = await supabaseClient.from("memories").delete().eq("id", memory.id);
          if (error) throw error;
          if (memory.image_path) {
            await supabaseClient.storage.from(MEMORY_BUCKET).remove([memory.image_path]);
          }
          await fetchMemories();
        } else {
          remoteMemories = remoteMemories.filter((item) => item.id !== memory.id);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(remoteMemories));
          renderSavedMemories();
        }
        showToast("Memória removida.");
      } catch (error) {
        console.error(error);
        showToast("Não foi possível remover essa memória.");
      }
    });
  });
}

function resizeImage(file) {
  return new Promise((resolve, reject) => {
    if (!file) return resolve("");
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      const image = new Image();
      image.onerror = reject;
      image.onload = () => {
        const maxSize = 1200;
        const scale = Math.min(1, maxSize / Math.max(image.width, image.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(image.width * scale);
        canvas.height = Math.round(image.height * scale);
        canvas.getContext("2d").drawImage(image, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", .78));
      };
      image.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

function setupMemoryForm() {
  const form = $("#memoryForm");
  const imageInput = $("#memoryImage");
  const localDate = () => {
    const now = new Date();
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  };
  $("#memoryDate").value = localDate();
  imageInput.addEventListener("change", () => {
    $("#fileName").textContent = imageInput.files[0]?.name || "Escolher imagem";
  });
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const submitButton = $(".primary-button", form);
    submitButton.disabled = true;
    submitButton.firstChild.textContent = "Guardando... ";
    try {
      const imageData = await resizeImage(imageInput.files[0]);
      const memoryData = {
        title: $("#memoryTitle").value.trim(),
        text: $("#memoryText").value.trim(),
        date: $("#memoryDate").value
      };

      if (supabaseClient && currentUserId) {
        const uploaded = imageData
          ? await uploadMemoryImage(await dataUrlToBlob(imageData), imageInput.files[0]?.name)
          : { imageUrl: "", imagePath: "" };
        const { error } = await supabaseClient.from("memories").insert({
          owner_id: currentUserId,
          title: memoryData.title,
          body: memoryData.text,
          memory_date: memoryData.date,
          image_url: uploaded.imageUrl || null,
          image_path: uploaded.imagePath || null
        });
        if (error) {
          if (uploaded.imagePath) await supabaseClient.storage.from(MEMORY_BUCKET).remove([uploaded.imagePath]);
          throw error;
        }
        await fetchMemories();
      } else {
        remoteMemories.unshift({
          id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
          ...memoryData,
          image: imageData
        });
        localStorage.setItem(STORAGE_KEY, JSON.stringify(remoteMemories));
        renderSavedMemories();
      }

      form.reset();
      $("#memoryDate").value = localDate();
      $("#fileName").textContent = "Escolher imagem";
      renderSavedMemories();
      $("#savedMemoriesSection").scrollIntoView({ behavior: "smooth" });
      showToast("Memória guardada com carinho.");
    } catch (error) {
      showToast("Não foi possível guardar. Tente uma imagem menor.");
    } finally {
      submitButton.disabled = false;
      submitButton.firstChild.textContent = "Guardar no nosso cantinho ";
    }
  });
}

function setupBackup() {
  $("#exportButton").addEventListener("click", () => {
    const memories = remoteMemories.map((memory) => ({
      title: memory.title,
      text: memory.body || memory.text,
      date: memory.memory_date || memory.date,
      image: memory.image_url || memory.image || ""
    }));
    const data = JSON.stringify({ version: 2, memories }, null, 2);
    const url = URL.createObjectURL(new Blob([data], { type: "application/json" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `nossas-memorias-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
    showToast("Cópia das memórias baixada.");
  });

  $("#importInput").addEventListener("change", async (event) => {
    try {
      const content = await event.target.files[0].text();
      const parsed = JSON.parse(content);
      if (!Array.isArray(parsed.memories)) throw new Error("Formato inválido");
      localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed.memories));
      localStorage.removeItem(MIGRATION_KEY);
      if (supabaseClient) {
        await migrateLocalMemories();
        await fetchMemories();
      } else {
        remoteMemories = parsed.memories;
        renderSavedMemories();
      }
      showToast("Memórias restauradas e sincronizadas.");
    } catch (_) {
      showToast("Esse arquivo de memórias não é válido.");
    }
    event.target.value = "";
  });
}

let toastTimer;
function showToast(message) {
  const toast = $("#toast");
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 3000);
}

document.addEventListener("mousemove", (event) => {
  const glow = $(".cursor-glow");
  glow.style.left = `${event.clientX}px`;
  glow.style.top = `${event.clientY}px`;
});

updateCounter();
setInterval(updateCounter, 1000);
renderMilestones();
setupRevealAnimations();
setupGallery();
setupMemoryForm();
setupBackup();
setupAuthentication();
initializeSupabase();
loadYouTubePlayer();
$("#soundButton").addEventListener("click", toggleAmbientSound);
