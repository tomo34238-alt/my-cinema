const STORAGE_KEY = "myCinema.movies.v1";
const API_KEY_STORAGE = "myCinema.tmdbKey";
const TMDB_IMAGE = "https://image.tmdb.org/t/p/w500";
let movies = [];
let selectedRating = 0;
let activeGenre = "すべて";
let deferredInstallPrompt = null;

const $ = (id) => document.getElementById(id);
const movieDialog = $("movieDialog");
const settingsDialog = $("settingsDialog");

function uid(){ return (crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + Math.random().toString(16).slice(2)); }
function safeParse(raw, fallback){ try{return JSON.parse(raw) ?? fallback;}catch{return fallback;} }
function loadData(){
  const data = safeParse(localStorage.getItem(STORAGE_KEY), []);
  movies = Array.isArray(data) ? data : [];
  movies = movies.map(m => ({
    id: m.id || uid(), title: String(m.title || "タイトル未設定"),
    watchedAt: m.watchedAt || "", genre: m.genre || "",
    poster: m.poster || "", rating: Math.min(5, Math.max(0, Number(m.rating) || 0)),
    review: m.review || "", scene: m.scene || "", thought: m.thought || "",
    favorite: Boolean(m.favorite), tmdbId: m.tmdbId || null
  }));
}
function saveData(){ localStorage.setItem(STORAGE_KEY, JSON.stringify(movies)); }
function toast(message){ const el=$("toast"); el.textContent=message; el.classList.add("show"); setTimeout(()=>el.classList.remove("show"),2300); }
function escapeHtml(value){return String(value ?? "").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
function formatDate(date){ if(!date)return "鑑賞日未設定"; const d=new Date(date+"T00:00:00"); return `${d.getFullYear()}.${String(d.getMonth()+1).padStart(2,"0")}.${String(d.getDate()).padStart(2,"0")}`; }

function renderStats(){
  $("statCount").textContent = movies.length;
  const rated=movies.filter(m=>m.rating>0);
  $("statAverage").textContent = rated.length ? (rated.reduce((s,m)=>s+m.rating,0)/rated.length).toFixed(1) : "—";
  $("statFavorites").textContent = movies.filter(m=>m.favorite).length;
  const now=new Date(), month=String(now.getMonth()+1).padStart(2,"0"), year=now.getFullYear();
  $("statMonth").textContent=movies.filter(m=>m.watchedAt && m.watchedAt.startsWith(`${year}-${month}`)).length;
}
function renderGenres(){
  const genres=[...new Set(movies.map(m=>m.genre.trim()).filter(Boolean))].sort();
  const all=["すべて",...genres];
  if(!all.includes(activeGenre))activeGenre="すべて";
  $("genreChips").innerHTML=all.map(g=>`<button class="chip ${g===activeGenre?"active":""}" data-genre="${escapeHtml(g)}">${escapeHtml(g)}</button>`).join("");
  $("genreChips").querySelectorAll("button").forEach(b=>b.addEventListener("click",()=>{activeGenre=b.dataset.genre;renderLibrary();}));
}
function renderLibrary(){
  renderStats(); renderGenres();
  const query=$("librarySearch").value.trim().toLowerCase();
  const filter=$("filterSelect").value;
  let list=movies.filter(m=>{
    const matchesQuery=[m.title,m.review,m.scene,m.thought,m.genre].join(" ").toLowerCase().includes(query);
    const matchesGenre=activeGenre==="すべて"||m.genre===activeGenre;
    const matchesFilter=filter==="all"||(filter==="favorites"&&m.favorite)||(filter==="rated"&&m.rating>0)||(filter==="unrated"&&m.rating===0);
    return matchesQuery&&matchesGenre&&matchesFilter;
  });
  const sort=$("sortSelect").value;
  list.sort((a,b)=>sort==="oldest"?(a.watchedAt||"").localeCompare(b.watchedAt||""):sort==="rating"?b.rating-a.rating:sort==="title"?a.title.localeCompare(b.title,"ja"):(b.watchedAt||"").localeCompare(a.watchedAt||""));
  $("movieGrid").innerHTML=list.map(m=>{
    const poster=m.poster?`<img src="${escapeHtml(m.poster)}" alt="${escapeHtml(m.title)}のポスター" loading="lazy" onerror="this.remove()">`:`<div class="poster-placeholder">MY<br>CINEMA</div>`;
    return `<article class="movie-card" data-id="${escapeHtml(m.id)}" tabindex="0" role="button" aria-label="${escapeHtml(m.title)}を編集">
      <div class="poster-wrap">${poster}<span class="fav-mark" title="お気に入り">${m.favorite?"♥":"♡"}</span></div>
      <div class="card-info"><h3 class="card-title">${escapeHtml(m.title)}</h3><div class="card-meta"><span>${escapeHtml(formatDate(m.watchedAt))}</span><span>${escapeHtml(m.genre||"ジャンル未設定")}</span></div><div class="card-rating">${m.rating?"★".repeat(m.rating)+"<span style='color:#645b4e'>"+ "★".repeat(5-m.rating)+"</span>":"未評価"}</div></div>
    </article>`;
  }).join("");
  $("movieGrid").querySelectorAll(".movie-card").forEach(card=>{
    const open=()=>openMovie(card.dataset.id);
    card.addEventListener("click",open); card.addEventListener("keydown",e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();open();}});
  });
  $("emptyState").classList.toggle("show",list.length===0);
  $("emptyState").querySelector("h3").textContent=movies.length===0?"最初の一本を記録しよう":"作品が見つかりませんでした";
  $("emptyState").querySelector("p").textContent=movies.length===0?"観た映画を追加すると、ここにあなたのライブラリが育っていきます。":"検索条件や絞り込みを変更してみてください。";
  $("emptyAddBtn").style.display=movies.length===0?"inline-block":"none";
}
function setRating(value){
  selectedRating=value;
  $("ratingControl").innerHTML=[1,2,3,4,5].map(n=>`<button type="button" class="star-btn ${n<=selectedRating?"selected":""}" data-rating="${n}" aria-label="${n}点">★</button>`).join("");
  $("ratingControl").querySelectorAll("button").forEach(b=>b.addEventListener("click",()=>setRating(Number(b.dataset.rating))));
}
function resetForm(){
  $("movieForm").reset(); $("movieId").value=""; $("dialogTitle").textContent="映画を記録する";
  $("deleteBtn").hidden=true; $("searchResults").innerHTML=""; $("tmdbQuery").value="";
  $("watchedAtInput").value=new Date().toISOString().slice(0,10); setRating(0);
}
function openMovie(id){
  resetForm();
  if(id){
    const m=movies.find(x=>x.id===id); if(!m)return;
    $("dialogTitle").textContent="記録を編集"; $("movieId").value=m.id;
    $("titleInput").value=m.title; $("watchedAtInput").value=m.watchedAt;
    $("genreInput").value=m.genre; $("posterInput").value=m.poster;
    $("reviewInput").value=m.review; $("sceneInput").value=m.scene;
    $("thoughtInput").value=m.thought; $("favoriteInput").checked=m.favorite;
    setRating(m.rating); $("deleteBtn").hidden=false;
  }
  movieDialog.showModal();
}
function saveMovie(event){
  event.preventDefault();
  const title=$("titleInput").value.trim(); if(!title){toast("タイトルを入力してください");return;}
  const id=$("movieId").value;
  const record={id:id||uid(),title,watchedAt:$("watchedAtInput").value,genre:$("genreInput").value.trim(),poster:$("posterInput").value.trim(),rating:selectedRating,review:$("reviewInput").value.trim(),scene:$("sceneInput").value.trim(),thought:$("thoughtInput").value.trim(),favorite:$("favoriteInput").checked};
  if(id){const index=movies.findIndex(m=>m.id===id);if(index>=0)movies[index]={...movies[index],...record};}
  else movies.unshift(record);
  saveData(); movieDialog.close(); renderLibrary(); toast(id?"記録を更新しました":"映画を追加しました");
}
function deleteCurrentMovie(){
  const id=$("movieId").value; if(!id)return;
  if(!confirm("この映画の記録を削除しますか？"))return;
  movies=movies.filter(m=>m.id!==id);saveData();movieDialog.close();renderLibrary();toast("記録を削除しました");
}
function getApiKey(){return localStorage.getItem(API_KEY_STORAGE)||"";}
async function searchTMDB(){
  const key=getApiKey(), query=$("tmdbQuery").value.trim();
  if(!key){toast("設定からTMDB APIキーを登録してください");return;}
  if(!query){toast("検索するタイトルを入力してください");return;}
  $("searchResults").innerHTML="<p class='hint'>検索しています…</p>";
  try{
    const url=`https://api.themoviedb.org/3/search/movie?query=${encodeURIComponent(query)}&include_adult=false&language=ja-JP&page=1`;
    const response=await fetch(url,{headers:{Authorization:`Bearer ${key}`,accept:"application/json"}});
    if(!response.ok)throw new Error(response.status===401?"APIキーを確認してください":"検索に失敗しました");
    const data=await response.json();
    const results=(data.results||[]).slice(0,6);
    if(!results.length){$("searchResults").innerHTML="<p class='hint'>作品が見つかりませんでした。</p>";return;}
    $("searchResults").innerHTML=results.map(m=>{
      const poster=m.poster_path?TMDB_IMAGE+m.poster_path:"";
      return `<button type="button" class="result-item" data-tmdb="${m.id}">
        ${poster?`<img src="${poster}" alt="">`:`<span class="poster-placeholder">✦</span>`}
        <span>${escapeHtml(m.title)}<small>${escapeHtml((m.release_date||"").slice(0,4))}年 / ${escapeHtml(m.original_title||"")}</small></span>
      </button>`;
    }).join("");
    $("searchResults").querySelectorAll("[data-tmdb]").forEach(btn=>btn.addEventListener("click",()=>{
      const m=results.find(x=>String(x.id)===btn.dataset.tmdb); if(!m)return;
      $("titleInput").value=m.title;
      $("posterInput").value=m.poster_path?TMDB_IMAGE+m.poster_path:"";
      $("genreInput").value="";
      $("searchResults").innerHTML="";
      toast("作品情報を入力しました。ジャンルや感想を追加してください");
    }));
  }catch(err){$("searchResults").innerHTML=`<p class="hint">${escapeHtml(err.message||"通信エラー")}</p>`;}
}
function exportData(){
  const blob=new Blob([JSON.stringify({version:1,exportedAt:new Date().toISOString(),movies},null,2)],{type:"application/json"});
  const url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download=`my-cinema-backup-${new Date().toISOString().slice(0,10)}.json`;a.click();URL.revokeObjectURL(url);toast("バックアップを書き出しました");
}
async function importData(file){
  if(!file)return;
  try{
    const parsed=safeParse(await file.text(),null);
    const incoming=Array.isArray(parsed)?parsed:parsed?.movies;
    if(!Array.isArray(incoming))throw new Error("ファイル形式が正しくありません");
    if(!confirm(`${incoming.length}件の映画データを読み込み、現在のデータと置き換えますか？`))return;
    movies=incoming.map(m=>({...m,id:m.id||uid()}));saveData();renderLibrary();toast("データを読み込みました");settingsDialog.close();
  }catch(e){toast(e.message||"読み込みに失敗しました");}
}
function setupInstall(){
  window.addEventListener("beforeinstallprompt",e=>{e.preventDefault();deferredInstallPrompt=e;$("installBtn").hidden=false;});
  $("installBtn").addEventListener("click",async()=>{if(!deferredInstallPrompt)return;deferredInstallPrompt.prompt();await deferredInstallPrompt.userChoice;deferredInstallPrompt=null;$("installBtn").hidden=true;});
}
function setupEvents(){
  ["addBtn","heroAddBtn","emptyAddBtn"].forEach(id=>$(id).addEventListener("click",()=>openMovie()));
  $("movieForm").addEventListener("submit",saveMovie);
  $("closeDialog").addEventListener("click",()=>movieDialog.close());
  $("cancelBtn").addEventListener("click",()=>movieDialog.close());
  $("deleteBtn").addEventListener("click",deleteCurrentMovie);
  $("tmdbSearchBtn").addEventListener("click",searchTMDB);
  $("tmdbQuery").addEventListener("keydown",e=>{if(e.key==="Enter"){e.preventDefault();searchTMDB();}});
  $("librarySearch").addEventListener("input",renderLibrary);
  $("sortSelect").addEventListener("change",renderLibrary);
  $("filterSelect").addEventListener("change",renderLibrary);
  $("settingsBtn").addEventListener("click",()=>{ $("apiKeyInput").value=getApiKey();settingsDialog.showModal();});
  $("closeSettings").addEventListener("click",()=>settingsDialog.close());
  $("cancelSettings").addEventListener("click",()=>settingsDialog.close());
  $("settingsForm").addEventListener("submit",e=>{e.preventDefault();localStorage.setItem(API_KEY_STORAGE,$("apiKeyInput").value.trim());settingsDialog.close();toast("設定を保存しました");});
  $("exportBtn").addEventListener("click",exportData);
  $("importInput").addEventListener("change",e=>importData(e.target.files[0]));
}
loadData();setupEvents();setupInstall();renderLibrary();
if("serviceWorker" in navigator && location.protocol!=="file:"){window.addEventListener("load",()=>navigator.serviceWorker.register("./sw.js").catch(()=>{}));}
