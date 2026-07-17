# 积分规则引擎 (QLExpress 可视化配置平台)

基于 AntV X6 + React + SpringBoot 的信用卡积分规则可视化配置平台。通过拖拽方式搭建积分规则流程，自动生成 QLExpress 表达式。

## 项目结构

```
qlexpress/
├── frontend/          # 前端 (Vite + React + AntV X6)
│   ├── src/
│   │   ├── components/    # 组件（画布、配置面板、侧边栏等）
│   │   ├── config/        # 节点定义、运算符配置
│   │   ├── store/         # Zustand 状态管理
│   │   └── utils/         # QL 表达式生成器
│   ├── package.json
│   └── vite.config.js
│
├── backend/           # 后端 (SpringBoot 3.2 + Java 17)
│   ├── src/main/java/com/qlexpress/
│   │   ├── controller/    # REST API
│   │   ├── service/       # 业务逻辑 + QL 生成
│   │   └── model/         # 数据模型
│   ├── src/main/resources/application.yml
│   └── pom.xml
│
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

## 快速开始

### 前置要求

- **Node.js** 18+（推荐 20+）
- **Java** 17+
- **Maven** 3.8+

### 启动前端

```bash
cd frontend
npm install
npm run dev
```

前端默认运行在 `http://localhost:5173`

### 启动后端

```bash
cd backend
mvn install
mvn spring-boot:run
```

后端默认运行在 `http://localhost:8080`

> 前端也可以脱离后端独立运行（画布搭建、QL 预览等功能完全在浏览器中完成）。
> 后端用于保存规则、执行 QL 引擎等持久化操作。

## 功能说明

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
- **模拟试算**：工具栏"模拟试算"测试规则

### 条件配置

支持多条件组组合：

- **组内关系**：AND（全部满足）/ OR（任一满足）
- **组间关系**：AND / OR
- **字段类型**：数字、小数、文本、布尔、日期、时间
- **运算符**：自动根据字段类型过滤
- **区间**：数字/日期/时间支持"在区间内"（值1 ~ 值2）

## API 接口

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/rules` | 保存规则 |
| GET | `/api/rules` | 获取规则列表 |
| GET | `/api/rules/{id}` | 获取规则详情 |
| DELETE | `/api/rules/{id}` | 删除规则 |
| POST | `/api/fields` | 保存自定义字段 |
| GET | `/api/fields` | 获取自定义字段列表 |

## QL 表达式示例

```
// === 开始：交易积分核算 ===
// ◆ 条件分流：金额门槛判断
// ★ 积分计算：多倍积分计算
// ● 输出最终积分
// ↵ 失败响应：未达标
if(mcc == "1520"){ point = 0; } else {
  if(tradeAmt >= 1000){ point = tradeAmt * 1; point; } else { 0; }
}
```
<img width="1928" height="1030" alt="图片" src="https://github.com/user-attachments/assets/e2403e7e-c652-489c-a29d-87897149bbf2" />
<img width="909" height="514" alt="图片" src="https://github.com/user-attachments/assets/91067bf4-341b-45e1-b63a-2fe169b590c6" />

