const RELATIONSHIP_START = new Date(2026, 5, 5, 0, 0, 0);
const STORAGE_KEY = "henrique-vithoria-memories-v1";
const MIGRATION_KEY = "henrique-vithoria-supabase-migrated-v1";
const REASONS_KEY = "henrique-vithoria-love-reasons-v1";
const MISSIONS_KEY = "henrique-vithoria-couple-missions-v3";
const REASONS_UNLOCK_DATE = new Date(2026, 6, 5, 0, 0, 0);
let supabaseClient = null;
let currentUserId = null;
let remoteMemories = [];
let remoteSongs = [];

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

const loveReasons = [
  "Porque você transformou conversas simples em um lugar onde meu coração quis morar.",
  "Porque seu sorriso tem um jeito de arrumar o meu dia inteiro.",
  "Porque até o silêncio com você parece carinho.",
  "Porque eu sinto paz quando imagino meu futuro e vejo você nele.",
  "Porque você me faz querer ser melhor sem deixar de ser eu.",
  "Porque sua voz virou uma das coisas mais bonitas que eu conheço.",
  "Porque você cuida de mim até nos detalhes pequenos.",
  "Porque a saudade de você prova o tamanho do espaço que você ocupa em mim.",
  "Porque nossas madrugadas me ensinaram que tempo bom passa rápido demais.",
  "Porque você é linda de um jeito que vai muito além do que os olhos conseguem ver.",
  "Porque seu jeito me prende sem me apertar.",
  "Porque eu amo quando você fica toda carinhosa comigo.",
  "Porque você me entende mesmo quando eu não sei explicar direito.",
  "Porque você trouxe cor para dias que eu nem sabia que estavam apagados.",
  "Porque eu confio em você com partes minhas que quase ninguém conhece.",
  "Porque você é minha vontade favorita de ficar.",
  "Porque toda chamada com você parece curta, mesmo quando dura horas.",
  "Porque você tem um coração que dá vontade de proteger do mundo inteiro.",
  "Porque eu amo seu jeitinho, suas manias e até suas birrinhas.",
  "Porque você me faz rir de um jeito leve.",
  "Porque você é minha paz e meu frio na barriga ao mesmo tempo.",
  "Porque você me fez entender que amor também é cuidado diário.",
  "Porque quando penso em casa, penso em você.",
  "Porque você deixa qualquer plano mais bonito só por estar nele.",
  "Porque eu amo a forma como você existe na minha vida.",
  "Porque sua presença, mesmo de longe, consegue ficar perto de mim.",
  "Porque eu gosto de te imaginar feliz, segura e amada.",
  "Porque você merece o mundo, e eu quero te entregar o meu melhor.",
  "Porque você me deu motivos para acreditar em nós.",
  "Porque eu amo chamar você de minha.",
  "Porque você faz o meu coração descansar.",
  "Porque seus detalhes viraram meus favoritos.",
  "Porque com você eu sinto que posso construir algo de verdade.",
  "Porque eu amo quando a gente fala besteira e ri junto.",
  "Porque você é minha escolha bonita em todos os dias.",
  "Porque você faz falta até quando acabou de sair.",
  "Porque eu amo cuidar de você.",
  "Porque eu amo ser cuidado por você.",
  "Porque você tem um jeito único de ficar nos meus pensamentos.",
  "Porque você me faz querer viver coisas simples e gigantes ao seu lado.",
  "Porque eu amo nossa história, desde o começo até tudo que ainda vem.",
  "Porque você é a pessoa para quem meu coração sempre quer voltar.",
  "Porque eu amo a delicadeza que existe em nós.",
  "Porque você me faz sentir sortudo por poder te amar.",
  "Porque você virou meu assunto favorito.",
  "Porque eu amo cada plano que começa com nós dois.",
  "Porque sua felicidade importa muito para mim.",
  "Porque você é minha mulher demais, do jeitinho mais lindo possível.",
  "Porque se eu pudesse escolher de novo, escolheria você sem pensar duas vezes.",
  "Porque cinquenta motivos ainda são pouco para explicar o quanto eu amo você."
];

const starPositions = [
  [10, 18], [18, 31], [29, 14], [41, 25], [53, 12], [66, 22], [78, 15], [90, 28], [14, 48], [25, 40],
  [37, 53], [49, 42], [61, 55], [73, 44], [86, 58], [8, 72], [21, 64], [34, 78], [47, 69], [60, 82],
  [74, 72], [91, 79], [16, 12], [31, 31], [45, 15], [58, 34], [70, 10], [83, 35], [12, 59], [28, 58],
  [42, 72], [55, 63], [69, 77], [82, 67], [19, 84], [36, 22], [51, 30], [64, 46], [77, 52], [88, 18],
  [7, 38], [23, 22], [39, 38], [54, 49], [68, 62], [81, 83], [93, 48], [30, 88], [50, 86], [72, 31]
];

let discoveredReasons = [];
let selectedReasonIndex = null;
let skyAnimationFrame = null;

function loadDiscoveredReasons() {
  try {
    const stored = JSON.parse(localStorage.getItem(REASONS_KEY)) || [];
    return stored.filter((index) => Number.isInteger(index) && index >= 0 && index < loveReasons.length);
  } catch (_) {
    return [];
  }
}

function saveDiscoveredReasons() {
  localStorage.setItem(REASONS_KEY, JSON.stringify(discoveredReasons));
}

function updateReasonsProgress() {
  const total = discoveredReasons.length;
  $("#reasonCount").textContent = `${total} / ${loveReasons.length} descobertos`;
  $("#reasonProgress").style.width = `${(total / loveReasons.length) * 100}%`;
  $("#reasonsFinal").hidden = total !== loveReasons.length;
  $$(".love-star").forEach((star) => {
    const index = Number(star.dataset.reasonIndex);
    star.classList.toggle("discovered", discoveredReasons.includes(index));
    star.classList.toggle("selected", selectedReasonIndex === index);
  });
}

function openReason(index) {
  selectedReasonIndex = index;
  if (!discoveredReasons.includes(index)) {
    discoveredReasons.push(index);
    saveDiscoveredReasons();
  }
  $("#reasonTitle").textContent = `Motivo ${pad(index + 1)}`;
  $("#reasonText").textContent = loveReasons[index];
  updateReasonsProgress();
}

function openRandomReason() {
  const closed = loveReasons.map((_, index) => index).filter((index) => !discoveredReasons.includes(index));
  const pool = closed.length ? closed : loveReasons.map((_, index) => index);
  const index = pool[Math.floor(Math.random() * pool.length)];
  openReason(index);
}

function setupLoveReasons() {
  const section = $("#motivos");
  const navLink = $("#reasonsNavLink");
  const unlocked = new Date() >= REASONS_UNLOCK_DATE;
  if (section) section.hidden = !unlocked;
  if (navLink) navLink.hidden = !unlocked;
  if (!unlocked) return;

  const stage = $("#reasonsStage");
  if (!stage) return;
  discoveredReasons = loadDiscoveredReasons();
  stage.innerHTML = loveReasons.map((_, index) => {
    const [left, top] = starPositions[index];
    return `<button class="love-star" type="button" data-reason-index="${index}" style="left:${left}%;top:${top}%;" aria-label="Abrir motivo ${index + 1}"></button>`;
  }).join("");
  $$(".love-star", stage).forEach((star) => {
    star.addEventListener("click", () => openReason(Number(star.dataset.reasonIndex)));
  });
  $("#reasonRandom").addEventListener("click", openRandomReason);
  updateReasonsProgress();
  drawReasonsSky();
}

function drawReasonsSky() {
  const canvas = $("#reasonsSky");
  if (!canvas) return;
  const context = canvas.getContext("2d");
  const stars = Array.from({ length: 120 }, () => ({
    x: Math.random(),
    y: Math.random(),
    r: Math.random() * 1.7 + .25,
    pulse: Math.random() * Math.PI * 2
  }));

  const resize = () => {
    const rect = canvas.getBoundingClientRect();
    const ratio = window.devicePixelRatio || 1;
    canvas.width = Math.max(1, Math.floor(rect.width * ratio));
    canvas.height = Math.max(1, Math.floor(rect.height * ratio));
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
  };

  const draw = (time = 0) => {
    const rect = canvas.getBoundingClientRect();
    context.clearRect(0, 0, rect.width, rect.height);
    stars.forEach((star) => {
      const alpha = .22 + Math.sin(time / 900 + star.pulse) * .18;
      context.beginPath();
      context.fillStyle = `rgba(255, 244, 255, ${alpha})`;
      context.arc(star.x * rect.width, star.y * rect.height, star.r, 0, Math.PI * 2);
      context.fill();
    });
    skyAnimationFrame = requestAnimationFrame(draw);
  };

  window.addEventListener("resize", resize);
  resize();
  cancelAnimationFrame(skyAnimationFrame);
  skyAnimationFrame = requestAnimationFrame(draw);
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

function getFallbackSongs() {
  return [];
}

function detectMusicLink(url) {
  try {
    const parsed = new URL(url.trim());
    const host = parsed.hostname.replace(/^www\./, "");
    if (host === "youtu.be" || host.endsWith("youtube.com") || host.endsWith("youtube-nocookie.com")) {
      return { platform: "youtube", label: "YouTube", url: parsed.href };
    }
    if (host.endsWith("spotify.com")) {
      return { platform: "spotify", label: "Spotify", url: parsed.href };
    }
  } catch (_) {
    return null;
  }
  return null;
}

function setPlaylistStatus(message, isError = false) {
  const status = $("#playlistStatus");
  if (!status) return;
  status.textContent = message;
  status.style.color = isError ? "#ff9aad" : "";
}

function renderPlaylist() {
  const grid = $("#playlistGrid");
  if (!grid) return;
  const songs = remoteSongs.length ? remoteSongs : getFallbackSongs();
  if (!songs.length) {
    grid.innerHTML = `
      <article class="song-card empty-song-card">
        <span class="song-number">00</span>
        <div>
          <p>Playlist vazia</p>
          <h3>Nenhuma música ainda</h3>
          <span>Entrem no cantinho para guardar a primeira.</span>
        </div>
      </article>
    `;
    return;
  }
  grid.innerHTML = songs.map((song, index) => {
    const platform = song.platform === "spotify" ? "Spotify" : "YouTube";
    const canDelete = currentUserId && song.owner_id === currentUserId && !String(song.id).startsWith("fallback");
    return `
      <article class="song-card">
        <span class="song-number">${pad(index + 1)}</span>
        <div>
          <p>${platform}</p>
          <h3>${escapeHtml(song.title)}</h3>
          <span>${escapeHtml(song.artist || platform)}</span>
          ${song.note ? `<b class="song-note">${escapeHtml(song.note)}</b>` : ""}
        </div>
        <a href="${escapeHtml(song.url)}" target="_blank" rel="noreferrer" aria-label="Abrir ${escapeHtml(song.title)} no ${platform}">${platform}</a>
        ${canDelete ? `<button class="delete-song" data-song-delete="${song.id}" type="button" aria-label="Excluir ${escapeHtml(song.title)}">×</button>` : ""}
      </article>
    `;
  }).join("");

  $$("[data-song-delete]").forEach((button) => {
    button.addEventListener("click", async () => {
      try {
        const { error } = await supabaseClient.from("couple_songs").delete().eq("id", button.dataset.songDelete);
        if (error) throw error;
        await fetchPlaylist();
        showToast("Música removida da playlist.");
      } catch (error) {
        console.error("Excluir música:", error);
        showToast("Não foi possível remover essa música.");
      }
    });
  });
}

async function fetchPlaylist() {
  if (!supabaseClient) {
    remoteSongs = [];
    renderPlaylist();
    return;
  }
  const { data, error } = await supabaseClient
    .from("couple_songs")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  remoteSongs = data || [];
  renderPlaylist();
}

function setupPlaylistForm() {
  const form = $("#songForm");
  if (!form) return;
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!supabaseClient || !currentUserId) {
      showToast("Entre no cantinho para adicionar músicas.");
      return;
    }
    const link = detectMusicLink($("#songUrl").value);
    if (!link) {
      showToast("Cole um link válido do YouTube ou Spotify.");
      return;
    }
    const button = $(".primary-button", form);
    button.disabled = true;
    button.firstChild.textContent = "Guardando... ";
    try {
      const { error } = await supabaseClient.from("couple_songs").insert({
        owner_id: currentUserId,
        title: $("#songTitle").value.trim(),
        artist: $("#songArtist").value.trim(),
        note: $("#songNote").value.trim(),
        url: link.url,
        platform: link.platform
      });
      if (error) throw error;
      form.reset();
      await fetchPlaylist();
      showToast("Música guardada na playlist.");
    } catch (error) {
      console.error("Salvar música:", error);
      showToast("Não foi possível salvar essa música. Confira o SQL da playlist.");
    } finally {
      button.disabled = false;
      button.firstChild.textContent = "Guardar música ";
    }
  });
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
    renderPlaylist();
    setStorageStatus("Configure o Supabase para sincronizar as memórias entre celulares.", true);
    setPlaylistStatus("Configure o Supabase para vocês adicionarem músicas pela página.", true);
    $("#authForm").hidden = true;
    $("#memoryForm").hidden = true;
    $("#songForm").hidden = true;
    return;
  }

  const config = window.SUPABASE_CONFIG;
  supabaseClient = window.supabase.createClient(config.url, config.publishableKey);

  try {
    await fetchMemories();
    try {
      await fetchPlaylist();
    } catch (playlistError) {
      console.error("Playlist:", playlistError);
      remoteSongs = [];
      renderPlaylist();
      setPlaylistStatus("Execute o SQL atualizado para ativar a playlist editável.", true);
    }
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
    remoteMemories = [];
    renderSavedMemories();
    renderPlaylist();
    $("#authForm").hidden = false;
    $("#memoryForm").hidden = true;
    $("#songForm").hidden = true;
    setStorageStatus("Banco desconectado. Nada será salvo apenas neste navegador.", true);
    setPlaylistStatus("Playlist usando música padrão enquanto o Supabase está desconectado.", true);
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
  $("#songForm").hidden = !loggedIn;

  if (!loggedIn) {
    await fetchMemories();
    try {
      await fetchPlaylist();
    } catch (error) {
      console.error("Playlist:", error);
      remoteSongs = [];
      renderPlaylist();
      setPlaylistStatus("Execute o SQL atualizado para ativar a playlist editável.", true);
      return;
    }
    setStorageStatus("As memórias publicadas estão visíveis para todos. Entre para adicionar uma nova.");
    setPlaylistStatus("Entre no cantinho para adicionar músicas à playlist.");
    return;
  }

  try {
    await migrateLocalMemories();
    await fetchMemories();
    await fetchPlaylist();
    setStorageStatus("Nova memória será publicada no mural e ficará visível para todos.");
    setPlaylistStatus("Cole um link do YouTube ou Spotify para guardar uma música de vocês.");
  } catch (error) {
    console.error("Sincronização:", error);
    setStorageStatus("Login realizado, mas não foi possível carregar as memórias. Confira o SQL.", true);
    setPlaylistStatus("Login realizado, mas a playlist precisa do SQL atualizado.", true);
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
  remoteMemories = data || [];
  renderSavedMemories();
}

async function migrateLocalMemories() {
  if (localStorage.getItem(MIGRATION_KEY) === "done") return;
  const localMemories = loadLocalMemories();
  for (const memory of localMemories) {
    const { error } = await supabaseClient.from("memories").insert({
      owner_id: currentUserId,
      title: memory.title,
      body: memory.text,
      memory_date: memory.date,
      image_url: memory.image || null,
      image_path: null
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
      ${currentUserId && memory.owner_id === currentUserId ? `<button class="delete-memory" data-delete="${memory.id}" type="button" aria-label="Excluir ${escapeHtml(memory.title)}">×</button>` : ""}
      ${memory.image_url || memory.image ? `<img src="${memory.image_url || memory.image}" alt="">` : ""}
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
        const maxSize = 900;
        const scale = Math.min(1, maxSize / Math.max(image.width, image.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(image.width * scale);
        canvas.height = Math.round(image.height * scale);
        canvas.getContext("2d").drawImage(image, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", .68));
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
      if (!supabaseClient || !currentUserId) {
        throw new Error("Faça login para salvar no Supabase.");
      }
      const imageData = await resizeImage(imageInput.files[0]);
      const memoryData = {
        title: $("#memoryTitle").value.trim(),
        text: $("#memoryText").value.trim(),
        date: $("#memoryDate").value
      };

      const { error } = await supabaseClient.from("memories").insert({
        owner_id: currentUserId,
        title: memoryData.title,
        body: memoryData.text,
        memory_date: memoryData.date,
        image_url: imageData || null,
        image_path: null
      });
      if (error) throw error;
      await fetchMemories();

      form.reset();
      $("#memoryDate").value = localDate();
      $("#fileName").textContent = "Escolher imagem";
      renderSavedMemories();
      $("#savedMemoriesSection").scrollIntoView({ behavior: "smooth" });
      showToast("Memória guardada com carinho.");
    } catch (error) {
      console.error("Salvar memória:", error);
      showToast(error.message || "Não foi possível salvar no Supabase.");
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

const missionBlueprints = [
  {
    key: "leve",
    type: "Diversão e carinho",
    titles: ["Riso garantido", "Só vocês dois", "Momento bobo", "Desafio fofo", "Do nada", "Sem vergonha", "Nosso jeitinho", "Dose de alegria", "Surpresa leve", "Bagunça a dois"],
    prompts: [
      "Façam uma imitação exagerada um do outro e tentem descobrir qual mania está sendo representada.",
      "Inventem um apelido completamente novo um para o outro e contem de onde ele teria surgido.",
      "Mandem um áudio cantando o refrão de uma música que combine com o casal, mesmo que fique desafinado.",
      "Escolham três emojis para resumir o relacionamento de vocês hoje e expliquem cada escolha.",
      "Contem o pior mico que já passaram e decidam qual dos dois merece o troféu da vergonha.",
      "Criem um meme sobre uma situação que só vocês dois entenderiam.",
      "Descrevam um ao outro como se fossem personagens de um filme muito dramático.",
      "Façam um ranking das cinco comidas que mais gostariam de dividir agora.",
      "Inventem uma manchete de jornal sobre o namoro de vocês.",
      "Escolham um objeto perto de vocês e tentem vendê-lo ao outro como se fosse um produto revolucionário.",
      "Tentem falar um trava-língua sem errar e deixem o outro escolher a punição engraçada.",
      "Criem uma história juntos, alternando uma frase de cada vez até chegar a um final absurdo.",
      "Mostrem o item mais estranho que conseguirem encontrar no quarto e contem a história dele.",
      "Façam um desafio de não rir enquanto um tenta fazer a expressão mais ridícula possível.",
      "Assobiem ou cantarolem uma música para o outro adivinhar.",
      "Criem o nome, o cartaz e a frase de efeito de um filme inspirado na história de vocês.",
      "Desenhem um retrato um do outro sem tirar o dedo da tela ou o lápis do papel.",
      "Respondam: se o relacionamento de vocês fosse uma sobremesa, qual seria e por quê?",
      "Escolham um filtro engraçado e façam juntos a foto mais caótica possível.",
      "Inventem uma dança de dez segundos que vire a coreografia oficial do casal."
    ],
    twists: [
      "Façam isso em chamada e não vale ensaiar antes.",
      "Cada um tem apenas sessenta segundos para completar a missão.",
      "Quem rir primeiro precisa mandar um elogio criativo.",
      "Gravem apenas um áudio e aceitem a primeira tentativa.",
      "Incluam uma lembrança real de vocês no meio da brincadeira.",
      "A resposta precisa conter uma palavra escolhida pelo outro.",
      "Façam por mensagem usando no máximo cinco linhas.",
      "O vencedor escolhe a música que vocês ouvirão depois.",
      "Transformem o resultado em uma pequena tradição do casal.",
      "No final, deem uma nota de zero a dez para a atuação do outro."
    ],
    endings: [
      "Terminem escolhendo o momento mais engraçado.",
      "Guardem o resultado para rever quando bater saudade.",
      "Quem se divertir mais escolhe a próxima missão.",
      "Finalizem com um elogio sincero.",
      "Prometam repetir a brincadeira quando estiverem juntos."
    ]
  },
  {
    key: "pessoal",
    type: "Pergunta pessoal",
    titles: ["Conversa de verdade", "Entre nós", "Coração aberto", "Sem resposta pronta", "Quero te conhecer", "Pergunta sincera", "Nossa intimidade", "Um pouco mais fundo", "Só a verdade", "Descoberta a dois"],
    prompts: [
      "Respondam: qual foi o momento exato em que você percebeu que estava se apaixonando?",
      "Respondam: qual insegurança sua você gostaria que o outro entendesse melhor?",
      "Contem qual gesto pequeno do outro faz vocês se sentirem mais amados.",
      "Respondam: o que você mais teme perder e como o outro pode trazer segurança?",
      "Contem uma coisa sobre a infância que explica muito de quem vocês são hoje.",
      "Respondam: em que momento você mais sentiu orgulho do outro?",
      "Digam qual hábito gostariam de construir juntos nos próximos meses.",
      "Respondam: qual parte da sua personalidade você ainda tem dificuldade de mostrar?",
      "Contem que tipo de carinho ajuda quando o dia está pesado.",
      "Respondam: qual sonho individual você quer muito que o outro acompanhe?",
      "Digam uma coisa que aprenderam sobre amor depois que começaram a namorar.",
      "Respondam: quando você se sente mais desejado, admirado e escolhido pelo outro?",
      "Contem uma memória que ainda emociona, mesmo que pareça simples.",
      "Respondam: qual conversa importante vocês têm adiado e poderiam começar com calma?",
      "Digam como imaginam uma rotina feliz quando puderem estar mais perto.",
      "Respondam: qual limite pessoal é importante que o outro sempre respeite?",
      "Contem uma qualidade própria que aprenderam a reconhecer por causa do relacionamento.",
      "Respondam: qual pedido de desculpas ou agradecimento ainda merece ser dito?",
      "Digam três coisas que querem viver juntos antes do próximo aniversário de namoro.",
      "Respondam: o que faria você se sentir ainda mais cuidado nesta semana?"
    ],
    twists: [
      "Cada um responde por dois minutos sem ser interrompido.",
      "Depois de responder, o outro só pode fazer uma pergunta de aprofundamento.",
      "Comecem a resposta com 'eu nunca te contei, mas...'.",
      "Respondam primeiro por áudio e depois conversem em chamada.",
      "A resposta precisa incluir um exemplo real vivido por vocês.",
      "Antes de responder, tentem adivinhar o que o outro dirá.",
      "Não tentem resolver nada; apenas escutem e acolham.",
      "Cada um deve terminar dizendo como o outro pode ajudar.",
      "Façam a conversa com as luzes baixas e sem outras distrações.",
      "Depois troquem um elogio relacionado ao que foi compartilhado."
    ],
    endings: [
      "Terminem agradecendo pela confiança.",
      "Escolham uma atitude pequena para colocar em prática amanhã.",
      "Guardem a resposta mais bonita como lembrança.",
      "Finalizem com a frase 'estou com você'.",
      "Terminem escolhendo algo novo que descobriram um no outro."
    ]
  },
  {
    key: "jogos",
    type: "Jogo e desafio",
    titles: ["Valendo tudo", "Duelo do casal", "Quem conhece melhor?", "Rodada surpresa", "Jogo rápido", "Desafio aceito", "Um contra o outro", "Sem roubar", "Melhor de três", "Prontos para jogar?"],
    prompts: [
      "Joguem verdade ou desafio com três rodadas para cada um.",
      "Façam dez perguntas de 'isso ou aquilo' e comparem as respostas no final.",
      "Cada um escreve cinco fatos sobre si, sendo um falso, para o outro descobrir.",
      "Joguem adedonha com categorias inventadas sobre o relacionamento.",
      "Façam uma batalha de elogios: perde quem demorar mais de cinco segundos.",
      "Escolham uma palavra proibida durante a chamada; quem falar primeiro perde.",
      "Joguem vinte perguntas para descobrir uma memória escolhida pelo outro.",
      "Façam um quiz com cinco perguntas sobre gostos, manias e histórias do casal.",
      "Cada um escolhe uma música e o outro precisa adivinhar por que ela foi escolhida.",
      "Joguem pedra, papel e tesoura em melhor de cinco com uma prenda carinhosa.",
      "Façam um bingo de coisas que costumam acontecer nas chamadas de vocês.",
      "Criem três desafios secretos e escolham um número sem saber qual desafio virá.",
      "Joguem 'eu nunca' com dez frases leves e inesperadas.",
      "Façam uma caça ao tesouro: cada um pede três objetos para o outro encontrar.",
      "Joguem uma rodada de perguntas em que só vale responder com outra pergunta.",
      "Escolham um tema e disputem quem lembra mais itens em trinta segundos.",
      "Façam um campeonato de caretas com três categorias e notas de zero a dez.",
      "Joguem 'complete a frase' usando lembranças e planos do casal.",
      "Cada um descreve uma foto antiga sem mostrar e o outro tenta adivinhar qual é.",
      "Criem um jogo de pistas para o outro descobrir o lugar ideal do próximo encontro."
    ],
    twists: [
      "O vencedor ganha o direito de escolher a próxima missão.",
      "Quem perder precisa cumprir uma prenda romântica.",
      "Façam tudo em no máximo cinco minutos.",
      "Não vale repetir resposta nem pedir dica.",
      "Incluam uma rodada bônus criada na hora.",
      "Marquem os pontos e façam uma final em melhor de três.",
      "O perdedor manda um áudio fazendo uma declaração dramática.",
      "Cada resposta certa vale também um beijo para o próximo encontro.",
      "Joguem por chamada com a câmera ligada.",
      "Se empatar, decidam com uma pergunta surpresa."
    ],
    endings: [
      "Anotem o placar para uma revanche futura.",
      "O vencedor escolhe uma recompensa simples.",
      "Terminem rindo da resposta mais inesperada.",
      "Façam uma foto comemorando o resultado.",
      "Prometam uma revanche quando estiverem juntos."
    ]
  },
  {
    key: "fotos",
    type: "Fotos e chamada",
    titles: ["Foto do nada", "Mostra seu mundo", "Saudade em imagem", "Clique surpresa", "Em chamada", "Um detalhe seu", "Registro de hoje", "Câmera ligada", "Só para mim", "Presença à distância"],
    prompts: [
      "Mandem uma foto do que estão vendo exatamente agora, sem arrumar a cena.",
      "Cada um envia uma selfie fazendo a expressão que melhor resume o dia.",
      "Fotografem um detalhe da roupa de hoje e deixem o outro adivinhar o restante.",
      "Mandem uma foto de um objeto que faz lembrar o outro e expliquem o motivo.",
      "Façam uma chamada de cinco minutos apenas para se olhar e conversar sem pressa.",
      "Cada um mostra pela câmera o cantinho favorito do quarto.",
      "Recriem hoje a pose de uma foto antiga de vocês.",
      "Mandem uma foto do sorriso mais espontâneo que conseguirem.",
      "Escolham uma cor e fotografem três coisas dessa cor ao redor.",
      "Façam uma mini sessão de fotos com três emoções escolhidas pelo outro.",
      "Enviem uma foto do céu e comparem como ele está em cada lugar.",
      "Mostrem pela câmera a roupa que usariam se fossem se encontrar agora.",
      "Mandem uma foto sem mostrar o rosto e deixem o outro adivinhar o momento.",
      "Façam uma chamada enquanto cada um prepara a mesma bebida ou lanche.",
      "Cada um escolhe uma foto favorita do outro e conta por que gosta tanto dela.",
      "Mandem uma sequência de três fotos contando uma pequena história do dia.",
      "Façam uma foto usando algo que o outro já elogiou.",
      "Mostrem em chamada uma lembrança guardada e contem a história por trás dela.",
      "Mandem uma foto inesperada de um detalhe bonito: olhos, mãos, cabelo ou sorriso.",
      "Façam uma captura combinada em chamada, posando como se estivessem lado a lado."
    ],
    twists: [
      "Não vale usar foto antiga nem repetir a primeira tentativa.",
      "A imagem precisa representar uma palavra escolhida pelo outro.",
      "Façam com luz natural e sem filtro.",
      "Incluam uma legenda de apenas três palavras.",
      "O outro precisa responder com uma foto no mesmo tema.",
      "Transformem a foto em uma pista para uma pergunta.",
      "Façam tudo em até dois minutos.",
      "Escolham juntos qual registro merece entrar no mural.",
      "Não mostrem a foto imediatamente: deem três pistas antes.",
      "Finalizem a troca com um áudio contando o que sentiram."
    ],
    endings: [
      "Escolham qual foto ficou mais bonita e deem a ela um título só de vocês.",
      "Escolham a imagem que mais matou a saudade.",
      "Terminem marcando uma chamada mais longa.",
      "Façam um elogio específico sobre a foto recebida.",
      "Mandem mais uma foto completamente inesperada para fechar a sequência."
    ]
  },
  {
    key: "picante",
    type: "Picante",
    titles: ["Temperatura subindo", "Vontade de você", "Provocação", "Segredo quente", "Chega mais perto", "Saudade com desejo", "Só entre nós", "Clima de hoje", "Promessa provocante", "Quase sem limites"],
    prompts: [
      "Cada um descreve o beijo que mais gostaria de dar no outro agora.",
      "Mandem um elogio provocante sobre uma parte do corpo ou um jeito do outro.",
      "Contem qual roupa do outro mais desperta vontade e por quê.",
      "Descrevam uma cena romântica e intensa que gostariam de viver no próximo encontro.",
      "Façam uma lista de três carinhos que estão devendo um ao outro.",
      "Mandem uma foto sensual e discreta de um detalhe escolhido por vocês.",
      "Digam em um áudio o que fariam nos primeiros cinco minutos se estivessem juntos.",
      "Cada um escolhe uma música que criaria o clima perfeito para o casal.",
      "Brinquem de completar a frase: 'quando eu olho para você, tenho vontade de...'.",
      "Contem qual foi o momento em que mais sentiram atração um pelo outro.",
      "Escolham uma palavra secreta para avisar que estão com saudade e desejo.",
      "Façam uma promessa provocante para cumprir no próximo encontro.",
      "Descrevam lentamente um carinho que gostariam de receber.",
      "Mandem uma selfie com o olhar mais sedutor que conseguirem.",
      "Cada um revela uma fantasia romântica que ainda não contou.",
      "Escolham juntos um lugar inesperado onde gostariam de trocar um beijo demorado.",
      "Façam três perguntas de desejo que nunca tiveram coragem de fazer.",
      "Digam qual cheiro, toque ou detalhe do outro mais fica na memória.",
      "Criem um código de emojis para uma conversa mais quente durante o dia.",
      "Planejem um encontro completo começando pelo clima, roupa, música e primeiro beijo."
    ],
    twists: [
      "Façam por áudio, falando devagar e sem ensaiar.",
      "Cada um tem direito a uma pergunta extra.",
      "Comecem de forma romântica e aumentem a provocação aos poucos.",
      "Usem apenas cinco frases para dizer tudo.",
      "O outro pode escolher um detalhe para aprofundar.",
      "Façam em chamada com as luzes mais baixas.",
      "Transformem a resposta em uma promessa para depois.",
      "Alternem uma frase de cada vez até criar a cena completa.",
      "Incluam algo que já viveram e algo novo que desejam.",
      "O outro escolhe uma palavra que precisa aparecer na resposta."
    ],
    endings: [
      "Depois, cada um escolhe qual detalhe mais mexeu com a imaginação.",
      "Continuem a provocação por mais cinco mensagens.",
      "Quem deixar o outro com mais vontade escolhe a próxima missão.",
      "Transformem a resposta em uma promessa ousada para o próximo encontro.",
      "Finalizem com um áudio dizendo o que ainda ficou na vontade."
    ]
  },
  {
    key: "adulto",
    type: "Adulto +18",
    titles: ["Sem roupa e sem pressa", "Desejo explícito", "Chamada particular", "Verdade +18", "Só para adultos", "Fantasia liberada", "Noite quente", "Entre quatro paredes", "Sem censura", "Prazer a dois"],
    prompts: [
      "Peçam e troquem uma nude pensada especialmente para o outro.",
      "Façam uma chamada íntima e conduzam um ao outro apenas com a voz, dizendo o que desejam ver e sentir.",
      "Brinquem de verdade ou desafio +18 com três rodadas para cada um.",
      "Cada um descreve, com detalhes, como gostaria de fazer amor com o outro no próximo encontro.",
      "Escolham uma peça de roupa para tirar lentamente durante uma chamada privada.",
      "Troquem uma sequência de três fotos: sensual, mais ousada e completamente nua.",
      "Façam um striptease curto em chamada e caprichem na provocação.",
      "Contem uma fantasia sexual e descrevam exatamente como gostariam de vivê-la.",
      "Respondam qual posição, ritmo ou tipo de toque mais gostariam de experimentar juntos.",
      "Digam exatamente onde e como gostariam de ser beijados ou tocados pelo outro.",
      "Mandem um áudio explícito contando o que mais desejam fazer quando se encontrarem.",
      "Criem um jogo de comandos íntimos e alternem quem manda em cada rodada.",
      "Escolham um personagem ou cenário para uma interpretação adulta em chamada.",
      "Compartilhem um momento de prazer individual em chamada e provoquem um ao outro com a voz.",
      "Façam uma rodada de sexting com cinco mensagens cada, alternando quem conduz a história.",
      "Troquem uma foto íntima do ângulo que o outro escolher.",
      "Montem juntos uma lista de desejos dividida entre 'sim', 'talvez' e 'não'.",
      "Planejem uma noite de sexo completa, incluindo roupa, clima, preliminares e a parte mais desejada.",
      "Façam perguntas sobre posições, lugares e fantasias que ainda querem experimentar.",
      "Conversem sobre o que ajuda cada um a relaxar, sentir prazer e se sentir cuidado depois da intimidade."
    ],
    twists: [
      "Comecem com uma mensagem curta dizendo exatamente o que querem.",
      "Façam com luz baixa e uma música escolhida para aumentar o clima.",
      "Um escolhe o ritmo e o outro decide qual será o próximo comando.",
      "Comecem devagar e aumentem a intensidade a cada nova rodada.",
      "Façam tudo pela chamada e alternem uma provocação por vez.",
      "Alternem quem conduz e deixem cada rodada mais ousada que a anterior.",
      "Cada um diz qual parte mais gostou e pede uma continuação.",
      "Usem um cronômetro de dez minutos e não mudem de assunto até ele terminar.",
      "Incluam elogios explícitos no meio da provocação.",
      "Terminem com uma última provocação escolhida pelo outro."
    ],
    endings: [
      "Quem deixar o outro com mais vontade escolhe a próxima missão.",
      "Transformem o final em uma promessa detalhada para o próximo encontro.",
      "Depois mandem um áudio dizendo tudo o que ainda ficaram imaginando.",
      "Aumentem o desafio com uma pergunta ainda mais ousada.",
      "Finalizem escolhendo qual parte merece uma repetição mais demorada."
    ]
  }
];

function buildMissionPool() {
  return missionBlueprints.flatMap((blueprint) =>
    blueprint.prompts.flatMap((prompt, promptIndex) =>
      blueprint.twists.flatMap((twist, twistIndex) =>
        blueprint.endings.map((ending, endingIndex) => ({
          id: `${blueprint.key}-${promptIndex}-${twistIndex}-${endingIndex}`,
          level: blueprint.key,
          type: blueprint.type,
          title: blueprint.titles[(promptIndex + twistIndex + endingIndex) % blueprint.titles.length],
          text: `${prompt} ${twist} ${ending}`
        }))
      )
    )
  );
}

const coupleMissions = buildMissionPool();

function loadMissionHistory() {
  try {
    return JSON.parse(localStorage.getItem(MISSIONS_KEY)) || [];
  } catch (_) {
    return [];
  }
}

function saveMissionHistory(history) {
  localStorage.setItem(MISSIONS_KEY, JSON.stringify(history.slice(0, 5)));
}

function renderMissionHistory() {
  const container = $("#missionHistory");
  if (!container) return;
  const history = loadMissionHistory();
  container.innerHTML = history.length
    ? history.map((mission) => `
      <article>
        <strong>${escapeHtml(mission.title)}</strong>
        <span>${escapeHtml(mission.type)} · ${escapeHtml(mission.date)}</span>
      </article>
    `).join("")
    : "<article><strong>Nenhuma ainda</strong><span>Sortiem a primeira</span></article>";
}

function setMission(mission, save = true) {
  const card = $(".mission-card");
  card.dataset.missionId = mission.id || "";
  $("#missionType").textContent = mission.type;
  $("#missionTitle").textContent = mission.title;
  $("#missionText").textContent = mission.text;
  if (!save) return;
  const history = loadMissionHistory();
  saveMissionHistory([
    {
      id: mission.id || "",
      title: mission.title,
      type: mission.type,
      text: mission.text,
      level: mission.level || "leve",
      date: new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })
    },
    ...history.filter((item) => item.id ? item.id !== mission.id : item.title !== mission.title)
  ]);
  renderMissionHistory();
}

function dailyMissionIndex(poolLength) {
  const today = new Date();
  const key = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
  let hash = 2166136261;
  for (let index = 0; index < key.length; index += 1) {
    hash ^= key.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash) % poolLength;
}

function setupCoupleMissions() {
  const button = $("#missionButton");
  const dailyButton = $("#dailyMissionButton");
  if (!button) return;
  renderMissionHistory();
  const history = loadMissionHistory();
  const storedMission = history[0];
  const refreshedMission = storedMission && coupleMissions.find((mission) =>
    storedMission.id ? mission.id === storedMission.id : mission.title === storedMission.title
  );
  const lastMission = refreshedMission || (storedMission?.text && storedMission?.type ? storedMission : null);
  if (lastMission) setMission(lastMission, false);

  button.addEventListener("click", () => {
    const currentId = $(".mission-card").dataset.missionId;
    const options = coupleMissions.filter((mission) => mission.id !== currentId);
    const mission = options[Math.floor(Math.random() * options.length)];
    setMission(mission);
    showToast("Missão do casal sorteada.");
  });

  dailyButton.addEventListener("click", () => {
    setMission(coupleMissions[dailyMissionIndex(coupleMissions.length)]);
    showToast("A missão de hoje foi revelada.");
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
setupLoveReasons();
setupRevealAnimations();
setupGallery();
setupMemoryForm();
setupBackup();
setupCoupleMissions();
setupPlaylistForm();
setupAuthentication();
initializeSupabase();
loadYouTubePlayer();
$("#soundButton").addEventListener("click", toggleAmbientSound);
