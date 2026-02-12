let clientes = JSON.parse(localStorage.getItem("flowzap_clientes")) || [];
let meta = 20;

/* ================= SALVAR ================= */
function salvar() {
  localStorage.setItem("flowzap_clientes", JSON.stringify(clientes));
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

  if (!numero.startsWith("55")) {
    numero = "55" + numero;
  }

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

/* ================= MÁSCARA AUTOMÁTICA ================= */

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
  let nome = document.getElementById("nome").value.trim();
  let telefoneInput = document.getElementById("telefone").value.trim();

  if (!nome || !telefoneInput) {
    alert("Preencha tudo!");
    return;
  }

  if (!numeroValido(telefoneInput)) {
    alert("Número inválido! Use DDD + número.");
    return;
  }

  if (numeroDuplicado(telefoneInput)) {
    alert("Esse número já foi cadastrado!");
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
      <br>
      <button onclick="abrirWhats('${cliente.telefone}')" class="btn-whats">
        🟢 WhatsApp
      </button>
      <button onclick="mover(${cliente.id})">Mover</button>
      <button onclick="excluir(${cliente.id})">X</button>
    `;

    document.getElementById(cliente.status).appendChild(card);
  });

  atualizarMeta();
}

/* ================= MOVER ================= */

function mover(id) {
  const ordem = ["Novo", "Conversa", "Fechado", "Perdido"];
  const cliente = clientes.find(c => c.id === id);

  let index = ordem.indexOf(cliente.status);
  cliente.status = ordem[(index + 1) % ordem.length];

  salvar();
  renderizar();
}

/* ================= EXCLUIR ================= */

function excluir(id) {
  clientes = clientes.filter(c => c.id !== id);
  salvar();
  renderizar();
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

/* ================= COLUNAS RECOLHÍVEIS ================= */

function toggleColuna(status) {
  const colunas = ["Novo", "Conversa", "Fechado", "Perdido"];

  colunas.forEach(nome => {
    const lista = document.getElementById(nome);

    if (nome === status) {
      lista.style.display =
        lista.style.display === "none" ? "block" : "none";
    } else {
      lista.style.display = "none";
    }
  });
}

/* ================= BACKUP ================= */

function exportarDados() {
  const blob = new Blob([JSON.stringify(clientes)], { type: "application/json" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "flowzap-backup.json";
  link.click();
}

function importarDados(event) {
  const file = event.target.files[0];
  const reader = new FileReader();

  reader.onload = function(e) {
    clientes = JSON.parse(e.target.result);
    salvar();
    renderizar();
  };

  reader.readAsText(file);
}

/* ================= INICIAR ================= */

renderizar();
