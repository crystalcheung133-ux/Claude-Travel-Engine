(()=>{'use strict';
const URL_PDF='saigon-memory-book.pdf';
const FLIPBOOK_URL='https://heyzine.com/flip-book/1aeb62aaf8.html';
const PDF_FILENAME='Saigon_Companion_The_Memory_Edition.pdf';
const $=id=>document.getElementById(id),canvas=$('pdfCanvas'),ctx=canvas.getContext('2d',{alpha:false});
const viewport=$('viewport'),shell=$('pageShell'),load=$('loading');
let pdf=null,pageNo=1,zoom=1,panX=0,panY=0,renderTask=null,renderSequence=0,baseWidth=0,baseHeight=0;
const pointers=new Map();let gesture=null;let queued=false;
function notify(msg){const n=$('notice');n.textContent=msg;n.classList.add('show');clearTimeout(notify.timer);notify.timer=setTimeout(()=>n.classList.remove('show'),2800)}
function clamp(v,lo,hi){return Math.max(lo,Math.min(hi,v))}
function applyTransform(){const boundX=Math.max(0,(baseWidth*zoom-viewport.clientWidth)/2+30),boundY=Math.max(0,(baseHeight*zoom-viewport.clientHeight)/2+30);panX=clamp(panX,-boundX,boundX);panY=clamp(panY,-boundY,boundY);shell.style.transform=`translate(calc(-50% + ${panX}px),calc(-50% + ${panY}px)) scale(${zoom})`;$('zoomValue').textContent=zoom===1?'Fit':Math.round(zoom*100)+'%'}
function setZoom(next,cx=0,cy=0){const old=zoom;zoom=clamp(next,1,4);if(zoom===1){panX=0;panY=0}else{panX=panX+(cx-panX)*(1-zoom/old);panY=panY+(cy-panY)*(1-zoom/old)}applyTransform()}
async function render(){if(!pdf)return;let ticket=++renderSequence;if(renderTask){try{renderTask.cancel()}catch(e){}}load.hidden=false;const page=await pdf.getPage(pageNo);if(ticket!==renderSequence)return;const natural=page.getViewport({scale:1});const margin=12;const scale=Math.min((viewport.clientWidth-margin*2)/natural.width,(viewport.clientHeight-margin*2)/natural.height);const ratio=Math.min(window.devicePixelRatio||1,2);const vp=page.getViewport({scale:scale*ratio});baseWidth=Math.round(natural.width*scale);baseHeight=Math.round(natural.height*scale);shell.style.width=baseWidth+'px';shell.style.height=baseHeight+'px';canvas.width=Math.ceil(vp.width);canvas.height=Math.ceil(vp.height);const task=page.render({canvasContext:ctx,viewport:vp});renderTask=task;try{await task.promise}catch(e){if(e.name!=='RenderingCancelledException')console.error(e);return}if(ticket!==renderSequence)return;load.hidden=true;applyTransform();$('pageLabel').textContent=pageNo+' / '+pdf.numPages;$('prev').disabled=pageNo<=1;$('next').disabled=pageNo>=pdf.numPages;try{localStorage.setItem('saigon_memory_last_page',String(pageNo))}catch(e){}}
function goto(n){if(!pdf)return;const next=clamp(n,1,pdf.numPages);if(next===pageNo)return;pageNo=next;zoom=1;panX=panY=0;render()}
$('prev').onclick=()=>goto(pageNo-1);$('next').onclick=()=>goto(pageNo+1);$('zoomOut').onclick=()=>setZoom(zoom/1.35);$('zoomIn').onclick=()=>setZoom(zoom*1.35);$('fit').onclick=()=>setZoom(1);
let immersive=false;
function updateImmersive(){
  document.body.classList.toggle('immersive',immersive);
  $('full').setAttribute('aria-pressed',String(immersive));
  $('full').textContent=immersive?'⤢':'⛶';
  // Recalculate page fit after hiding/showing the reader chrome.
  window.requestAnimationFrame(()=>{zoom=1;panX=panY=0;render()});
}
async function toggleImmersive(){
  immersive=!immersive;updateImmersive();
  if(immersive&&document.documentElement.requestFullscreen){
    try{await document.documentElement.requestFullscreen()}catch(e){/* Safari iPhone: CSS immersive fallback */}
  }else if(!immersive&&document.fullscreenElement){
    try{await document.exitFullscreen()}catch(e){}
  }
}
$('full').onclick=toggleImmersive;
$('immersiveExit').onclick=()=>{if(immersive)toggleImmersive()};
document.addEventListener('fullscreenchange',()=>{if(!document.fullscreenElement&&immersive){immersive=false;updateImmersive()}});
// Original instrumental track, only starts after a user gesture.
const audio=$('memoryAudio');audio.volume=.22;
let musicEnabled=false;
function updateMusicUI(){
  $('music').setAttribute('aria-pressed',String(musicEnabled));
  $('music').innerHTML=(musicEnabled?'♫ <span>Pause</span>':'♫ <span>Music</span>');
  $('immersiveMusic').textContent=musicEnabled?'♫ Pause':'♫ Music';
}
async function toggleMusic(){
  if(musicEnabled){audio.pause();musicEnabled=false;updateMusicUI();return}
  try{await audio.play();musicEnabled=true;updateMusicUI()}catch(e){notify('Tap again to start music')}
}
$('music').onclick=toggleMusic;$('immersiveMusic').onclick=toggleMusic;
// Sharing is intentionally separate from PDF rendering so the book remains usable offline.
// navigator.share({files}) is available only in secure contexts on supported mobile devices.
const pdfUrl=new URL(URL_PDF,location.href).href;
let pdfBlobPromise=null;
function getPdfBlob(){
  if(!pdfBlobPromise){
    pdfBlobPromise=fetch(pdfUrl,{credentials:'same-origin'}).then(response=>{
      if(!response.ok)throw new Error('PDF HTTP '+response.status);
      return response.blob();
    }).then(blob=>{
      if(!blob.size)throw new Error('PDF is empty');
      return blob;
    }).catch(error=>{pdfBlobPromise=null;throw error});
  }
  return pdfBlobPromise;
}
function savePdf(){
  const a=document.createElement('a');a.href=pdfUrl;a.download=PDF_FILENAME;
  document.body.appendChild(a);a.click();a.remove();
  notify('Saving Memory Book PDF');
}
async function copyLink(url,label){
  try{
    await navigator.clipboard.writeText(url);notify(label+' copied');
  }catch(e){window.prompt('Copy '+label,url)}
}
async function shareLink(url,title){
  if(navigator.share){
    try{await navigator.share({title,text:'Our Saigon Memory Book',url});return}
    catch(e){if(e.name==='AbortError')return}
  }
  await copyLink(url,'Flipbook link');
}
async function sharePdf(){
  const btn=$('sharePdf');
  // Use a full-file share when supported, otherwise fall back to sharing a direct PDF URL.
  // A transient sharing permission can expire during a large network fetch on iOS;
  // retaining the direct URL fallback keeps sharing useful when that happens.
  btn.disabled=true;
  try{
    notify('Preparing Memory Book PDF…');
    if(navigator.share && navigator.canShare && typeof File!=='undefined'){
      const blob=await getPdfBlob();
      const file=new File([blob],PDF_FILENAME,{type:'application/pdf'});
      const data={files:[file],title:'Our Saigon Memory Book'};
      if(navigator.canShare(data)){
        try{await navigator.share(data);return}
        catch(e){if(e.name==='AbortError')return}
      }
    }
    if(navigator.share){
      try{await navigator.share({title:'Our Saigon Memory Book PDF',url:pdfUrl});return}
      catch(e){if(e.name==='AbortError')return}
    }
    await copyLink(pdfUrl,'PDF link');
    notify('PDF link copied — recipients can open and save it');
  }catch(error){
    console.warn('PDF sharing fallback',error);
    if(navigator.share){
      try{await navigator.share({title:'Our Saigon Memory Book PDF',url:pdfUrl});return}
      catch(e){if(e.name==='AbortError')return}
    }
    await copyLink(pdfUrl,'PDF link');
  }finally{btn.disabled=false}
}
$('download').onclick=savePdf;
$('shareFlipbook').onclick=()=>shareLink(FLIPBOOK_URL,'Our Saigon Memory Book · Flipbook');
$('sharePdf').onclick=sharePdf;
$('immersiveSave').onclick=savePdf;
$('immersiveFlipbook').onclick=()=>shareLink(FLIPBOOK_URL,'Our Saigon Memory Book · Flipbook');
$('immersiveSharePdf').onclick=sharePdf;
viewport.addEventListener('pointerdown',e=>{viewport.setPointerCapture(e.pointerId);pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});if(pointers.size===1)gesture={startX:e.clientX,startY:e.clientY,lastX:e.clientX,lastY:e.clientY,panX,panY,moved:false};if(pointers.size===2){const a=[...pointers.values()];gesture={pinch:true,distance:Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y),zoom,panX,panY}}});
viewport.addEventListener('pointermove',e=>{if(!pointers.has(e.pointerId))return;pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});if(!gesture)return;if(pointers.size===2){const a=[...pointers.values()];if(!gesture.pinch){gesture={pinch:true,distance:Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y),zoom}}const dist=Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y);setZoom(gesture.zoom*dist/Math.max(1,gesture.distance));return}if(pointers.size===1&&!gesture.pinch){const dx=e.clientX-gesture.startX,dy=e.clientY-gesture.startY;gesture.moved=Math.abs(dx)>6||Math.abs(dy)>6;if(zoom>1){panX=gesture.panX+dx;panY=gesture.panY+dy;applyTransform()}gesture.lastX=e.clientX;gesture.lastY=e.clientY}});
function release(e){if(!pointers.has(e.pointerId))return;const last=gesture;pointers.delete(e.pointerId);if(pointers.size===0){if(last&&!last.pinch&&zoom===1){const dx=e.clientX-last.startX;if(Math.abs(dx)>65&&Math.abs(e.clientY-last.startY)<90)goto(pageNo+(dx<0?1:-1))}gesture=null}else if(pointers.size===1){const one=[...pointers.values()][0];gesture={startX:one.x,startY:one.y,panX,panY,pinch:false}}}
viewport.addEventListener('pointerup',release);viewport.addEventListener('pointercancel',release);
viewport.addEventListener('wheel',e=>{if(e.ctrlKey||e.metaKey){e.preventDefault();setZoom(zoom*(e.deltaY<0?1.12:0.89))}else if(zoom>1){e.preventDefault();panX-=e.deltaX;panY-=e.deltaY;applyTransform()}},{passive:false});
document.addEventListener('keydown',e=>{if(e.target.matches('input,textarea'))return;if(e.key==='ArrowRight')goto(pageNo+1);if(e.key==='ArrowLeft')goto(pageNo-1);if(e.key==='Escape'&&immersive){immersive=false;updateImmersive()}else if(e.key==='Escape'&&zoom>1)setZoom(1);if(e.key==='+'||e.key==='=')setZoom(zoom*1.35);if(e.key==='-')setZoom(zoom/1.35)});
let resizeTimeout;window.addEventListener('resize',()=>{clearTimeout(resizeTimeout);resizeTimeout=setTimeout(render,150)});
(async()=>{try{if(!window.pdfjsLib)throw Error('PDF reader missing');pdfjsLib.GlobalWorkerOptions.workerSrc='vendor-pdfjs-worker-3.11.174.min.js';pdf=await pdfjsLib.getDocument({url:URL_PDF}).promise;try{pageNo=clamp(parseInt(localStorage.getItem('saigon_memory_last_page'),10)||1,1,pdf.numPages)}catch(e){}await render();$('state').textContent='45-page Memory Edition · Swipe or use arrows to turn pages'}catch(e){load.textContent='Unable to open the book. Please check your connection.';console.error(e);$('state').textContent='Reader unavailable';notify('PDF available using Save')}})();
})();