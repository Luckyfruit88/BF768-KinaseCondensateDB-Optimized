---
title: KinaseCondensateDB Beginner Workflow
author: BF768 Course Project
---

# KinaseCondensateDB Beginner Workflow

## 1. What This Project Does

KinaseCondensateDB is a beginner-friendly web database for exploring how human kinase proteins are connected to biomolecular condensates, diseases, chemical modifiers, and literature evidence.

The project answers three main biological database questions:

1. Which condensates are associated with a specific human kinase?
2. Which human kinases are present in a specific condensate?
3. Which condensates are linked to a disease, and what PubMed evidence supports the link?

## 2. Project Components

The project uses:

- **Flask** for the web application
- **MariaDB** for the relational database
- **SQLAlchemy** for Python database models
- **PyMySQL** for database connection
- **HTML/CSS/JavaScript** for the web interface
- **ECharts** for interactive charts
- **Matplotlib** for a backend-generated PNG chart

## 3. Folder Structure

```text
KinaseCondensateDB-Optimized/
├── app.py
├── config.py
├── requirements.txt
├── routes.py
├── controller/
├── models/
├── service/
├── templates/
├── static/
│   ├── css/
│   ├── js/
│   └── generated/
├── sql/
├── raw_data/
└── docs/
```

Important files:

- `app.py`: starts the Flask app
- `config.py`: stores configuration and database URL
- `models/entities.py`: defines database tables as SQLAlchemy models
- `controller/auth.py`: handles login and registration
- `controller/data_controller.py`: handles query, export, relationship, and chart APIs
- `sql/condensatedb.sql`: database creation and initial data script
- `docs/`: beginner workflow documents

## 4. How to Run the Project Locally

Open a terminal in the project folder.

### Step 1: Create a virtual environment

```bash
python3 -m venv .venv
```

### Step 2: Activate the environment

On macOS or Linux:

```bash
source .venv/bin/activate
```

On Windows PowerShell:

```powershell
.venv\Scripts\Activate.ps1
```

### Step 3: Install packages

```bash
pip install -r requirements.txt
```

### Step 4: Start Flask

```bash
python app.py
```

### Step 5: Open the website

Go to:

```text
http://127.0.0.1:5000/login
```

## 5. Demo Login Accounts

For course demonstration, use:

| Role | Username | Password |
|---|---|---|
| Administrator | admin | 123456 |
| Regular User | xiaoming | 123456 |
| Regular User | xiaozhang | 123456 |

Choose the matching role on the login page.

## 6. Beginner User Workflow

### Step 1: Log in as a regular user

Use:

```text
Username: xiaoming
Password: 123456
Role: User
```

After login, the user portal opens.

### Step 2: Search proteins

Click **Proteins**.

You can search by:

- UniProt accession
- gene name
- protein name
- species

Use this page to answer:

> Which condensates are associated with a specific kinase or protein?

### Step 3: Search kinases

Click **Kinases**.

This page shows:

- kinase entry name
- UniProt accession
- gene name
- organism
- sequence length
- reviewed flag

Click **Sequence** to view the amino acid sequence.

### Step 4: Search condensates

Click **Condensates**.

This page shows:

- condensate UID
- condensate name
- condensate type
- species tax ID
- protein count
- DNA/RNA information
- confidence score

Use action buttons to see related proteins, kinases, diseases, and evidence.

### Step 5: Search diseases and evidence

Click **Diseases**.

Use this page to answer:

> Which condensates are linked to a disease, and what evidence supports the link?

Evidence may include dysregulation type, condensate markers, and PubMed PMID.

### Step 6: Use Integrated Query

Click **Integrated Query**.

This page gives access to:

- chemical modifier queries
- PubMed evidence queries
- statistical charts

### Step 7: Export results

Most list pages include an **Export Excel** button.

The backend also supports CSV export through API endpoints such as:

```text
/api/proteins/export?type=csv
```

## 7. Administrator Workflow

### Step 1: Log in as administrator

Use:

```text
Username: admin
Password: 123456
Role: Administrator
```

### Step 2: Manage records

The admin console can manage:

- users
- proteins
- kinases
- condensates
- diseases
- chemical modifiers
- publications

### Step 3: Manage relationships

The admin can maintain:

- protein-condensate relationships
- condensate-cmod relationships
- condensate-disease relationships

These relationships are important because they connect biological entities across tables.

### Step 4: View statistics

Click **Statistics** to view summary counts and charts.

## 8. Backend PNG Chart

The project includes a Flask/Python-generated PNG chart to satisfy the course graphical output requirement.

Route:

```text
/api/stats/plots/condensate-type.png
```

What it does:

1. Queries condensate counts grouped by condensate type.
2. Uses Matplotlib in the Flask backend.
3. Saves the output image under:

```text
static/generated/condensate_type_summary.png
```

4. Returns the PNG to the browser.

## 9. How the Project Matches the Proposal

The proposal required:

- a relational database for human kinases and biomolecular condensates
- authenticated access
- query functions
- disease and PubMed evidence support
- graphical output
- downloadable result files

This optimized version supports those goals through:

- SQLAlchemy models and MariaDB schema
- login and role-based access
- user query portal
- admin management portal
- ECharts and backend Matplotlib plot
- CSV/Excel export endpoints

## 10. Troubleshooting

### Problem: Flask cannot connect to database

Check `DATABASE_URL` in `config.py` or set it manually:

```bash
export DATABASE_URL="mysql+pymysql://USER:PASSWORD@HOST:PORT/Team3?charset=utf8mb4"
```

### Problem: packages are missing

Run:

```bash
pip install -r requirements.txt
```

### Problem: login fails

Make sure username, password, and role match. For example, admin must use role **Administrator**.

### Problem: chart PNG does not load

Make sure `matplotlib` is installed and the `static/generated/` folder exists.

## 11. Suggested Demo Order

For a class presentation:

1. Introduce the biological problem.
2. Show the relational schema.
3. Log in as a regular user.
4. Search a protein or kinase.
5. Show associated condensates.
6. Show disease and PubMed evidence.
7. Export a result table.
8. Show the statistics chart and backend PNG plot.
9. Log in as admin and show relationship management.
10. Conclude with how the database answers the three proposal questions.
