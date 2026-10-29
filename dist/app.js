'use strict';
const PRODUCTS = [
{id:'hoodie',name:'The Bearcat Hoodie',category:'Apparel',isNew:true,price:58,color:'Royal blue',hex:'#2346af',bg:'#e2e7ef',type:'hoodie',tag:'Founders edit',sizes:['S','M','L','XL','2XL'],stock:[5,8,10,6,3],description:'A campus staple, reimagined in royal blue. A proposed heavyweight hoodie with collegiate lettering and a roomy front pocket.'},
{id:'tee',name:'Heritage Tee',category:'Apparel',price:28,color:'Vintage cream',hex:'#e7e1d2',bg:'#e9e6df',type:'tee',tag:'Everyday essential',sizes:['S','M','L','XL','2XL'],stock:[8,12,12,8,4],description:'An easy everyday tee with a vintage-inspired Rust College print. A sample design celebrating where it all began.'},
{id:'cap',name:'The Campus Cap',category:'Headwear',isNew:true,price:24,color:'Royal blue',hex:'#2346af',bg:'#e3e7eb',type:'cap',tag:'',sizes:['One size'],stock:[12],description:'A classic six-panel cap with a simple collegiate R. Proposed adjustable fit for game days, class days, and everything between.'},
{id:'crew',name:'1866 Crewneck',category:'Apparel',price:36,wasPrice:48,color:'Heather gray',hex:'#b6b9bd',bg:'#e8e8e3',type:'crew',tag:'',sizes:['S','M','L','XL','2XL'],stock:[4,7,8,0,2],description:'A relaxed crewneck concept with bold Rust lettering and a nod to 1866. An easy layer for a cool evening on campus.'},
{id:'tote',name:'The Everyday Tote',category:'Accessories',price:18,color:'Natural canvas',hex:'#e5d9bc',bg:'#eae7dc',type:'tote',tag:'Carry your pride',sizes:['One size'],stock:[8],description:'A roomy canvas tote concept for books, essentials, and a little Bearcat pride. Designed to go from campus to your next adventure.'},
{id:'mug',name:'Bearcat Morning Mug',category:'Accessories',price:12,wasPrice:16,color:'Porcelain white',hex:'#f8f6f0',bg:'#dfe6e9',type:'mug',tag:'',sizes:['12 oz'],stock:[10],description:'A simple ceramic mug concept for a warm start to your day. Royal blue collegiate lettering on a clean white finish.'},
{id:'scarf',name:'Game Day Scarf',category:'Accessories',isNew:true,price:22,color:'Blue & cream',hex:'#2443a2',bg:'#e5e8ed',type:'scarf',tag:'Game day ready',sizes:['One size'],stock:[6],description:'A spirited scarf concept in blue and cream, finished with collegiate lettering. A sample accessory for cheering on the Bearcats.'},
{id:'jacket',name:'Varsity Letter Jacket',category:'Apparel',price:78,color:'Royal & ivory',hex:'#284bb3',bg:'#e9e4dc',type:'jacket',tag:'Sold out · demo',sizes:['S','M','L','XL'],stock:[0,0,0,0],description:'A varsity-inspired jacket concept with contrasting sleeves and an embroidered-style R. This sample demonstrates the sold-out experience.'}
];
const STORAGE_KEY='the-den-demo-v1';
const $=s=>document.querySelector(s);
const money=n=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(n);
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const product=id=>PRODUCTS.find(p=>p.id===id);
const sku=(id,size)=>id+'|'+size;
const total=lines=>lines.reduce((sum,l)=>sum+product(l.id).price*l.qty,0);
const SHIPPING=7.95,FREE_SHIPPING_MIN=75;
const shippingFor=subtotal=>subtotal>=FREE_SHIPPING_MIN?0:SHIPPING;
const PROMOS=['Buying 10 or more? Bulk orders get discounts','Free shipping on U.S. orders over $75!','Students and Alumni get 25% off with a Rust email!','Student-Run Since 2026.'];
const orderTotal=o=>total(o.lines)+(o.shipping||0);
const formatAddress=a=>esc(a.line1)+(a.line2?', '+esc(a.line2):'')+'<br>'+esc(a.city)+', '+esc(a.state)+' '+esc(a.zip);
let artCounter=0,filter='All',checkoutMethod='pickup',selectedProduct=null,selectedSize=null,detailQty=1,toastTimer,storageWarning=false;
function initialState(){
 const inventory={}; PRODUCTS.forEach(p=>p.sizes.forEach((size,i)=>inventory[sku(p.id,size)]=p.stock[i]));
 return {version:1,inventory,cart:[],orders:[]};
}
function validLine(l){return l&&product(l.id)?.sizes.includes(l.size)&&Number.isInteger(l.qty)&&l.qty>0&&l.qty<1000}
function validAddress(a){return a&&['line1','line2','city','state','zip'].every(k=>typeof a[k]==='string')}
function validOrder(o){
 if(!o||typeof o.code!=='string'||typeof o.name!=='string'||!Number.isFinite(o.created)||!Array.isArray(o.lines)||!o.lines.every(validLine))return false;
 if(o.method===undefined||o.method==='pickup')return ['New','Ready','Collected'].includes(o.status);
 return o.method==='delivery'&&['New','Shipped','Delivered'].includes(o.status)&&validAddress(o.address)&&Number.isFinite(o.shipping);
}
function readState(){
 try{const s=JSON.parse(localStorage.getItem(STORAGE_KEY));if(s?.version===1&&s.inventory&&Array.isArray(s.cart)&&s.cart.every(validLine)&&Array.isArray(s.orders)&&s.orders.every(validOrder)&&PRODUCTS.every(p=>p.sizes.every(size=>Number.isInteger(s.inventory[sku(p.id,size)])&&s.inventory[sku(p.id,size)]>=0)))return s;}catch{}
 return initialState();
}
let state=readState();
function focusElement(target){const el=typeof target==='string'?$(target):target;if(el){if(!el.matches('input,button,a,select'))el.setAttribute('tabindex','-1');el.focus({preventScroll:true});}}
function save(){try{localStorage.setItem(STORAGE_KEY,JSON.stringify(state));}catch{if(!storageWarning){storageWarning=true;toast('Browser storage is unavailable. This demo will reset when the page closes.');}}updateBagCount();}
function toast(message){const el=$('#toast');el.textContent=message;el.classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('visible'),3500)}
function available(p,size){return state.inventory[sku(p.id,size)]||0}
function inBag(id,size){return state.cart.find(l=>l.id===id&&l.size===size)?.qty||0}
function art(p){
 const g='fabric'+(++artCounter), shade='shine'+artCounter, fill='url(#'+g+')', ink=['tee','crew','tote','mug'].includes(p.type)?'#173b9e':'#f4edda';
 const words='<text x="200" y="184" text-anchor="middle" font-family="Georgia,serif" font-size="39" font-weight="bold" fill="'+ink+'" letter-spacing="2">RUST</text><text x="200" y="208" text-anchor="middle" font-family="Arial,sans-serif" font-size="10" fill="'+ink+'" letter-spacing="3">COLLEGE</text><path d="M160 220h80" stroke="'+ink+'" opacity=".65"/><text x="200" y="238" text-anchor="middle" font-family="Georgia,serif" font-size="13" fill="'+ink+'" letter-spacing="4">1866</text>';
 let shape='';
 if(['hoodie','tee','crew','jacket'].includes(p.type)){
  const tee=p.type==='tee';
  shape='<path d="'+(tee?'M151 87L111 103 62 168 105 197 132 164 124 315Q200 331 276 315L268 164 295 197 338 168 289 103 249 87Z':'M151 92L110 111 54 274 97 289 136 193 125 319Q200 337 275 319L264 193 303 289 346 274 290 111 249 92Z')+'" fill="'+fill+'" stroke="#13244b" stroke-opacity=".17" stroke-width="1.5"/>';
  if(!tee) shape+='<path d="M57 269L52 283 93 297 99 284M301 284L307 297 348 283 343 269" fill="'+p.hex+'" stroke="#0002"/><path d="M126 309Q200 327 274 309L275 324Q200 342 125 324Z" fill="'+p.hex+'" stroke="#0002"/>';
  if(p.type==='hoodie'){
   shape+='<path d="M150 99Q143 42 200 36Q257 42 250 99L222 127 178 127Z" fill="'+fill+'" stroke="#11285d" stroke-width="1.5"/><path d="M168 88Q171 56 200 55Q229 56 232 88L211 118 189 118Z" fill="#122b75"/><path d="M175 112L172 161M225 112L228 161" stroke="#d4dcf0" stroke-width="2"/><path d="M166 258L154 289Q200 300 246 289L234 258" fill="'+p.hex+'" stroke="#102961" stroke-opacity=".6"/><path d="M169 259L163 280M231 259L237 280" stroke="#173478" stroke-width="2"/>';
  }else{shape+='<path d="M152 87Q200 143 248 87L235 84Q200 115 165 84Z" fill="'+(p.type==='jacket'?'#ece4d5':p.hex)+'" stroke="#0003" stroke-width="3"/>';}
  if(p.type==='jacket'){
   shape+='<path d="M110 111L145 126 136 193 97 289 54 274Z M290 111L255 126 264 193 303 289 346 274Z" fill="#e8dfcd" stroke="#0002"/><path d="M200 115v210" stroke="#ece4d5" stroke-width="6"/><text x="244" y="181" text-anchor="middle" font-family="Georgia" font-size="48" font-weight="bold" fill="#eee5d2" stroke="#17377c" stroke-width="1">R</text><g fill="#c7c8c5"><circle cx="200" cy="151" r="3"/><circle cx="200" cy="185" r="3"/><circle cx="200" cy="219" r="3"/><circle cx="200" cy="253" r="3"/><circle cx="200" cy="287" r="3"/></g>';
  }else shape+=words;
  shape+='<path d="M136 193L145 282M264 193L255 282" fill="none" stroke="#000" stroke-opacity=".08" stroke-width="2"/><path d="M112 118L85 256M288 118L315 256" stroke="#fff" stroke-opacity=".12" stroke-width="2"/>';
 }
 if(p.type==='cap')shape='<ellipse cx="205" cy="292" rx="122" ry="14" fill="#192c44" opacity=".07"/><path d="M84 231Q84 119 190 105Q279 104 299 220L245 253 124 256Z" fill="'+fill+'" stroke="#142c6b" stroke-width="2"/><path d="M91 228Q149 207 248 237Q280 250 325 269Q338 281 309 287Q224 302 124 264Z" fill="#183787" stroke="#102b71" stroke-width="2"/><path d="M190 108Q143 146 147 219M190 108Q233 145 249 230" fill="none" stroke="#6381d0" stroke-opacity=".4"/><ellipse cx="190" cy="107" rx="9" ry="5" fill="#16377f"/><text x="193" y="197" text-anchor="middle" font-family="Georgia" font-size="61" fill="#f2eddf" font-weight="bold">R</text><path d="M115 241Q202 259 307 278" stroke="#7890c3" stroke-opacity=".3" fill="none"/>';
 if(p.type==='tote')shape='<path d="M144 126V93Q144 57 171 57Q198 57 198 93V126M202 126V93Q202 57 229 57Q256 57 256 93V126" fill="none" stroke="#b5a57e" stroke-width="11"/><path d="M142 126V93Q142 57 169 57Q196 57 196 93V126M200 126V93Q200 57 227 57Q254 57 254 93V126" fill="none" stroke="#e7dcc1" stroke-width="8"/><path d="M99 120L108 314Q200 334 292 314L301 120Z" fill="'+fill+'" stroke="#b7ab8b" stroke-width="2"/><path d="M112 128L119 307M288 128L281 307" stroke="#fff5" fill="none"/><g transform="translate(0 23)">'+words+'</g><path d="M111 310Q200 325 289 310" stroke="#b7ab8b" fill="none"/>';
 if(p.type==='mug')shape='<path d="M264 139H287Q332 139 329 185Q328 231 269 235" fill="none" stroke="#c4c6c3" stroke-width="23"/><path d="M265 139H287Q326 139 324 184Q322 224 268 228" fill="none" stroke="#f2f1ec" stroke-width="16"/><path d="M102 115H274L267 280Q190 309 110 280Z" fill="'+fill+'" stroke="#b9bfbd" stroke-width="1.5"/><ellipse cx="188" cy="115" rx="86" ry="20" fill="#fffdf8" stroke="#c6ccc9" stroke-width="2"/><ellipse cx="188" cy="115" rx="73" ry="12" fill="#c9cdc8"/><g transform="translate(-8 14) scale(.98)">'+words+'</g><path d="M119 140L126 273" stroke="white" stroke-width="4" opacity=".8"/>';
 if(p.type==='scarf')shape='<g transform="rotate(-12 200 200)"><path d="M128 59H205V316H128Z M210 76H278V334H210Z" fill="'+fill+'" stroke="#142c6b" stroke-width="1.5"/><path d="M128 80H205V99H128Z M128 273H205V291H128Z M210 95H278V113H210Z M210 290H278V308H210Z" fill="#efe8d9"/><text transform="translate(181 246) rotate(-90)" font-family="Georgia" font-size="36" font-weight="bold" fill="#efe8d9" letter-spacing="5">RUST</text><text transform="translate(252 268) rotate(-90)" font-family="Arial" font-size="16" fill="#efe8d9" letter-spacing="4">BEARCATS</text><path d="M132 315v20m10-20v23m10-23v20m10-20v23m10-23v21m10-21v23m10-23v20m10-20v23M214 334v20m10-20v23m10-23v20m10-20v23m10-23v21m10-21v23m10-23v20" stroke="#e8dfcc" stroke-width="5"/></g>';
 return '<svg viewBox="0 0 400 380" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><defs><linearGradient id="'+g+'" x1="0" x2="1" y1="0" y2=".75"><stop stop-color="'+p.hex+'"/><stop offset=".45" stop-color="'+p.hex+'"/><stop offset="1" stop-color="'+p.hex+'"/></linearGradient><linearGradient id="'+shade+'"><stop stop-color="white" stop-opacity=".2"/><stop offset=".5" stop-color="white" stop-opacity="0"/><stop offset="1" stop-color="black" stop-opacity=".12"/></linearGradient></defs><g>'+shape+'</g></svg>';
}
function matchesFilter(p){return filter==='All'||(filter==='New'?p.isNew:filter==='Clearance'?!!p.wasPrice:p.category===filter)}
function priceHtml(p){return p.wasPrice?'<s class="was-price"><span class="sr-only">Was </span>'+money(p.wasPrice)+'</s> <span class="sale-price"><span class="sr-only">now </span>'+money(p.price)+'</span>':money(p.price)}
function renderProducts(){
 const search=$('#search').value.trim().toLowerCase();
 let list=PRODUCTS.filter(p=>matchesFilter(p)&&(p.name+' '+p.category+' '+p.color).toLowerCase().includes(search));
 if($('#sort').value==='price-low')list.sort((a,b)=>a.price-b.price);if($('#sort').value==='price-high')list.sort((a,b)=>b.price-a.price);
 $('#product-count').textContent=list.length+' products shown';
 $('#product-grid').innerHTML=list.length?list.map(p=>{
  const sold=p.sizes.every(s=>available(p,s)===0),tag=sold?'Sold out · demo':p.wasPrice?'Clearance':p.isNew?'New arrival':p.tag;
  return '<article class="product-card"><button class="product-image-button" style="background:'+p.bg+'" data-action="product" data-id="'+p.id+'" aria-label="View '+p.name+'">'+(tag?'<span class="product-tag '+(sold?'sold':'')+'">'+tag+'</span>':'')+art(p)+'<span class="product-quick" aria-hidden="true">'+(sold?'↗':'+')+'</span></button><p class="product-category">'+p.category+'</p><div class="product-meta"><button class="product-name" data-action="product" data-id="'+p.id+'">'+p.name+'</button><span class="product-price">'+priceHtml(p)+'</span></div><p class="product-color"><span class="color-dot" style="background:'+p.hex+'"></span>'+p.color+'</p></article>';
 }).join(''):'<div class="empty-results"><h3>No matches this time.</h3><p>Try another search or explore the full collection.</p><button class="button button-blue" data-action="clear-filters">Show all items ↗</button></div>';
 document.querySelectorAll('[data-action=filter]').forEach(b=>{const active=b.dataset.category===filter;b.classList.toggle('active',active);b.setAttribute('aria-pressed',active)});
}
function updateBagCount(){const n=state.cart.reduce((a,l)=>a+l.qty,0);$('#bag-count').textContent=n;$('.bag-button').setAttribute('aria-label','Open shopping bag, '+n+' items')}
const closeButton='<button class="close-button" data-action="close" aria-label="Close dialog">×</button>';
function openDialog(id){const d=$('#'+id);document.querySelectorAll('dialog[open]').forEach(x=>{if(x!==d)x.close()});if(!d.open)d.showModal();d.scrollTop=0}
function openProduct(id){
 const p=product(id);if(!p)return;selectedProduct=p;selectedSize=p.sizes.length===1?p.sizes[0]:null;detailQty=1;
 $('#product-dialog').innerHTML=closeButton+'<div class="product-detail"><div class="product-detail-art" style="background:'+p.bg+'">'+art(p)+'</div><div class="product-detail-copy"><p class="eyebrow">SAMPLE '+p.category.toUpperCase()+'</p><h2 id="product-title">'+p.name+'</h2><p class="detail-price">'+priceHtml(p)+'</p><p class="detail-description">'+p.description+'</p><span class="field-label">Color · '+p.color+'</span><span class="field-label" style="margin-top:18px">Choose a size</span><div class="size-options" role="group" aria-label="Choose a size">'+p.sizes.map(s=>'<button data-action="size" data-size="'+s+'" aria-pressed="'+(s===selectedSize)+'" class="'+(s===selectedSize?'selected':'')+'" '+(available(p,s)===0?'disabled':'')+'>'+s+'</button>').join('')+'</div><p id="stock-note" class="stock-note"></p><div class="detail-quantity"><label for="detail-qty">Quantity</label><div class="quantity-control"><button data-action="detail-minus" aria-label="Decrease quantity">−</button><input id="detail-qty" type="number" min="1" max="99" value="1" inputmode="numeric"><button data-action="detail-plus" aria-label="Increase quantity">+</button></div></div><button class="button button-blue full-width" id="add-to-bag" data-action="add">Add to bag <span aria-hidden="true">+</span></button><p id="product-error" class="inline-error" role="alert"></p><p class="detail-disclaimer">Illustrated sample product. Price and availability are for demonstration only.</p></div></div>';
 updateDetail();openDialog('product-dialog');
}
function updateDetail(){
 const p=selectedProduct,allSold=p.sizes.every(s=>available(p,s)===0),left=selectedSize?Math.max(0,available(p,selectedSize)-inBag(p.id,selectedSize)):0;
 $('#stock-note').textContent=allSold?'This sample item is sold out.':selectedSize?left+' available to add in the demo'+(inBag(p.id,selectedSize)?' · '+inBag(p.id,selectedSize)+' already in your bag':''):'Select a size to see sample availability.';
 $('#add-to-bag').disabled=allSold||(selectedSize!==null&&left===0);
 $('#add-to-bag').innerHTML=(allSold?'Sold out':selectedSize&&left===0?'All available items are in your bag':'Add to bag')+' <span aria-hidden="true">+</span>';
 $('#detail-qty').max=selectedSize?Math.max(1,left):99;
 document.querySelectorAll('[data-action=size]').forEach(b=>{b.classList.toggle('selected',b.dataset.size===selectedSize);b.setAttribute('aria-pressed',b.dataset.size===selectedSize)});
}
function addToBag(){
 const p=selectedProduct,err=$('#product-error');if(!selectedSize){err.textContent='Choose a size first.';return}
 const qty=Number($('#detail-qty').value),left=available(p,selectedSize)-inBag(p.id,selectedSize);
 if(!Number.isInteger(qty)||qty<1||qty>left){err.textContent='Choose a whole quantity from 1 to '+left+'.';return}
 const existing=state.cart.find(l=>l.id===p.id&&l.size===selectedSize);if(existing)existing.qty+=qty;else state.cart.push({id:p.id,size:selectedSize,qty});
 save();$('#product-dialog').close();toast(p.name+' added to your bag.');
}
function renderBag(focusSelector){
 $('#bag-dialog').innerHTML=closeButton+'<h2 id="bag-title">Your bag<span class="count-small"> / '+state.cart.reduce((n,l)=>n+l.qty,0)+'</span></h2><p class="bag-subtitle">A little Bearcat pride, ready to go.</p>'+(state.cart.length?'<div class="bag-items">'+state.cart.map((l,i)=>{
  const p=product(l.id);return '<div class="bag-item"><div class="bag-art" style="background:'+p.bg+'">'+art(p)+'</div><div class="bag-item-info"><div class="bag-item-row"><h3>'+p.name+'</h3><strong>'+money(p.price*l.qty)+'</strong></div><p>'+p.color+' / '+l.size+'</p><div class="bag-item-controls"><div class="quantity-control"><button data-action="cart-minus" data-index="'+i+'" aria-label="Decrease '+p.name+' quantity">−</button><span aria-label="Quantity">'+l.qty+'</span><button data-action="cart-plus" data-index="'+i+'" aria-label="Increase '+p.name+' quantity" '+(l.qty>=available(p,l.size)?'disabled':'')+'>+</button></div><button class="remove-item" data-action="remove" data-index="'+i+'">Remove</button></div></div></div>';
 }).join('')+'</div><div class="bag-summary"><div class="subtotal"><span>Sample subtotal</span><strong>'+money(total(state.cart))+'</strong></div><p>Choose campus pickup or delivery at checkout. No payment is taken. Final pricing, shipping, taxes, and pickup details would be confirmed for a real pilot.</p><button class="button button-blue full-width" data-action="checkout">Try checkout <span aria-hidden="true">→</span></button></div>':'<div class="empty-bag"><span aria-hidden="true">R</span><h3>Your next favorite is waiting.</h3><p>Explore the collection and add a little Rust to your day.</p><button class="button button-blue" data-action="continue">Explore the collection ↗</button></div>');
 openDialog('bag-dialog');focusElement((focusSelector&&$(focusSelector))||$('#bag-title'));
}
function checkout(){
 if(!state.cart.length){renderBag();return}
 const delivery=checkoutMethod==='delivery',option=(value,title,note)=>'<label class="method-option"><input type="radio" name="method" value="'+value+'" '+(checkoutMethod===value?'checked':'')+'><span><strong>'+title+'</strong><small>'+note+'</small></span></label>';
 $('#bag-dialog').innerHTML=closeButton+'<button class="back-button" data-action="bag">← Back to your bag</button><h2 id="bag-title">Try checkout.</h2><div class="checkout-note"><strong>Demo checkout</strong><br>This creates a simulated order in this browser. Nothing is sent to The Den, nothing is shipped, and no payment is taken.</div><form class="checkout-form" id="checkout-form"><fieldset class="method-options"><legend>How would you like to get your order?</legend>'+option('pickup','Campus pickup','Collect at The Den · Free')+option('delivery','Ship to me','For buyers off campus · '+money(SHIPPING)+', free over '+money(FREE_SHIPPING_MIN))+'</fieldset><label for="pickup-name">Demo name</label><input id="pickup-name" name="pickupName" type="text" value="Jordan Bearcat" required maxlength="50" autocomplete="off"><p class="help">Use a fictional name. No email, phone, or card details needed.</p><fieldset id="address-fields" class="address-fields" '+(delivery?'':'disabled hidden')+'><legend>Delivery address</legend><label for="addr-line1">Street address</label><input id="addr-line1" type="text" value="1866 Demo Lane" required maxlength="80" autocomplete="off"><label for="addr-line2">Apartment, suite, etc. <span class="optional">(optional)</span></label><input id="addr-line2" type="text" maxlength="40" autocomplete="off"><div class="address-row"><div><label for="addr-city">City</label><input id="addr-city" type="text" value="Memphis" required maxlength="40" autocomplete="off"></div><div><label for="addr-state">State</label><input id="addr-state" type="text" value="TN" required maxlength="2" pattern="[A-Za-z]{2}" title="Two-letter state code, e.g. MS" autocomplete="off"></div><div><label for="addr-zip">ZIP code</label><input id="addr-zip" type="text" inputmode="numeric" value="38103" required maxlength="10" pattern="\\d{5}(-\\d{4})?" title="5-digit ZIP code" autocomplete="off"></div></div><p class="help">Use a fictional address. This demo shows US delivery only.</p></fieldset><div class="checkout-summary">'+state.cart.map(l=>'<div><span>'+l.qty+' × '+product(l.id).name+' / '+l.size+'</span><strong>'+money(product(l.id).price*l.qty)+'</strong></div>').join('')+'</div><div id="checkout-totals" class="checkout-totals"></div><label class="checkbox-label"><input type="checkbox" id="demo-consent" required><span>I understand this is a demo: nothing is reserved, charged, or shipped.</span></label><button type="submit" class="button button-blue full-width">Place demo order <span aria-hidden="true">→</span></button><p id="checkout-error" class="inline-error" role="alert"></p></form>';
 renderCheckoutTotals();$('#bag-dialog').scrollTop=0;focusElement('#pickup-name');
}
function renderCheckoutTotals(){
 const delivery=checkoutMethod==='delivery',sub=total(state.cart),ship=delivery?shippingFor(sub):0;
 $('#checkout-totals').innerHTML='<div class="subtotal minor"><span>Sample subtotal</span><span>'+money(sub)+'</span></div><div class="subtotal minor"><span>'+(delivery?'Delivery':'Campus pickup')+'</span><span>'+(ship?money(ship):'Free')+'</span></div><div class="subtotal total-line"><span>Sample total</span><strong>'+money(sub+ship)+'</strong></div><p class="help">'+(delivery?'Carrier, real shipping rates, delivery times, payment, and final taxes would be agreed with The Den before a real pilot.':'Pickup location, opening hours, payment, and final taxes will be agreed with The Den before a real pilot.')+'</p>';
}
function setCheckoutMethod(method){
 checkoutMethod=method;const f=$('#address-fields'),delivery=method==='delivery';f.hidden=!delivery;f.disabled=!delivery;renderCheckoutTotals();
}
function placeOrder(event){
 event.preventDefault();const form=event.target;if(form.id!=='checkout-form'||!form.reportValidity())return;
 const name=$('#pickup-name').value.trim(),err=$('#checkout-error');if(!name){err.textContent='Enter a fictional name.';return}
 const delivery=checkoutMethod==='delivery';let address=null;
 if(delivery){address={line1:$('#addr-line1').value.trim(),line2:$('#addr-line2').value.trim(),city:$('#addr-city').value.trim(),state:$('#addr-state').value.trim().toUpperCase(),zip:$('#addr-zip').value.trim()};if(!address.line1||!address.city){err.textContent='Enter a fictional delivery address.';return}}
 if(!state.cart.length)return;
 for(const l of state.cart){if(l.qty>available(product(l.id),l.size)){err.textContent='Sample stock changed. Return to your bag and reduce the quantity.';return}}
 const code='DEN-'+Date.now().toString(36).slice(-4).toUpperCase()+'-'+Math.random().toString(36).slice(2,4).toUpperCase();
 const order={code,name,method:delivery?'delivery':'pickup',status:'New',created:Date.now(),shipping:delivery?shippingFor(total(state.cart)):0,lines:state.cart.map(l=>({...l}))};if(delivery)order.address=address;
 order.lines.forEach(l=>state.inventory[sku(l.id,l.size)]-=l.qty);state.orders.unshift(order);state.cart=[];save();renderProducts();
 $('#bag-dialog').innerHTML=closeButton+'<div class="confirmation"><div class="success-icon" aria-hidden="true">✓</div><p class="eyebrow" style="justify-content:center">DEMO ORDER CREATED</p><h2 id="bag-title" style="margin-top:12px">'+(delivery?'Your Rust pride is on its way.':'Your pickup story starts here.')+'</h2><p>Thanks, '+esc(name)+'. Keep this code handy for your order.</p><div class="pickup-code"><small>'+(delivery?'DEMO ORDER NUMBER':'DEMO PICKUP CODE')+'</small><strong style="font-size:25px">'+code+'</strong></div>'+(delivery?'<div class="ship-to"><small>SHIPS TO</small><p>'+esc(name)+'<br>'+formatAddress(address)+'</p></div>':'')+'<div class="subtotal"><span>Sample total</span><strong>'+money(orderTotal(order))+'</strong></div><p>'+(delivery?'Nothing will actually be shipped yet.':'No actual reservation has been made yet.')+'</p><button class="button button-blue full-width" data-action="continue">Keep exploring ↗</button></div>';$('#bag-dialog').scrollTop=0;focusElement('#bag-title');
}
function showView(view){
 document.querySelectorAll('dialog[open]').forEach(d=>d.close());
 $('#shop-view').hidden=view==='account';$('#account-view').hidden=view!=='account';
 if(location.hash!=='#'+view)history.replaceState(null,'','#'+view);
 window.scrollTo({top:0,behavior:'instant'});focusElement(view==='account'?'#account-heading':'#hero-heading');
}
const AUTH_COPY={signin:['Welcome back.','Sign in to see your orders and saved details.'],signup:['Join The Den.','Create an account to track orders and check out faster.']};
function setAuthTab(tab){
 document.querySelectorAll('[role=tab][data-action=auth-tab]').forEach(t=>{const active=t.dataset.tab===tab;t.classList.toggle('active',active);t.setAttribute('aria-selected',active);t.tabIndex=active?0:-1});
 $('#signin-form').hidden=tab!=='signin';$('#signup-form').hidden=tab!=='signup';
 $('#account-heading').textContent=AUTH_COPY[tab][0];$('#account-sub').textContent=AUTH_COPY[tab][1];
 document.querySelectorAll('.auth-status').forEach(s=>s.textContent='');
}
function submitAuth(form){
 const pw=$('#signup-password');pw.setCustomValidity(form.id==='signup-form'&&pw.value.length<8?'Use at least 8 characters.':'');
 if(!form.reportValidity())return;
 // No server yet: nothing typed here is sent or stored.
 form.querySelectorAll('input[type=password],input[data-was-password]').forEach(i=>i.value='');
 form.querySelector('.auth-status').textContent=form.id==='signin-form'?'Sign-in opens when The Den launches. Check back soon!':'Accounts open when The Den launches. Check back soon to create yours!';
}
function info(kind){
 let title,body,action='';
 if(kind==='how'){title='From your bag to you.';body='<ol><li><strong>Choose your merchandise.</strong> Pick a style, size, and quantity from the sample collection.</li><li><strong>Pick up or ship it.</strong> On campus? Choose pickup at The Den. Off campus? Choose delivery and enter a fictional shipping address.</li><li><strong>Collect it or receive it.</strong> Pick up your order at The Den, or watch for it at your door.</li></ol><p class="note">For a future live pilot, The Den would confirm available products, pickup hours and location, shipping carrier and rates, and the payment process. This demo does not reserve or ship merchandise.</p>';action='<button class="button button-blue" data-action="continue">Explore the collection ↗</button>';}
 else{title='A new idea for The Den.';body='<p>This independent student-built concept explores how Rust College merchandise could be browsed and ordered for campus pickup, or delivered to alumni, families, and fans off campus.</p><ul><li>All products, illustrations, prices, sizes, shipping rates, and stock are samples.</li><li>Orders are simulated, with no payments, shipments, or messages sent to the college.</li><li>Your bag is saved in this browser only.</li><li>Accounts and sign-in open at launch.</li></ul><p class="note">Before real use: confirm The Den’s inventory and operating process, connect shared order storage, and turn on customer accounts. This is not an official Rust College storefront.</p>';action='<button class="button button-blue" data-action="close">Got it ↗</button>';}
 $('#info-dialog').innerHTML=closeButton+'<p class="eyebrow">THE DEN / CONCEPT DEMO</p><h2 id="info-title">'+title+'</h2>'+body+action;openDialog('info-dialog');
}
document.addEventListener('click',event=>{
 const b=event.target.closest('[data-action]');if(!b||b.disabled)return;const a=b.dataset.action;
 if(a==='product')openProduct(b.dataset.id);
 else if(a==='close')b.closest('dialog').close();
 else if(a==='about'||a==='how')info(a);
 else if(a==='bag')renderBag();
 else if(a==='checkout')checkout();
 else if(a==='account'){event.preventDefault();showView('account');setAuthTab(b.dataset.tab||'signin')}
 else if(a==='auth-tab'){setAuthTab(b.dataset.tab);focusElement('#tab-'+b.dataset.tab)}
 else if(a==='toggle-password'){const input=$('#'+b.getAttribute('aria-controls')),show=input.type==='password';input.type=show?'text':'password';if(show)input.dataset.wasPassword='';else delete input.dataset.wasPassword;b.textContent=show?'Hide':'Show';b.setAttribute('aria-label',show?'Hide password':'Show password')}
 else if(a==='forgot')$('#signin-form .auth-status').textContent='Password resets will be available when accounts open at launch.';
 else if(a==='shop'){event.preventDefault();showView('shop');if(b.tagName==='A')$('#collection').scrollIntoView()}
 else if(a==='continue'){showView('shop');$('#collection').scrollIntoView()}
 else if(a==='filter'){filter=b.dataset.category;renderProducts()}
 else if(a==='shop-filter'){if(!$('#account-view').hidden)showView('shop');filter=b.dataset.category;$('#search').value='';renderProducts();$('#collection').scrollIntoView();focusElement('#collection-heading')}
 else if(a==='clear-filters'){filter='All';$('#search').value='';$('#sort').value='featured';renderProducts()}
 else if(a==='size'){selectedSize=b.dataset.size;$('#product-error').textContent='';$('#detail-qty').value=1;updateDetail()}
 else if(a==='detail-minus'||a==='detail-plus'){const input=$('#detail-qty'),v=Number(input.value)||1;input.value=Math.max(1,Math.min(Number(input.max),v+(a==='detail-plus'?1:-1)))}
 else if(a==='add')addToBag();
 else if(a==='cart-plus'||a==='cart-minus'||a==='remove'){
  const i=Number(b.dataset.index),l=state.cart[i];if(!l)return;
  if(a==='remove'||(a==='cart-minus'&&l.qty===1))state.cart.splice(i,1);
  else if(a==='cart-minus')l.qty--;
  else if(l.qty<available(product(l.id),l.size))l.qty++;
  save();renderBag('[data-action="'+a+'"][data-index="'+Math.min(i,state.cart.length-1)+'"]');
 }
});
document.addEventListener('submit',e=>{if(e.target.classList.contains('auth-form')){e.preventDefault();submitAuth(e.target)}else placeOrder(e)});
document.addEventListener('change',e=>{if(e.target.name==='method')setCheckoutMethod(e.target.value)});
$('#signup-password').addEventListener('input',e=>e.target.setCustomValidity(''));
$('#search').addEventListener('input',renderProducts);$('#sort').addEventListener('change',renderProducts);
document.querySelectorAll('dialog').forEach(d=>d.addEventListener('click',e=>{const r=d.getBoundingClientRect();if(e.target===d&&(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom))d.close()}));
window.addEventListener('hashchange',()=>{if(location.hash==='#account')showView('account');else if(location.hash==='#shop')showView('shop')});
window.addEventListener('storage',e=>{if(e.key===STORAGE_KEY){state=readState();updateBagCount();renderProducts();if($('#bag-dialog').open)renderBag();if($('#product-dialog').open)openProduct(selectedProduct.id)}});
$('#hero-product').innerHTML=art(PRODUCTS[0]);
// Illustrated stand-ins until real product photography is available.
$('#spot-new-art').innerHTML='<div class="spot-main">'+art(product('scarf'))+'</div><div class="spot-side">'+art(product('cap'))+'</div>';
$('#spot-clear-art').innerHTML='<div class="spot-main">'+art(product('crew'))+'</div><div class="spot-side">'+art(product('mug'))+'</div>';
// Two identical groups so the loop is seamless; each group repeats the promos twice to stay wider than large screens.
const promoGroup=hidden=>'<ul class="marquee-group"'+(hidden?' aria-hidden="true"':'')+'>'+PROMOS.concat(PROMOS).map((t,i)=>'<li'+(hidden||i>=PROMOS.length?' aria-hidden="true"':'')+'>'+esc(t)+'</li><li class="marquee-logo" aria-hidden="true"><img src="assets/bearcat-logo.png" alt="" width="34" height="34"></li>').join('')+'</ul>';
$('#marquee-track').innerHTML=promoGroup(false)+promoGroup(true);renderProducts();updateBagCount();save();if(location.hash==='#account')showView('account');

