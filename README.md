# KinaseCondensateDB Optimized

A course-project web database for exploring relationships between human kinases and biomolecular condensates.

This repository is an optimized course-demo version based on the original Team 3 BF768 project framework. It keeps the beginner-friendly demo accounts while adding clearer setup instructions, local testing support, and a backend-generated PNG plot to better match the final proposal requirements.

## Project Goal

KinaseCondensateDB integrates:

- reviewed human kinase records from UniProtKB/Swiss-Prot
- condensate master records
- protein-condensate mappings
- chemical modifier / c-mod annotations
- condensatopathy evidence
- publication evidence via PMID

The web app allows users to search, browse, visualize, and download structured biological database results.

## Main Features

- Flask web application with login and role-based access
- MariaDB / SQLAlchemy relational schema
- User portal for query and browsing
- Admin console for record and relationship management
- Search by protein, kinase, condensate, disease, c-mod, or PMID
- CSV / Excel export endpoints
- ECharts frontend visualizations
- Flask/Python backend PNG chart generation under `static/generated/`
- Beginner workflow PDFs in English and Chinese under `docs/`

## Demo Accounts

These accounts are intentionally kept for course demonstration.

| Role | Username | Password |
|---|---|---|
| Administrator | `admin` | `123456` |
| Regular User | `xiaoming` | `123456` |
| Regular User | `xiaozhang` | `123456` |

For public production use, replace demo passwords and use password hashing.

## Quick Start

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python app.py
```

Open:

```text
http://127.0.0.1:5000/login
```

## Database Configuration

By default, `config.py` contains the course Team3 database connection. To override it safely:

```bash
export DATABASE_URL="mysql+pymysql://USER:PASSWORD@HOST:PORT/Team3?charset=utf8mb4"
python app.py
```

See `.env.example` for a template.

## Main Routes

- `/login` - sign in
- `/register` - create standard user
- `/index` - user query portal
- `/admin` - admin console
- `/api/stats/summary` - summary counts
- `/api/stats/charts` - chart-ready JSON
- `/api/stats/plots/condensate-type.png` - backend-generated PNG plot

## Documentation

Beginner-oriented workflow PDFs:

- `docs/workflow_en.pdf`
- `docs/workflow_zh.pdf`

Markdown sources are also included:

- `docs/workflow_en.md`
- `docs/workflow_zh.md`

## Course Proposal Alignment

This optimized version is designed to match the BF768 Final Proposal more closely:

- relational schema covers Protein, Kinase, Condensate, CMod, Disease, Publication, and relationship tables
- query portal supports kinase-centered, condensate-centered, and disease/evidence-centered questions
- export function provides downloadable tabular result files
- backend Flask route generates a saved PNG chart for graphical output

## Notes

This is a course project, not a production biomedical database service. The demo accounts and simple password design are acceptable for classroom demonstration but should be replaced before any real deployment.
