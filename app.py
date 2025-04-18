from flask import Flask, request, jsonify, render_template, send_file
from flask_cors import CORS
import os
import tempfile
import io
import base64
import requests
import json
from Bio.PDB import PDBParser, PDBList
from Bio.SeqUtils import seq1
from Bio.Seq import Seq
import warnings
from Bio import BiopythonWarning
import numpy as np
from PIL import Image, ImageDraw

# 忽略Biopython的警告
warnings.simplefilter('ignore', BiopythonWarning)

app = Flask(__name__, static_folder='static', template_folder='templates')
CORS(app)  # 允许跨域请求

# 密码子表 - DNA到氨基酸的映射
codon_table = {
    'TTT': 'F', 'TTC': 'F', 'TTA': 'L', 'TTG': 'L',
    'CTT': 'L', 'CTC': 'L', 'CTA': 'L', 'CTG': 'L',
    'ATT': 'I', 'ATC': 'I', 'ATA': 'I', 'ATG': 'M',
    'GTT': 'V', 'GTC': 'V', 'GTA': 'V', 'GTG': 'V',
    'TCT': 'S', 'TCC': 'S', 'TCA': 'S', 'TCG': 'S',
    'CCT': 'P', 'CCC': 'P', 'CCA': 'P', 'CCG': 'P',
    'ACT': 'T', 'ACC': 'T', 'ACA': 'T', 'ACG': 'T',
    'GCT': 'A', 'GCC': 'A', 'GCA': 'A', 'GCG': 'A',
    'TAT': 'Y', 'TAC': 'Y', 'TAA': '*', 'TAG': '*',
    'CAT': 'H', 'CAC': 'H', 'CAA': 'Q', 'CAG': 'Q',
    'AAT': 'N', 'AAC': 'N', 'AAA': 'K', 'AAG': 'K',
    'GAT': 'D', 'GAC': 'D', 'GAA': 'E', 'GAG': 'E',
    'TGT': 'C', 'TGC': 'C', 'TGA': '*', 'TGG': 'W',
    'CGT': 'R', 'CGC': 'R', 'CGA': 'R', 'CGG': 'R',
    'AGT': 'S', 'AGC': 'S', 'AGA': 'R', 'AGG': 'R',
    'GGT': 'G', 'GGC': 'G', 'GGA': 'G', 'GGG': 'G'
}

# 从NCBI获取DNA序列
def fetch_sequence_from_ncbi(query):
    try:
        # 搜索序列ID
        search_url = f"https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=nucleotide&term={query}&retmode=json"
        search_response = requests.get(search_url)
        search_data = search_response.json()
        
        if not search_data.get('esearchresult', {}).get('idlist'):
            return {"success": False, "message": "未找到匹配的序列"}
        
        sequence_id = search_data['esearchresult']['idlist'][0]
        
        # 获取序列
        fetch_url = f"https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=nucleotide&id={sequence_id}&rettype=fasta&retmode=text"
        fetch_response = requests.get(fetch_url)
        
        if fetch_response.status_code != 200:
            return {"success": False, "message": f"获取序列失败: {fetch_response.status_code}"}
        
        # 解析FASTA
        fasta_content = fetch_response.text
        lines = fasta_content.strip().split('\n')
        sequence = ''.join(lines[1:])
        
        return {"success": True, "sequence": sequence}
    except Exception as e:
        return {"success": False, "message": f"查询错误: {str(e)}"}

# 使用Biopython翻译DNA到氨基酸
def translate_dna_to_protein_biopython(dna_sequence):
    try:
        # 创建Seq对象并翻译
        dna_seq = Seq(dna_sequence)
        protein_seq = str(dna_seq.translate())
        return protein_seq
    except Exception as e:
        print(f"Biopython翻译错误: {e}")
        # 回退到自定义翻译方法
        return translate_dna_to_protein_manual(dna_sequence)

# 手动翻译DNA到氨基酸
def translate_dna_to_protein_manual(dna_sequence):
    protein = ""
    # 确保序列长度是3的倍数
    dna_sequence = dna_sequence.upper()
    adjusted_dna = dna_sequence[:len(dna_sequence) - (len(dna_sequence) % 3)]
    
    for i in range(0, len(adjusted_dna), 3):
        codon = adjusted_dna[i:i+3]
        if codon in codon_table:
            protein += codon_table[codon]
        else:
            protein += 'X'  # 未知氨基酸
    
    return protein

# 为不同氨基酸定义颜色
amino_acid_colors = {
    'A': (240, 230, 230),  # 丙氨酸
    'R': (20, 90, 255),    # 精氨酸
    'N': (0, 220, 220),    # 天冬酰胺
    'D': (230, 10, 10),    # 天冬氨酸
    'C': (230, 230, 0),    # 半胱氨酸
    'Q': (0, 220, 220),    # 谷氨酰胺
    'E': (230, 10, 10),    # 谷氨酸
    'G': (235, 235, 235),  # 甘氨酸
    'H': (130, 130, 210),  # 组氨酸
    'I': (15, 130, 15),    # 异亮氨酸
    'L': (15, 130, 15),    # 亮氨酸
    'K': (20, 90, 255),    # 赖氨酸
    'M': (230, 230, 0),    # 甲硫氨酸
    'F': (50, 50, 170),    # 苯丙氨酸
    'P': (220, 150, 130),  # 脯氨酸
    'S': (250, 150, 0),    # 丝氨酸
    'T': (250, 150, 0),    # 苏氨酸
    'W': (180, 90, 180),   # 色氨酸
    'Y': (50, 50, 170),    # 酪氨酸
    'V': (15, 130, 15),    # 缬氨酸
    '*': (250, 250, 250),  # 终止密码子
    'X': (190, 190, 190)   # 未知氨基酸
}

# 创建简单的蛋白质结构可视化
def create_protein_visualization(amino_sequence, view_type="cartoon"):
    try:
        # 设置图像大小
        width, height = 800, 600
        img = Image.new('RGB', (width, height), (255, 255, 255))
        draw = ImageDraw.Draw(img)
        
        # 根据视图类型选择不同的绘制方法
        if view_type == "ribbon" or view_type == "cartoon":
            draw_protein_ribbon(draw, amino_sequence, width, height)
        elif view_type == "stick":
            draw_protein_sticks(draw, amino_sequence, width, height)
        elif view_type == "sphere":
            draw_protein_spheres(draw, amino_sequence, width, height)
        
        # 添加标题
        draw.text((width//2 - 100, 20), f"蛋白质结构可视化 - {view_type}模式", fill=(0, 0, 0))
        
        # 保存为临时文件
        temp_file = tempfile.NamedTemporaryFile(suffix='.png', delete=False)
        img.save(temp_file.name)
        
        # 读取图像文件为base64
        with open(temp_file.name, "rb") as image_file:
            encoded_string = base64.b64encode(image_file.read()).decode('utf-8')
        
        # 删除临时文件
        os.unlink(temp_file.name)
        
        # 根据序列长度选择PDB ID
        pdb_id = select_pdb_id(amino_sequence)
        
        return {"success": True, "image": encoded_string, "pdb_id": pdb_id}
    except Exception as e:
        print(f"可视化错误: {str(e)}")
        return {"success": False, "message": f"创建蛋白质结构可视化失败: {str(e)}"}

# 根据序列长度选择PDB ID
def select_pdb_id(sequence):
    if len(sequence) < 50:
        return "1CRN"  # 小型蛋白质
    elif len(sequence) < 100:
        return "1PGB"  # 蛋白G
    elif len(sequence) < 200:
        return "1HHO"  # 血红蛋白
    else:
        return "4HHB"  # 血红蛋白四聚体

# 绘制蛋白质带状图
def draw_protein_ribbon(draw, sequence, width, height):
    # 计算参数
    seq_length = len(sequence)
    center_x, center_y = width // 2, height // 2
    radius = min(width, height) // 3
    
    # 创建螺旋结构
    points = []
    turns = seq_length / 10  # 每10个氨基酸一个螺旋周期
    
    for i in range(seq_length):
        angle = (i / seq_length) * 2 * np.pi * turns
        x = center_x + radius * np.cos(angle)
        y = center_y + radius * np.sin(angle)
        z = (i / seq_length) * height / 2 - height / 4  # 垂直螺旋
        points.append((x, y, z, sequence[i]))
    
    # 按深度排序点
    points.sort(key=lambda p: p[2])
    
    # 绘制螺旋带
    prev_point = None
    for point in points:
        x, y, z, aa = point
        # 获取氨基酸颜色
        color = amino_acid_colors.get(aa, (150, 150, 150))
        
        # 点的大小由深度决定
        size = int(5 + (z + height/4) / (height/2) * 10)
        
        # 绘制点
        draw.ellipse((x-size, y-size, x+size, y+size), fill=color)
        
        # 连接前一个点
        if prev_point:
            prev_x, prev_y, prev_z, prev_aa = prev_point
            draw.line((prev_x, prev_y, x, y), fill=color, width=2)
        
        prev_point = point
    
    # 添加图例
    legend_x, legend_y = 50, 50
    for i, aa in enumerate(set(sequence)):
        if i > 10:  # 限制图例数量
            break
        color = amino_acid_colors.get(aa, (150, 150, 150))
        draw.rectangle((legend_x, legend_y + i*20, legend_x+15, legend_y+15 + i*20), fill=color)
        draw.text((legend_x+20, legend_y + i*20), aa, fill=(0, 0, 0))

# 绘制蛋白质棍状模型
def draw_protein_sticks(draw, sequence, width, height):
    # 计算参数
    seq_length = len(sequence)
    start_x, start_y = width // 4, height // 2
    
    # 每个氨基酸的间距
    spacing = (width // 2) / seq_length
    
    # 绘制骨架
    for i in range(seq_length):
        x = start_x + i * spacing
        y = start_y + np.sin(i * 0.3) * height / 10  # 添加波动
        
        # 获取氨基酸颜色
        aa = sequence[i]
        color = amino_acid_colors.get(aa, (150, 150, 150))
        
        # 绘制氨基酸
        draw.line((x, y, x, y-20), fill=color, width=3)  # 垂直线
        
        # 连接到下一个氨基酸
        if i < seq_length - 1:
            next_x = start_x + (i+1) * spacing
            next_y = start_y + np.sin((i+1) * 0.3) * height / 10
            draw.line((x, y, next_x, next_y), fill=(100, 100, 100), width=2)  # 骨架
    
    # 添加图例
    legend_x, legend_y = 50, 50
    for i, aa in enumerate(set(sequence)):
        if i > 10:  # 限制图例数量
            break
        color = amino_acid_colors.get(aa, (150, 150, 150))
        draw.rectangle((legend_x, legend_y + i*20, legend_x+15, legend_y+15 + i*20), fill=color)
        draw.text((legend_x+20, legend_y + i*20), aa, fill=(0, 0, 0))

# 绘制蛋白质球状模型
def draw_protein_spheres(draw, sequence, width, height):
    # 计算参数
    seq_length = len(sequence)
    center_x, center_y = width // 2, height // 2
    radius = min(width, height) // 3
    
    # 创建3D空间中的点
    points = []
    for i in range(seq_length):
        # 创建基于黄金比螺旋的点分布
        phi = np.arccos(1 - 2 * (i + 0.5) / seq_length)
        theta = np.pi * (1 + 5**0.5) * (i + 0.5)
        
        x = center_x + radius * np.sin(phi) * np.cos(theta)
        y = center_y + radius * np.sin(phi) * np.sin(theta)
        z = radius * np.cos(phi)
        points.append((x, y, z, sequence[i]))
    
    # 按深度排序点
    points.sort(key=lambda p: p[2], reverse=True)
    
    # 绘制球体
    for point in points:
        x, y, z, aa = point
        # 获取氨基酸颜色
        color = amino_acid_colors.get(aa, (150, 150, 150))
        
        # 点的大小与深度相关
        size = int(5 + (z / radius) * 15)
        
        # 绘制点
        draw.ellipse((x-size, y-size, x+size, y+size), fill=color, outline=(50, 50, 50))
    
    # 添加图例
    legend_x, legend_y = 50, 50
    for i, aa in enumerate(set(sequence)):
        if i > 10:  # 限制图例数量
            break
        color = amino_acid_colors.get(aa, (150, 150, 150))
        draw.rectangle((legend_x, legend_y + i*20, legend_x+15, legend_y+15 + i*20), fill=color)
        draw.text((legend_x+20, legend_y + i*20), aa, fill=(0, 0, 0))

# API 路由
@app.route('/api/search', methods=['POST'])
def search_sequence():
    data = request.json
    query = data.get('query')
    
    if not query:
        return jsonify({"success": False, "message": "查询参数不能为空"})
    
    result = fetch_sequence_from_ncbi(query)
    return jsonify(result)

@app.route('/api/translate', methods=['POST'])
def translate_sequence():
    data = request.json
    dna_sequence = data.get('sequence', '')
    
    if not dna_sequence:
        return jsonify({"success": False, "message": "DNA序列不能为空"})
    
    # 清理DNA序列，移除非ATGC字符（如括号、空格等）
    cleaned_dna = ''.join(c for c in dna_sequence.upper() if c in 'ATGC')
    
    if not cleaned_dna:
        return jsonify({"success": False, "message": "无效的DNA序列，清理后没有有效的碱基"})
    
    # 检查清理后的序列是否包含非法字符（这一步实际上不需要了，因为我们已经过滤了）
    if not all(n in 'ATGC' for n in cleaned_dna):
        return jsonify({"success": False, "message": "无效的DNA序列，请确保只包含A、T、G、C字母"})
    
    protein_sequence = translate_dna_to_protein_biopython(cleaned_dna)
    return jsonify({"success": True, "protein": protein_sequence})

@app.route('/api/pdb_structure', methods=['POST'])
def get_pdb_structure():
    try:
        data = request.json
        amino_sequence = data.get('sequence', '')
        
        if not amino_sequence:
            return jsonify({"success": False, "message": "氨基酸序列不能为空"})
        
        # 根据序列长度选择合适的PDB ID
        pdb_id = select_pdb_id(amino_sequence)
        
        # 直接从RCSB PDB数据库通过HTTP请求获取PDB文件，而不保存到本地
        pdb_url = f"https://files.rcsb.org/download/{pdb_id}.pdb"
        print(f"正在从{pdb_url}获取PDB数据...")
        
        response = requests.get(pdb_url)
        if response.status_code != 200:
            # 如果获取失败，尝试备用PDB ID
            backup_pdb_ids = {
                "1CRN": "1CRN", # 小型蛋白质
                "1PGB": "1PGB", # 蛋白G
                "1HHO": "3HHB", # 血红蛋白
                "4HHB": "1HHB"  # 血红蛋白四聚体
            }
            
            backup_id = backup_pdb_ids.get(pdb_id)
            if backup_id and backup_id != pdb_id:
                print(f"尝试备用PDB ID: {backup_id}")
                pdb_url = f"https://files.rcsb.org/download/{backup_id}.pdb"
                response = requests.get(pdb_url)
                if response.status_code == 200:
                    pdb_id = backup_id
            
            # 如果仍然失败，使用默认PDB
            if response.status_code != 200:
                print(f"无法获取PDB ID {pdb_id}，使用默认结构1AK4")
                pdb_url = "https://files.rcsb.org/download/1AK4.pdb"
                response = requests.get(pdb_url)
                pdb_id = "1AK4"  # 通用的小蛋白质结构
        
        if response.status_code != 200:
            return jsonify({"success": False, "message": f"无法从PDB数据库获取结构 ({pdb_url}): {response.status_code}"})
        
        # 获取PDB文本数据
        pdb_data = response.text
        
        return jsonify({
            "success": True, 
            "pdb_id": pdb_id,
            "pdb_data": pdb_data
        })
    except Exception as e:
        print(f"获取PDB结构错误: {str(e)}")
        return jsonify({"success": False, "message": f"获取蛋白质结构数据失败: {str(e)}"})

@app.route('/api/visualize', methods=['POST'])
def visualize_structure():
    data = request.json
    amino_sequence = data.get('sequence', '')
    view_type = data.get('view_type', 'cartoon')  # 默认为cartoon视图
    
    if not amino_sequence:
        return jsonify({"success": False, "message": "氨基酸序列不能为空"})
    
    # 使用简单可视化代替PyMOL
    result = create_protein_visualization(amino_sequence, view_type)
    return jsonify(result)

# 主页
@app.route('/')
def index():
    return render_template('index.html')

# 示例序列API
@app.route('/api/examples', methods=['GET'])
def get_example_sequences():
    examples = {
        "beta_globin": {
            "name": "人类β-珠蛋白",
            "sequence": "ATGGTGCACCTGACTCCTGAGGAGAAGTCTGCCGTTACTGCCCTGTGGGGCAAGGTGAACGTGGATGAAGTTGGTGGTGAGGCCCTGGGCAGGCTGCTGGTGGTCTACCCTTGGACCCAGAGGTTCTTTGAGTCCTTTGGGGATCTGTCCACTCCTGATGCTGTTATGGGCAACCCTAAGGTGAAGGCTCATGGCAAGAAAGTGCTCGGTGCCTTTAGTGATGGCCTGGCTCACCTGGACAACCTCAAGGGCACCTTTGCCACACTGAGTGAGCTGCACTGTGACAAGCTGCACGTGGATCCTGAGAACTTCAGGCTCCTGGGCAACGTGCTGGTCTGTGTGCTGGCCCATCACTTTGGCAAAGAATTCACCCCACCAGTGCAGGCTGCCTATCAGAAAGTGGTGGCTGGTGTGGCTAATGCCCTGGCCCACAAGTATCACTAA"
        },
        "alpha_globin": {
            "name": "人类α-珠蛋白",
            "sequence": "ATGGTGCTGTCTCCTGCCGACAAGACCAACGTCAAGGCCGCCTGGGGTAAGGTCGGCGCGCACGCTGGCGAGTATGGTGCGGAGGCCCTGGAGAGGATGTTCCTGTCCTTCCCCACCACCAAGACCTACTTCCCGCACTTCGACCTGAGCCACGGCTCTGCCCAGGTTAAGGGCCACGGCAAGAAGGTGGCCGACGCGCTGACCAACGCCGTGGCGCACGTGGACGACATGCCCAACGCGCTGTCCGCCCTGAGCGACCTGCACGCGCACAAGCTTCGGGTGGACCCGGTCAACTTCAAGCTCCTAAGCCACTGCCTGCTGGTGACCCTGGCCGCCCACCTCCCCGCCGAGTTCACCCCTGCGGTGCACGCCTCCCTGGACAAGTTCCTGGCTTCTGTGAGCACCGTGCTGACCTCCAAATACCGTTAA"
        },
        "insulin": {
            "name": "人类胰岛素",
            "sequence": "ATGGCCCTGTGGATGCGCCTCCTGCCCCTGCTGGCGCTGCTGGCCCTCTGGGGACCTGACCCAGCCGCAGCCTTTGTGAACCAACACCTGTGCGGCTCACACCTGGTGGAAGCTCTCTACCTAGTGTGCGGGGAACGAGGCTTCTTCTACACACCCAAGACCCGCCGGGAGGCAGAGGACCTGCAGGTGGGGCAGGTGGAGCTGGGCGGGGGCCCTGGTGCAGGCAGCCTGCAGCCCTTGGCCCTGGAGGGGTCCCTGCAGAAGCGTGGCATTGTGGAACAATGCTGTACCAGCATCTGCTCCCTCTACCAGCTGGAGAACTACTGCAACTAGACGCAGCCCGCAGGCAGCCCCACACCCGCCGCCTCCTGCACCGAGAGAGATGGAATAAAGCCCTTGAACCAGC"
        }
    }
    return jsonify(examples)

if __name__ == '__main__':
    # 开发环境使用该配置
    app.run(debug=True, host='0.0.0.0', port=5000)
    # 生产环境会使用gunicorn，不会执行这行 