/**
 * ========================================
 * SCRIPTS DO MAPA LEAFLET
 * ========================================
 * Responsável por: Inicialização do mapa, camadas base, controle de layers, 
 * carregamento de dados GeoJSON, criação de camadas de monitoramento
 */

// ========================================
// VARIÁVEIS GLOBAIS DO MAPA
// ========================================
let map;                        // Instância do mapa Leaflet
let layers = {};                // Layers principais (pontos, áreas, rotas)
let baseLayers = {};            // Layers de mapas base (Light/Dark)
let currentBaseLayer = 'light'; // Mapa base atual (light/dark)

// ========================================
// INICIALIZAÇÃO DO MAPA
// ========================================
async function initMap() {
    const loadingEl = document.getElementById('mapLoading');
    
    try {
        console.log('🗺️ Inicializando mapa...');
        
        // Inicializar mapa centrado em Belém, PA
        map = L.map('map').setView([-1.4558, -48.4902], 10);
        
        // Configurar layers de mapas base
        setupBaseLayers();

        // Remover os botões de zoom depois
        map.zoomControl.remove();
        
        // Adicionar mapa light como padrão
        baseLayers.dark.addTo(map);

        // Mostrar progresso de carregamento
        loadingEl.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Carregando dados GeoJSON...';

        console.log('🔥 Iniciando carregamento paralelo dos dados...');
        
        // CARREGAMENTO PARALELO - Todas as requisições simultâneas
        const [pontosData, areasData, rotasData] = await Promise.all([
            fetchGeoJSONData('./data/pontos_interesse.geojson', 'pontos'),
            fetchGeoJSONData('./data/areas_especiais.geojson', 'áreas'),
            fetchGeoJSONData('./data/rotas.geojson', 'rotas')
        ]);

        console.log('✅ Todos os dados carregados! Processando layers...');
        loadingEl.innerHTML = '<i class="fas fa-cog fa-spin"></i> Processando layers...';

        // Criar layers dos dados carregados
        createPointsLayer(pontosData);
        createAreasLayer(areasData);
        createRoutesLayer(rotasData);
        
        // Esconder indicador de carregamento
        loadingEl.style.display = 'none';
        
        // Atualizar estatísticas com dados reais
        updateStatsFromData(pontosData, areasData, rotasData);
        
        // Log de sucesso
        const totalFeatures = 
            (pontosData?.features?.length || 0) + 
            (areasData?.features?.length || 0) + 
            (rotasData?.features?.length || 0);
        
        console.log(`📊 Mapa carregado: ${totalFeatures} features total`);
        console.log(`   - ${pontosData?.features?.length || 0} pontos`);
        console.log(`   - ${areasData?.features?.length || 0} áreas`);
        console.log(`   - ${rotasData?.features?.length || 0} rotas`);
        
    } catch (error) {
        console.error('❌ Erro ao carregar dados do mapa:', error);
        handleMapLoadError(error, loadingEl);
    }
}

// ========================================
// CONFIGURAÇÃO DE MAPAS BASE
// ========================================

/**
 * Configura os layers de mapas base (Light/Dark)
 */
function setupBaseLayers() {
    // Mapa Light - OpenStreetMap
    baseLayers.light = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19,
        id: 'osm-light'
    });

    // Mapa Dark - CartoDB Dark Matter
    baseLayers.dark = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '© OpenStreetMap contributors © CARTO',
        maxZoom: 19,
        id: 'cartodb-dark'
    });

    console.log('🗺️ Mapas base configurados: Light (OSM) e Dark (CartoDB)');
}

/**
 * Alterna entre mapas Light e Dark
 */
function switchBaseLayer(layerType) {
    if (!baseLayers[layerType]) {
        console.error(`❌ Layer base '${layerType}' não encontrado`);
        return;
    }

    // Remove layer atual
    if (baseLayers[currentBaseLayer]) {
        map.removeLayer(baseLayers[currentBaseLayer]);
    }

    // Adiciona novo layer
    baseLayers[layerType].addTo(map);
    currentBaseLayer = layerType;

    // Atualiza botões de controle
    updateBaseLayerButtons(layerType);

    console.log(`🗺️ Mapa base alterado para: ${layerType}`);
    Analytics.track('base_layer_changed', { from: currentBaseLayer, to: layerType });
}

/**
 * Atualiza status visual dos botões de mapa base
 */
function updateBaseLayerButtons(activeLayer) {
    // Remove classe active de todos os botões de mapa
    document.querySelectorAll('[onclick*="mapa-"]').forEach(btn => {
        btn.classList.remove('active');
    });

    // Adiciona classe active ao botão correto
    const buttonSelector = activeLayer === 'dark' ? '[onclick*="mapa-dark"]' : '[onclick*="mapa-light"]';
    const activeButton = document.querySelector(buttonSelector);
    if (activeButton) {
        activeButton.classList.add('active');
    }
}

// ========================================
// FUNÇÕES AUXILIARES DE CARREGAMENTO
// ========================================

/**
 * Carrega dados GeoJSON com tratamento de erro
 */
async function fetchGeoJSONData(url, type) {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Erro ${response.status} ao carregar ${type}`);
        }
        return await response.json();
    } catch (error) {
        console.warn(`⚠️ Falha ao carregar ${type} de ${url}:`, error.message);
        return { type: "FeatureCollection", features: [] }; // Retorna vazio em caso de erro
    }
}

/**
 * Trata erros de carregamento do mapa
 */
function handleMapLoadError(error, loadingEl) {
    loadingEl.innerHTML = `
        <div style="color: #ff6b6b; text-align: center;">
            <i class="fas fa-exclamation-triangle" style="font-size: 24px; margin-bottom: 10px;"></i><br>
            <strong>Erro ao carregar dados do mapa</strong><br>
            <small style="opacity: 0.8;">${error.message}</small><br>
            <small style="opacity: 0.6;">Verifique se os arquivos GeoJSON existem na pasta './data/'</small>
        </div>
    `;
    
    // Manter o mapa base mesmo com erro
    if (!map) {
        map = L.map('map').setView([-1.4558, -48.4902], 10);
        setupBaseLayers();
        baseLayers.light.addTo(map);
    }
}

// ========================================
// CRIAÇÃO DE LAYERS
// ========================================

/**
 * Cria layer de pontos de interesse
 */
function createPointsLayer(pontosData) {
    if (!pontosData?.features?.length) return;
    
    layers.pontos = L.geoJSON(pontosData, {
        pointToLayer: function(feature, latlng) {
            return L.circleMarker(latlng, {
                color: '#ff0000',
                fillColor: '#ff0000',
                fillOpacity: 0.7,
                radius: 8,
                weight: 2
            });
        },
        onEachFeature: function(feature, layer) {
            const props = feature.properties || {};
            const popupContent = `
                <div style="min-width: 200px;">
                    <h3 style="margin: 0 0 10px 0; color: #333;">
                        <i class="fas fa-map-marker-alt"></i> ${props.nome || 'Ponto'}
                    </h3>
                    <p style="margin: 0; color: #666;">${props.descricao || 'Sem descrição'}</p>
                    ${props.categoria ? `<p style="margin: 5px 0 0 0; font-size: 12px; color: #999;"><strong>Categoria:</strong> ${props.categoria}</p>` : ''}
                    ${props.status ? `<p style="margin: 5px 0 0 0; font-size: 12px; color: #999;"><strong>Status:</strong> ${props.status}</p>` : ''}
                </div>
            `;
            layer.bindPopup(popupContent);
        }
    });
}

/**
 * Cria layer de áreas especiais
 */
function createAreasLayer(areasData) {
    if (!areasData?.features?.length) return;
    
    layers['areas-especiais'] = L.geoJSON(areasData, {
        style: {
            color: '#0000ff',
            weight: 2,
            fillColor: '#0000ff',
            fillOpacity: 0.3
        },
        onEachFeature: function(feature, layer) {
            const props = feature.properties || {};
            const popupContent = `
                <div style="min-width: 200px;">
                    <h3 style="margin: 0 0 10px 0; color: #333;">
                        <i class="fas fa-draw-polygon"></i> ${props.nome || 'Área'}
                    </h3>
                    <p style="margin: 0; color: #666;">Área: ${props.area || 'N/A'} m²</p>
                    <p style="margin: 5px 0 0 0; color: #666;">${props.descricao || ''}</p>
                    ${props.tipo ? `<p style="margin: 5px 0 0 0; font-size: 12px; color: #999;"><strong>Tipo:</strong> ${props.tipo}</p>` : ''}
                </div>
            `;
            layer.bindPopup(popupContent);
        }
    });
}

/**
 * Cria layer de rotas
 */
function createRoutesLayer(rotasData) {
    if (!rotasData?.features?.length) return;
    
    layers.rotas = L.geoJSON(rotasData, {
        style: {
            color: '#00ff00',
            weight: 4,
            opacity: 0.8
        },
        onEachFeature: function(feature, layer) {
            const props = feature.properties || {};
            const popupContent = `
                <div style="min-width: 200px;">
                    <h3 style="margin: 0 0 10px 0; color: #333;">
                        <i class="fas fa-route"></i> ${props.nome || 'Rota'}
                    </h3>
                    <p style="margin: 0; color: #666;">Distância: ${props.distancia || 'N/A'} km</p>
                    <p style="margin: 5px 0 0 0; color: #666;">${props.descricao || ''}</p>
                    ${props.tipo ? `<p style="margin: 5px 0 0 0; font-size: 12px; color: #999;"><strong>Tipo:</strong> ${props.tipo}</p>` : ''}
                </div>
            `;
            layer.bindPopup(popupContent);
        }
    });
}

// ========================================
// CONTROLE DE LAYERS ATUALIZADO
// ========================================

/**
 * Liga/desliga visibilidade de um layer - VERSÃO ATUALIZADA
 */
function toggleLayer(layerName) { 
    const button = event.target.closest('.control-button'); 
    
    // Tratamento especial para mapas base
    if (layerName === 'mapa-dark') {
        switchBaseLayer('dark');
        return;
    }
    
    if (layerName === 'mapa-light') {
        switchBaseLayer('ligth');
        return;
    }
    
    // Criar HeatMap se não existir
    if (layerName === 'heatmap' && !layers[layerName]) {
        createHeatMapLayer();
    }
    
    // Para outros layers
    let layer = layers[layerName];

    if (!layer) {
        console.error(`❌ Layer '${layerName}' não encontrado`);
        return;
    }

    if (map.hasLayer(layer)) { 
        map.removeLayer(layer); 
        button.classList.remove('active'); 
        console.log(`👁️ Layer ${layerName} ocultado`);
    } else { 
        map.addLayer(layer); 
        button.classList.add('active'); 
        console.log(`👁️ Layer ${layerName} exibido`);
    } 
    
    // Registrar métrica
    Analytics.track('layer_toggle', { 
        layer: layerName, 
        visible: map.hasLayer(layer) 
    });
}

// ========================================
// CRIAÇÃO DE CAMADAS DE MONITORAMENTO
// ========================================

/**
 * Cria camadas relacionadas a eventos de fogo
 */
function createFireEventLayers() {
    // Eventos de Fogo
    layers['eventos-fogo'] = L.layerGroup();
    createFireEventPoints();
    
    // Novos Eventos (últimas 24h)
    layers['novos-eventos'] = L.layerGroup();
    createNewEventPoints();
    
    // Eventos mais Severos
    layers['eventos-severos'] = L.layerGroup();
    createSevereEventPoints();
    
    // Maior Área de Influência
    layers['maior-area'] = L.layerGroup();
    createInfluenceAreas();
    
    console.log('🔥 Camadas de eventos de fogo criadas');
}

/**
 * Cria camadas ambientais
 */
function createEnvironmentalLayers() {
    // Aerosol
    layers['aerosol'] = L.layerGroup();
    createAerosolLayer();
    
    // CO (Monóxido de Carbono)
    layers['co'] = L.layerGroup();
    createCOLayer();
    
    // Pluma de Fumaça
    layers['pluma-fumaca'] = L.layerGroup();
    createSmokeLayer();
    
    console.log('🌍 Camadas ambientais criadas');
}

/**
 * Cria camadas de alertas
 */
function createAlertLayers() {
    // Alertas
    layers['alertas'] = L.layerGroup();
    createAlertsLayer();
    
    console.log('🚨 Camadas de alertas criadas');
}

/**
 * Cria pontos de eventos de fogo
 */
function createFireEventPoints() {
    const fireEvents = [
        {lat: -1.4558, lng: -48.4902, intensity: 'alta', size: 120, time: '2h'},
        {lat: -1.4200, lng: -48.5100, intensity: 'média', size: 85, time: '4h'},
        {lat: -1.4800, lng: -48.4500, intensity: 'baixa', size: 45, time: '6h'},
        {lat: -1.4400, lng: -48.4700, intensity: 'alta', size: 200, time: '1h'},
        {lat: -1.4650, lng: -48.4950, intensity: 'média', size: 90, time: '3h'}
    ];

    fireEvents.forEach(event => {
        const color = event.intensity === 'alta' ? '#ff0000' : 
                     event.intensity === 'média' ? '#ff8800' : '#ffaa00';
        
        const marker = L.circleMarker([event.lat, event.lng], {
            color: color,
            fillColor: color,
            fillOpacity: 0.7,
            radius: 10,
            weight: 2
        }).bindPopup(`
            <div style="min-width: 200px;">
                <h3 style="margin: 0 0 10px 0; color: #333;">
                    <i class="fas fa-fire"></i> Evento de Fogo
                </h3>
                <p><strong>Intensidade:</strong> ${event.intensity}</p>
                <p><strong>Área:</strong> ${event.size} hectares</p>
                <p><strong>Detectado:</strong> há ${event.time}</p>
            </div>
        `);
        
        layers['eventos-fogo'].addLayer(marker);
    });
}

/**
 * Cria pontos de novos eventos
 */
function createNewEventPoints() {
    const newEvents = [
        {lat: -1.4350, lng: -48.4600, type: 'Fogo', time: '30min'},
        {lat: -1.4750, lng: -48.5050, type: 'Fumaça', time: '1h'},
        {lat: -1.4150, lng: -48.4850, type: 'Aerosol', time: '2h'}
    ];

    newEvents.forEach(event => {
        const marker = L.circleMarker([event.lat, event.lng], {
            color: '#00ff00',
            fillColor: '#00ff00',
            fillOpacity: 0.8,
            radius: 8,
            weight: 3
        }).bindPopup(`
            <div style="min-width: 180px;">
                <h3 style="margin: 0 0 10px 0; color: #333;">
                    <i class="fas fa-exclamation"></i> Novo Evento
                </h3>
                <p><strong>Tipo:</strong> ${event.type}</p>
                <p><strong>Detectado:</strong> há ${event.time}</p>
            </div>
        `);
        
        layers['novos-eventos'].addLayer(marker);
    });
}

/**
 * Cria pontos de eventos severos
 */
function createSevereEventPoints() {
    const severeEvents = [
        {lat: -1.4450, lng: -48.4800, severity: 'Crítico', area: 500},
        {lat: -1.4300, lng: -48.4900, severity: 'Alto', area: 350}
    ];

    severeEvents.forEach(event => {
        const marker = L.circleMarker([event.lat, event.lng], {
            color: '#8B0000',
            fillColor: '#8B0000',
            fillOpacity: 0.9,
            radius: 15,
            weight: 3
        }).bindPopup(`
            <div style="min-width: 200px;">
                <h3 style="margin: 0 0 10px 0; color: #333;">
                    <i class="fas fa-exclamation-triangle"></i> Evento Severo
                </h3>
                <p><strong>Severidade:</strong> ${event.severity}</p>
                <p><strong>Área Afetada:</strong> ${event.area} hectares</p>
            </div>
        `);
        
        layers['eventos-severos'].addLayer(marker);
    });
}

/**
 * Cria áreas de influência
 */
function createInfluenceAreas() {
    const influenceAreas = [
        {center: [-1.4558, -48.4902], radius: 2000, name: 'Zona de Impacto Principal'},
        {center: [-1.4400, -48.4700], radius: 1500, name: 'Zona de Impacto Secundário'}
    ];

    influenceAreas.forEach(area => {
        const circle = L.circle(area.center, {
            color: '#ff6600',
            fillColor: '#ff6600',
            fillOpacity: 0.2,
            radius: area.radius,
            weight: 2,
            dashArray: '10, 10'
        }).bindPopup(`
            <div style="min-width: 200px;">
                <h3 style="margin: 0 0 10px 0; color: #333;">
                    <i class="fas fa-expand-arrows-alt"></i> ${area.name}
                </h3>
                <p><strong>Raio:</strong> ${area.radius}m</p>
            </div>
        `);
        
        layers['maior-area'].addLayer(circle);
    });
}

/**
 * Cria layer de aerosol
 */
function createAerosolLayer() {
    const aerosolPoints = [
        {lat: -1.4300, lng: -48.4800, concentration: 'Alta'},
        {lat: -1.4600, lng: -48.4600, concentration: 'Média'},
        {lat: -1.4500, lng: -48.5000, concentration: 'Baixa'}
    ];

    aerosolPoints.forEach(point => {
        const color = point.concentration === 'Alta' ? '#800080' : 
                     point.concentration === 'Média' ? '#9932CC' : '#DA70D6';
        
        const marker = L.circleMarker([point.lat, point.lng], {
            color: color,
            fillColor: color,
            fillOpacity: 0.6,
            radius: 12,
            weight: 2
        }).bindPopup(`
            <div style="min-width: 180px;">
                <h3 style="margin: 0 0 10px 0; color: #333;">
                    <i class="fas fa-smog"></i> Concentração de Aerosol
                </h3>
                <p><strong>Nível:</strong> ${point.concentration}</p>
            </div>
        `);
        
        layers['aerosol'].addLayer(marker);
    });
}

/**
 * Cria layer de CO
 */
function createCOLayer() {
    const coPoints = [
        {lat: -1.4400, lng: -48.4750, level: 25, status: 'Atenção'},
        {lat: -1.4550, lng: -48.4850, level: 18, status: 'Normal'},
        {lat: -1.4350, lng: -48.4950, level: 32, status: 'Alerta'}
    ];

    coPoints.forEach(point => {
        const color = point.status === 'Alerta' ? '#8B0000' : 
                     point.status === 'Atenção' ? '#FF4500' : '#228B22';
        
        const marker = L.circleMarker([point.lat, point.lng], {
            color: color,
            fillColor: color,
            fillOpacity: 0.7,
            radius: 9,
            weight: 2
        }).bindPopup(`
            <div style="min-width: 180px;">
                <h3 style="margin: 0 0 10px 0; color: #333;">
                    <i class="fas fa-skull-crossbones"></i> Monóxido de Carbono
                </h3>
                <p><strong>Concentração:</strong> ${point.level} ppm</p>
                <p><strong>Status:</strong> ${point.status}</p>
            </div>
        `);
        
        layers['co'].addLayer(marker);
    });
}

/**
 * Cria layer de pluma de fumaça
 */
function createSmokeLayer() {
    const smokeAreas = [
        {points: [[-1.4500, -48.4800], [-1.4520, -48.4750], [-1.4480, -48.4720], [-1.4460, -48.4770]], density: 'Densa'},
        {points: [[-1.4600, -48.4900], [-1.4620, -48.4850], [-1.4580, -48.4820], [-1.4560, -48.4870]], density: 'Moderada'}
    ];

    smokeAreas.forEach(area => {
        const color = area.density === 'Densa' ? '#2F4F4F' : '#708090';
        
        const polygon = L.polygon(area.points, {
            color: color,
            fillColor: color,
            fillOpacity: 0.4,
            weight: 2
        }).bindPopup(`
            <div style="min-width: 180px;">
                <h3 style="margin: 0 0 10px 0; color: #333;">
                    <i class="fas fa-cloud"></i> Pluma de Fumaça
                </h3>
                <p><strong>Densidade:</strong> ${area.density}</p>
            </div>
        `);
        
        layers['pluma-fumaca'].addLayer(polygon);
    });
}

/**
 * Cria layer de alertas
 */
function createAlertsLayer() {
    const alerts = [
        {lat: -1.4450, lng: -48.4800, type: 'Incêndio', priority: 'Alta'},
        {lat: -1.4300, lng: -48.4650, type: 'Fumaça Tóxica', priority: 'Média'},
        {lat: -1.4600, lng: -48.4950, type: 'Evacuação', priority: 'Crítica'}
    ];

    alerts.forEach(alert => {
        const color = alert.priority === 'Crítica' ? '#FF0000' : 
                     alert.priority === 'Alta' ? '#FF4500' : '#FFA500';
        
        const marker = L.circleMarker([alert.lat, alert.lng], {
            color: color,
            fillColor: color,
            fillOpacity: 0.8,
            radius: 11,
            weight: 3
        }).bindPopup(`
            <div style="min-width: 180px;">
                <h3 style="margin: 0 0 10px 0; color: #333;">
                    <i class="fas fa-bell"></i> Alerta
                </h3>
                <p><strong>Tipo:</strong> ${alert.type}</p>
                <p><strong>Prioridade:</strong> ${alert.priority}</p>
            </div>
        `);
        
        // Adicionar animação para alertas críticos
        if (alert.priority === 'Crítica') {
            setInterval(() => {
                marker.setStyle({
                    fillOpacity: marker.options.fillOpacity === 0.8 ? 0.3 : 0.8
                });
            }, 1000);
        }
        
        layers['alertas'].addLayer(marker);
    });
}

/**
 * Cria HeatMap básico
 */
function createHeatMapLayer() {
    // Dados simulados para heatmap
    const heatmapData = [
        [-1.4558, -48.4902, 0.8],
        [-1.4400, -48.4700, 0.6],
        [-1.4300, -48.4800, 0.9],
        [-1.4650, -48.4950, 0.7],
        [-1.4500, -48.4600, 0.5]
    ];

    // Criar círculos coloridos para simular heatmap
    layers['heatmap'] = L.layerGroup();
    
    heatmapData.forEach(point => {
        const intensity = point[2];
        const color = intensity > 0.7 ? '#FF0000' : 
                     intensity > 0.5 ? '#FF8800' : '#FFAA00';
        
        const circle = L.circle([point[0], point[1]], {
            color: color,
            fillColor: color,
            fillOpacity: 0.4,
            radius: intensity * 1000,
            weight: 1
        }).bindPopup(`
            <div style="min-width: 150px;">
                <h3 style="margin: 0 0 10px 0; color: #333;">
                    <i class="fas fa-burn"></i> HeatMap
                </h3>
                <p><strong>Intensidade:</strong> ${(intensity * 100).toFixed(0)}%</p>
            </div>
        `);
        
        layers['heatmap'].addLayer(circle);
    });
    
    console.log('🔥 HeatMap criado');
}

/**
 * Carrega dados iniciais
 */
function loadInitialData() { 
    console.log('📋 Carregando dados iniciais...');
    // Criar todas as camadas de monitoramento
    createFireEventLayers();
    createEnvironmentalLayers();
    createAlertLayers();
}

// ========================================
// EVENT LISTENERS DO MAPA
// ========================================

/**
 * Adiciona event listeners específicos do mapa
 */
function setupMapEventListeners() {
    if (map) {
        // Listener para cliques no mapa
        map.on('click', function(e) {
            console.log(`🔍 Clique no mapa: ${e.latlng.lat}, ${e.latlng.lng}`);
        });
        
        // Listener para mudança de zoom
        map.on('zoomend', function() {
            console.log(`🔍 Zoom alterado para: ${map.getZoom()}`);
        });
    }
}