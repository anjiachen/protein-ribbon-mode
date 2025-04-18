// 等待DOM加载完成
document.addEventListener('DOMContentLoaded', function() {
    // 获取DOM元素
    const sequenceTypeSelect = document.getElementById('sequence-type');
    const manualInputDiv = document.getElementById('manual-input');
    const queryInputDiv = document.getElementById('query-input');
    const exampleInputDiv = document.getElementById('example-input');
    const exampleSelect = document.getElementById('example-select');
    const dnaSequenceTextarea = document.getElementById('dna-sequence');
    const aminoSequenceTextarea = document.getElementById('amino-sequence');
    const searchBtn = document.getElementById('search-btn');
    const translateBtn = document.getElementById('translate-btn');
    const visualizeBtn = document.getElementById('visualize-btn');
    const singleViewContainer = document.getElementById('single-view-container');
    const compareViewContainer = document.getElementById('compare-view-container');
    const visualizationControls = document.getElementById('visualization-controls');
    const pdbInfo = document.getElementById('pdb-info');
    const visPlaceholder = document.getElementById('visualization-placeholder');
    const moleculeViewer = document.getElementById('3dmol-viewer');
    const originalViewer = document.getElementById('original-viewer');
    const modifiedViewer = document.getElementById('modified-viewer');
    
    // 视图按钮
    const ribbonViewBtn = document.getElementById('ribbon-view');
    const stickViewBtn = document.getElementById('stick-view');
    const sphereViewBtn = document.getElementById('sphere-view');
    const cartoonViewBtn = document.getElementById('cartoon-view');
    
    // 为编辑功能创建HTML元素
    const editControls = document.createElement('div');
    editControls.id = 'edit-controls';
    editControls.className = 'mt-3';
    editControls.innerHTML = `
        <button id="edit-sequence-btn" class="btn btn-warning">修改氨基酸序列</button>
        <div id="edit-panel" class="mt-2" style="display: none;">
            <div class="form-text mb-2">
                修改氨基酸序列后点击"应用修改"以更新结构。
            </div>
            <div class="input-group">
                <button id="apply-edit-btn" class="btn btn-primary">应用修改</button>
                <button id="cancel-edit-btn" class="btn btn-secondary">取消</button>
            </div>
        </div>
    `;
    visualizationControls.appendChild(editControls);
    
    // 获取编辑控件
    const editSequenceBtn = document.getElementById('edit-sequence-btn');
    const editPanel = document.getElementById('edit-panel');
    const applyEditBtn = document.getElementById('apply-edit-btn');
    const cancelEditBtn = document.getElementById('cancel-edit-btn');
    
    // 当前蛋白质氨基酸序列
    let currentProtein = '';
    // 存储原始氨基酸序列（用于对比修改）
    let originalProtein = '';
    // 当前选择的视图类型
    let currentViewType = 'cartoon';
    // 3Dmol.js 可视化对象
    let viewer = null;
    let originViewer = null;
    let modifyViewer = null;
    // 当前模型
    let currentModel = null;
    let originalModel = null;
    let modifiedModel = null;
    // 当前PDB数据
    let currentPdbData = '';
    let currentPdbId = '';
    // 编辑模式标志
    let editMode = false;
    // 显示模式：single（单视图）或compare（比较视图）
    let viewMode = 'single';
    
    // 加载状态的按钮控件元素
    const searchBtnText = document.getElementById('search-btn-text');
    const searchSpinner = document.getElementById('search-spinner');
    const translateBtnText = document.getElementById('translate-btn-text');
    const translateSpinner = document.getElementById('translate-spinner');
    const visualizeBtnText = document.getElementById('visualize-btn-text');
    const visualizeSpinner = document.getElementById('visualize-spinner');
    
    // 输入方式切换
    sequenceTypeSelect.addEventListener('change', function() {
        const value = this.value;
        
        // 隐藏所有输入区域
        manualInputDiv.style.display = 'none';
        queryInputDiv.style.display = 'none';
        exampleInputDiv.style.display = 'none';
        
        // 显示选中的输入区域
        if (value === 'manual') {
            manualInputDiv.style.display = 'block';
        } else if (value === 'query') {
            queryInputDiv.style.display = 'block';
        } else if (value === 'example') {
            exampleInputDiv.style.display = 'block';
        }
    });
    
    // NCBI查询
    searchBtn.addEventListener('click', function() {
        const query = document.getElementById('sequence-name').value.trim();
        
        if (!query) {
            showError('请输入蛋白质或基因名称');
            return;
        }
        
        // 显示加载状态
        setButtonLoading(searchBtn, searchBtnText, searchSpinner, true);
        
        // 发送API请求
        fetch('/api/search', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ query: query })
        })
        .then(response => response.json())
        .then(data => {
            // 恢复按钮状态
            setButtonLoading(searchBtn, searchBtnText, searchSpinner, false);
            
            if (data.success) {
                // 显示DNA序列
                dnaSequenceTextarea.value = data.sequence;
                manualInputDiv.style.display = 'block';
                sequenceTypeSelect.value = 'manual';
            } else {
                showError(data.message || '查询失败，请稍后再试');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            setButtonLoading(searchBtn, searchBtnText, searchSpinner, false);
            showError('请求出错: ' + error.message);
        });
    });
    
    // 示例序列选择变化
    exampleSelect.addEventListener('change', function() {
        const exampleId = this.value;
        
        if (!exampleId) {
            return;
        }
        
        fetch('/api/examples')
        .then(response => response.json())
        .then(examples => {
            if (examples[exampleId]) {
                dnaSequenceTextarea.value = examples[exampleId].sequence;
                manualInputDiv.style.display = 'block';
                sequenceTypeSelect.value = 'manual';
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showError('获取示例序列失败: ' + error.message);
        });
    });
    
    // 转换DNA为蛋白质序列
    translateBtn.addEventListener('click', function() {
        const dnaSequence = dnaSequenceTextarea.value.trim();
        
        if (!dnaSequence) {
            showError('请输入DNA序列');
            return;
        }
        
        // 显示加载状态
        setButtonLoading(translateBtn, translateBtnText, translateSpinner, true);
        
        // 发送API请求进行转换
        fetch('/api/translate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ sequence: dnaSequence })
        })
        .then(response => response.json())
        .then(data => {
            // 恢复按钮状态
            setButtonLoading(translateBtn, translateBtnText, translateSpinner, false);
            
            if (data.success) {
                // 显示氨基酸序列
                aminoSequenceTextarea.value = data.protein;
                // 允许编辑氨基酸序列
                aminoSequenceTextarea.readOnly = false;
                currentProtein = data.protein;
                originalProtein = data.protein;
                // 启用可视化按钮
                visualizeBtn.disabled = false;
                
                // 重置视图模式
                viewMode = 'single';
            } else {
                showError(data.message || '转换失败，请稍后再试');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            setButtonLoading(translateBtn, translateBtnText, translateSpinner, false);
            showError('请求出错: ' + error.message);
        });
    });
    
    // 可视化结构
    visualizeBtn.addEventListener('click', function() {
        // 获取可能已编辑的氨基酸序列
        currentProtein = aminoSequenceTextarea.value.trim();
        originalProtein = currentProtein;  // 更新原始序列
        
        if (!currentProtein) {
            showError('请先生成氨基酸序列');
            return;
        }
        
        // 显示加载状态
        setButtonLoading(visualizeBtn, visualizeBtnText, visualizeSpinner, true);
        visPlaceholder.style.display = 'block';
        visPlaceholder.innerHTML = "正在加载蛋白质结构...";
        moleculeViewer.style.display = 'none';
        
        // 确保使用单视图模式
        viewMode = 'single';
        singleViewContainer.style.display = 'block';
        compareViewContainer.style.display = 'none';
        
        // 重置视图按钮
        resetViewButtons();
        cartoonViewBtn.classList.add('active');
        currentViewType = 'cartoon';
        
        // 发送API请求获取PDB数据
        fetch('/api/pdb_structure', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
                sequence: currentProtein
            })
        })
        .then(response => response.json())
        .then(data => {
            // 恢复按钮状态
            setButtonLoading(visualizeBtn, visualizeBtnText, visualizeSpinner, false);
            
            if (data.success) {
                // 存储PDB数据以供后续使用
                currentPdbData = data.pdb_data;
                currentPdbId = data.pdb_id;
                
                // 隐藏占位文本
                visPlaceholder.style.display = 'none';
                // 显示3D查看器容器
                moleculeViewer.style.display = 'block';
                
                // 初始化3Dmol.js查看器
                initSingleViewer(currentPdbData, currentPdbId);
                
                // 显示控制按钮
                visualizationControls.style.display = 'block';
                editSequenceBtn.style.display = 'block';
                editPanel.style.display = 'none';
                editMode = false;
            } else {
                showError(data.message || '结构可视化失败，请稍后再试');
                visPlaceholder.innerHTML = data.message || '结构可视化失败，请稍后再试';
                visPlaceholder.style.display = 'block';
            }
        })
        .catch(error => {
            console.error('Error:', error);
            setButtonLoading(visualizeBtn, visualizeBtnText, visualizeSpinner, false);
            visPlaceholder.innerHTML = '请求出错: ' + error.message;
            visPlaceholder.style.display = 'block';
        });
    });
    
    // 编辑序列按钮
    editSequenceBtn.addEventListener('click', function() {
        // 打开编辑面板
        editPanel.style.display = 'block';
        this.style.display = 'none';
        
        // 设置编辑模式
        editMode = true;
        aminoSequenceTextarea.readOnly = false;
        aminoSequenceTextarea.focus();
    });
    
    // 应用编辑按钮
    applyEditBtn.addEventListener('click', function() {
        // 获取编辑后的序列
        const editedSequence = aminoSequenceTextarea.value.trim();
        
        if (!editedSequence) {
            showError('氨基酸序列不能为空');
            return;
        }
        
        if (editedSequence === originalProtein) {
            showError('序列未发生变化');
            return;
        }
        
        // 显示加载状态
        singleViewContainer.style.display = 'none';
        compareViewContainer.style.display = 'none';
        visPlaceholder.style.display = 'block';
        visPlaceholder.innerHTML = "正在生成对比结构...";
        
        // 切换到比较视图模式
        viewMode = 'compare';
        
        // 获取修改后序列的PDB数据
        fetch('/api/pdb_structure', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
                sequence: editedSequence
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // 隐藏占位文本
                visPlaceholder.style.display = 'none';
                
                // 显示比较视图
                singleViewContainer.style.display = 'none';
                compareViewContainer.style.display = 'flex';
                
                // 初始化对比视图
                initCompareViewers(currentPdbData, data.pdb_data, originalProtein, editedSequence, currentPdbId, data.pdb_id);
                
                // 更新当前序列
                currentProtein = editedSequence;
                
                // 恢复编辑界面
                editSequenceBtn.style.display = 'block';
                editPanel.style.display = 'none';
                editMode = false;
                aminoSequenceTextarea.readOnly = true;
            } else {
                showError(data.message || '生成对比结构失败，请稍后再试');
                visPlaceholder.innerHTML = data.message || '生成对比结构失败，请稍后再试';
                visPlaceholder.style.display = 'block';
            }
        })
        .catch(error => {
            console.error('Error:', error);
            visPlaceholder.innerHTML = '请求出错: ' + error.message;
            visPlaceholder.style.display = 'block';
        });
    });
    
    // 取消编辑按钮
    cancelEditBtn.addEventListener('click', function() {
        // 恢复原始序列
        aminoSequenceTextarea.value = originalProtein;
        currentProtein = originalProtein;
        
        // 恢复编辑界面
        editSequenceBtn.style.display = 'block';
        editPanel.style.display = 'none';
        editMode = false;
        aminoSequenceTextarea.readOnly = true;
    });
    
    // 初始化单个3Dmol.js查看器
    function initSingleViewer(pdbData, pdbId) {
        // 清空容器
        moleculeViewer.innerHTML = '';
        
        // 创建3Dmol.js查看器
        viewer = $3Dmol.createViewer($("#3dmol-viewer"), {
            backgroundColor: "white"
        });
        
        // 添加PDB模型
        currentModel = viewer.addModel(pdbData, "pdb");
        
        // 初始设置样式
        setSingleViewStyle(currentViewType);
        
        // 计算并设置适当的缩放和视角
        viewer.zoomTo();
        
        // 显示PDB ID信息
        pdbInfo.textContent = `使用的PDB结构: ${pdbId} (数据来源: RCSB PDB)`;
    }
    
    // 初始化比较视图查看器
    function initCompareViewers(originalPdbData, modifiedPdbData, originalSeq, modifiedSeq, originalPdbId, modifiedPdbId) {
        // 创建原始结构查看器
        originViewer = $3Dmol.createViewer($("#original-viewer"), {
            backgroundColor: "white"
        });
        originalModel = originViewer.addModel(originalPdbData, "pdb");
        
        // 创建修改后结构查看器
        modifyViewer = $3Dmol.createViewer($("#modified-viewer"), {
            backgroundColor: "white"
        });
        modifiedModel = modifyViewer.addModel(modifiedPdbData, "pdb");
        
        // 设置样式
        setCompareViewStyles(currentViewType, originalSeq, modifiedSeq);
        
        // 计算并设置适当的缩放和视角
        originViewer.zoomTo();
        modifyViewer.zoomTo();
        
        // 同步两个查看器的视角
        syncViewers(originViewer, modifyViewer);
        
        // 显示PDB ID信息
        pdbInfo.textContent = `原始结构: ${originalPdbId} | 修改后结构: ${modifiedPdbId} (数据来源: RCSB PDB)`;
    }
    
    // 同步两个查看器的视角
    function syncViewers(viewer1, viewer2) {
        viewer1.setClickable({}, true, function(atom, viewer) {
            let transform = viewer.getView();
            viewer2.setView(transform);
            viewer2.render();
        });
        
        viewer2.setClickable({}, true, function(atom, viewer) {
            let transform = viewer.getView();
            viewer1.setView(transform);
            viewer1.render();
        });
    }
    
    // 设置单个视图样式
    function setSingleViewStyle(style) {
        if (!viewer || !currentModel) return;
        
        // 清除所有样式
        viewer.setStyle({}, {});
        
        // 基础颜色 - 使用单一颜色
        const baseColor = '0x3366CC'; // 深蓝色
        
        // 根据选择的样式设置模型显示
        switch(style) {
            case 'ribbon':
                viewer.setStyle({}, {cartoon: {color: baseColor, style: 'ribbon', thickness: 0.8}});
                break;
                
            case 'stick':
                viewer.setStyle({}, {stick: {radius: 0.15, color: baseColor}});
                break;
                
            case 'sphere':
                viewer.setStyle({}, {sphere: {radius: 0.8, color: baseColor}});
                break;
                
            case 'cartoon':
            default:
                viewer.setStyle({}, {cartoon: {color: baseColor}});
                break;
        }
        
        // 渲染更新
        viewer.render();
    }
    
    // 设置比较视图样式
    function setCompareViewStyles(style, originalSeq, modifiedSeq) {
        if (!originViewer || !originalModel || !modifyViewer || !modifiedModel) return;
        
        // 基础颜色
        const baseColor = '0x3366CC'; // 深蓝色
        const deletedColor = '0xFF3333'; // 红色，标记删除的残基
        const addedColor = '0xFFAA00';   // 黄色，标记新增的残基
        
        // 清除所有样式
        originViewer.setStyle({}, {});
        modifyViewer.setStyle({}, {});
        
        // 计算删除的残基
        let deletedResidues = [];
        // 计算添加的残基
        let addedResidues = [];
        
        // 找出删除的残基（在原始序列中存在但在修改后序列中不存在或不匹配）
        for (let i = 0; i < originalSeq.length; i++) {
            if (i >= modifiedSeq.length || originalSeq[i] !== modifiedSeq[i]) {
                deletedResidues.push(i + 1); // 残基从1开始编号
            }
        }
        
        // 找出添加的残基（在修改后序列中存在但在原始序列中不存在或不匹配）
        for (let i = 0; i < modifiedSeq.length; i++) {
            if (i >= originalSeq.length || originalSeq[i] !== modifiedSeq[i]) {
                addedResidues.push(i + 1); // 残基从1开始编号
            }
        }
        
        // 根据选择的样式设置模型显示
        switch(style) {
            case 'ribbon':
                // 原始模型 - 基础样式
                originViewer.setStyle({}, {cartoon: {color: baseColor, style: 'ribbon', thickness: 0.8}});
                // 标记删除的残基
                for (let resno of deletedResidues) {
                    originViewer.setStyle({resi: resno}, {cartoon: {color: deletedColor, style: 'ribbon', thickness: 1.0}});
                }
                
                // 修改后模型 - 基础样式
                modifyViewer.setStyle({}, {cartoon: {color: baseColor, style: 'ribbon', thickness: 0.8}});
                // 标记新增的残基
                for (let resno of addedResidues) {
                    modifyViewer.setStyle({resi: resno}, {cartoon: {color: addedColor, style: 'ribbon', thickness: 1.0}});
                }
                break;
                
            case 'stick':
                // 原始模型 - 基础样式
                originViewer.setStyle({}, {stick: {radius: 0.15, color: baseColor}});
                // 标记删除的残基
                for (let resno of deletedResidues) {
                    originViewer.setStyle({resi: resno}, {stick: {radius: 0.2, color: deletedColor}});
                }
                
                // 修改后模型 - 基础样式
                modifyViewer.setStyle({}, {stick: {radius: 0.15, color: baseColor}});
                // 标记新增的残基
                for (let resno of addedResidues) {
                    modifyViewer.setStyle({resi: resno}, {stick: {radius: 0.2, color: addedColor}});
                }
                break;
                
            case 'sphere':
                // 原始模型 - 基础样式
                originViewer.setStyle({}, {sphere: {radius: 0.8, color: baseColor}});
                // 标记删除的残基
                for (let resno of deletedResidues) {
                    originViewer.setStyle({resi: resno}, {sphere: {radius: 1.0, color: deletedColor}});
                }
                
                // 修改后模型 - 基础样式
                modifyViewer.setStyle({}, {sphere: {radius: 0.8, color: baseColor}});
                // 标记新增的残基
                for (let resno of addedResidues) {
                    modifyViewer.setStyle({resi: resno}, {sphere: {radius: 1.0, color: addedColor}});
                }
                break;
                
            case 'cartoon':
            default:
                // 原始模型 - 基础样式
                originViewer.setStyle({}, {cartoon: {color: baseColor}});
                // 标记删除的残基
                for (let resno of deletedResidues) {
                    originViewer.setStyle({resi: resno}, {cartoon: {color: deletedColor}});
                }
                
                // 修改后模型 - 基础样式
                modifyViewer.setStyle({}, {cartoon: {color: baseColor}});
                // 标记新增的残基
                for (let resno of addedResidues) {
                    modifyViewer.setStyle({resi: resno}, {cartoon: {color: addedColor}});
                }
                break;
        }
        
        // 渲染更新
        originViewer.render();
        modifyViewer.render();
    }
    
    // 视图切换按钮
    ribbonViewBtn.addEventListener('click', function() {
        updateVisualization('ribbon', this);
    });
    
    stickViewBtn.addEventListener('click', function() {
        updateVisualization('stick', this);
    });
    
    sphereViewBtn.addEventListener('click', function() {
        updateVisualization('sphere', this);
    });
    
    cartoonViewBtn.addEventListener('click', function() {
        updateVisualization('cartoon', this);
    });
    
    // 更新可视化
    function updateVisualization(viewType, buttonElement) {
        if (!currentProtein) {
            return;
        }
        
        // 更新当前视图类型
        currentViewType = viewType;
        
        // 更新按钮状态
        resetViewButtons();
        buttonElement.classList.add('active');
        
        // 根据视图模式更新样式
        if (viewMode === 'single') {
            if (viewer && currentModel) {
                setSingleViewStyle(viewType);
            }
        } else if (viewMode === 'compare') {
            if (originViewer && originalModel && modifyViewer && modifiedModel) {
                setCompareViewStyles(viewType, originalProtein, currentProtein);
            }
        }
    }
    
    // 辅助函数: 显示错误
    function showError(message) {
        alert(message);
    }
    
    // 辅助函数: 设置按钮加载状态
    function setButtonLoading(button, textElement, spinner, isLoading) {
        if (isLoading) {
            button.disabled = true;
            textElement.style.display = 'none';
            spinner.classList.remove('d-none');
        } else {
            button.disabled = false;
            textElement.style.display = 'inline';
            spinner.classList.add('d-none');
        }
    }
    
    // 辅助函数: 重置视图按钮状态
    function resetViewButtons() {
        ribbonViewBtn.classList.remove('active');
        stickViewBtn.classList.remove('active');
        sphereViewBtn.classList.remove('active');
        cartoonViewBtn.classList.remove('active');
    }
}); 