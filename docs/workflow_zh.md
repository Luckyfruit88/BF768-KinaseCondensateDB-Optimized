---
title: KinaseCondensateDB 初学者工作流
author: BF768 课程项目
---

# KinaseCondensateDB 初学者工作流

## 1. 这个项目是做什么的

KinaseCondensateDB 是一个适合初学者理解和演示的生物数据库网页项目，用来探索人类激酶蛋白、 biomolecular condensates、生物疾病、chemical modifiers 以及文献证据之间的关系。

这个项目主要回答三个数据库问题：

1. 某个人类 kinase 和哪些 condensates 有关联？
2. 某个 condensate 中包含哪些人类 kinases？
3. 哪些 condensates 和疾病有关？这些关系有哪些 PubMed 文献证据支持？

## 2. 项目组成

项目使用：

- **Flask**：负责网页后端
- **MariaDB**：负责关系型数据库
- **SQLAlchemy**：负责 Python 数据库模型
- **PyMySQL**：负责 Python 连接 MariaDB
- **HTML/CSS/JavaScript**：负责网页界面
- **ECharts**：负责交互式图表
- **Matplotlib**：负责 Flask 后端生成 PNG 图像

## 3. 文件夹结构

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

重要文件说明：

- `app.py`：启动 Flask 应用
- `config.py`：保存配置和数据库连接地址
- `models/entities.py`：用 SQLAlchemy 定义数据库表
- `controller/auth.py`：处理登录和注册
- `controller/data_controller.py`：处理查询、导出、关系维护和图表 API
- `sql/condensatedb.sql`：数据库建表和初始数据脚本
- `docs/`：工作流说明文档

## 4. 如何在本地运行项目

在项目文件夹中打开终端。

### 第一步：创建 Python 虚拟环境

```bash
python3 -m venv .venv
```

### 第二步：激活虚拟环境

macOS 或 Linux：

```bash
source .venv/bin/activate
```

Windows PowerShell：

```powershell
.venv\Scripts\Activate.ps1
```

### 第三步：安装依赖包

```bash
pip install -r requirements.txt
```

### 第四步：启动 Flask

```bash
python app.py
```

### 第五步：打开网页

在浏览器中访问：

```text
http://127.0.0.1:5000/login
```

## 5. 演示账号

课程演示可以使用：

| 角色 | 用户名 | 密码 |
|---|---|---|
| 管理员 | admin | 123456 |
| 普通用户 | xiaoming | 123456 |
| 普通用户 | xiaozhang | 123456 |

登录时要选择对应的角色。

## 6. 普通用户工作流

### 第一步：以普通用户登录

使用：

```text
Username: xiaoming
Password: 123456
Role: User
```

登录后会进入普通用户查询界面。

### 第二步：查询 proteins

点击 **Proteins**。

可以按照以下字段搜索：

- UniProt accession
- gene name
- protein name
- species

这个页面可以帮助回答：

> 某个 kinase 或 protein 和哪些 condensates 有关联？

### 第三步：查询 kinases

点击 **Kinases**。

这个页面显示：

- kinase entry name
- UniProt accession
- gene name
- organism
- sequence length
- reviewed flag

点击 **Sequence** 可以查看氨基酸序列。

### 第四步：查询 condensates

点击 **Condensates**。

这个页面显示：

- condensate UID
- condensate name
- condensate type
- species tax ID
- protein count
- DNA/RNA 信息
- confidence score

可以通过按钮查看相关 proteins、kinases、diseases 和 evidence。

### 第五步：查询 diseases 和 evidence

点击 **Diseases**。

这个页面可以回答：

> 哪些 condensates 和某种疾病有关？有哪些证据支持？

证据可能包括 dysregulation type、condensate markers 和 PubMed PMID。

### 第六步：使用 Integrated Query

点击 **Integrated Query**。

这个页面包含：

- chemical modifier 查询
- PubMed evidence 查询
- statistical charts

### 第七步：导出结果

大多数列表页面都有 **Export Excel** 按钮。

后端也支持 CSV 导出，例如：

```text
/api/proteins/export?type=csv
```

## 7. 管理员工作流

### 第一步：以管理员登录

使用：

```text
Username: admin
Password: 123456
Role: Administrator
```

### 第二步：管理数据记录

管理员后台可以管理：

- users
- proteins
- kinases
- condensates
- diseases
- chemical modifiers
- publications

### 第三步：管理表之间的关系

管理员可以维护：

- protein-condensate relationships
- condensate-cmod relationships
- condensate-disease relationships

这些关系是数据库能够跨表回答问题的关键。

### 第四步：查看统计信息

点击 **Statistics** 查看总数统计和图表。

## 8. 后端生成 PNG 图表

为了满足课程对 graphical output 的要求，项目加入了 Flask/Python 后端生成 PNG 图像的功能。

路由：

```text
/api/stats/plots/condensate-type.png
```

它的流程是：

1. 查询不同 condensate type 的数量。
2. 在 Flask 后端使用 Matplotlib 画图。
3. 把图像保存到：

```text
static/generated/condensate_type_summary.png
```

4. 把 PNG 返回给浏览器显示或下载。

## 9. 项目如何对应 Proposal

Proposal 要求包括：

- 为 human kinases 和 biomolecular condensates 建立关系型数据库
- 登录保护
- 查询功能
- 疾病和 PubMed evidence 支持
- 图形输出
- 结果下载功能

这个优化版本通过以下方式实现：

- SQLAlchemy models 和 MariaDB schema
- 登录和角色权限控制
- 普通用户查询界面
- 管理员后台
- ECharts 交互式图表和 Matplotlib 后端 PNG 图
- CSV/Excel 导出接口

## 10. 常见问题

### 问题：Flask 无法连接数据库

检查 `config.py` 中的 `DATABASE_URL`，或者手动设置：

```bash
export DATABASE_URL="mysql+pymysql://USER:PASSWORD@HOST:PORT/Team3?charset=utf8mb4"
```

### 问题：缺少 Python 包

运行：

```bash
pip install -r requirements.txt
```

### 问题：登录失败

确认用户名、密码和角色是否匹配。例如 admin 必须选择 **Administrator**。

### 问题：PNG 图表无法打开

确认已经安装 `matplotlib`，并且 `static/generated/` 文件夹存在。

## 11. 推荐课堂演示顺序

1. 介绍生物学问题。
2. 展示关系型数据库 schema。
3. 用普通用户登录。
4. 搜索一个 protein 或 kinase。
5. 展示相关 condensates。
6. 展示 disease 和 PubMed evidence。
7. 导出一个结果表。
8. 展示统计图表和后端生成的 PNG 图。
9. 用管理员登录并展示关系维护功能。
10. 总结项目如何回答 proposal 中的三个问题。
