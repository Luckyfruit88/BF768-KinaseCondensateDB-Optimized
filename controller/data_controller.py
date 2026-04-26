from datetime import datetime
from flask import Blueprint, request, send_file, current_app
from sqlalchemy import func, or_
from sqlalchemy.exc import IntegrityError
from pathlib import Path
from exts import db
from models import *
from service.utils import ok, fail, jwt_required, paginate_query, model_to_dict, export_rows, apply_like

bp = Blueprint('data', __name__, url_prefix='/api')

MODEL_MAP = {
    'users': (UserInfo, ['username','role','status'], 'user_id'),
    'proteins': (Protein, ['uniprot_accession','gene_name','protein_name','species_name'], 'protein_id'),
    'kinases': (Kinase, ['entry_name','organism_name'], 'protein_id'),
    'condensates': (Condensate, ['condensate_uid','condensate_name','condensate_type'], 'condensate_id'),
    'diseases': (Disease, ['disease_name'], 'disease_id'),
    'cmods': (Cmod, ['cmod_name','biomolecular_type','phenotypic_class'], 'cmod_id'),
    'publications': (Publication, ['pmid'], 'pmid'),
}
AUTO_PK = {'users','proteins','condensates','diseases','cmods'}

COLUMNS = {
    'proteins': [('uniprot_accession','UniProt Accession'),('gene_name','Gene Name'),('protein_name','Protein Name'),('species_name','Species'),('biomolecular_condensate_count','Biomolecular Condensates'),('synthetic_condensate_count','Synthetic Condensates')],
    'kinases': [('entry_name','Kinase Entry'),('uniprot_accession','UniProt Accession'),('gene_name','Gene Name'),('organism_name','Organism'),('sequence_length','Sequence Length'),('reviewed_flag','Reviewed')],
    'condensates': [('condensate_uid','Condensate UID'),('condensate_name','Condensate Name'),('condensate_type','Type'),('species_tax_id','Species Tax ID'),('proteins_count','Protein Count'),('has_dna','DNA'),('has_rna','RNA'),('confidence_score','Confidence Score')],
    'diseases': [('disease_id','Disease ID'),('disease_name','Disease Name')],
    'cmods': [('cmod_id','C-mod ID'),('cmod_name','Chemical Modifier'),('biomolecular_type','Biomolecular Type'),('phenotypic_class','Phenotypic Class')],
    'publications': [('pmid','PMID')],
    'users': [('user_id','User ID'),('username','Username'),('gender','Gender'),('phone','Phone'),('email','Email'),('role','Role'),('status','Status'),('create_time','Created At')]
}

def clean_data(data):
    return {k:(None if v == '' else v) for k,v in (data or {}).items()}

def kinase_dict(k):
    d = model_to_dict(k)
    if k.protein:
        d.update({'uniprot_accession': k.protein.uniprot_accession, 'gene_name': k.protein.gene_name})
    return d

def get_query(name):
    if name == 'kinases':
        q = Kinase.query.join(Protein)
        kw = request.args.get('keyword','').strip()
        if kw:
            q = q.filter(or_(Kinase.entry_name.like(f'%{kw}%'), Kinase.organism_name.like(f'%{kw}%'), Protein.uniprot_accession.like(f'%{kw}%'), Protein.gene_name.like(f'%{kw}%')))
        return q
    model, fields, _ = MODEL_MAP[name]
    q = model.query
    if name == 'users':
        q = q.filter(UserInfo.role == '普通用户')
    return apply_like(q, model, fields)

@bp.get('/<name>')
@jwt_required()
def list_data(name):
    if name not in MODEL_MAP: return fail('Unknown resource')
    serializer = kinase_dict if name == 'kinases' else model_to_dict
    return ok(paginate_query(get_query(name), serializer))

@bp.get('/<name>/export')
@jwt_required()
def export_data(name):
    if name not in MODEL_MAP: return fail('Unknown resource')
    rows = [(kinase_dict(x) if name == 'kinases' else model_to_dict(x)) for x in get_query(name).limit(5000).all()]
    return export_rows(rows, COLUMNS[name], name, request.args.get('type','csv'))

@bp.post('/<name>')
@jwt_required('管理员')
def create_data(name):
    if name not in MODEL_MAP: return fail('Unknown resource')
    model, _, pk = MODEL_MAP[name]
    data = clean_data(request.get_json() or {})
    if name == 'users':
        data['role'] = '普通用户'
        data['status'] = 1
        data['create_time'] = datetime.now()
    if name == 'publications' and not data.get('pmid'):
        return fail('PMID is required')
    if name == 'kinases' and not data.get('protein_id'):
        return fail('Protein is required')
    filtered = {k:v for k,v in data.items() if hasattr(model, k)}
    if name in AUTO_PK:
        filtered.pop(pk, None)
    try:
        obj = model(**filtered)
        db.session.add(obj); db.session.commit()
        return ok(model_to_dict(obj), 'Created successfully')
    except IntegrityError as e:
        db.session.rollback(); return fail('Duplicate or invalid data: ' + str(e.orig))

@bp.put('/<name>/<id>')
@jwt_required('管理员')
def update_data(name, id):
    if name not in MODEL_MAP: return fail('Unknown resource')
    model, _, pk = MODEL_MAP[name]
    obj = model.query.get(id)
    if not obj: return fail('Record not found', 404)
    for k,v in clean_data(request.get_json() or {}).items():
        if hasattr(obj, k) and k != pk:
            setattr(obj, k, v)
    db.session.commit(); return ok(model_to_dict(obj), 'Updated successfully')

@bp.delete('/<name>/<id>')
@jwt_required('管理员')
def delete_data(name, id):
    if name not in MODEL_MAP: return fail('Unknown resource')
    model, _, _ = MODEL_MAP[name]
    obj = model.query.get(id)
    if not obj: return fail('Record not found', 404)
    db.session.delete(obj); db.session.commit(); return ok(msg='Deleted successfully')

@bp.put('/users/<id>/toggle')
@jwt_required('管理员')
def toggle_user(id):
    user = UserInfo.query.get(id)
    if not user: return fail('User not found', 404)
    user.status = 0 if user.status == 1 else 1
    db.session.commit(); return ok(model_to_dict(user, exclude={'password'}), 'Status updated')

@bp.get('/proteins/<pid>/condensates')
@jwt_required()
def protein_condensates(pid):
    rows = db.session.query(ProteinCondensate, Condensate).join(Condensate).filter(ProteinCondensate.protein_id==pid).all()
    return ok([dict(model_to_dict(c), protein_condensate_id=pc.protein_condensate_id, evidence_source=pc.evidence_source) for pc,c in rows])

@bp.get('/condensates/<cid>/proteins')
@jwt_required()
def condensate_proteins(cid):
    rows = db.session.query(ProteinCondensate, Protein).join(Protein).filter(ProteinCondensate.condensate_id==cid).all()
    return ok([dict(model_to_dict(p), protein_condensate_id=pc.protein_condensate_id, evidence_source=pc.evidence_source) for pc,p in rows])

@bp.get('/condensates/<cid>/diseases')
@jwt_required()
def condensate_diseases(cid):
    rows = db.session.query(CondensateDisease, Disease).join(Disease).filter(CondensateDisease.condensate_id==cid).all()
    return ok([dict(model_to_dict(d), condensate_disease_id=cd.condensate_disease_id, dysregulation_type=cd.dysregulation_type, condensate_markers=cd.condensate_markers, pmid=cd.pmid) for cd,d in rows])

@bp.get('/condensates/<cid>/cmods')
@jwt_required()
def condensate_cmods(cid):
    rows = db.session.query(CondensateCmod, Cmod).join(Cmod).filter(CondensateCmod.condensate_id==cid).all()
    return ok([dict(model_to_dict(m), condensate_cmod_id=cc.condensate_cmod_id, pmid=cc.pmid) for cc,m in rows])

@bp.get('/diseases/<did>/condensates')
@jwt_required()
def disease_condensates(did):
    rows = db.session.query(CondensateDisease, Condensate).join(Condensate).filter(CondensateDisease.disease_id==did).all()
    return ok([dict(model_to_dict(c), condensate_disease_id=cd.condensate_disease_id, dysregulation_type=cd.dysregulation_type, condensate_markers=cd.condensate_markers, pmid=cd.pmid) for cd,c in rows])

@bp.get('/cmods/<mid>/condensates')
@jwt_required()
def cmod_condensates(mid):
    rows = db.session.query(CondensateCmod, Condensate).join(Condensate).filter(CondensateCmod.cmod_id==mid).all()
    return ok([dict(model_to_dict(c), condensate_cmod_id=cc.condensate_cmod_id, pmid=cc.pmid) for cc,c in rows])

@bp.get('/publications/<pmid>/evidence')
@jwt_required()
def publication_evidence(pmid):
    disease = db.session.query(CondensateDisease, Condensate, Disease).join(Condensate).join(Disease).filter(CondensateDisease.pmid.like(f'%{pmid}%')).all()
    cmod = db.session.query(CondensateCmod, Condensate, Cmod).join(Condensate).join(Cmod).filter(CondensateCmod.pmid.like(f'%{pmid}%')).all()
    return ok({
        'disease_relations': [{'condensate_name': c.condensate_name, 'disease_name': d.disease_name, 'dysregulation_type': cd.dysregulation_type, 'condensate_markers': cd.condensate_markers, 'pmid': cd.pmid} for cd,c,d in disease],
        'cmod_relations': [{'condensate_name': c.condensate_name, 'cmod_name': m.cmod_name, 'pmid': cc.pmid} for cc,c,m in cmod]
    })

@bp.post('/relations/protein-condensate')
@jwt_required('管理员')
def add_pc():
    data = clean_data(request.get_json() or {}); obj = ProteinCondensate(**data); db.session.add(obj); db.session.commit(); return ok(model_to_dict(obj),'Relation created')
@bp.delete('/relations/protein-condensate/<rid>')
@jwt_required('管理员')
def del_pc(rid):
    obj = ProteinCondensate.query.get(rid); db.session.delete(obj); db.session.commit(); return ok(msg='Relation deleted')
@bp.post('/relations/condensate-cmod')
@jwt_required('管理员')
def add_cc():
    data = clean_data(request.get_json() or {}); obj = CondensateCmod(**data); db.session.add(obj); db.session.commit(); return ok(model_to_dict(obj),'Relation created')
@bp.delete('/relations/condensate-cmod/<rid>')
@jwt_required('管理员')
def del_cc(rid):
    obj = CondensateCmod.query.get(rid); db.session.delete(obj); db.session.commit(); return ok(msg='Relation deleted')
@bp.post('/relations/condensate-disease')
@jwt_required('管理员')
def add_cd():
    data = clean_data(request.get_json() or {}); obj = CondensateDisease(**data); db.session.add(obj); db.session.commit(); return ok(model_to_dict(obj),'Relation created')
@bp.delete('/relations/condensate-disease/<rid>')
@jwt_required('管理员')
def del_cd(rid):
    obj = CondensateDisease.query.get(rid); db.session.delete(obj); db.session.commit(); return ok(msg='Relation deleted')

@bp.get('/stats/summary')
@jwt_required()
def stats_summary():
    return ok({
        'protein_total': Protein.query.count(), 'kinase_total': Kinase.query.count(), 'condensate_total': Condensate.query.count(),
        'disease_total': Disease.query.count(), 'publication_total': Publication.query.count(), 'cmod_total': Cmod.query.count(),
        'user_total': UserInfo.query.count(), 'normal_user_total': UserInfo.query.filter_by(role='普通用户').count(),
        'admin_total': UserInfo.query.filter_by(role='管理员').count(), 'disabled_user_total': UserInfo.query.filter_by(status=0).count()
    })

@bp.get('/stats/charts')
@jwt_required()
def stats_charts():
    type_count = db.session.query(Condensate.condensate_type, func.count()).group_by(Condensate.condensate_type).all()
    disease_count = db.session.query(Disease.disease_name, func.count(CondensateDisease.condensate_id)).join(CondensateDisease).group_by(Disease.disease_name).order_by(func.count(CondensateDisease.condensate_id).desc()).limit(10).all()
    species_count = db.session.query(Condensate.species_tax_id, func.count()).group_by(Condensate.species_tax_id).limit(10).all()
    cmod_count = db.session.query(Cmod.biomolecular_type, func.count()).group_by(Cmod.biomolecular_type).all()
    protein_rank = Protein.query.order_by((Protein.biomolecular_condensate_count + Protein.synthetic_condensate_count).desc()).limit(10).all()
    return ok({
        'condensate_type': [{'name': str(k), 'value': v} for k,v in type_count],
        'disease_rank': [{'name': k, 'value': v} for k,v in disease_count],
        'species_count': [{'name': str(k), 'value': v} for k,v in species_count],
        'cmod_type': [{'name': str(k), 'value': v} for k,v in cmod_count],
        'protein_rank': [{'name': p.gene_name or p.uniprot_accession, 'value': (p.biomolecular_condensate_count or 0)+(p.synthetic_condensate_count or 0)} for p in protein_rank]
    })


@bp.get('/stats/plots/condensate-type.png')
@jwt_required()
def condensate_type_plot():
    """Generate a backend PNG chart for the course graphical-output requirement."""
    import matplotlib
    matplotlib.use('Agg')
    import matplotlib.pyplot as plt

    rows = db.session.query(Condensate.condensate_type, func.count()).group_by(Condensate.condensate_type).all()
    labels = [str(k or 'Unknown') for k, _ in rows] or ['No data']
    values = [int(v) for _, v in rows] or [0]

    out_dir = Path(current_app.root_path) / 'static' / 'generated'
    out_dir.mkdir(parents=True, exist_ok=True)
    out_path = out_dir / 'condensate_type_summary.png'

    plt.figure(figsize=(8, 5))
    if sum(values) > 0:
        plt.bar(labels, values, color='#2563eb')
    else:
        plt.text(0.5, 0.5, 'No condensate data available', ha='center', va='center')
        plt.xticks([]); plt.yticks([])
    plt.title('Condensate Count by Type')
    plt.xlabel('Condensate Type')
    plt.ylabel('Count')
    plt.xticks(rotation=30, ha='right')
    plt.tight_layout()
    plt.savefig(out_path, dpi=160)
    plt.close()
    return send_file(out_path, mimetype='image/png')

@bp.get('/options/<name>')
@jwt_required()
def options(name):
    mapping = {'proteins':(Protein,'protein_id','uniprot_accession'), 'condensates':(Condensate,'condensate_id','condensate_name'), 'diseases':(Disease,'disease_id','disease_name'), 'cmods':(Cmod,'cmod_id','cmod_name'), 'publications':(Publication,'pmid','pmid')}
    if name not in mapping: return fail('Unknown option')
    model, value, label = mapping[name]
    rows = model.query.limit(1000).all()
    return ok([{'value': getattr(x,value), 'label': getattr(x,label)} for x in rows])
