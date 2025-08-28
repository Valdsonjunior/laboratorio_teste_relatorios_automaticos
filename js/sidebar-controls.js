/**
 * ========================================
 * SCRIPTS DO MENU LATERAL (CONTROLES)
 * ========================================
 * Responsável por: Filtros, áreas monitoradas, ações de controle,
 * auto-refresh, auto-run, interface de usuário
 */

// ========================================
// VARIÁVEIS GLOBAIS DOS CONTROLES
// ========================================
let areaLayers = {};            // Layers de áreas monitoradas (cache)
let currentAreaLayer = null;    // Layer da área atualmente selecionada
let autoRefreshInterval;        // Intervalo para atualização automática
let isAutoRefresh = false;      // Status do auto-refresh
let autoRunInterval;            // Intervalo para alternância automática de camadas
let isAutoRun = false;          // Status do auto-run
let currentAutoRunIndex = 0;    // Índice atual da camada no auto-run

// ========================================
// CONTROLE DE ÁREAS MONITORADAS
// ========================================

/**
 * Muda a área monitorada selecionada
 */
async function changeMonitoredArea() {
    const areaSelect = document.getElementById('areaFilter');
    const selectedArea = areaSelect.value;
    
    if (!selectedArea) {
        clearCurrentArea();
        return;
    }

    try {
        showRefreshIndicator();
        
        // Configuração das áreas disponíveis
        const areasConfig = getAreasConfiguration();
        const areaConfig = areasConfig[selectedArea];
        
        if (!areaConfig) {
            throw new Error(`Configuração não encontrada para área: ${selectedArea}`);
        }

        // Remove área anterior
        if (currentAreaLayer) {
            map.removeLayer(currentAreaLayer);
        }

        // Verifica cache ou carrega nova área
        if (areaLayers[selectedArea]) {
            displayCachedArea(selectedArea);
        } else {
            await loadNewArea(selectedArea, areaConfig);
        }
        
        // Atualiza estatísticas e interface
        updateAreaStats(selectedArea, areaConfig.name);
        showAreaInfo(areaConfig.name);
        
    } catch (error) {
        handleAreaLoadError(error, selectedArea);
    } finally {
        hideRefreshIndicator();
    }
}

/**
 * Configuração das áreas monitoradas
 */
function getAreasConfiguration() {
    return {
        brasil: {
            file: './data/areas/brasil.geojson',
            name: 'Brasil',
            color: '#2563eb'
        },
        amazonia_legal: {
            file: './data/areas/amazonia_legal.geojson',
            name: 'Amazônia Legal',
            color: '#059669'
        },
        bioma_amazonia: {
            file: './data/areas/bioma_amazonia.geojson',
            name: 'Bioma Amazônia',
            color: '#0d9488'
        },
        bioma_pantanal: {
            file: './data/areas/bioma_pantanal.geojson',
            name: 'Bioma Pantanal',
            color: '#7c3aed'
        },
        bioma_cerrado: {
            file: './data/areas/bioma_cerrado.geojson',
            name: 'Bioma Cerrado',
            color: '#dc2626'
        },
        crbe: {
            file: './data/areas/crbe.geojson',
            name: 'CRBE',
            color: '#ea580c'
        },
        para: {
            file: './data/areas/para.geojson',
            name: 'Pará',
            color: '#7c2d12'
        },
        tocantins: {
            file: './data/areas/tocantins.geojson',
            name: 'Tocantins',
            color: '#92400e'
        },
        amapa: {
            file: './data/areas/amapa.geojson',
            name: 'Amapá',
            color: '#065f46'
        },
        maranhao: {
            file: './data/areas/maranhao.geojson',
            name: 'Maranhão',
            color: '#1e40af'
        }
    };
}

/**
 * Carrega nova área monitorada
 */
async function loadNewArea(areaKey, areaConfig) {
    console.log(`🗺️ Carregando área: ${areaConfig.name}`);
    
    const response = await fetch(areaConfig.file);
    if (!response.ok) {
        throw new Error(`Erro ${response.status} ao carregar ${areaConfig.name}`);
    }
    
    const areaData = await response.json();
    
    // Cria layer da área
    const areaLayer = L.geoJSON(areaData, {
        style: {
            color: areaConfig.color,
            weight: 3,
            fillColor: areaConfig.color,
            fillOpacity: 0.1,
            dashArray: '10, 5'
        },
        onEachFeature: function(feature, layer) {
            const props = feature.properties || {};
            const popupContent = `
                <div style="min-width: 250px;">
                    <h3 style="margin: 0 0 10px 0; color: #333;">
                        <i class="fas fa-map-marked-alt"></i> ${areaConfig.name}
                    </h3>
                    ${props.nome ? `<p><strong>Nome:</strong> ${props.nome}</p>` : ''}
                    ${props.area ? `<p><strong>Área:</strong> ${props.area} km²</p>` : ''}
                    ${props.populacao ? `<p><strong>População:</strong> ${props.populacao}</p>` : ''}
                    ${props.capital ? `<p><strong>Capital:</strong> ${props.capital}</p>` : ''}
                    ${props.regiao ? `<p><strong>Região:</strong> ${props.regiao}</p>` : ''}
                    ${props.descricao ? `<p><strong>Descrição:</strong> ${props.descricao}</p>` : ''}
                </div>
            `;
            layer.bindPopup(popupContent);
        }
    });

    // Cache e exibição
    areaLayers[areaKey] = areaLayer;
    currentAreaLayer = areaLayer;
    map.addLayer(areaLayer);
    
    // Zoom para a área
    map.fitBounds(areaLayer.getBounds(), {
        padding: [20, 20],
        maxZoom: 12
    });
    
    console.log(`✅ Área ${areaConfig.name} carregada com sucesso!`);
}

/**
 * Exibe área já carregada do cache
 */
function displayCachedArea(areaKey) {
    currentAreaLayer = areaLayers[areaKey];
    map.addLayer(currentAreaLayer);
    map.fitBounds(currentAreaLayer.getBounds(), {
        padding: [20, 20]
    });
    console.log(`📋 Área ${areaKey} carregada do cache`);
}

/**
 * Remove área atual e volta para view padrão
 */
function clearCurrentArea() {
    if (currentAreaLayer) {
        map.removeLayer(currentAreaLayer);
        currentAreaLayer = null;
    }
    map.setView([-1.4558, -48.4902], 10);
    hideAreaInfo();
    updateStatsFromData(); // Reset para estatísticas gerais
}

/**
 * Trata erros no carregamento de áreas
 */
function handleAreaLoadError(error, selectedArea) {
    console.error('❌ Erro ao carregar área monitorada:', error);
    
    showTemporaryError(`Erro ao carregar ${selectedArea}: ${error.message}`);
    
    // Reset do select
    document.getElementById('areaFilter').value = '';
}

// ========================================
// SISTEMA DE FILTROS
// ========================================

/**
 * Aplica filtros aos dados exibidos
 */
function applyFilters() { 
    const period = document.getElementById('periodFilter').value; 
    const area = document.getElementById('areaFilter').value;
     
    console.log('🔍 Aplicando filtros:', { period, area }); 
    
    // Aplicar filtros em todas as camadas de monitoramento
    const layersToFilter = [
        'eventos-fogo', 'novos-eventos', 'eventos-severos', 
        'maior-area', 'aerosol', 'co', 'pluma-fumaca', 'alertas', 'heatmap'
    ];
    
    layersToFilter.forEach(layerName => {
        if (layers[layerName]) {
            applyLayerFilters(layers[layerName], period);
        }
    });
}

/**
 * Aplica filtros em um layer específico
 */
function applyLayerFilters(layerGroup, period) {
    // Converter período para horas
    const periodHours = getPeriodHours(period);
    
    layerGroup.eachLayer(function(layer) {
        let shouldShow = true;
        
        // Simular filtro temporal baseado no período selecionado
        // Na implementação real, isso seria baseado em timestamps dos dados
        const randomAge = Math.random() * 720; // Idade aleatória até 30 dias em horas
        
        if (periodHours > 0) {
            shouldShow = randomAge <= periodHours;
        }
        
        // Aplicar visibilidade
        if (shouldShow) {
            if (layer.setStyle) {
                layer.setStyle({ 
                    opacity: 1, 
                    fillOpacity: layer.options.fillOpacity || 0.7 
                });
            }
        } else {
            if (layer.setStyle) {
                layer.setStyle({ 
                    opacity: 0.2, 
                    fillOpacity: 0.1 
                });
            }
        }
    });
}

/**
 * Converte período selecionado para horas
 */
function getPeriodHours(period) {
    switch(period) {
        case '24h': return 24;
        case '7days': return 168; // 7 * 24
        case '15days': return 360; // 15 * 24
        case '30days': return 720; // 30 * 24
        default: return -1; // Mostrar todos
    }
}

// ========================================
// ATUALIZAÇÃO DE DADOS
// ========================================

/**
 * Atualiza todos os dados do mapa
 */
function refreshData() { 
    console.log('🔄 Atualizando dados...');
    showRefreshIndicator(); 
    
    // Recarregar mapa completo
    initMap().then(() => {
        hideRefreshIndicator(); 
        updateLastRefreshTime();
        console.log('✅ Dados atualizados com sucesso!');
        NotificationSystem.success('Dados atualizados com sucesso!');
    }).catch(error => {
        console.error('❌ Erro ao atualizar:', error);
        hideRefreshIndicator();
        showTemporaryError('Erro ao atualizar dados: ' + error.message);
        NotificationSystem.error('Erro ao atualizar dados');
    });
}

/**
 * Liga/desliga atualização automática
 */
function toggleAutoRefresh() { 
    const button = event.target.closest('.control-button'); 
     
    if (isAutoRefresh) { 
        clearInterval(autoRefreshInterval); 
        isAutoRefresh = false; 
        button.classList.remove('active'); 
        button.querySelector('span').textContent = 'Auto-Refresh'; 
        console.log('⏸️ Auto-refresh desativado');
        NotificationSystem.info('Auto-refresh desativado');
    } else { 
        autoRefreshInterval = setInterval(refreshData, 60000); // 1 minuto 
        isAutoRefresh = true; 
        button.classList.add('active'); 
        button.querySelector('span').textContent = 'Auto-Refresh ON'; 
        console.log('▶️ Auto-refresh ativado (60s)');
        NotificationSystem.success('Auto-refresh ativado (60s)');
    } 
}

/**
 * Liga/desliga alternância automática de camadas (Auto-Run)
 */
function toggleAutoRun() {
    const button = event.target.closest('.control-button');
    
    if (isAutoRun) {
        // Parar Auto-Run
        clearInterval(autoRunInterval);
        isAutoRun = false;
        button.classList.remove('active');
        button.querySelector('span').textContent = 'Run';
        button.querySelector('i').className = 'fas fa-play';
        console.log('⏹️ Auto-run parado');
        NotificationSystem.info('Auto-run parado');
    } else {
        // Iniciar Auto-Run
        startAutoRun();
        isAutoRun = true;
        button.classList.add('active');
        button.querySelector('span').textContent = 'Running...';
        button.querySelector('i').className = 'fas fa-stop';
        console.log('▶️ Auto-run iniciado (30s por camada)');
        NotificationSystem.success('Auto-run iniciado - alternando camadas a cada 30s');
    }
}

/**
 * Inicia a alternância automática de camadas
 */
function startAutoRun() {
    // Lista das camadas para alternar (camadas 3 a 11)
    const autoRunLayers = [
        'eventos-fogo',
        'heatmap', 
        'novos-eventos',
        'eventos-severos',
        'maior-area',
        'aerosol',
        'co',
        'pluma-fumaca',
        'alertas'
    ];
    
    // Desativar todas as camadas primeiro
    autoRunLayers.forEach(layerName => {
        if (layers[layerName] && map.hasLayer(layers[layerName])) {
            map.removeLayer(layers[layerName]);
            // Remover classe active do botão correspondente
            const button = document.querySelector(`[onclick*="${layerName}"]`);
            if (button) button.classList.remove('active');
        }
    });
    
    currentAutoRunIndex = 0;
    
    // Função para ativar próxima camada
    const activateNextLayer = () => {
        // Desativar camada anterior
        if (currentAutoRunIndex > 0) {
            const prevLayerName = autoRunLayers[currentAutoRunIndex - 1];
            if (layers[prevLayerName] && map.hasLayer(layers[prevLayerName])) {
                map.removeLayer(layers[prevLayerName]);
                const prevButton = document.querySelector(`[onclick*="${prevLayerName}"]`);
                if (prevButton) prevButton.classList.remove('active');
            }
        } else if (currentAutoRunIndex === 0 && autoRunLayers.length > 0) {
            // Primeira execução - desativar a última camada do ciclo anterior
            const lastLayerName = autoRunLayers[autoRunLayers.length - 1];
            if (layers[lastLayerName] && map.hasLayer(layers[lastLayerName])) {
                map.removeLayer(layers[lastLayerName]);
                const lastButton = document.querySelector(`[onclick*="${lastLayerName}"]`);
                if (lastButton) lastButton.classList.remove('active');
            }
        }
        
        // Ativar camada atual
        const currentLayerName = autoRunLayers[currentAutoRunIndex];
        
        // Criar camada se não existir
        if (currentLayerName === 'heatmap' && !layers[currentLayerName]) {
            createHeatMapLayer();
        }
        
        if (layers[currentLayerName]) {
            map.addLayer(layers[currentLayerName]);
            const currentButton = document.querySelector(`[onclick*="${currentLayerName}"]`);
            if (currentButton) currentButton.classList.add('active');
            
            console.log(`🔄 Auto-run: Ativando ${currentLayerName}`);
            
            // Mostrar notificação da camada atual
            const layerNames = {
                'eventos-fogo': 'Eventos de Fogo',
                'heatmap': 'HeatMap',
                'novos-eventos': 'Novos Eventos',
                'eventos-severos': 'Eventos mais Severos',
                'maior-area': 'Maior Área de Influência',
                'aerosol': 'Aerosol',
                'co': 'CO',
                'pluma-fumaca': 'Pluma de Fumaça',
                'alertas': 'Alertas'
            };
            
            NotificationSystem.info(`Exibindo: ${layerNames[currentLayerName]}`, 2000);
        }
        
        // Avançar para próxima camada
        currentAutoRunIndex = (currentAutoRunIndex + 1) % autoRunLayers.length;
    };
    
    // Ativar primeira camada imediatamente
    activateNextLayer();
    
    // Configurar intervalo para alternar a cada 30 segundos
    autoRunInterval = setInterval(activateNextLayer, 30000);
}

/**
 * Ativa Auto-Refresh por padrão
 */
function activateAutoRefreshByDefault() {
    autoRefreshInterval = setInterval(refreshData, 60000); // 1 minuto 
    isAutoRefresh = true;
    console.log('▶️ Auto-refresh ativado por padrão (60s)');
}

// ========================================
// FUNÇÕES DE INTERFACE
// ========================================

/**
 * Mostra indicador de carregamento
 */
function showRefreshIndicator() { 
    document.getElementById('refreshIndicator').style.display = 'block'; 
} 

/**
 * Esconde indicador de carregamento
 */
function hideRefreshIndicator() { 
    document.getElementById('refreshIndicator').style.display = 'none'; 
}

/**
 * Atualiza horário da última atualização
 */
function updateLastRefreshTime() { 
    const now = new Date(); 
    document.getElementById('lastUpdate').textContent =  
        now.getHours().toString().padStart(2, '0') + ':' +  
        now.getMinutes().toString().padStart(2, '0'); 
}

/**
 * Mostra informações da área selecionada
 */
function showAreaInfo(areaName) {
    const areaInfo = document.getElementById('areaInfo');
    if (areaInfo) {
        document.getElementById('areaInfoTitle').textContent = areaName;
        document.getElementById('areaInfoDescription').textContent = `Monitorando dados da região: ${areaName}`;
        areaInfo.style.display = 'block';
    }
}

/**
 * Esconde informações da área
 */
function hideAreaInfo() {
    const areaInfo = document.getElementById('areaInfo');
    if (areaInfo) {
        areaInfo.style.display = 'none';
    }
}

/**
 * Mostra erro temporário
 */
function showTemporaryError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.innerHTML = `
        <i class="fas fa-exclamation-triangle"></i>
        ${message}
    `;
    document.body.appendChild(errorDiv);
    
    setTimeout(() => {
        if (errorDiv.parentNode) {
            errorDiv.parentNode.removeChild(errorDiv);
        }
    }, 5000);
}

// ========================================
// EXPORTAÇÃO DE DADOS
// ========================================

/**
 * Exporta dados do mapa
 */
function exportData() { 
    console.log('📤 Exportando dados...');
    
    try {
        const dataToExport = {
            timestamp: new Date().toISOString(),
            base_layer: currentBaseLayer,
            pontos: layers.pontos ? layers.pontos.toGeoJSON() : null,
            areas_especiais: layers['areas-especiais'] ? layers['areas-especiais'].toGeoJSON() : null,
            dados_municipais: layers['dados-municipais'] ? layers['dados-municipais'].toGeoJSON() : null,
            rotas: layers.rotas ? layers.rotas.toGeoJSON() : null,
            area_monitorada: currentAreaLayer ? currentAreaLayer.toGeoJSON() : null
        };
        
        const dataStr = JSON.stringify(dataToExport, null, 2);
        const dataBlob = new Blob([dataStr], {type: 'application/json'});
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `dashboard-dados-${new Date().toISOString().split('T')[0]}.geojson`;
        link.click();
        
        console.log('✅ Dados exportados com sucesso!');
        NotificationSystem.success('Dados exportados com sucesso!');
        
    } catch (error) {
        console.error('❌ Erro na exportação:', error);
        showTemporaryError('Erro ao exportar dados: ' + error.message);
        NotificationSystem.error('Erro ao exportar dados');
    }
}

// ========================================
// ATALHOS DE TECLADO
// ========================================

/**
 * Configura atalhos de teclado para controles
 */
function setupKeyboardShortcuts() {
    document.addEventListener('keydown', function(e) {
        // Ctrl+R = Refresh
        if (e.ctrlKey && e.key === 'r') {
            e.preventDefault();
            refreshData();
        }
        
        // ESC = Limpar área selecionada OU parar Auto-Run
        if (e.key === 'Escape') {
            if (isAutoRun) {
                toggleAutoRun();
            } else {
                document.getElementById('areaFilter').value = '';
                clearCurrentArea();
            }
        }
        
        // L = Toggle Light Map
        if (e.key.toLowerCase() === 'l' && !e.ctrlKey) {
            switchBaseLayer('light');
        }
        
        // D = Toggle Dark Map
        if (e.key.toLowerCase() === 'd' && !e.ctrlKey) {
            switchBaseLayer('dark');
        }
        
        // R = Toggle Auto-Run
        if (e.key.toLowerCase() === 'r' && !e.ctrlKey) {
            toggleAutoRun();
        }
        
        // Spacebar = Pause/Resume Auto-Run
        if (e.key === ' ' && isAutoRun) {
            e.preventDefault();
            toggleAutoRun();
        }
    });
    
    console.log('⌨️ Atalhos de teclado configurados');
}

// ========================================
// FUNÇÕES UTILITÁRIAS
// ========================================

/**
 * Calcula data baseada no período selecionado
 */
function getPeriodDate(period) { 
    const now = new Date(); 
    switch(period) { 
        case '24h': 
            return new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString().split('T')[0]; 
        case '7days': 
            return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]; 
        case '15days': 
            return new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]; 
        case '30days': 
            return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]; 
        default: 
            return '1900-01-01'; 
    } 
}