const KEY='showpay_v2_approved_visual';
let db=JSON.parse(localStorage.getItem(KEY)||'{"quotes":[],"invoices":[],"clients":[],"shows":[],"marketing":[],"contracts":[],"activity":[],"settings":{"invPrefix":"INV-","quotePrefix":"QUO-"}}');
let docType='invoice', editId=null, activeList='invoices', calDate=new Date();
const $=id=>document.getElementById(id), money=n=>Number(n||0).toLocaleString('en-ZA',{style:'currency',currency:'ZAR'}).replace('R ','R ');
const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
function persist(){localStorage.setItem(KEY,JSON.stringify(db));render()}
function go(id){document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));if($(id))$(id).classList.add('active');document.querySelectorAll('.bottom button').forEach(b=>b.classList.remove('active'));render()}
function next(type){let a=db[type+'s'],p=type==='invoice'?db.settings.invPrefix:db.settings.quotePrefix,n=a.map(x=>parseInt((x.number||'').replace(/\D/g,''))||0);return(p||'')+String(Math.max(0,...n)+1).padStart(4,'0')}
function openDoc(type,id=null){docType=type;editId=id;activeList=type==='invoice'?'invoices':'quotes';go('editor');let d=id?db[type+'s'].find(x=>x.id===id):null,today=new Date().toISOString().slice(0,10);$('editorTitle').textContent=(id?'Edit ':'New ')+(type==='invoice'?'Invoice':'Quote');$('dNumber').value=d?.number||next(type);$('dReference').value=d?.reference||'';$('dDate').value=d?.date||today;$('dDue').value=d?.due||today;$('dEvent').value=d?.eventDate||'';$('dTerms').value=d?.terms||'COD';$('dSales').value=d?.sales||db.settings.bizName||'';$('dJob').value=d?.job||'';$('dVat').value=d?.vatRate??0;$('dThanks').value=d?.thanks||'Thank you for your business!';$('dClient').innerHTML='<option value="">Select client…</option>'+db.clients.map(c=>`<option value="${c.id}">${esc(c.name)}</option>`).join('');$('dClient').value=d?.clientId||'';$('lines').innerHTML='';(d?.items||[{qty:1,desc:'',price:0}]).forEach(addLine);recalc()}
function addLine(v={qty:1,desc:'',price:0}){let d=document.createElement('div');d.className='line';d.innerHTML=`<input class="qty" type="number" value="${v.qty}"><input class="desc" value="${esc(v.desc)}" placeholder="Description"><input class="price" type="number" step="0.01" value="${v.price}"><button onclick="this.parentElement.remove();recalc()">×</button>`;d.querySelectorAll('input').forEach(x=>x.oninput=recalc);$('lines').appendChild(d)}
function recalc(){let sub=[...document.querySelectorAll('.line')].reduce((a,r)=>a+Number(r.querySelector('.qty').value||0)*Number(r.querySelector('.price').value||0),0),vat=sub*Number($('dVat').value||0)/100;$('sub').textContent=money(sub);$('vat').textContent=money(vat);$('total').textContent=money(sub+vat);return{sub,vat,total:sub+vat}}
function saveDoc(){let c=$('dClient').value,x=recalc(),o={id:editId||crypto.randomUUID(),number:$('dNumber').value,reference:$('dReference').value,date:$('dDate').value,due:$('dDue').value,eventDate:$('dEvent').value,terms:$('dTerms').value,sales:$('dSales').value,job:$('dJob').value,clientId:c,subtotal:x.sub,vat:x.vat,vatRate:Number($('dVat').value||0),total:x.total,thanks:$('dThanks').value,status:'Unpaid',items:[...document.querySelectorAll('.line')].map(r=>({qty:+r.querySelector('.qty').value,desc:r.querySelector('.desc').value,price:+r.querySelector('.price').value}))};let a=db[docType+'s'],i=a.findIndex(z=>z.id===o.id);if(i>=0)a[i]=o;else a.push(o);db.activity.unshift(`${o.number} saved`);persist();go(activeList);toast(o.number+' saved')}
function convert(id){let q=db.quotes.find(x=>x.id===id);if(!q)return;let i={...q,id:crypto.randomUUID(),number:next('invoice'),status:'Unpaid',convertedFrom:q.number};db.invoices.push(i);q.status='Converted';db.activity.unshift(`${i.number} created from ${q.number}`);persist();toast('Quote converted to '+i.number)}
function paid(id){let i=db.invoices.find(x=>x.id===id);if(i){i.status='Paid';i.paidDate=new Date().toISOString().slice(0,10);db.activity.unshift(`${i.number} marked Paid`);persist()}}
function del(type,id){if(confirm('Delete this '+type+'?')){db[type+'s']=db[type+'s'].filter(x=>x.id!==id);persist()}}
function addClient(){let n=prompt('Client / business name?');if(!n)return;db.clients.push({id:crypto.randomUUID(),name:n,vat:prompt('VAT number?')||'',phone:prompt('Phone?')||'',email:prompt('Email?')||'',address:prompt('Postal / physical address?')||''});persist();go('clients')}
function addShow(){let t=prompt('Show name?');if(!t)return;db.shows.push({id:crypto.randomUUID(),title:t,date:prompt('Date (YYYY-MM-DD)?')||new Date().toISOString().slice(0,10),venue:prompt('Venue?')||'',fee:+(prompt('Fee R?')||0),owner:prompt('Owner: Person 1 / Person 2 / Shared?')||'Shared'});persist();go('calendar')}
function addMarketing(){let n=prompt('Campaign name?');if(n){db.marketing.push({name:n,date:prompt('Date?')||'',channel:prompt('Channel?')||''});persist()}}
function addContract(){let n=prompt('Contract name?');if(n){db.contracts.push({name:n,client:prompt('Client?')||'',date:new Date().toISOString().slice(0,10)});persist()}}
function moveMonth(n){calDate.setMonth(calDate.getMonth()+n);renderCalendar()}
function renderCalendar(){let y=calDate.getFullYear(),m=calDate.getMonth(),first=new Date(y,m,1),days=new Date(y,m+1,0).getDate();$('month').textContent=calDate.toLocaleString('en-ZA',{month:'long',year:'numeric'});let h='';for(let i=0;i<first.getDay();i++)h+='<div></div>';for(let d=1;d<=days;d++){let iso=`${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`,ev=db.shows.filter(s=>s.date===iso);h+=`<div><b>${d}</b>${ev.map(e=>`<div class="event ${e.owner==='Person 2'?'partner':e.owner==='You'?'you':'shared'}">${esc(e.title)}</div>`).join('')}</div>`}$('calgrid').innerHTML=h}
function printDoc(type,id){let d=db[type+'s'].find(x=>x.id===id),c=db.clients.find(x=>x.id===d.clientId),s=db.settings,logo=s.invoiceLogo?`<img src="${s.invoiceLogo}" style="max-width:190px;max-height:70px;object-fit:contain">`:'' ,rows=d.items.map(i=>`<tr><td>${i.qty}</td><td>${esc(i.desc)}</td><td>${money(i.price)}</td><td>${money(i.qty*i.price)}</td></tr>`).join('');let w=open('','_blank');w.document.write(`<html><head><title>${d.number}</title><style>@page{size:A4;margin:14mm}body{font-family:Arial;color:#111;font-size:10px}.top{display:flex;justify-content:space-between}h1{text-align:right}table{width:100%;border-collapse:collapse;margin-top:30px}th,td{border:1px solid #111;padding:8px}.r{text-align:right}.bank{margin-top:35px}</style></head><body><div class=top><div>${logo}<br><b>${esc(s.bizName||'Artist')}</b><br>${esc(s.bizAddress||'')}<br>VAT: ${esc(s.bizVat||'')}</div><div><h1>${type.toUpperCase()}</h1>Number: ${d.number}<br>Reference: ${esc(d.reference)}<br>Date: ${d.date}<br>Due Date: ${d.due}</div></div><hr><div class=top><div><b>FROM</b><br>${esc(s.bizName||'')}<br>${esc(s.bizAddress||'')}</div><div><b>TO</b><br>${esc(c?.name||'')}<br>VAT: ${esc(c?.vat||'')}<br>${esc(c?.address||'')}</div></div><table><tr><th>Qty</th><th>Description</th><th>Unit Price</th><th>Line Total</th></tr>${rows}</table><div class=r>Subtotal: ${money(d.subtotal)}<br>VAT: ${money(d.vat)}<br><b>Total: ${money(d.total)}</b></div><div class=bank><b>Bank Details</b><br>${esc(s.bankHolder||'')}<br>${esc(s.bank||'')}<br>Account: ${esc(s.bankAccount||'')}<br>Branch: ${esc(s.bankBranch||'')}</div><p style="text-align:center;margin-top:50px"><i>${esc(d.thanks)}</i></p><script>print()<\/script></body></html>`);w.document.close()}
async function whats(type,id){let d=db[type+'s'].find(x=>x.id===id),c=db.clients.find(x=>x.id===d.clientId),txt=`${type.toUpperCase()} ${d.number}\n${c?.name||''}\nTotal: ${money(d.total)}`;if(navigator.share){try{await navigator.share({title:'ShowPay '+d.number,text:txt})}catch(e){}}else open('https://wa.me/?text='+encodeURIComponent(txt),'_blank')}
function saveSettings(){db.settings={...db.settings,bizName:$('sName').value,bizVat:$('sVat').value,bizEmail:$('sEmail').value,bizPhone:$('sPhone').value,bizAddress:$('sAddress').value,bankHolder:$('sHolder').value,bank:$('sBank').value,bankAccount:$('sAccount').value,bankBranch:$('sBranch').value,invPrefix:$('sInvPrefix').value||'INV-',quotePrefix:$('sQuotePrefix').value||'QUO-'};persist();toast('Settings saved')}
function loadSettings(){let s=db.settings;[['sName','bizName'],['sVat','bizVat'],['sEmail','bizEmail'],['sPhone','bizPhone'],['sAddress','bizAddress'],['sHolder','bankHolder'],['sBank','bank'],['sAccount','bankAccount'],['sBranch','bankBranch'],['sInvPrefix','invPrefix'],['sQuotePrefix','quotePrefix']].forEach(([a,b])=>$(a).value=s[b]??$(a).value)}
function render(){let mo=new Date().toISOString().slice(0,7),p=db.invoices.filter(i=>i.status==='Paid'&&String(i.paidDate||'').startsWith(mo)).reduce((a,i)=>a+i.total,0),d=db.invoices.filter(i=>i.status!=='Paid').reduce((a,i)=>a+i.total,0);$('income').textContent=money(p);$('outstanding').textContent=money(d);$('showsCount').textContent=db.shows.filter(s=>s.date>=new Date().toISOString().slice(0,10)).length;$('quotesCount').textContent=db.quotes.filter(q=>q.status!=='Converted').length;$('incPaid').textContent=money(p);$('incDue').textContent=money(d);$('incCount').textContent=db.invoices.filter(i=>i.status==='Paid').length;$('reportValue').textContent=money(p);$('artistName').textContent=db.settings.bizName||'Artist';
$('showsList').innerHTML=db.shows.map(s=>`<div class=item><div><b>${esc(s.title)}</b><small>${s.date} · ${esc(s.venue)}</small></div><strong>${money(s.fee)}</strong></div>`).join('')||'<div class=empty>No shows yet.</div>';
$('clientsList').innerHTML=db.clients.map(c=>`<div class=item><div><b>${esc(c.name)}</b><small>${esc(c.phone)} · ${esc(c.email)}<br>${esc(c.address)}</small></div><button class=tiny onclick="delClient('${c.id}')">Delete</button></div>`).join('')||'<div class=empty>No clients yet.</div>';
$('quotesList').innerHTML=db.quotes.map(q=>`<div class=item><div><b>${q.number}</b><small>${esc(db.clients.find(c=>c.id===q.clientId)?.name||'')} · ${q.date}</small></div><div><strong>${money(q.total)}</strong><div class=actions><button class=tiny onclick="openDoc('quote','${q.id}')">Edit</button><button class=tiny onclick="convert('${q.id}')">Invoice</button><button class=tiny onclick="printDoc('quote','${q.id}')">PDF</button><button class=tiny onclick="del('quote','${q.id}')">Delete</button></div></div></div>`).join('')||'<div class=empty>No quotes yet.</div>';
$('invoicesList').innerHTML=db.invoices.map(i=>`<div class=item><div><b>${i.number}</b><small>${esc(db.clients.find(c=>c.id===i.clientId)?.name||'')} · ${i.date}</small></div><div><strong>${money(i.total)}</strong><span class="status ${i.status==='Paid'?'paid':'unpaid'}">${i.status}</span><div class=actions><button class=tiny onclick="openDoc('invoice','${i.id}')">Edit</button>${i.status!=='Paid'?`<button class=tiny onclick="paid('${i.id}')">Paid</button>`:''}<button class=tiny onclick="printDoc('invoice','${i.id}')">PDF</button><button class=tiny onclick="whats('invoice','${i.id}')">WhatsApp</button><button class=tiny onclick="del('invoice','${i.id}')">Delete</button></div></div></div>`).join('')||'<div class=empty>No invoices yet.</div>';
$('incomeList').innerHTML=db.invoices.filter(i=>i.status==='Paid').map(i=>`<div class=item><div><b>${i.number}</b><small>${i.paidDate||''} · ${esc(db.clients.find(c=>c.id===i.clientId)?.name||'')}</small></div><strong>${money(i.total)}</strong></div>`).join('')||'<div class=empty>No paid invoices yet.</div>';
$('marketingList').innerHTML=db.marketing.map(x=>`<div class=card><b>📱 ${esc(x.name)}</b><small>${esc(x.date)} · ${esc(x.channel)}</small></div>`).join('')||'<div class=card><b>No campaigns yet</b><small>Add your first campaign.</small></div>';
$('contractList').innerHTML=db.contracts.map(x=>`<div class=card><b>📄 ${esc(x.name)}</b><small>${esc(x.client)} · ${esc(x.date)}</small></div>`).join('')||'<div class=card><b>No contracts yet</b><small>Add a booking agreement.</small></div>';loadSettings();renderCalendar()}
function delClient(id){if(confirm('Delete client?')){db.clients=db.clients.filter(c=>c.id!==id);persist()}}
function toast(t){$('toast').textContent=t;$('toast').style.display='block';setTimeout(()=>$('toast').style.display='none',2200)}

/* SHOWPAY v21 — TimeTree-style shared calendar */
let calView = 'month';
let calSelected = new Date().toISOString().slice(0,10);

function isoDate(d){
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}
function parseDate(iso){
  const [y,m,d]=String(iso).split('-').map(Number);
  return new Date(y,(m||1)-1,d||1);
}
function calendarToday(){
  calDate=new Date();
  calSelected=isoDate(calDate);
  renderCalendar();
}
function setCalView(view){
  calView=view;
  ['Month','Week','Day','List'].forEach(v=>{
    const el=$('tab'+v);
    if(el) el.classList.toggle('active',v.toLowerCase()===view);
  });
  renderCalendar();
}
function calendarEvents(){
  return (db.shows||[]).map(s=>({
    id:s.id, title:s.title||'Show', date:s.date||isoDate(new Date()),
    time:s.time||'', venue:s.venue||'', owner:s.owner||'Shared',
    notes:s.notes||'', reminder:s.reminder||'', color:s.color||''
  }));
}
function ownerClass(owner){
  return owner==='Person 2'?'partner':owner==='Person 1'?'you':'shared';
}
function selectedLabel(iso){
  return parseDate(iso).toLocaleDateString('en-ZA',{weekday:'long',day:'numeric',month:'long',year:'numeric'});
}
function dayEvents(iso){
  return calendarEvents().filter(e=>e.date===iso).sort((a,b)=>(a.time||'').localeCompare(b.time||''));
}
function selectCalendarDate(iso){
  calSelected=iso;
  renderCalendar();
}
function eventHtml(e){
  const cls=ownerClass(e.owner);
  const when=e.time?` · ${esc(e.time)}`:'';
  return `<div class="tt-event ${cls}" title="${esc(e.title)}">${esc(e.title)}${when}</div>`;
}
function selectedEventCards(iso){
  const ev=dayEvents(iso);
  if(!ev.length) return '<div class="tt-empty">No events on this day. Add a show, booking or shared event.</div>';
  return ev.map(e=>{
    const cls=ownerClass(e.owner);
    return `<div class="tt-event-card">
      <div class="tt-event-line ${cls}"></div>
      <div class="tt-event-info">
        <b>${esc(e.title)}</b>
        <small>${e.time?esc(e.time)+' · ':''}${esc(e.venue||'No location')} · ${esc(e.owner||'Shared')}</small>
        ${e.notes?`<small>${esc(e.notes)}</small>`:''}
      </div>
      <div class="tt-event-actions">
        <button onclick="editCalendarEvent('${e.id}')">Edit</button>
        <button onclick="deleteCalendarEvent('${e.id}')">×</button>
      </div>
    </div>`;
  }).join('');
}
function renderMonthView(){
  const y=calDate.getFullYear(),m=calDate.getMonth();
  const first=new Date(y,m,1), start=new Date(y,m,1-first.getDay());
  let h='<div class="tt-week-head">'+['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(x=>`<div>${x}</div>`).join('')+'</div><div class="tt-month-grid">';
  const today=isoDate(new Date());
  for(let i=0;i<42;i++){
    const d=new Date(start); d.setDate(start.getDate()+i);
    const iso=isoDate(d), muted=d.getMonth()!==m;
    const cls=`tt-day ${muted?'muted ':''}${iso===today?'today ':''}${iso===calSelected?'selected':''}`;
    h+=`<div class="${cls}" onclick="selectCalendarDate('${iso}')"><div class="tt-day-num">${d.getDate()}</div>${dayEvents(iso).slice(0,3).map(eventHtml).join('')}</div>`;
  }
  return h+'</div>';
}
function weekStart(d){
  const x=new Date(d); x.setDate(x.getDate()-x.getDay()); x.setHours(0,0,0,0); return x;
}
function renderWeekView(){
  const start=weekStart(parseDate(calSelected));
  let h='<div class="tt-week-grid">';
  h+='<div class="tt-time-row"><div class="tt-time"></div>';
  for(let i=0;i<7;i++){let d=new Date(start);d.setDate(start.getDate()+i);h+=`<div class="tt-week-label">${d.toLocaleDateString('en-ZA',{weekday:'short'})}<br>${d.getDate()}</div>`}
  h+='</div>';
  for(let hour=6;hour<=23;hour++){
    h+=`<div class="tt-time-row"><div class="tt-time">${String(hour).padStart(2,'0')}:00</div>`;
    for(let i=0;i<7;i++){
      let d=new Date(start);d.setDate(start.getDate()+i);let iso=isoDate(d);
      const ev=dayEvents(iso).filter(e=>e.time && parseInt(e.time,10)===hour);
      h+=`<div class="tt-slot">${ev.map(eventHtml).join('')}</div>`;
    }
    h+='</div>';
  }
  return h+'</div>';
}
function renderDayView(){
  const iso=calSelected;
  let h='<div class="tt-day-grid">';
  for(let hour=6;hour<=23;hour++){
    const ev=dayEvents(iso).filter(e=>e.time && parseInt(e.time,10)===hour);
    h+=`<div class="tt-time-row day"><div class="tt-time">${String(hour).padStart(2,'0')}:00</div><div class="tt-slot">${ev.map(eventHtml).join('')}</div></div>`;
  }
  return h+'</div>';
}
function renderListView(){
  const ev=calendarEvents().filter(e=>e.date>=isoDate(new Date())).sort((a,b)=>(a.date+b.time).localeCompare(b.date+a.time));
  if(!ev.length) return '<div class="tt-empty">No upcoming events.</div>';
  return ev.map(e=>{
    const d=parseDate(e.date), cls=ownerClass(e.owner);
    return `<div class="tt-list-item" onclick="selectCalendarDate('${e.date}')">
      <div class="tt-list-date"><b>${d.getDate()}</b><small>${d.toLocaleDateString('en-ZA',{weekday:'short'})}</small></div>
      <div class="tt-list-info"><b>${esc(e.title)}</b><small>${esc(e.date)}${e.time?' · '+esc(e.time):''} · ${esc(e.venue||'No location')} · ${esc(e.owner)}</small></div>
      <div class="tt-event ${cls}" style="align-self:center;margin:0"> </div>
    </div>`;
  }).join('');
}
function renderCalendar(){
  if(!$('month')) return;
  $('month').textContent=calDate.toLocaleString('en-ZA',{month:'long',year:'numeric'});
  const view=$('calendarView');
  if(view){
    view.innerHTML=calView==='month'?renderMonthView():calView==='week'?renderWeekView():calView==='day'?renderDayView():renderListView();
  }
  if($('selectedDateLabel')) $('selectedDateLabel').textContent=selectedLabel(calSelected);
  if($('selectedEvents')) $('selectedEvents').innerHTML=selectedEventCards(calSelected);
}
function addCalendarEvent(date=calSelected){
  const title=prompt('Event / booking name?'); if(!title) return;
  const chosenDate=prompt('Date (YYYY-MM-DD)?',date||isoDate(new Date()))||date;
  const time=prompt('Start time (HH:MM)?','18:00')||'';
  const venue=prompt('Location / venue?')||'';
  const owner=prompt('Who is it for? Person 1 / Person 2 / Shared','Shared')||'Shared';
  const notes=prompt('Notes?')||'';
  db.shows.push({id:crypto.randomUUID(),title,date:chosenDate,time,venue,fee:0,owner,notes,type:'calendar'});
  db.activity.unshift(`Calendar event ${title} added`);
  calSelected=chosenDate; persist(); toast('Event added');
}
function editCalendarEvent(id){
  const e=db.shows.find(x=>x.id===id); if(!e) return;
  const title=prompt('Event / booking name?',e.title); if(!title) return;
  e.title=title;
  e.date=prompt('Date (YYYY-MM-DD)?',e.date)||e.date;
  e.time=prompt('Start time (HH:MM)?',e.time||'18:00')||e.time||'';
  e.venue=prompt('Location / venue?',e.venue||'')||'';
  e.owner=prompt('Who is it for? Person 1 / Person 2 / Shared',e.owner||'Shared')||e.owner||'Shared';
  e.notes=prompt('Notes?',e.notes||'')||'';
  persist(); toast('Event updated');
}
function deleteCalendarEvent(id){
  if(!confirm('Delete this calendar event?')) return;
  db.shows=db.shows.filter(x=>x.id!==id);
  persist(); toast('Event deleted');
}

render()


/* Neutral shared-calendar access — no relationship-specific wording */
function inviteCalendarPerson(){
  const email=$('sharedPersonEmail')?.value.trim();
  const name=$('sharedCalendarName')?.value.trim() || 'My Shared Calendar';
  if(!email){ toast('Enter the other person’s email address'); return; }
  const code='SP-'+Math.random().toString(36).slice(2,8).toUpperCase();
  localStorage.setItem('showpay_shared_calendar',JSON.stringify({name,email,code}));
  if($('sharedCalendarStatus')) $('sharedCalendarStatus').textContent=`Shared calendar ready for ${email}. Code: ${code}`;
  toast('Shared calendar access prepared');
}
function copyCalendarShareCode(){
  const saved=JSON.parse(localStorage.getItem('showpay_shared_calendar')||'null');
  if(!saved){ toast('Add a person first'); return; }
  const text=`${saved.name} — ShowPay shared calendar — ${saved.code}`;
  if(navigator.clipboard) navigator.clipboard.writeText(text);
  toast('Share code copied');
}
