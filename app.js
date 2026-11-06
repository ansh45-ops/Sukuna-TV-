const PLAYLIST='https://iptv-org.github.io/iptv/countries/in.m3u';
const $=id=>document.getElementById(id);let channels=[],hls=null,currentFilter='all',favorites=new Set();
const rules={sports:/sport|cricket|football|tennis|sony ten|star sports|eurosport/i,news:/news|aaj tak|republic|ndtv|zee news|india tv|cnn|bbc|tv9|abp|news18/i,movies:/movie|cinema|picture|film|flix|star gold|zee cinema/i,entertainment:/entertainment|zee |sony|colors|star |sun tv|vijay|gemini|music|mtv|comedy|serial/i,kids:/kids|cartoon|nick|pogo|disney|hungama/i,music:/music|mtv|9xm|b4u music/i};
function parseM3U(t){
  const lines=t.replace(/^\uFEFF/,'').split(/\r?\n/);
  let meta=null,out=[];
  for(const raw of lines){
    const line=raw.trim();
    if(!line) continue;
    if(line.startsWith('#EXTINF')){
      const attrs={};
      for(const match of line.matchAll(/([\w-]+)="([^"]*)"/g)) attrs[match[1].toLowerCase()]=match[2];
      const comma=line.indexOf(',');
      meta={name:(comma>=0?line.slice(comma+1).trim():'')||attrs['tvg-name']||'Live Channel',logo:attrs['tvg-logo']||'',group:attrs['group-title']||''};
    }else if(line.startsWith('#')){
      continue;
    }else if(meta){
      try{const u=new URL(line);if(u.protocol==='http:'||u.protocol==='https:'){out.push({...meta,url:u.href,id:out.length});meta=null;}}catch{}
    }
  }
  return out;
}
function type(c){let s=c.name+' '+c.group;for(const k of Object.keys(rules))if(rules[k].test(s))return k;return'other'}
function esc(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function render(){let q=$('searchInput').value.trim().toLowerCase();let list=channels.filter(c=>(currentFilter==='all'||type(c)===currentFilter)&&(!q||c.name.toLowerCase().includes(q)||c.group.toLowerCase().includes(q)));$('channelGrid').innerHTML=list.slice(0,120).map((c,i)=>`<article class="channel-card" data-id="${c.id}" tabindex="0"><div class="channel-visual" style="--accent:${['#501020','#132c52','#493019','#2a1644','#17463b'][i%5]}"><span class="live-label">● LIVE</span>${c.logo?`<img src="${esc(c.logo)}" alt="${esc(c.name)}" loading="lazy" onerror="this.remove()">`:`<span class="channel-fallback">${esc(c.name.split(/\s+/).slice(0,2).join(' ').toUpperCase())}</span>`}</div><div class="channel-meta"><strong>${esc(c.name)}</strong><small>Live Now</small></div></article>`).join('');$('emptyState').hidden=!!list.length;$('channelGrid').querySelectorAll('.channel-card').forEach(el=>{let fn=()=>play(channels[+el.dataset.id]);el.onclick=fn;el.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();fn()}}})}
function play(c){if(!c)return;let modal=$('player'),v=$('video');$('playerName').textContent=c.name;$('playerError').textContent='';modal.classList.add('open');modal.setAttribute('aria-hidden','false');if(hls){hls.destroy();hls=null}v.pause();v.removeAttribute('src');v.load();if(v.canPlayType('application/vnd.apple.mpegurl')){v.src=c.url;v.play().catch(()=>{$('playerError').textContent='Tap play to start this channel.'})}else if(window.Hls&&Hls.isSupported()){hls=new Hls();hls.loadSource(c.url);hls.attachMedia(v);hls.on(Hls.Events.MANIFEST_PARSED,()=>v.play().catch(()=>{$('playerError').textContent='Tap play to start this channel.'}));hls.on(Hls.Events.ERROR,(e,d)=>{if(d.fatal)$('playerError').textContent='This stream is currently unavailable. Try another channel.'})}else $('playerError').textContent='Live playback is not supported in this browser.'}
function closePlayer(){if(hls){hls.destroy();hls=null}let v=$('video');v.pause();v.removeAttribute('src');v.load();$('player').classList.remove('open');$('player').setAttribute('aria-hidden','true')}
document.querySelectorAll('.category').forEach(b=>b.onclick=()=>{document.querySelectorAll('.category').forEach(x=>x.classList.remove('active'));b.classList.add('active');currentFilter=b.dataset.filter;render()});
$('exploreBtn').onclick=()=>$('live').scrollIntoView({behavior:'smooth'});$('viewAll').onclick=()=>{currentFilter='all';document.querySelectorAll('.category').forEach(x=>x.classList.toggle('active',x.dataset.filter==='all'));render()};
$('searchToggle').onclick=()=>$('searchPanel').classList.add('open');$('closeSearch').onclick=()=>$('searchPanel').classList.remove('open');$('searchInput').oninput=render;
$('closePlayer').onclick=closePlayer;$('player').onclick=e=>{if(e.target===$('player'))closePlayer()};document.addEventListener('keydown',e=>{if(e.key==='Escape'){closePlayer();$('searchPanel').classList.remove('open')}});
document.querySelectorAll('.nav-item').forEach(b=>b.onclick=()=>{document.querySelectorAll('.nav-item').forEach(x=>x.classList.remove('selected'));b.classList.add('selected');if(b.dataset.tab==='live')$('live').scrollIntoView({behavior:'smooth'});else if(b.dataset.tab==='home')window.scrollTo({top:0,behavior:'smooth'});else if(b.dataset.tab==='favorites'){currentFilter='all';$('channelGrid').innerHTML='<div class="loading-card">Tap a channel to add it to your favorites.</div>'}else if(b.dataset.tab==='profile'||b.dataset.tab==='settings')$('live').scrollIntoView({behavior:'smooth'})});
async function init(){
  const sources=[PLAYLIST,'https://raw.githubusercontent.com/iptv-org/iptv/master/streams/in.m3u'];
  for(const source of sources){
    try{
      const response=await fetch(source,{cache:'no-store'});
      if(!response.ok) throw new Error('Playlist request failed');
      const text=await response.text();
      const parsed=parseM3U(text);
      if(!parsed.length) throw new Error('No valid channel entries');
      channels=parsed;
      render();
      return;
    }catch(error){console.warn('Playlist source unavailable:',source,error);}
  }
  $('channelGrid').innerHTML='<div class="loading-card">Could not load the live channel list. Open this site with an internet connection. If you opened the HTML directly, try hosting it on Netlify or running it from localhost.</div>';
}
init();
