// ==============================
// SUPABASE
// ==============================

const config = window.LOJA_CONFIG || {};
const supabaseClient = config.supabaseUrl && config.supabaseKey && window.supabase
    ? window.supabase.createClient(config.supabaseUrl, config.supabaseKey)
    : null;


// ==============================
// WHATSAPP MERCEARIA DA ESQUINA
// ==============================

const contatosWhatsApp = [
    { elemento: "whatsappLoja", numero: "5591984344128" }
];


// ==============================
// PRODUTOS
// ==============================

let produtos = [];

let categoriaAtual =
    "todos";


// ==============================
// ELEMENTOS
// ==============================

const listaProdutos =
    document.getElementById(
        "listaProdutos"
    );

const campoBusca =
    document.getElementById(
        "campoBusca"
    );

const botoesCategorias =
    document.querySelectorAll(
        ".categoria"
    );

const quantidadeProdutos =
    document.getElementById(
        "quantidadeProdutos"
    );

const semResultados =
    document.getElementById(
        "semResultados"
    );


// ==============================
// FORMATAR PREÇO
// ==============================

function formatarPreco(valor) {

    return Number(valor).toLocaleString(
        "pt-BR",
        {
            style: "currency",
            currency: "BRL"
        }
    );

}


// ==============================
// NOME DA CATEGORIA
// ==============================

function nomeCategoria(categoria) {

    const categorias = {
        alimentos: "Alimentos",
        bebidas: "Bebidas",
        limpeza: "Limpeza",
        higiene: "Higiene",
        utilidades: "Utilidades"
    };

    return categorias[categoria]
        || categoria;

}


// ==============================
// CARREGAR PRODUTOS
// ==============================

async function carregarProdutos() {
    if (!supabaseClient) {
        produtos = []; filtrarProdutos();
        quantidadeProdutos.textContent = 'Catálogo em preparação';
        return;
    }

    quantidadeProdutos.textContent =
        "Carregando...";

    const {
        data,
        error
    } = await supabaseClient
        .from("produtos")
        .select("*")
        .order(
            "created_at",
            {
                ascending: false
            }
        );

    if (error) {

        console.error(
            "Erro ao carregar produtos:",
            error
        );

        quantidadeProdutos.textContent =
            "Erro ao carregar";

        listaProdutos.innerHTML = `
            <p style="
                grid-column: 1 / -1;
                text-align: center;
                color: #888;
                padding: 30px;
            ">
                Não foi possível carregar
                os produtos.
            </p>
        `;

        return;
    }

    produtos =
        data || [];
    window.MerceariaCart.setCatalog(produtos);

    filtrarProdutos();

}


// ==============================
// MOSTRAR PRODUTOS
// ==============================

function mostrarProdutos(lista) {

    listaProdutos.innerHTML = "";

    quantidadeProdutos.textContent =
        lista.length === 1
            ? "1 produto"
            : `${lista.length} produtos`;

    if (lista.length === 0) {

        semResultados.style.display =
            "block";

        return;
    }

    semResultados.style.display =
        "none";

    lista.forEach(produto => {

        const card =
            document.createElement(
                "article"
            );

        card.classList.add(
            "produto-card"
        );

        const imagem = produto.imagem_url || "img/logo.png";

        const disponivel =
            produto.status
            !== "esgotado";

        card.innerHTML = `
            <div class="produto-imagem">

                <img
                    src="${imagem}"
                    alt="${produto.nome}"
                    loading="lazy"
                >

                <span class="etiqueta">
                    ${
                        disponivel
                            ? "DISPONÍVEL"
                            : "ESGOTADO"
                    }
                </span>

            </div>

            <div class="produto-info">

                <span class="produto-categoria">
                    ${nomeCategoria(
                        produto.categoria
                    )}
                </span>

                <h3>
                    ${produto.nome}
                </h3>

                <p class="produto-preco">
                    ${formatarPreco(
                        produto.preco
                    )}
                </p>

                ${
                    disponivel
                    ? `
                        <button
                            class="botao-whatsapp"
                            data-adicionar-carrinho
                        >
                            Adicionar ao carrinho
                        </button>
                    `
                    : `
                        <button
                            class="botao-whatsapp"
                            disabled
                            style="
                                opacity: 0.45;
                                cursor: not-allowed;
                            "
                        >
                            Produto esgotado
                        </button>
                    `
                }

            </div>
        `;

        const adicionar = card.querySelector('[data-adicionar-carrinho]');
        if (adicionar) adicionar.addEventListener('click', () => window.MerceariaCart.add(produto.id));
        listaProdutos.appendChild(card);

    });

}


// ==============================
// FILTRAR
// ==============================

function filtrarProdutos() {

    const pesquisa =
        campoBusca.value
            .toLowerCase()
            .trim();

    const filtrados =
        produtos.filter(
            produto => {

                const nome =
                    (
                        produto.nome
                        || ""
                    ).toLowerCase();

                const combinaBusca =
                    nome.includes(
                        pesquisa
                    );

                const combinaCategoria =
                    categoriaAtual === "todos"
                    ||
                    produto.categoria === categoriaAtual;

                return (
                    combinaBusca
                    &&
                    combinaCategoria
                );

            }
        );

    mostrarProdutos(
        filtrados
    );

}


// ==============================
// BUSCA
// ==============================

campoBusca.addEventListener(
    "input",
    filtrarProdutos
);


// ==============================
// CATEGORIAS
// ==============================

botoesCategorias.forEach(
    botao => {

        botao.addEventListener(
            "click",
            () => {

                botoesCategorias
                    .forEach(
                        btn => {

                            btn.classList
                                .remove(
                                    "ativa"
                                );

                        }
                    );

                botao.classList.add(
                    "ativa"
                );

                categoriaAtual =
                    botao.dataset
                        .categoria;

                filtrarProdutos();

            }
        );

    }
);


// ==============================
// WHATSAPP
// ==============================

const modalVendedores = document.getElementById("modalVendedores");
let overflowAntesVendedores = "";

document.getElementById("fecharVendedores").addEventListener("click", () => {
    modalVendedores.close();
});

modalVendedores.addEventListener("click", event => {
    const limites = modalVendedores.getBoundingClientRect();
    if (event.target === modalVendedores && (
        event.clientX < limites.left || event.clientX > limites.right ||
        event.clientY < limites.top || event.clientY > limites.bottom
    )) {
        modalVendedores.close();
    }
});

modalVendedores.addEventListener("close", () => {
    document.body.style.overflow = overflowAntesVendedores;
});

function comprarProduto(id) {

    const produto =
        produtos.find(
            produto =>
                produto.id === id
        );

    if (!produto || produto.status === "esgotado") {
        return;
    }

    const mensagem =
        `Olá! Tenho interesse no produto ` +
        `"${produto.nome}", no valor de ` +
        `${formatarPreco(produto.preco)}. ` +
        `Gostaria de saber mais.`;

    contatosWhatsApp.forEach(contato => {
        document.getElementById(contato.elemento).href =
            `https://wa.me/${contato.numero}?text=${encodeURIComponent(mensagem)}`;
    });

    document.getElementById("produtoVendedores").textContent =
        `${produto.nome} • ${formatarPreco(produto.preco)}`;

    if (!modalVendedores.open) {
        overflowAntesVendedores = document.body.style.overflow;
        modalVendedores.showModal();
        document.body.style.overflow = "hidden";
    }

}


// ==============================
// ATUALIZAÇÃO EM TEMPO REAL
// ==============================

if (supabaseClient) supabaseClient
    .channel(
        "produtos-mercearia-esquina"
    )
    .on(
        "postgres_changes",
        {
            event: "*",
            schema: "public",
            table: "produtos"
        },
        () => {
            carregarProdutos();
        }
    )
    .subscribe();


// ==============================
// INICIAR SITE
// ==============================
// ==============================
// AMPLIAR FOTO DA JOIA
// ==============================

const modalImagem =
    document.getElementById(
        "modalImagem"
    );

const imagemAmpliada =
    document.getElementById(
        "imagemAmpliada"
    );

const fecharModal =
    document.getElementById(
        "fecharModal"
    );


// ABRIR FOTO
listaProdutos.addEventListener(
    "click",
    event => {

        const imagemClicada =
            event.target.closest(
                ".produto-imagem img"
            );

        if (!imagemClicada) {
            return;
        }

        imagemAmpliada.src =
            imagemClicada.src;

        imagemAmpliada.alt =
            imagemClicada.alt;

        imagemAmpliada.classList
            .remove("zoom");

        modalImagem.classList
            .add("ativo");

        document.body.style.overflow =
            "hidden";

    }
);


// DAR ZOOM NA FOTO
imagemAmpliada.addEventListener(
    "click",
    event => {

        event.stopPropagation();

        imagemAmpliada.classList
            .toggle("zoom");

    }
);


// FUNÇÃO PARA FECHAR
function fecharImagemAmpliada() {

    modalImagem.classList
        .remove("ativo");

    imagemAmpliada.classList
        .remove("zoom");

    imagemAmpliada.src = "";

    document.body.style.overflow =
        "";

}


// BOTÃO X
fecharModal.addEventListener(
    "click",
    fecharImagemAmpliada
);


// CLICAR NO FUNDO ESCURO
modalImagem.addEventListener(
    "click",
    event => {

        if (
            event.target === modalImagem
            ||
            event.target.classList
                .contains(
                    "modal-conteudo"
                )
        ) {

            fecharImagemAmpliada();

        }

    }
);


// TECLA ESC NO COMPUTADOR
document.addEventListener(
    "keydown",
    event => {

        if (
            event.key === "Escape"
            &&
            modalImagem.classList
                .contains("ativo")
        ) {

            fecharImagemAmpliada();

        }

    }
);
carregarProdutos();