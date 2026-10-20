(() => {
  'use strict';
  const KEY = 'mercearia-esquina:carrinho:v1';
  const money = cents => (cents / 100).toLocaleString('pt-BR', {style:'currency',currency:'BRL'});
  const dialog = document.getElementById('carrinho');
  const list = document.getElementById('carrinhoItens');
  const checkout = document.getElementById('finalizarPedido');
  const notice = document.getElementById('avisoCarrinho');
  let catalog = new Map(), ready = false, items = [], previousOverflow = '';
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) || '[]');
    if (Array.isArray(saved)) {
      const unique = new Map();
      saved.slice(0,200).forEach(item => {
        if (!item || !['string','number'].includes(typeof item.id) || typeof item.nome !== 'string' || !Number.isSafeInteger(item.centavos) || item.centavos < 0 || !Number.isInteger(item.quantidade) || item.quantidade < 1) return;
        unique.set(String(item.id), {id:String(item.id),nome:item.nome.slice(0,300),centavos:item.centavos,quantidade:Math.min(99,item.quantidade)});
      });
      items = [...unique.values()];
    }
  } catch (_) { /* Carrinho novo se o armazenamento estiver indisponível. */ }
  const persist = () => {try {localStorage.setItem(KEY,JSON.stringify(items));} catch (_) {notice.textContent='Seu navegador não permitiu salvar o carrinho. Ele será mantido enquanto esta página estiver aberta.';}};
  const valid = item => catalog.has(item.id) && catalog.get(item.id).status !== 'esgotado' && Number.isFinite(Number(catalog.get(item.id).preco)) && Number(catalog.get(item.id).preco) >= 0;
  const total = () => items.reduce((sum,item) => sum + item.centavos * item.quantidade,0);
  function element(tag, text, className) {
    const node = document.createElement(tag);
    if (text !== undefined) node.textContent = text;
    if (className) node.className = className;
    return node;
  }
  function button(text,label,action) {
    const node = element('button',text); node.type='button'; node.setAttribute('aria-label',label); node.addEventListener('click',action); return node;
  }
  function change(id,delta) {
    const item = items.find(x=>x.id===id); if (!item) return;
    item.quantidade = Math.min(99,item.quantidade+delta);
    if (item.quantidade<=0) items=items.filter(x=>x.id!==id);
    render();persist();
    const next = [...list.querySelectorAll('button')].find(b=>b.dataset.focusKey===id+':'+delta);
    (next || document.getElementById('fecharCarrinho')).focus();
  }
  function render() {
    list.replaceChildren();
    const count=items.reduce((sum,item)=>sum+item.quantidade,0);
    document.getElementById('contadorCarrinho').textContent=String(count);
    document.getElementById('abrirCarrinho').setAttribute('aria-label',`Abrir carrinho com ${count} itens`);
    document.getElementById('totalCarrinho').textContent=money(total());
    checkout.disabled=!ready || items.length===0 || items.some(item=>!valid(item));
    notice.textContent=items.length && !ready ? 'Aguardando o catálogo para confirmar os produtos e preços.' : items.some(item=>ready && !valid(item)) ? 'Remova os produtos indisponíveis para continuar.' : '';
    if (!items.length) {list.append(element('p','Seu carrinho está vazio. Adicione produtos do catálogo para montar seu pedido.','carrinho-vazio'));return;}
    items.forEach(item=>{
      const row=element('li',undefined,'carrinho-item');
      const info=element('div',undefined,'carrinho-item-info');
      info.append(element('h3',item.nome),element('p',`${money(item.centavos)} por unidade`));
      if(ready && !valid(item)) info.append(element('p','Produto indisponível','item-indisponivel'));
      const controls=element('div',undefined,'carrinho-controles');
      const minus=button('−',`Diminuir quantidade de ${item.nome}`,()=>change(item.id,-1));minus.dataset.focusKey=item.id+':-1';
      const plus=button('+',`Aumentar quantidade de ${item.nome}`,()=>change(item.id,1));plus.dataset.focusKey=item.id+':1';plus.disabled=item.quantidade>=99 || (ready && !valid(item));
      const quantity=element('span',String(item.quantidade));quantity.setAttribute('aria-label',`Quantidade: ${item.quantidade}`);
      controls.append(minus,quantity,plus);
      const remove=button('Remover',`Remover ${item.nome}`,()=>{items=items.filter(x=>x.id!==item.id);render();persist();document.getElementById('fecharCarrinho').focus();});remove.className='remover-item';
      row.append(info,element('strong',money(item.centavos*item.quantidade),'subtotal-item'),controls,remove);list.append(row);
    });
  }
  function open() {render();if(!dialog.open){previousOverflow=document.body.style.overflow;dialog.showModal();document.body.style.overflow='hidden';}}
  document.getElementById('abrirCarrinho').addEventListener('click',open);
  document.getElementById('fecharCarrinho').addEventListener('click',()=>dialog.close());
  document.getElementById('continuarComprando').addEventListener('click',()=>dialog.close());
  dialog.addEventListener('close',()=>{document.body.style.overflow=previousOverflow;});
  dialog.addEventListener('click',event=>{if(event.target!==dialog)return;const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close();});
  checkout.addEventListener('click',()=>{
    if(checkout.disabled)return;
    const lines=['Olá! Gostaria de finalizar meu pedido na Mercearia da Esquina:','',...items.map(item=>`• ${item.quantidade} x ${item.nome} - ${money(item.centavos * item.quantidade).replace(/\s/g, '')}`),'',`Total dos produtos: ${money(total()).replace(/\u00A0/g, ' ')}`];
    window.open('https://wa.me/5591984344128?text='+encodeURIComponent(lines.join('\n')),'_blank','noopener,noreferrer');
  });
  window.MerceariaCart={
    setCatalog(products) {
      catalog=new Map(products.map(p=>[String(p.id),p]));ready=true;
      items.forEach(item=>{if(valid(item)){const p=catalog.get(item.id);item.nome=String(p.nome);item.centavos=Math.round(Number(p.preco)*100);}});
      render();persist();
    },
    add(id) {
      const key=String(id),p=catalog.get(key);
      if(!ready || !valid({id:key}))return;
      const item=items.find(x=>x.id===key);
      if(item && item.quantidade>=99){document.getElementById('statusCarrinho').textContent='Limite de 99 unidades por produto.';return;}
      if(item)item.quantidade++;else items.push({id:key,nome:String(p.nome),centavos:Math.round(Number(p.preco)*100),quantidade:1});
      render();persist();
      document.getElementById('statusCarrinho').textContent=`${p.nome} adicionado ao carrinho. ${items.reduce((s,i)=>s+i.quantidade,0)} itens no total.`;
    }
  };
  render();
})();
