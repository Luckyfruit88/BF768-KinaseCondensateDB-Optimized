checkLogin();
let current='home',state={page:1,size:10,total:0};
const cols={
  proteins:[['uniprot_accession','UniProt Acc'],['gene_name','Gene'],['protein_name','Protein Name'],['species_name','Species'],['biomolecular_condensate_count','Biomol Count'],['synthetic_condensate_count','Synth Count']],
  kinases:[['entry_name','Kinase Entry'],['uniprot_accession','UniProt Acc'],['gene_name','Gene Name'],['sequence_length','Length'],['reviewed_flag','Reviewed']],
  condensates:[['condensate_uid','Condensate UID'],['condensate_name','Condensate Name'],['condensate_type','Type'],['proteins_count','Proteins'],['has_dna','DNA'],['has_rna','RNA'],['confidence_score','Score']],
  diseases:[['disease_id','ID'],['disease_name','Disease Name']],
  cmods:[['cmod_id','ID'],['cmod_name','Chemical Modifier'],['biomolecular_type','Type'],['phenotypic_class','Class']],
  publications:[['pmid','PMID']]
};
function setNav(n){document.querySelectorAll('.nav button').forEach(b=>b.classList.remove('active'));document.getElementById('nav-'+n)?.classList.add('active')}

// Override formatVal in common.js to return styled badges
const origFormatVal = window.formatVal;
window.formatVal = function(k,v) {
  if(['has_dna','has_rna','has_cmods','has_condensatopathy','reviewed_flag'].includes(k)){
    return v==1?'<span class="badge badge-yes">Yes</span>':'<span class="badge badge-no">No</span>';
  }
  if (k==='condensate_type') {
    return `<span class="badge badge-neutral">${v||'Unknown'}</span>`;
  }
  return origFormatVal?origFormatVal(k,v):(v==1?'Yes':(v==0?'No':v));
}

function page(title,name,tip){current=name;state.page=1;setNav(name);document.getElementById('app').innerHTML=`<div class="card"><h2>${title}</h2><p>${tip||''}</p><div class="toolbar"><input id="kw" class="input" placeholder="Search keywords..."><button class="btn primary" onclick="loadList(1)">Search</button><button class="btn" onclick="exportUrl('${name}')">Export CSV</button></div><div id="list" class="table-wrap"></div></div>`;loadList(1)}

async function loadList(p=1){state.page=p;const kw=document.getElementById('kw')?.value||'';const data=await api(`/api/${current}?page=${state.page}&size=${state.size}&keyword=${encodeURIComponent(kw)}`);state.total=data.total;let actions=null;if(current==='proteins')actions=r=>`<button class="btn small" onclick="showProteinCond(${r.protein_id})">Condensates</button>`;if(current==='kinases')actions=r=>`<button class="btn small" onclick="showSeq(${r.protein_id})">Sequence</button>`;if(current==='condensates')actions=r=>`<button class="btn small" onclick="showCondProteins(${r.condensate_id})">Proteins</button> <button class="btn small" onclick="showCondDiseases(${r.condensate_id})">Diseases</button>`;if(current==='diseases')actions=r=>`<button class="btn small" onclick="showDiseaseCond(${r.disease_id})">Evidence</button>`;if(current==='cmods')actions=r=>`<button class="btn small" onclick="showCmodCond(${r.cmod_id})">Condensates</button>`;if(current==='publications')actions=r=>`<button class="btn small" onclick="showPmid('${r.pmid}')">Evidence</button>`;document.getElementById('list').innerHTML=tableHtml(cols[current],data.items,actions)+pagerHtml(state)}

async function showProteinCond(id){const rows=await api(`/api/proteins/${id}/condensates`);showModal('Associated Condensates',tableHtml(cols.condensates,rows))}
async function showCondProteins(id){const rows=await api(`/api/condensates/${id}/proteins`);showModal('Proteins in Condensate',tableHtml(cols.proteins,rows))}
async function showCondDiseases(id){const rows=await api(`/api/condensates/${id}/diseases`);showModal('Disease Evidence',tableHtml([['disease_name','Disease'],['dysregulation_type','Dysregulation'],['condensate_markers','Markers'],['pmid','PMID']],rows))}
async function showDiseaseCond(id){const rows=await api(`/api/diseases/${id}/condensates`);showModal('Associated Condensates',tableHtml([['condensate_name','Condensate'],['dysregulation_type','Dysregulation'],['condensate_markers','Markers'],['pmid','PMID']],rows))}
async function showCmodCond(id){const rows=await api(`/api/cmods/${id}/condensates`);showModal('Affected Condensates',tableHtml(cols.condensates.concat([['pmid','PMID']]),rows))}
async function showSeq(id){const data=await api(`/api/kinases?keyword=&page=1&size=100`);const k=data.items.find(x=>x.protein_id==id);showModal('Kinase Sequence',`<div style="font-family:monospace;background:#f8fafc;padding:20px;border-radius:12px;word-break:break-all;font-size:13px;line-height:1.6;border:1px solid #e2e8f0">${esc(k?.sequence||'No sequence found')}</div>`)}
async function showPmid(pmid){const d=await api(`/api/publications/${encodeURIComponent(pmid)}/evidence`);showModal('PubMed Evidence',`<h3>Disease Evidence</h3><div class="table-wrap" style="margin-bottom:24px">${tableHtml([['condensate_name','Condensate'],['disease_name','Disease'],['dysregulation_type','Dysregulation'],['condensate_markers','Markers']],d.disease_relations)}</div><h3>Chemical Modifier Evidence</h3><div class="table-wrap">${tableHtml([['condensate_name','Condensate'],['cmod_name','Chemical Modifier']],d.cmod_relations)}</div>`)}

function home(){
  current='home';setNav('home');
  document.getElementById('app').innerHTML=`
    <div class="dash-grid" id="stats">
      <!-- Injected stats -->
    </div>
    
    <div class="schema-section">
      <div class="schema-header">
        <h2>Relational Schema Overview</h2>
        <p>KinaseCondensateDB maps interactions across 9 integrated biological tables.</p>
      </div>
      <div class="schema-grid">
        <div class="schema-table-card">
          <h3>Protein / Kinase <span class="schema-tag">Entity</span></h3>
          <ul class="schema-fields">
            <li><span class="pk">PK</span> protein_id</li>
            <li><span></span> uniprot_accession</li>
            <li><span></span> gene_name</li>
            <li><span class="fk">FK</span> Kinase (1:1 extension)</li>
          </ul>
        </div>
        <div class="schema-table-card">
          <h3>Condensate <span class="schema-tag">Entity</span></h3>
          <ul class="schema-fields">
            <li><span class="pk">PK</span> condensate_id</li>
            <li><span></span> condensate_uid</li>
            <li><span></span> condensate_type</li>
            <li><span></span> confidence_score</li>
          </ul>
        </div>
        <div class="schema-table-card">
          <h3>Protein-Condensate <span class="schema-tag">Relation</span></h3>
          <ul class="schema-fields">
            <li><span class="pk">PK</span> protein_condensate_id</li>
            <li><span class="fk">FK</span> protein_id</li>
            <li><span class="fk">FK</span> condensate_id</li>
            <li><span></span> evidence_source</li>
          </ul>
        </div>
        <div class="schema-table-card">
          <h3>Disease Evidence <span class="schema-tag">Relation</span></h3>
          <ul class="schema-fields">
            <li><span class="pk">PK</span> condensate_disease_id</li>
            <li><span class="fk">FK</span> condensate_id</li>
            <li><span class="fk">FK</span> disease_id</li>
            <li><span class="fk">FK</span> pmid (Publication)</li>
          </ul>
        </div>
      </div>
    </div>

    <div class="card">
      <h2>Guided Queries</h2>
      <p>Use these predefined workflows to answer specific biological questions.</p>
      <div class="quick-list">
        <button class="btn quick" onclick="page('Protein Information','proteins','Which biomolecular condensates is a human kinase associated with? What are the condensate types and confidence scores?')">
          <strong>Query 1: Human kinase → associated condensates and metadata</strong>
        </button>
        <button class="btn quick" onclick="page('Condensate Information','condensates','Which human kinases are contained in a specific condensate? What are their UniProt accessions, gene names, and sequence lengths?')">
          <strong>Query 2: Condensate → contained human kinases</strong>
        </button>
        <button class="btn quick" onclick="page('Condensate Information','condensates','Which biomolecular condensates are associated with a disease or dysregulation type? What PubMed PMIDs support these associations?')">
          <strong>Query 3: Disease / dysregulation → condensates and supporting PMIDs</strong>
        </button>
      </div>
    </div>
  `;
  loadStats();
}

async function loadStats(){
  const s=await api('/api/stats/summary');
  document.getElementById('stats').innerHTML=`
    <div class="dash-card">
      <span class="dash-label">Human Kinases</span>
      <span class="dash-value" style="color:#2563eb">${s.kinase_total}</span>
    </div>
    <div class="dash-card">
      <span class="dash-label">Total Condensates</span>
      <span class="dash-value" style="color:#0891b2">${s.condensate_total}</span>
    </div>
    <div class="dash-card">
      <span class="dash-label">Disease Links</span>
      <span class="dash-value" style="color:#14b8a6">${s.disease_total}</span>
    </div>
    <div class="dash-card">
      <span class="dash-label">Chemical Modifiers</span>
      <span class="dash-value" style="color:#f59e0b">${s.cmod_total}</span>
    </div>
  `;
}

function complex(){
  setNav('complex');
  document.getElementById('app').innerHTML=`
    <div class="card">
      <h2>Analytics & Specialized Tools</h2>
      <div class="toolbar">
        <button class="btn primary" onclick="page('Chemical Modifier Query','cmods','Query C-mod information and view affected condensates')">Search Chemical Modifiers</button>
        <button class="btn primary" onclick="page('Literature Evidence Query','publications','Search evidence by PubMed PMID')">Search Publications</button>
        <button class="btn primary" onclick="charts()">View Statistical Charts</button>
      </div>
    </div>
    <div id="complexBox"></div>
  `;
}

async function charts(){
  document.getElementById('complexBox').innerHTML=`
    <div class="card" style="background:#eff6ff;border-color:#bfdbfe">
      <h3>Backend-generated PNG Chart</h3>
      <p>This plot is generated by Flask/Python using Matplotlib and saved under <code>static/generated/</code>, fulfilling the course graphical-output requirement.</p>
      <button class="btn primary" onclick="openBackendPlot()">Open Generated PNG Plot</button>
    </div>
    <div class="charts">
      <div class="card chart" id="c1"></div>
      <div class="card chart" id="c2"></div>
      <div class="card chart" id="c3"></div>
      <div class="card chart" id="c4"></div>
      <div class="card chart" id="c5"></div>
    </div>
  `;
  const d=await api('/api/stats/charts');
  drawPie('c1','Condensate Count by Type',d.condensate_type);
  drawBar('c2','Disease-Associated Condensates',d.disease_rank);
  drawBar('c3','Condensates by Species',d.species_count);
  drawPie('c4','Chemical Modifiers by Type',d.cmod_type);
  drawBar('c5','Top Proteins by Condensates',d.protein_rank);
}

function drawPie(id,title,data){echarts.init(document.getElementById(id)).setOption({title:{text:title,textStyle:{fontSize:15,fontWeight:'normal'}},tooltip:{},series:[{type:'pie',radius:'55%',data}]})}
function drawBar(id,title,data){echarts.init(document.getElementById(id)).setOption({title:{text:title,textStyle:{fontSize:15,fontWeight:'normal'}},tooltip:{},grid:{left:'3%',right:'4%',bottom:'15%',containLabel:true},xAxis:{type:'category',data:data.map(x=>x.name),axisLabel:{rotate:25,interval:0}},yAxis:{type:'value'},series:[{type:'bar',data:data.map(x=>x.value),itemStyle:{color:'#38bdf8'}}]})}
async function openBackendPlot(){
  const r=await fetch('/api/stats/plots/condensate-type.png',{headers:{'Authorization':'Bearer '+localStorage.getItem('token')}});
  if(!r.ok){alert('Plot generation failed');return}
  const blob=await r.blob();
  window.open(URL.createObjectURL(blob),'_blank');
}

home();
