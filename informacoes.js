// Informações da loja: independentes do carregamento do catálogo.
(() => {
    const botoes = document.querySelectorAll('[data-dialog]');
    botoes.forEach(botao => {
        const modal = document.getElementById(botao.dataset.dialog);
        let overflowAnterior = '';
        botao.addEventListener('click', () => {
            if (modal.open) return;
            overflowAnterior = document.body.style.overflow;
            modal.showModal();
            document.body.style.overflow = 'hidden';
        });
        modal.querySelector('.fechar-informacao').addEventListener('click', () => modal.close());
        modal.addEventListener('click', event => {
            if (event.target !== modal) return;
            const limites = modal.getBoundingClientRect();
            if (event.clientX < limites.left || event.clientX > limites.right ||
                event.clientY < limites.top || event.clientY > limites.bottom) modal.close();
        });
        modal.addEventListener('close', () => {
            document.body.style.overflow = overflowAnterior;
            botao.focus();
        });
    });
})();
