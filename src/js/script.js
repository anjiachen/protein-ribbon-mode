// 页面加载完成后执行
document.addEventListener('DOMContentLoaded', function() {
    // 获取DOM元素
    const sequenceTypeSelect = document.getElementById('sequence-type');
    const manualInputDiv = document.getElementById('manual-input');
    const queryInputDiv = document.getElementById('query-input');
    const translateBtn = document.getElementById('translate-btn');
    const searchBtn = document.getElementById('search-btn');
    const visualizeBtn = document.getElementById('visualize-btn');
    const dnaSequenceTextarea = document.getElementById('dna-sequence');
    const aminoSequenceTextarea = document.getElementById('amino-sequence');
    const viewerContainer = document.getElementById('viewer-container');
    
    // 可视化控制按钮
    const ribbonViewBtn = document.getElementById('ribbon-view');
    const stickViewBtn = document.getElementById('stick-view');
    const sphereViewBtn = document.getElementById('sphere-view');
    const cartoonViewBtn = document.getElementById('cartoon-view');
    
    // 3Dmol查看器实例
    let viewer = null;
    let currentModel = null;
    
    // 输入方式切换
    sequenceTypeSelect.addEventListener('change', function() {
        if (this.value === 'manual') {
            manualInputDiv.style.display = 'block';
            queryInputDiv.style.display = 'none';
        } else {
            manualInputDiv.style.display = 'none';
            queryInputDiv.style.display = 'block';
        }
    });
    
    // 从NCBI查询序列
    searchBtn.addEventListener('click', function() {
        const sequenceName = document.getElementById('sequence-name').value.trim();
        if (!sequenceName) {
            alert('请输入蛋白质或基因名称');
            return;
        }
        
        // 显示加载状态
        searchBtn.textContent = '查询中...';
        searchBtn.disabled = true;
        
        // 由于CORS限制，实际应用中应使用后端代理请求NCBI API
        // 为了演示，这里使用样本数据替代真实API调用
        getExampleDNASequence(sequenceName)
            .then(sequence => {
                dnaSequenceTextarea.value = sequence;
                manualInputDiv.style.display = 'block'; // 显示DNA序列框
                // 恢复按钮状态
                searchBtn.textContent = '获取样本序列';
                searchBtn.disabled = false;
            })
            .catch(error => {
                console.error('查询错误详情:', error);
                alert('查询失败: ' + (error.message || '网络连接问题，请稍后再试'));
                // 恢复按钮状态
                searchBtn.textContent = '获取样本序列';
                searchBtn.disabled = false;
            });
    });
    
    // 获取示例DNA序列（实际应用中应使用后端API）
    async function getExampleDNASequence(query) {
        // 正常情况下应调用后端API，由后端处理NCBI请求
        // 这里根据输入提供样例序列用于演示
        
        // 模拟网络延迟
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // 根据不同查询返回不同样例序列
        if (query.toLowerCase().includes('珠蛋白') || 
            query.toLowerCase().includes('globin') || 
            query.toLowerCase().includes('β') ||
            query.toLowerCase().includes('beta')) {
            // 人类β-珠蛋白基因部分序列（示例）
            return 'ATGGTGCACCTGACTCCTGAGGAGAAGTCTGCCGTTACTGCCCTGTGGGGCAAGGTGAACGTGGATGAAGTTGGTGGTGAGGCCCTGGGCAGGCTGCTGGTGGTCTACCCTTGGACCCAGAGGTTCTTTGAGTCCTTTGGGGATCTGTCCACTCCTGATGCTGTTATGGGCAACCCTAAGGTGAAGGCTCATGGCAAGAAAGTGCTCGGTGCCTTTAGTGATGGCCTGGCTCACCTGGACAACCTCAAGGGCACCTTTGCCACACTGAGTGAGCTGCACTGTGACAAGCTGCACGTGGATCCTGAGAACTTCAGGCTCCTGGGCAACGTGCTGGTCTGTGTGCTGGCCCATCACTTTGGCAAAGAATTCACCCCACCAGTGCAGGCTGCCTATCAGAAAGTGGTGGCTGGTGTGGCTAATGCCCTGGCCCACAAGTATCACTAA';
        } else if (query.toLowerCase().includes('α') || 
                  query.toLowerCase().includes('alpha')) {
            // 人类α-珠蛋白基因部分序列（示例）
            return 'ATGGTGCTGTCTCCTGCCGACAAGACCAACGTCAAGGCCGCCTGGGGTAAGGTCGGCGCGCACGCTGGCGAGTATGGTGCGGAGGCCCTGGAGAGGATGTTCCTGTCCTTCCCCACCACCAAGACCTACTTCCCGCACTTCGACCTGAGCCACGGCTCTGCCCAGGTTAAGGGCCACGGCAAGAAGGTGGCCGACGCGCTGACCAACGCCGTGGCGCACGTGGACGACATGCCCAACGCGCTGTCCGCCCTGAGCGACCTGCACGCGCACAAGCTTCGGGTGGACCCGGTCAACTTCAAGCTCCTAAGCCACTGCCTGCTGGTGACCCTGGCCGCCCACCTCCCCGCCGAGTTCACCCCTGCGGTGCACGCCTCCCTGGACAAGTTCCTGGCTTCTGTGAGCACCGTGCTGACCTCCAAATACCGTTAA';
        } else if (query.toLowerCase().includes('insulin') || 
                  query.toLowerCase().includes('胰岛素')) {
            // 人类胰岛素基因部分序列（示例）
            return 'ATGGCCCTGTGGATGCGCCTCCTGCCCCTGCTGGCGCTGCTGGCCCTCTGGGGACCTGACCCAGCCGCAGCCTTTGTGAACCAACACCTGTGCGGCTCACACCTGGTGGAAGCTCTCTACCTAGTGTGCGGGGAACGAGGCTTCTTCTACACACCCAAGACCCGCCGGGAGGCAGAGGACCTGCAGGTGGGGCAGGTGGAGCTGGGCGGGGGCCCTGGTGCAGGCAGCCTGCAGCCCTTGGCCCTGGAGGGGTCCCTGCAGAAGCGTGGCATTGTGGAACAATGCTGTACCAGCATCTGCTCCCTCTACCAGCTGGAGAACTACTGCAACTAGACGCAGCCCGCAGGCAGCCCCACACCCGCCGCCTCCTGCACCGAGAGAGATGGAATAAAGCCCTTGAACCAGC';
        } else {
            // 默认返回一个简单的示例序列
            return 'ATGAAACCTGCGGCATTCGTGGCGAGCGGTTGCGTTGTGCTGCTGACGGCAGGCAGATCACTGACTTCGCATCCATCGACGCTGAAGGTAAAACCACCGGCAACTGGGCCAAGCGTTGGTTTGAGCATATCCGTCAGCTGACTAACCTGGCGCAGATCGGCGATCTGGGCTTCCCGAACCTGCCGGAGCTGGAGATGCTGAAACAATACTTCGGCAAAGAGCCAGTCACTGTTGAGAAACTGGGCCTGAACATCCTGGTCGAACTGATGCAGCAGTTCCACGCTATGGCGGCGATTACCGTTAACTGA';
        }
    }
    
    // 从NCBI获取序列的函数（需要后端代理实现）
    async function fetchSequenceFromNCBI(query) {
        try {
            // 注意：这个函数在实际应用中需要通过后端代理服务器实现
            // 直接从前端调用NCBI API会遇到CORS限制
            
            // 首先搜索找到ID
            const searchUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=nucleotide&term=${encodeURIComponent(query)}&retmode=json`;
            const searchResponse = await fetch(searchUrl);
            if (!searchResponse.ok) {
                throw new Error(`搜索请求失败: ${searchResponse.status} ${searchResponse.statusText}`);
            }
            
            const searchData = await searchResponse.json();
            
            if (!searchData.esearchresult.idlist || searchData.esearchresult.idlist.length === 0) {
                throw new Error('未找到匹配的序列');
            }
            
            // 获取第一个结果的ID
            const id = searchData.esearchresult.idlist[0];
            
            // 使用ID获取序列
            const fetchUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=nucleotide&id=${id}&rettype=fasta&retmode=text`;
            const fetchResponse = await fetch(fetchUrl);
            if (!fetchResponse.ok) {
                throw new Error(`获取序列请求失败: ${fetchResponse.status} ${fetchResponse.statusText}`);
            }
            
            const fastaData = await fetchResponse.text();
            
            // 解析FASTA格式
            return parseFasta(fastaData);
        } catch (error) {
            console.error('NCBI API调用错误:', error);
            throw new Error('无法从NCBI获取数据，请稍后再试或尝试其他关键词');
        }
    }
    
    // 解析FASTA格式
    function parseFasta(fastaData) {
        const lines = fastaData.split('\n');
        let sequence = '';
        
        // 跳过第一行（头信息）
        for (let i = 1; i < lines.length; i++) {
            sequence += lines[i].trim();
        }
        
        return sequence;
    }
    
    // 转换DNA为蛋白质序列
    translateBtn.addEventListener('click', function() {
        const dnaSequence = dnaSequenceTextarea.value.trim().toUpperCase();
        
        if (!dnaSequence) {
            alert('请输入DNA序列');
            return;
        }
        
        if (!isValidDNASequence(dnaSequence)) {
            alert('无效的DNA序列，请确保只包含A、T、G、C字母');
            return;
        }
        
        const aminoSequence = translateDNAToProtein(dnaSequence);
        aminoSequenceTextarea.value = aminoSequence;
    });
    
    // 验证DNA序列的有效性
    function isValidDNASequence(sequence) {
        return /^[ATGC]+$/.test(sequence);
    }
    
    // DNA转氨基酸
    function translateDNAToProtein(dna) {
        const codonTable = {
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
        };
        
        let protein = '';
        
        // 确保序列长度是3的倍数
        const adjustedDNA = dna.length % 3 === 0 ? dna : dna.slice(0, dna.length - (dna.length % 3));
        
        for (let i = 0; i < adjustedDNA.length; i += 3) {
            const codon = adjustedDNA.substring(i, i + 3);
            if (codonTable[codon]) {
                protein += codonTable[codon];
            } else {
                protein += 'X'; // 未知氨基酸
            }
        }
        
        return protein;
    }
    
    // 可视化蛋白质结构
    visualizeBtn.addEventListener('click', function() {
        const aminoSequence = aminoSequenceTextarea.value.trim();
        
        if (!aminoSequence) {
            alert('请先生成氨基酸序列');
            return;
        }
        
        // 初始化3Dmol.js可视化
        initViewer(aminoSequence);
    });
    
    // 初始化3Dmol.js查看器
    function initViewer(sequence) {
        try {
            // 清除之前的查看器
            if (viewer) {
                // 重置容器
                viewerContainer.innerHTML = '';
            }
            
            // 创建新的3Dmol查看器
            viewer = $3Dmol.createViewer(viewerContainer, {
                backgroundAlpha: 0,
                antialias: true,
                cartoonQuality: 8
            });
            
            // 加载蛋白质结构
            loadProteinStructure(sequence);
            
            // 设置可视化控制按钮事件
            setVisualControls();
            
        } catch (error) {
            console.error('可视化初始化错误:', error);
            viewerContainer.innerHTML = `<div style="padding: 20px; text-align: center; color: red;">
                初始化可视化工具失败: ${error.message}</div>`;
        }
    }
    
    // 设置可视化控制按钮事件
    function setVisualControls() {
        // 骨架视图
        ribbonViewBtn.addEventListener('click', function() {
            if (!viewer || !currentModel) return;
            
            viewer.removeAllShapes();
            viewer.removeAllSurfaces();
            viewer.setStyle({}, {cartoon: {color: 'spectrum'}});
            viewer.render();
        });
        
        // 棍状视图
        stickViewBtn.addEventListener('click', function() {
            if (!viewer || !currentModel) return;
            
            viewer.removeAllShapes();
            viewer.removeAllSurfaces();
            viewer.setStyle({}, {stick: {colorscheme: 'yellowCarbon', radius: 0.15}});
            viewer.render();
        });
        
        // 球状视图
        sphereViewBtn.addEventListener('click', function() {
            if (!viewer || !currentModel) return;
            
            viewer.removeAllShapes();
            viewer.removeAllSurfaces();
            viewer.setStyle({}, {sphere: {colorscheme: 'greenCarbon', radius: 0.8}});
            viewer.render();
        });
        
        // 卡通视图
        cartoonViewBtn.addEventListener('click', function() {
            if (!viewer || !currentModel) return;
            
            viewer.removeAllShapes();
            viewer.removeAllSurfaces();
            viewer.setStyle({}, {cartoon: {style: 'trace', color: 'spectrum', thickness: 0.8}});
            viewer.render();
        });
    }
    
    // 加载蛋白质结构
    async function loadProteinStructure(sequence) {
        try {
            // 显示加载状态
            viewerContainer.innerHTML = '<div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); background: rgba(255,255,255,0.8); padding: 20px; border-radius: 8px;">加载蛋白质结构中...</div>';
            
            // 根据序列长度选择不同的PDB ID
            let pdbId;
            
            if (sequence.length < 50) {
                pdbId = '1CRN'; // 小型蛋白质
            } else if (sequence.includes('HVD') || sequence.includes('HDVP')) {
                pdbId = '1A3N'; // 特定氨基酸模式
            } else if (sequence.includes('*')) {
                pdbId = '1HHO'; // 血红蛋白
            } else {
                // 根据序列长度选择不同的结构
                if (sequence.length < 100) {
                    pdbId = '1PGB'; // 蛋白G
                } else if (sequence.length < 200) {
                    pdbId = '4HHB'; // 血红蛋白四聚体
                } else {
                    pdbId = '3PQR'; // 较大蛋白质
                }
            }
            
            // 从RCSB PDB获取结构
            const url = `https://files.rcsb.org/download/${pdbId}.pdb`;
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`无法获取PDB结构 (${pdbId}): ${response.status}`);
            }
            
            const pdbData = await response.text();
            
            // 重新创建查看器
            viewerContainer.innerHTML = '';
            viewer = $3Dmol.createViewer($(viewerContainer), {
                backgroundAlpha: 0,
                antialias: true
            });
            
            // 加载PDB数据
            currentModel = viewer.addModel(pdbData, "pdb");
            
            // 计算中心点并设置样式
            viewer.zoomTo();
            viewer.setStyle({}, {cartoon: {color: 'spectrum'}});
            
            // 添加水面
            viewer.addSurface($3Dmol.SurfaceType.VDW, {
                opacity: 0.2,
                color: 'white'
            });
            
            // 开始渲染
            viewer.render();
            
        } catch (error) {
            console.error('加载蛋白质结构错误:', error);
            viewerContainer.innerHTML = `<div style="padding: 20px; text-align: center; color: red;">
                加载蛋白质结构失败: ${error.message}<br>
                请刷新页面重试</div>`;
        }
    }
    
    // 设置本地PDB数据
    function getLocalPdbData(proteinType) {
        // 内置一些常见蛋白质的PDB数据（简化版本）
        // 这里只是示例，实际应用中应该有更完整的模型
        
        // 简单螺旋结构
        if (proteinType === 'helix') {
            return `
ATOM      1  N   ALA A   1      -5.606  -2.251 -12.878  1.00  0.00           N  
ATOM      2  CA  ALA A   1      -5.850  -1.194 -13.852  1.00  0.00           C  
ATOM      3  C   ALA A   1      -5.186  -1.524 -15.184  1.00  0.00           C  
ATOM      4  O   ALA A   1      -5.744  -1.260 -16.249  1.00  0.00           O  
ATOM      5  CB  ALA A   1      -5.339   0.137 -13.323  1.00  0.00           C  
ATOM      6  N   ALA A   2      -3.991  -2.102 -15.115  1.00  0.00           N  
ATOM      7  CA  ALA A   2      -3.261  -2.499 -16.313  1.00  0.00           C  
ATOM      8  C   ALA A   2      -3.961  -3.660 -17.011  1.00  0.00           C  
ATOM      9  O   ALA A   2      -3.940  -3.725 -18.240  1.00  0.00           O  
ATOM     10  CB  ALA A   2      -1.858  -2.894 -15.889  1.00  0.00           C  
ATOM     11  N   ALA A   3      -4.492  -4.585 -16.195  1.00  0.00           N  
ATOM     12  CA  ALA A   3      -5.234  -5.699 -16.757  1.00  0.00           C  
`;
        }
        
        // 简单的β折叠结构
        if (proteinType === 'sheet') {
            return `
ATOM      1  N   VAL A   1      -3.371  -4.911  -9.268  1.00  0.00           N  
ATOM      2  CA  VAL A   1      -2.130  -5.668  -9.023  1.00  0.00           C  
ATOM      3  C   VAL A   1      -0.971  -4.728  -8.705  1.00  0.00           C  
ATOM      4  O   VAL A   1      -0.036  -5.108  -8.006  1.00  0.00           O  
ATOM      5  CB  VAL A   1      -2.330  -6.674  -7.883  1.00  0.00           C  
ATOM      6  CG1 VAL A   1      -3.346  -7.734  -8.253  1.00  0.00           C  
ATOM      7  CG2 VAL A   1      -2.743  -5.975  -6.596  1.00  0.00           C  
ATOM      8  N   ILE A   2      -1.041  -3.510  -9.211  1.00  0.00           N  
ATOM      9  CA  ILE A   2       0.030  -2.553  -9.033  1.00  0.00           C  
ATOM     10  C   ILE A   2       0.111  -1.656 -10.259  1.00  0.00           C  
ATOM     11  O   ILE A   2      -0.657  -1.748 -11.203  1.00  0.00           O  
ATOM     12  CB  ILE A   2      -0.234  -1.709  -7.778  1.00  0.00           C  
ATOM     13  CG1 ILE A   2      -1.617  -1.074  -7.850  1.00  0.00           C  
ATOM     14  CG2 ILE A   2      -0.119  -2.552  -6.519  1.00  0.00           C  
ATOM     15  CD1 ILE A   2      -1.854   0.041  -6.845  1.00  0.00           C  
ATOM     16  N   VAL A   3       1.113  -0.786 -10.220  1.00  0.00           N  
ATOM     17  CA  VAL A   3       1.320   0.151 -11.308  1.00  0.00           C  
`;
        }
        
        // 默认情况下返回null，表示需要从外部获取
        return null;
    }
}); 