let clientes = JSON.parse(localStorage.getItem("flowzap_clientes")) || [];
let meta = 20;

/* ================= SISTEMA DE PLANO ================= */

const LIMITE_FREE = 5;
let plano = localStorage.getItem("flowzap_plano") || "free";

/* ===== GERAR ID ÚNICO DO DISPOSITIVO ===== */

function gerarDeviceId() {
  let id = localStorage.getItem("nexlead_device");

  if (!id) {
    id = "DEV-" + Math.random().toString(36).substring(2, 12);
    localStorage.setItem("nexlead_device", id);
  }

  return id;
}

const deviceId = gerarDeviceId();

/* ===== GERAR CÓDIGO BASEADO NO DEVICE ===== */

function gerarCodigoValido() {
  const segredo = "NEXLEAD2026";
  return btoa(deviceId + segredo).substring(0, 20);
}

/* ================= SALVAR ================= */

function salvar() {
  localStorage.setItem("flowzap_clientes", JSON.stringify(clientes));
}

/* ================= VERIFICAR LIMITE ================= */

function verificarLimite() {
  if (plano === "premium") return true;

  if (clientes.length >= LIMITE_FREE) {
    abrirModalPagamento();
    return false;
  }

  return true;
}

/* ================= FORMATADORES ================= */

function formatarNome(nome) {
  nome = nome.replace("@", "").trim();
  nome = nome.charAt(0).toUpperCase() + nome.slice(1).toLowerCase();
  return "@" + nome;
}

function limparNumero(numero) {
  return numero.replace(/\D/g, "");
}

function formatarTelefone(numero) {
  numero = limparNumero(numero);
  if (!numero.startsWith("55")) numero = "55" + numero;
  return numero;
}

function formatarExibicao(numero) {
  numero = numero.replace(/^55/, "");
  if (numero.length === 11) {
    return numero.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
  }
  return numero;
}

/* ================= VALIDAÇÃO ================= */

function numeroValido(numero) {
  numero = limparNumero(numero);
  return numero.length === 11 || numero.length === 13;
}

function numeroDuplicado(numero) {
  numero = formatarTelefone(numero);
  return clientes.some(c => c.telefone === numero);
}

/* ================= MÁSCARA TELEFONE ================= */

document.getElementById("telefone").addEventListener("input", function(e) {
  let numero = limparNumero(e.target.value);
  if (numero.length > 11) numero = numero.slice(0, 11);

  if (numero.length > 6) {
    numero = numero.replace(/(\d{2})(\d{5})(\d+)/, "($1) $2-$3");
  } else if (numero.length > 2) {
    numero = numero.replace(/(\d{2})(\d+)/, "($1) $2");
  }

  e.target.value = numero;
});

/* ================= ADICIONAR ================= */

function adicionarCliente() {
  if (!verificarLimite()) return;

  let nome = document.getElementById("nome").value.trim();
  let telefoneInput = document.getElementById("telefone").value.trim();

  if (!nome || !telefoneInput) {
    mostrarToast("Preencha todos os campos");
    return;
  }

  if (!numeroValido(telefoneInput)) {
    mostrarToast("Número inválido");
    return;
  }

  if (numeroDuplicado(telefoneInput)) {
    mostrarToast("Número já cadastrado");
    return;
  }

  nome = formatarNome(nome);
  const telefone = formatarTelefone(telefoneInput);

  clientes.push({
    id: Date.now(),
    nome,
    telefone,
    status: "Novo"
  });

  document.getElementById("nome").value = "";
  document.getElementById("telefone").value = "";

  salvar();
  renderizar();
}

/* ================= RENDER ================= */

function renderizar() {

  const colunas = ["Novo", "Conversa", "Fechado", "Perdido"];

  colunas.forEach(status => {
    const lista = document.getElementById(status);
    lista.innerHTML = "";

    const quantidade = clientes.filter(c => c.status === status).length;
    document.getElementById("count-" + status).innerText = quantidade;
  });

  clientes.forEach(cliente => {

    const card = document.createElement("div");
    card.className = "card";

    card.innerHTML = `
      <strong>${cliente.nome}</strong>
      <small>${formatarExibicao(cliente.telefone)}</small>
      <div class="card-buttons">
        <button onclick="abrirWhats('${cliente.telefone}')">WhatsApp</button>
        <button onclick="mover(${cliente.id})">Mover</button>
        <button onclick="excluir(${cliente.id})">Excluir</button>
      </div>
    `;

    document.getElementById(cliente.status).appendChild(card);
  });

  atualizarMeta();
  mostrarPlano();
}

/* ================= WHATS ================= */

function abrirWhats(numero) {
  window.open(`https://wa.me/${numero}`, "_blank");
}

/* ================= META ================= */

function atualizarMeta() {
  const fechados = clientes.filter(c => c.status === "Fechado").length;
  document.getElementById("fechados").innerText = fechados;

  const porcentagem = (fechados / meta) * 100;
  document.getElementById("progressBar").style.width = porcentagem + "%";
}

/* ================= MOSTRAR PLANO ================= */

function mostrarPlano() {
  const el = document.getElementById("planoAtual");
  if (!el) return;

  el.innerText = plano === "premium"
    ? "Premium 🚀"
    : "Free (5 contatos)";
}

/* ================= MODAL PAGAMENTO ================= */

function abrirModalPagamento() {

  const modal = document.createElement("div");
  modal.id = "modalPagamento";

  modal.innerHTML = `
    <div class="modal-box">
      <h2>Desbloqueie o Premium 🚀</h2>
      <p>Contatos ilimitados + acesso vitalício</p>
      <h3>R$ 29,99 pagamento único</h3>

      <div class="pix-box">
        <p><strong>Chave PIX:</strong></p>
        <input id="pixKey" value="nexleadnexlead@gmail.com" readonly>
        <button onclick="copiarPix()">Copiar Chave pix</button>

        <button class="btn-secondary" onclick="abrirWhatsSuporte()">Enviar Comprovante Pix +55-(61)99881-4365</button>
      </div>

      <p class="device-id">Seu Device ID:</p>
      <small>${deviceId}</small>

      <input id="codigoPremium" placeholder="Digite seu código de ativação">

      <button class="btn-primary" onclick="ativarPremium()">Ativar Premium</button>
      
      <button class="btn-close" onclick="fecharModal()">Fechar</button>
    </div>
  `;

  document.body.appendChild(modal);
}

function fecharModal() {
  document.getElementById("modalPagamento")?.remove();
}

/* ================= PIX ================= */

function copiarPix() {
  const pix = document.getElementById("pixKey");
  pix.select();
  document.execCommand("copy");
  mostrarToast("Chave PIX copiada!");
}

function abrirWhatsSuporte() {
  const mensagem = encodeURIComponent(
    `Olá, fiz o pagamento do Premium.\nMeu Device ID: ${deviceId}`
  );
  window.open(`https://wa.me/5561998814365?text=${mensagem}`, "_blank");
}

/* ================= ATIVAÇÃO ================= */

function ativarPremium() {

  const codigoDigitado = document.getElementById("codigoPremium").value.trim();
  const codigoCorreto = gerarCodigoValido();

  if (codigoDigitado === codigoCorreto) {

    plano = "premium";
    localStorage.setItem("flowzap_plano", "premium");

    fecharModal();
    mostrarToast("Premium ativado com sucesso 🚀");
    renderizar();

  } else {
    mostrarToast("Código inválido");
  }
}

/* ================= TOAST ================= */

function mostrarToast(mensagem) {

  const toast = document.createElement("div");
  toast.className = "toast";
  toast.innerText = mensagem;

  document.body.appendChild(toast);

  setTimeout(() => {
    toast.remove();
  }, 3000);
}

/* ================= INICIAR ================= */

renderizar();
