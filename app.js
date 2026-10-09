// ============================================================
// PySchool — app.js
// Conecta direto na API REST do Supabase.
// ATENÇÃO: apenas a PUBLISHABLE key pode ficar aqui.
// A SECRET key (sb_secret_...) NUNCA deve ir para o frontend —
// qualquer visitante conseguiria acessar todo o banco com ela.
// ============================================================

const SUPABASE_URL = "https://uaonpehkmxqgvekrdmud.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_s5D2znFTI0ALTvH1Ipthpw_o-RyaE0o";
let modoCadastro = false;

// Helper para chamadas à API REST do Supabase
async function supabaseFetch(caminho, opcoes = {}) {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/${caminho}`, {
        ...opcoes,
        headers: {
            apikey: SUPABASE_PUBLISHABLE_KEY,
            Authorization: `Bearer ${SUPABASE_PUBLISHABLE_KEY}`,
            "Content-Type": "application/json",
            ...(opcoes.headers || {})
        }
    });
    if (!response.ok) {
        const texto = await response.text();
        throw new Error(`Supabase ${response.status}: ${texto}`);
    }
    return response.json();
}

function usuarioAtual() {
    return localStorage.getItem("pyschool_usuario");
}

function nomeUsuarioAtual() {
    return localStorage.getItem("pyschool_nome");
}

async function buscarLicoes() {
    const response = await fetch('/api/licoes');
    if (!response.ok) {
        throw new Error(`Erro ao carregar lições: HTTP ${response.status}`);
    }
    const texto = await response.text();
    return texto ? JSON.parse(texto) : null;
}

async function chamarRpc(nomeFuncao, corpo) {
    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${nomeFuncao}`, {
            method: 'POST',
            headers: {
                apikey: SUPABASE_PUBLISHABLE_KEY,
                Authorization: `Bearer ${SUPABASE_PUBLISHABLE_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify(corpo)
        });
        if (!response.ok) {
            console.error(`Erro Supabase ${response.status}: ${await response.text()}`);
            return null;
        }
        return await response.json();
    } catch (error) {
        console.error('Erro ao chamar função do Supabase:', error);
        return null;
    }
}

async function verificarLogin(email, senha, nome) {
    if (modoCadastro) {
        const cadastro = await chamarRpc('pyschool_cadastrar', {
            p_nome: nome,
            p_email: email,
            p_senha: senha
        });
        if (cadastro !== true) {
            return 'cadastro-falhou';
        }
    }

    const linhas = await chamarRpc('pyschool_entrar', {
        p_email: email,
        p_senha: senha
    });
    if (!Array.isArray(linhas) || linhas.length === 0) {
        return modoCadastro ? 'cadastro-falhou' : 'senha-incorreta';
    }

    localStorage.setItem("pyschool_usuario", linhas[0].email || email);
    localStorage.setItem("pyschool_nome", linhas[0].nome || nome || linhas[0].email || email);
    return 'ok';
}

function mostrarMensagemLogin(mensagem) {
    document.getElementById('msg-login').textContent = mensagem;
}

function alternarCadastro() {
    modoCadastro = !modoCadastro;
    document.getElementById('campo-nome').style.display = modoCadastro ? 'block' : 'none';
    document.getElementById('botao-entrar').textContent = modoCadastro ? 'Criar conta' : 'Entrar no PySchool';
    document.getElementById('link-cadastro').textContent = modoCadastro ? 'Já tenho conta. Quero entrar' : 'Primeira vez? Crie sua conta';
    mostrarMensagemLogin('');
}

// Espera o HTML carregar completamente para executar o script
document.addEventListener('DOMContentLoaded', () => {
    // Verifica se já existe um usuário salvo no localStorage
    const usuarioSalvo = localStorage.getItem("pyschool_usuario");
    const nomeSalvo = nomeUsuarioAtual();
    if (usuarioSalvo && nomeSalvo) {
        iniciarApp(nomeSalvo);
    }

    // Adiciona o evento de submit no formulário de login
    const formLogin = document.getElementById('form-login');
    formLogin.addEventListener('submit', async (e) => {
        e.preventDefault(); // Evita o recarregamento da página
        const email = document.getElementById('campo-email').value.trim();
        const senha = document.getElementById('campo-senha').value;
        const nome = document.getElementById('campo-nome').value.trim();
        if (modoCadastro && !nome) {
            mostrarMensagemLogin('Digite o seu nome');
            return;
        }
        const resultado = await verificarLogin(email, senha, nome);
        if (resultado === 'ok') {
            iniciarApp(nomeUsuarioAtual());
        } else if (resultado === 'cadastro-falhou') {
            mostrarMensagemLogin('Não foi possível criar a conta. Esse e-mail já pode ter conta.');
        } else {
            mostrarMensagemLogin('E-mail ou senha incorretos');
        }
    });
});

// Função para iniciar o app após o login
function iniciarApp(nome) {
    document.getElementById('tela-login').style.display = 'none';
    document.getElementById('app').style.display = 'flex';
    document.getElementById('nome-usuario').textContent = nome;
    document.getElementById('perfil-nome').textContent = nome;

    // Inicia na tela inicial e carrega os dados
    mostrarTela('inicio');
    carregarLicoes();
    atualizarProgresso();
}

// Função para sair do app (logout)
function sair() {
    localStorage.removeItem("pyschool_usuario");
    localStorage.removeItem("pyschool_nome");
    document.getElementById('app').style.display = 'none';
    document.getElementById('tela-login').style.display = 'flex';
    document.getElementById('form-login').reset();
    if (modoCadastro) {
        alternarCadastro();
    }
}

// Função para alternar entre as telas (seções) do app
function mostrarTela(nome) {
    document.getElementById('tela-inicio').style.display = 'none';
    document.getElementById('tela-progresso').style.display = 'none';
    document.getElementById('tela-perfil').style.display = 'none';
    document.getElementById('tela-' + nome).style.display = 'block';
}

// Busca as lições no Supabase e monta os cards na tela inicial
async function carregarLicoes() {
    const container = document.getElementById('lista-licoes');
    container.replaceChildren();
    try {
        const licoes = await buscarLicoes();
        let idsConcluidos = new Set();
        try {
            const usuario = encodeURIComponent(usuarioAtual() || '');
            const progresso = await supabaseFetch(`pyschool_progresso?aluno=eq.${usuario}&select=licao_id`);
            idsConcluidos = new Set(progresso.map(p => String(p.licao_id)));
        } catch (error) {
            console.error('Erro ao carregar progresso das lições:', error);
        }

        licoes.forEach(licao => {
            const concluida = idsConcluidos.has(String(licao.id));

            // Cria o elemento do card
            const card = document.createElement('div');
            // Adiciona a classe 'concluida' se a lição já tiver sido feita
            card.className = 'card' + (concluida ? ' concluida' : '');

            const detalhes = document.createElement('div');
            const titulo = document.createElement('h3');
            titulo.className = 'titulo-licao';
            titulo.textContent = licao.titulo;
            const descricao = document.createElement('p');
            descricao.textContent = licao.descricao;
            detalhes.append(titulo, descricao);

            const acoes = document.createElement('div');
            acoes.style.cssText = 'display: flex; align-items: center; gap: 15px;';
            const badge = document.createElement('span');
            badge.className = 'badge';
            badge.textContent = `${licao.xp} XP`;
            const botao = document.createElement('button');
            botao.disabled = concluida;
            botao.textContent = concluida ? 'Concluída' : 'Concluir';
            botao.addEventListener('click', () => concluirLicao(licao.id));
            acoes.append(badge, botao);
            card.append(detalhes, acoes);
            container.appendChild(card);
        });
    } catch (error) {
        console.error('Erro ao carregar lições:', error);
        const mensagem = document.createElement('p');
        mensagem.textContent = 'Não foi possível carregar as lições agora. Tente novamente em instantes.';
        container.appendChild(mensagem);
    }
}

// Marca uma lição como concluída no Supabase (sem duplicar)
async function concluirLicao(id) {
    try {
        await supabaseFetch('pyschool_progresso?on_conflict=aluno,licao_id', {
            method: 'POST',
            headers: { Prefer: 'resolution=ignore-duplicates,return=minimal' },
            body: JSON.stringify({ aluno: usuarioAtual(), licao_id: id })
        });
        // Recarrega as lições e o progresso para refletir a mudança
        await Promise.all([carregarLicoes(), atualizarProgresso()]);
    } catch (error) {
        console.error('Erro ao concluir lição:', error);
    }
}

// Busca o progresso no Supabase e atualiza a interface
async function atualizarProgresso() {
    try {
        const usuario = encodeURIComponent(usuarioAtual() || '');
        const [licoes, progresso] = await Promise.all([
            buscarLicoes(),
            supabaseFetch(`pyschool_progresso?aluno=eq.${usuario}&select=licao_id`)
        ]);

        const total = licoes.length;
        const concluidas = progresso.length;
        const mapaXp = new Map(licoes.map(l => [String(l.id), l.xp || 0]));
        const xpTotal = progresso.reduce((soma, p) => soma + (mapaXp.get(String(p.licao_id)) || 0), 0);

        // Atualiza os textos de XP e contadores
        document.getElementById('xp-total').textContent = xpTotal;
        document.getElementById('perfil-xp').textContent = xpTotal;
        document.getElementById('contador-licoes').textContent = `${concluidas} de ${total}`;

        // Calcula a porcentagem para a barra de progresso
        const porcentagem = total > 0 ? (concluidas / total) * 100 : 0;
        document.getElementById('barra-progresso').style.width = `${porcentagem}%`;
    } catch (error) {
        console.error('Erro ao atualizar progresso:', error);
    }
}
