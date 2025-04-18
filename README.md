# 蛋白质序列分析与可视化工具

这是一个基于Python (Flask) 的蛋白质序列分析和结构可视化工具，提供以下功能：

1. DNA序列输入：用户可以手动输入DNA序列、通过NCBI查询获取序列或使用示例序列。
2. DNA转氨基酸：使用Biopython将DNA序列转换为氨基酸序列。
3. 蛋白质结构可视化：使用PIL和Numpy生成蛋白质结构的2D可视化图像，支持多种显示模式。

## 技术架构

本项目采用前后端结合的架构：

### 后端
- **Flask**: 轻量级Web框架
- **Biopython**: 用于生物序列处理和分析
- **PIL (Pillow)**: 用于图像处理和创建蛋白质结构可视化
- **Numpy**: 用于数学计算和3D结构的2D投影
- **NCBI E-utilities API**: 用于获取生物序列数据

### 前端
- **HTML5/CSS3/JavaScript**: 构建用户界面
- **Bootstrap 5**: 响应式UI组件
- **Fetch API**: 处理异步请求

## 安装与配置

### 环境要求
- Python 3.7+
- Flask和其他Python依赖

### 安装步骤

1. 克隆或下载本仓库到本地
2. 安装Python依赖：
   ```bash
   pip install -r requirements.txt
   ```

## 使用方法

1. 运行Flask应用：
   ```bash
   python app.py
   ```

2. 打开浏览器访问：`http://localhost:5000`

3. 在界面上可以：
   - 选择输入方式（手动输入、NCBI查询或示例序列）
   - 输入DNA序列
   - 将DNA序列转换为氨基酸序列
   - 可视化蛋白质结构
   - 切换不同的结构视图（骨架、棍状、球状、卡通）

## 特色功能

- **多种视图模式**: 支持骨架(ribbon)、棍状(stick)、球状(sphere)和卡通(cartoon)等多种视图模式
- **NCBI集成**: 直接从NCBI数据库获取序列数据
- **示例序列**: 内置常见的蛋白质序列样本
- **自适应结构选择**: 根据序列长度自动选择合适的参考PDB ID

## 注意事项

- 本应用使用简化的2D可视化模型，适合教学和基础展示用途
- 对于需要精确结构的专业应用，建议使用PyMOL或其他专业工具
- 实际应用中，可考虑集成AlphaFold等结构预测服务生成特定结构

## 扩展与改进

- 添加序列比对功能
- 集成AlphaFold API进行结构预测
- 添加更多蛋白质分析工具
- 提供互动式3D可视化

## 参考资源

- [Biopython 文档](https://biopython.org/wiki/Documentation)
- [NCBI E-utilities API](https://www.ncbi.nlm.nih.gov/books/NBK25500/)
- [PDB (蛋白质数据库)](https://www.rcsb.org/) 