checkLogin();
let current='users',state={page:1,size:10,total:0};
const config={
 users:{title:'User Management',pk:'user_id',cols:[['user_id','ID'],['username','Username'],['gender','Gender'],['phone','Phone'],['email','Email'],['role','Role'],['status','Status'],['create_time','Created At']],fields:['username','password','gender','phone','email']},
 proteins:{title:'Protein Management',pk:'protein_id',cols:[['protein_id','ID'],['uniprot_accession','UniProt'],['gene_name','Gene'],['protein_name','Protein Name'],['species_name','Species']],fields:['uniprot_accession','gene_name','protein_name','species_name','biomolecular_condensate_count','synthetic_condensate_count']},
 kinases:{title:'Kinase Management',pk:'protein_id',cols:[['protein_id','ID'],['entry_name','Entry'],['uniprot_accession','UniProt'],['gene_name','Gene'],['sequence_length','Len'],['reviewed_flag','Reviewed']],fields:['protein_id','entry_name','organism_name','sequence_length','sequence','reviewed_flag']},
 condensates:{title:'Condensate Management',pk:'condensate_id',cols:[['condensate_id','ID'],['condensate_uid','UID'],['condensate_name','Name'],['condensate_type','Type'],['proteins_count','Prot Cnt'],['has_dna','DNA'],['has_rna','RNA'],['has_cmods','C-mods'],['has_condensatopathy','Disease']],fields:['condensate_uid','condensate_name','condensate_type','species_tax_id','proteins_count','has_dna','has_rna','has_cmods','has_condensatopathy','confidence_score']},
 diseases:{title:'Disease Management',pk:'disease_id',cols:[['disease_id','ID'],['disease_name','Disease Name']],fields:['disease_name']},
 cmods:{title:'Chemical Modifier Management',pk:'cmod_id',cols:[['cmod_id','ID'],['cmod_name','Name'],['biomolecular_type','Type'],['phenotypic_class','Class']],fields:['cmod_name','biomolecular_type','phenotypic_class']},
 publications:{title:'Publication Management',pk:'pmid',cols:[['pmid','PMID']],fields:['pmid']}
};
const fieldLabels={username:'Username',password:'Password',gender:'Gender',phone:'Phone',email:'Email',protein_id:'Protein',entry_name:'Entry Name',organism_name:'Organism',sequence_length:'Sequence Length',sequence:'Sequence',reviewed_flag:'Reviewed'};

// Admin badge styling
window.formatVal = function(k,v) {
  if(['has_dna','has_rna','has_cmods','has_condensatopathy','reviewed_flag'].includes(k)) return v==1?'<span class="badge badge-yes">Yes</span>':'<span class="badge badge-no">No</span>';
  if(k==='status') return v==1?'<span class="badge badge-yes">Active</span>':'<span class="badge badge-no">Disabled</span>';
  if(k==='role') return v==='管理员'?'<span class="badge badge-neutral">Administrator</span>':'<span class="badge badge-neutral">User</span>';
  return v;
}

function switchMenu(n){current=n;document.querySelectorAll('.side-btn').forEach(b=>b.classList.remove('active'));document.getElementById('side-'+n)?.classList.add('active');state.page=1;renderManage()}
function renderManage(){const c=config[current];document.getElementById('main').innerHTML=`<div class="card"><h2>${c.title}</h2><div class="toolbar"><input id="kw" class="input" placeholder="Keyword search..."><button class="btn primary" onclick="loadList(1)">Search</button><button class="btn primary" onclick="openForm()">Add New Record</button><button class="btn" onclick="exportUrl('${current}')">Export CSV</button></div><div id="list" class="table-wrap"></div></div>`;loadList(1)}
async function loadList(p=1){state.page=p;const kw=document.getElementById('kw')?.value||'';const data=await api(`/api/${current}?page=${p}&size=${state.size}&keyword=${encodeURIComponent(kw)}`);state.total=data.total;const c=config[current];const actions=r=>{let s=`<button class="btn small" onclick='openForm(${JSON.stringify(r).replace(/'/g,"&#39;")})'>Edit</button> <button class="btn danger small" onclick="delRow('${r[c.pk]}')">Delete</button>`;if(current==='users')s+=` <button class="btn warn small" onclick="toggleUser('${r.user_id}',${r.status})">${r.status==1?'Disable':'Enable'}</button>`;if(current==='proteins')s+=` <button class="btn small" onclick="managePC(${r.protein_id})">Condensates</button>`;if(current==='condensates')s+=` <button class="btn small" onclick="manageCC(${r.condensate_id})">C-mods</button> <button class="btn small" onclick="manageCD(${r.condensate_id})">Diseases</button>`;return s};document.getElementById('list').innerHTML=tableHtml(c.cols,data.items,actions)+pagerHtml(state)}
async function selectOptions(name,selected){const rows=await api(`/api/options/${name}`);return rows.map(o=>`<option value="${esc(o.value)}" ${String(o.value)===String(selected)?'selected':''}>${esc(o.label)} (${esc(o.value)})</option>`).join('')}
async function openForm(row=null){const c=config[current];let html=`<div class="grid">`;for(const f of c.fields){const v=row?.[f]??'';if(current==='kinases'&&f==='protein_id'&&!row){html+=`<div class="form-row"><label>Protein</label><select id="f_${f}" class="input">${await selectOptions('proteins',v)}</select></div>`}else if(f==='status'||f.startsWith('has_')||f==='reviewed_flag'){html+=field(f,row?.[f]??1,['1','0'])}else{html+=`<div class="form-row"><label>${fieldLabels[f]||f}</label><textarea id="f_${f}" class="input" rows="2">${esc(v)}</textarea></div>`}}html+=`</div><button class="btn primary" onclick="saveForm('${row?row[c.pk]:''}')">Save Changes</button>`;showModal(row?'Edit Record':'Add New Record',html)}
function field(f,v,opts){return `<div class="form-row"><label>${fieldLabels[f]||f}</label><select id="f_${f}" class="input">${opts.map(o=>`<option value="${o}" ${String(v)===String(o)?'selected':''}>${o==1?'Yes':'No'}</option>`).join('')}</select></div>`}
async function saveForm(id){const c=config[current],data={};c.fields.forEach(f=>data[f]=document.getElementById('f_'+f)?.value);if(current==='users'){data.role='普通用户';data.status=1}try{await api(`/api/${current}${id?'/'+id:''}`,{method:id?'PUT':'POST',body:JSON.stringify(data)});closeModal();loadList(state.page)}catch(e){alert(e.message)}}
async function delRow(id){if(!confirm('Delete this record permanently?'))return;try{await api(`/api/${current}/${id}`,{method:'DELETE'});loadList(state.page)}catch(e){alert(e.message)}}
async function toggleUser(id,status){if(!confirm(status==1?'Disable this user?':'Enable this user?'))return;await api(`/api/users/${id}/toggle`,{method:'PUT'});loadList(state.page)}

async function managePC(pid){const rows=await api(`/api/proteins/${pid}/condensates`);showModal('Protein-Condensate Relations',`<div class="toolbar"><input id="rel_cid" class="input" placeholder="Condensate ID"><button class="btn primary" onclick="addPC(${pid})">Add Relation</button></div><div class="table-wrap">${tableHtml([['protein_condensate_id','Rel ID'],['condensate_id','Cond ID'],['condensate_uid','UID'],['condensate_name','Name'],['evidence_source','Evidence']],rows,r=>`<button class="btn danger small" onclick="delRel('/api/relations/protein-condensate/${r.protein_condensate_id}',()=>managePC(${pid}))">Delete</button>`)}</div>`)}
async function addPC(pid){await api('/api/relations/protein-condensate',{method:'POST',body:JSON.stringify({protein_id:pid,condensate_id:rel_cid.value,evidence_source:'manual'})});managePC(pid)}
async function manageCC(cid){const rows=await api(`/api/condensates/${cid}/cmods`);showModal('Condensate-Cmod Relations',`<div class="toolbar"><input id="rel_mid" class="input" placeholder="C-mod ID"><input id="rel_pmid" class="input" placeholder="PMID (Optional)"><button class="btn primary" onclick="addCC(${cid})">Add Relation</button></div><div class="table-wrap">${tableHtml([['condensate_cmod_id','Rel ID'],['cmod_id','C-mod ID'],['cmod_name','Chemical Modifier'],['biomolecular_type','Type'],['pmid','PMID']],rows,r=>`<button class="btn danger small" onclick="delRel('/api/relations/condensate-cmod/${r.condensate_cmod_id}',()=>manageCC(${cid}))">Delete</button>`)}</div>`)}
async function addCC(cid){await api('/api/relations/condensate-cmod',{method:'POST',body:JSON.stringify({condensate_id:cid,cmod_id:rel_mid.value,pmid:rel_pmid.value||null})});manageCC(cid)}
async function manageCD(cid){const rows=await api(`/api/condensates/${cid}/diseases`);showModal('Condensate-Disease Relations',`<div class="toolbar"><input id="rel_did" class="input" placeholder="Disease ID"><input id="rel_pmid" class="input" placeholder="PMID"></div><div class="form-row"><textarea id="rel_dys" class="input" placeholder="Dysregulation description" rows="2"></textarea></div><div class="form-row"><textarea id="rel_marker" class="input" placeholder="Condensate markers" rows="2"></textarea></div><button class="btn primary" style="margin-bottom:20px" onclick="addCD(${cid})">Add Relation</button><div class="table-wrap">${tableHtml([['condensate_disease_id','Rel ID'],['disease_id','Disease ID'],['disease_name','Disease'],['dysregulation_type','Dysregulation'],['pmid','PMID']],rows,r=>`<button class="btn danger small" onclick="delRel('/api/relations/condensate-disease/${r.condensate_disease_id}',()=>manageCD(${cid}))">Delete</button>`)}</div>`)}
async function addCD(cid){await api('/api/relations/condensate-disease',{method:'POST',body:JSON.stringify({condensate_id:cid,disease_id:rel_did.value,pmid:rel_pmid.value||null,dysregulation_type:rel_dys.value,condensate_markers:rel_marker.value})});manageCD(cid)}
async function delRel(url,cb){if(confirm('Delete this relation?')){await api(url,{method:'DELETE'});cb()}}

async function dashboard(){
  document.querySelectorAll('.side-btn').forEach(b=>b.classList.remove('active'));
  document.getElementById('side-dashboard').classList.add('active');
  const s=await api('/api/stats/summary');
  main.innerHTML=`
    <div class="card">
      <h2>System Overview</h2>
      <div class="dash-grid" style="grid-template-columns:repeat(auto-fit,minmax(200px,1fr))">
        <div class="dash-card"><span class="dash-label">Kinases</span><span class="dash-value" style="color:#2563eb">${s.kinase_total}</span></div>
        <div class="dash-card"><span class="dash-label">Condensates</span><span class="dash-value" style="color:#0891b2">${s.condensate_total}</span></div>
        <div class="dash-card"><span class="dash-label">Diseases</span><span class="dash-value" style="color:#14b8a6">${s.disease_total}</span></div>
        <div class="dash-card"><span class="dash-label">Publications</span><span class="dash-value" style="color:#6366f1">${s.publication_total}</span></div>
      </div>
    </div>
    <div class="charts">
      <div class="card chart" id="c1"></div>
      <div class="card chart" id="c2"></div>
    </div>
  `;
  const d=await api('/api/stats/charts');
  echarts.init(c1).setOption({title:{text:'Condensate Count by Type',textStyle:{fontSize:15,fontWeight:'normal'}},tooltip:{},series:[{type:'pie',radius:'55%',data:d.condensate_type}]});
  echarts.init(c2).setOption({title:{text:'Top Proteins by Condensates',textStyle:{fontSize:15,fontWeight:'normal'}},grid:{left:'3%',right:'4%',bottom:'15%',containLabel:true},xAxis:{type:'category',data:d.protein_rank.map(x=>x.name),axisLabel:{rotate:25,interval:0}},yAxis:{},series:[{type:'bar',data:d.protein_rank.map(x=>x.value),itemStyle:{color:'#38bdf8'}}]});
}

switchMenu('users');
