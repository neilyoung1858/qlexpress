# 积分规则引擎 (QLExpress 可视化配置平台)

基于 AntV X6 + React 19 + Spring Boot 3.2 的信用卡积分规则可视化配置平台。通过拖拽方式搭建积分规则流程图，自动生成 QLExpress 表达式，并支持在线规则测试与模拟执行。

## 项目结构

```
qlexpress/
├── frontend/                      # 前端 (Vite + React + AntV X6)
│   ├── src/
│   │   ├── components/            # 组件
│   │   │   ├── Canvas.jsx         # 主画布 (X6 流程图)
│   │   │   ├── Sidebar.jsx        # 左侧拖拽组件面板
│   │   │   ├── RightPanel.jsx     # 右侧配置面板 + QL 预览
│   │   │   ├── RuleList.jsx       # 规则列表页
│   │   │   ├── RuleCreate.jsx     # 创建/编辑规则页
│   │   │   ├── RuleTest.jsx       # 规则测试页
│   │   │   ├── FieldModal.jsx     # 自定义字段管理弹窗
│   │   │   └── SimulatePanel.jsx  # 模拟试算面板
│   │   ├── config/nodes.js        # 节点定义、系统字段、运算符配置
│   │   ├── store/useStore.js      # Zustand 状态管理
│   │   └── utils/qlGenerator.js   # QL 表达式生成器
│   ├── package.json
│   └── vite.config.js
│
├── backend/                       # 后端 (SpringBoot 3.2 + Java 17)
│   ├── src/main/java/com/qlexpress/
│   │   ├── controller/            # REST API 控制器
│   │   │   ├── RuleController.java
│   │   │   └── FieldController.java
│   │   ├── service/               # 业务逻辑
│   │   │   ├── RuleService.java   # 规则 CRUD
│   │   │   ├── QlGeneratorService.java  # QL 表达式生成
│   │   │   ├── QLTestService.java # QLExpress 执行引擎
│   │   │   └── FieldService.java  # 字段管理
│   │   ├── repository/            # JPA 数据访问
│   │   │   └── RuleRepository.java
│   │   └── model/                 # 数据模型
│   │       ├── Rule.java
│   │       └── CustomField.java
│   ├── src/main/resources/application.yml
│   └── pom.xml
│
├── sql/
│   └── init.sql                   # 数据库初始化脚本
├── .gitignore
└── README.md
```

## 技术栈

### 前端
| 技术 | 版本 | 用途 |
|------|------|------|
| React | 19 | UI 框架 |
| Vite | 8 | 构建工具 |
| AntV X6 | 3 | 流程图画布 |
| antd | 6 | UI 组件库 |
| Zustand | 5 | 状态管理 |
| Lucide React | — | 图标库 |

### 后端
| 技术 | 版本 | 用途 |
|------|------|------|
| Spring Boot | 3.2.5 | Web 框架 |
| Java | 17 | 运行环境 |
| Maven | — | 构建工具 |
| MySQL | 8.0+ | 数据库 |
| QLExpress | 4.x | 规则表达式引擎 |
| HikariCP | — | 数据库连接池 |
| Spring Data JPA | — | 数据持久化 |

## 快速开始

### 前置要求

- **Node.js** 18+（推荐 20+）
- **Java** 17+
- **Maven** 3.8+
- **MySQL** 8.0+

### 初始化数据库

```sql
-- 创建数据库
CREATE DATABASE IF NOT EXISTS test DEFAULT CHARSET utf8mb4;

-- 执行初始化脚本
source sql/init.sql;
```

或直接启动后端（`ddl-auto: update` 会自动建表）。

### 启动前端

```bash
cd frontend
npm install
npm run dev
```

前端默认运行在 `http://localhost:3000`，API 代理到 `http://localhost:8080`。

### 启动后端

```bash
cd backend
set JAVA_HOME=E:\env_\jdk21
mvn clean package -DskipTests
java -jar target\ql-express-backend-1.0.0.jar
```

后端默认运行在 `http://localhost:8080`。

## 功能说明

### 页面导航

系统采用三 Tab 页面布局：

| Tab | 功能 |
|-----|------|
| 规则列表 | 查看所有规则（名称/版本/创建人/状态/时间），支持编辑和删除 |
| 创建规则 | 拖拽画布搭建规则流程，提交保存到后端 |
| 规则测试 | 选择规则 → 自动解析参数字段 → 填写测试数据 → 执行并查看结果 |

### 画布组件

| 组件 | 图标 | 说明 |
|------|------|------|
| 开始 | ⊙ | 流程起点，自动固定在画布顶部 |
| 交易条件分流 | ◇ | 按条件分支，Y=成立 / N=不成立 |
| 多倍积分计算 | Calc | 配置金额字段和积分比率 |
| 无积分拦截 | ⊘ | 条件拦截，Y=放行 / N=拦截 |
| 失败响应 | ↵ | 条件不成立时的返回值 |
| 输出最终积分 | ● | 流程终点 |

### 交互操作

- **拖拽组件**：从左侧面板拖拽到画布
- **连线**：从节点端口圆圈拖出到目标节点
- **选择/删除**：点击选中，Delete 删除（Y/N 成对删除）
- **平移**：拖拽空白区域
- **缩放**：滚轮缩放
- **自动排版**：工具栏"排版"按钮一键整理布局
- **编辑名称**：右侧面板可修改节点标题
- **模拟试算**：工具栏"模拟试算"输入参数并执行规则
- **搜索定位**：工具栏搜索框模糊搜索条件节点并居中聚焦
- **导入/导出**：工具栏"导出"下载 JSON / "导入"加载他人 JSON
- **保存/提交**："提交"将画布内容 + QL 表达式保存到后端数据库

### 条件配置

支持多条件组组合：

- **组内关系**：AND（全部满足）/ OR（任一满足）
- **组间关系**：AND / OR
- **字段类型**：数字、小数、文本、布尔、枚举、日期、时间
- **运算符**：自动根据字段类型过滤（如数字有 ≥ / ≤ / between，字符串有 contains / startsWith 等）
- **区间**：数字/日期/时间支持"在区间内"（值1 ~ 值2）

## API 接口

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/rules` | 创建规则 |
| PUT | `/api/rules/{id}` | 更新规则 |
| GET | `/api/rules` | 获取规则列表 |
| GET | `/api/rules/{id}` | 获取规则详情 |
| DELETE | `/api/rules/{id}` | 删除规则 |
| POST | `/api/rules/generate-ql` | 从画布 JSON 生成 QL 表达式 |
| POST | `/api/rules/test` | 测试规则执行（传入 ruleId + params） |
| POST | `/api/fields` | 添加自定义字段 |
| PUT | `/api/fields/{id}` | 更新自定义字段 |
| GET | `/api/fields` | 获取自定义字段列表 |
| DELETE | `/api/fields/{id}` | 删除自定义字段 |

## QL 表达式示例

```
// === 开始：交易积分核算 ===
// ◆ 条件分流：金额门槛判断
if (tradeAmt >= 1000) {
  // ★ 积分计算：多倍积分计算
  point = tradeAmt * 1;
  // ● 输出最终积分
  point;
} else {
  // ↵ 失败响应：未达标
  "F001";
}
```

## 数据库

使用 MySQL 8.0+，数据库名 `test`，核心表：

| 表名 | 说明 |
|------|------|
| `ql_rule` | 规则表（名称/画布JSON/QL表达式/版本/创建人/状态/时间戳） |

JPA 配置 `ddl-auto: update` 可自动建表，或手动执行 `sql/init.sql`。

## 许可证

MIT
