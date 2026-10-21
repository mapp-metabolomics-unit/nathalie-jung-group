
document.addEventListener('DOMContentLoaded', function () {
  const state = window.MAPP_DATA_EXPLORER;
  if (!state) {
    document.body.innerHTML = '<main class="workspace"><section class="plot-card"><div class="plot-card-header"><div class="plot-card-title">MAPP data explorer</div></div><p class="muted" style="padding:1rem">Payload missing: data_explorer_assets/data_explorer_payload.js</p></section></main>';
    return;
  }
  if (!state.feature_metadata && state.feature_metadata_columns) {
    const featureColumns = state.feature_metadata_columns;
    const featureColumnNames = Object.keys(featureColumns);
    const featureCount = featureColumnNames.length ? featureColumns[featureColumnNames[0]].length : 0;
    state.feature_metadata = Array.from({ length: featureCount }, function(_, index) {
      const row = {};
      featureColumnNames.forEach(function(column) {
        row[column] = featureColumns[column][index];
      });
      return row;
    });
    delete state.feature_metadata_columns;
  }

  const levelSelect = document.querySelector('[data-level]');
  const searchInput = document.querySelector('[data-search]');
  const globalSearchInput = document.querySelector('[data-global-search]');
	  const itemSelect = document.querySelector('[data-item]');
	  const groupSelect = document.querySelector('[data-group]');
	  const facetSelect = document.querySelector('[data-facet]');
	  const colorSelect = document.querySelector('[data-color]');
	  const sampleFilterRows = Array.from(document.querySelectorAll('[data-sample-filter]'));
	  const groupOrderInput = document.querySelector('[data-group-order]');
	  const groupColorsInput = document.querySelector('[data-group-colors]');
	  const useCurrentGroupsButton = document.querySelector('[data-use-current-groups]');
	  const pathwaySelect = document.querySelector('[data-pathway]');
	  const superclassSelect = document.querySelector('[data-superclass]');
	  const classSelect = document.querySelector('[data-class]');
	  const componentSelect = document.querySelector('[data-component]');
	  const dropSingletonsToggle = document.querySelector('[data-drop-singletons]');
	  const numericFilterPanel = document.querySelector('[data-numeric-filters]');
	  const valueModeSelect = document.querySelector('[data-value-mode]');
	  const plotTypeSelect = document.querySelector('[data-plot-type]');
	  const sortModeSelect = document.querySelector('[data-sort-mode]');
	  const legendModeSelect = document.querySelector('[data-legend-mode]');
	  const gridToggle = document.querySelector('[data-grid-toggle]');
  const pointsToggle = document.querySelector('[data-points-toggle]');
  const gridColumnsInput = document.querySelector('[data-grid-columns]');
	  const gridRowsInput = document.querySelector('[data-grid-rows]');
	  const overviewTab = document.querySelector('[data-tab-overview]');
	  const drilldownTab = document.querySelector('[data-tab-drilldown]');
	  const compositionTab = document.querySelector('[data-tab-composition]');
	  const overviewPanel = document.querySelector('[data-overview-panel]');
	  const compositionPanel = document.querySelector('[data-composition-panel]');
	  const compositionGroupSelect = document.querySelector('[data-composition-group]');
	  const compositionASelect = document.querySelector('[data-composition-a]');
	  const compositionBSelect = document.querySelector('[data-composition-b]');
	  const compositionDepthSelect = document.querySelector('[data-composition-depth]');
	  const compositionValueModeSelect = document.querySelector('[data-composition-value-mode]');
	  const compositionPlotA = document.querySelector('[data-composition-plot-a]');
	  const compositionPlotB = document.querySelector('[data-composition-plot-b]');
	  const compositionTitleA = document.querySelector('[data-composition-title-a]');
	  const compositionTitleB = document.querySelector('[data-composition-title-b]');
	  const compositionMetaA = document.querySelector('[data-composition-meta-a]');
	  const compositionMetaB = document.querySelector('[data-composition-meta-b]');
	  const compositionResetButton = document.querySelector('[data-composition-reset]');
	  const sharedLegend = document.querySelector('[data-shared-legend]');
	  const plotGrid = document.querySelector('[data-plot-grid]');
	  const paginationBar = document.querySelector('[data-pagination]');
	  const paginationLabel = document.querySelector('[data-page-label]');
	  const paginationCount = document.querySelector('[data-page-count]');
	  const previousPageButton = document.querySelector('[data-page-previous]');
	  const nextPageButton = document.querySelector('[data-page-next]');
	  const drilldownPanel = document.querySelector('[data-drilldown]');
	  const drilldownTitle = document.querySelector('[data-drilldown-title]');
	  const drilldownGrid = document.querySelector('[data-drilldown-grid]');
	  const drilldownCloseButton = document.querySelector('[data-drilldown-close]');
	  const info = document.querySelector('[data-info]');
  const countLabel = document.querySelector('[data-count]');
  const titleLabel = document.querySelector('[data-title]');
  const summaryLabel = document.querySelector('[data-summary]');

	  titleLabel.textContent = state.title;
	  summaryLabel.textContent = state.sample_ids.length + ' samples - ' + state.feature_metadata.length + ' features';
	  let currentPage = 1;
	  let compositionFocusId = 'root';

	  const palette = ['#2563EB','#DC2626','#059669','#7C3AED','#D97706','#0891B2','#BE123C','#4B5563','#EA580C','#0F766E','#9333EA','#65A30D'];
	  const featuresById = {};
	  state.feature_metadata.forEach(function(feature) { featuresById[feature.feature_id] = feature; });
  function valueText(value) { return value === null || value === undefined || value === '' ? 'NA' : String(value); }
  function prettyColumn(column) { return column ? column.replace(/^attribute_/, '').replace(/_/g, ' ') : 'None'; }
  function uniqueSorted(values) { return Array.from(new Set(values.map(valueText))).sort(function(a,b){ return a.localeCompare(b); }); }
  function addOption(select, value, label) {
    const option = document.createElement('option');
    option.value = value;
    option.textContent = label || value;
    select.appendChild(option);
  }
	  function selectedOptions(select) { return Array.from(select.selectedOptions).map(function(option){ return option.value; }); }
	  function enableClickToggleMultiSelect(select) {
	    select.addEventListener('mousedown', function(event) {
	      if (!event.target || event.target.tagName !== 'OPTION') return;
	      event.preventDefault();
	      event.target.selected = !event.target.selected;
	      select.focus();
	      select.dispatchEvent(new Event('change', { bubbles: true }));
	    });
	  }
		  function metadataValue(sample, column) { return column ? valueText(sample[column]) : ''; }
	  function featureValue(feature, column) { return valueText(feature[column]); }
	  function numericFeatureValue(feature, column) {
	    const value = Number(feature[column]);
	    return Number.isFinite(value) ? value : null;
	  }
	  function formatSliderValue(value) {
	    const numeric = Number(value);
	    if (!Number.isFinite(numeric)) return 'NA';
	    if (Math.abs(numeric) < 1 && numeric !== 0) return numeric.toFixed(3);
	    if (Math.abs(numeric) >= 1000) return numeric.toExponential(2);
	    return numeric.toFixed(2).replace(/\.?0+$/, '');
	  }
	  function parseListInput(text) {
	    return String(text || '').split(/[\n,]+/).map(function(value) { return value.trim(); }).filter(Boolean);
	  }
	  function parseColorMap(text) {
	    const map = {};
	    String(text || '').split(/\n+/).forEach(function(line) {
	      const clean = line.trim();
	      if (!clean) return;
	      const parts = clean.split(/\s*[:=]\s*/);
	      if (parts.length < 2) return;
	      const key = parts.shift().trim();
	      const color = parts.join(':').trim();
	      if (key && color) map[key] = color;
	    });
	    return map;
	  }
	  function orderedValues(values, order) {
	    if (!order.length) return values;
	    const present = new Set(values);
	    const used = new Set();
	    const ordered = order.filter(function(value) {
	      const keep = present.has(value) && !used.has(value);
	      if (keep) used.add(value);
	      return keep;
	    });
	    return ordered.concat(values.filter(function(value) { return !used.has(value); }));
	  }
	  function groupOrder() {
	    return parseListInput(groupOrderInput.value);
	  }
	  function colorFor(value, index) {
	    const customColors = parseColorMap(groupColorsInput.value);
	    return customColors[value] || palette[index % palette.length];
	  }
	  function hexColorOrFallback(color, fallback) {
	    const clean = String(color || '').trim();
	    return /^#[0-9a-fA-F]{6}$/.test(clean) ? clean : fallback;
	  }
	  function setCustomColor(group, color) {
	    const cleanColor = String(color || '').trim();
	    if (!/^#[0-9a-fA-F]{6}$/.test(cleanColor)) return;
	    const colorMap = parseColorMap(groupColorsInput.value);
	    colorMap[group] = cleanColor;
	    const order = currentColorValues();
	    const orderedKeys = order.concat(Object.keys(colorMap).filter(function(key) { return order.indexOf(key) === -1; }));
	    groupColorsInput.value = orderedKeys.map(function(key) { return key + ' = ' + colorMap[key]; }).join('\n');
	  }

	  function populateMetadataSelect(select, includeNone) {
    select.innerHTML = '';
    if (includeNone) addOption(select, '', 'None');
    state.metadata_columns.forEach(function(column) { addOption(select, column, prettyColumn(column)); });
  }
	  function populateTermSelect(select, column) {
	    select.innerHTML = '';
	    uniqueSorted(state.feature_metadata.map(function(feature) { return featureValue(feature, column); }).filter(function(value) { return value !== 'NA'; }))
	      .forEach(function(value) { addOption(select, value, value); });
	  }
	  function npcColor(level, value, fallback) {
	    const maps = state.npc_color_maps || {};
	    const levelMap = maps[level] || {};
	    return levelMap[value] || fallback || '#D6D6D6';
	  }
	  function referenceNpcColor(pathway, superclass, fallback) {
	    const maps = state.npc_color_maps || {};
	    const pathwayMap = maps.pathway || {};
	    const superclassToPathway = maps.reference_superclass_pathway || {};
	    const referencePathway = superclassToPathway[superclass] || (pathwayMap[pathway] ? pathway : null);
	    return pathwayMap[referencePathway] || fallback || pathwayMap.Other || '#B7B7B7';
	  }
	  function numericFilterColumns() {
	    if (!state.feature_metadata.length) return [];
	    const first = state.feature_metadata[0];
	    return Object.keys(first).filter(function(column) {
	      if (!/(probability|score|confidence|p_value|q_value|pvalue|qvalue|fdr)/i.test(column)) return false;
	      const values = state.feature_metadata.map(function(feature) { return numericFeatureValue(feature, column); }).filter(function(value) { return value !== null; });
	      return values.length > 0;
	    });
	  }
	  function populateNumericFilters() {
	    numericFilterPanel.innerHTML = '';
	    numericFilterColumns().forEach(function(column) {
	      const values = state.feature_metadata.map(function(feature) { return numericFeatureValue(feature, column); }).filter(function(value) { return value !== null; });
	      const min = Math.min.apply(null, values);
	      const max = Math.max.apply(null, values);
	      if (!Number.isFinite(min) || !Number.isFinite(max) || min === max) return;
	      const row = document.createElement('label');
	      row.className = 'numeric-filter-row';
	      row.dataset.numericFilter = column;
	      const head = document.createElement('div');
	      head.className = 'numeric-filter-head';
	      const name = document.createElement('span');
	      name.className = 'numeric-filter-name';
	      name.textContent = prettyColumn(column);
	      const valueLabel = document.createElement('span');
	      valueLabel.className = 'numeric-filter-value';
	      valueLabel.dataset.numericValue = '';
	      const slider = document.createElement('input');
	      slider.type = 'range';
	      slider.min = String(min);
	      slider.max = String(max);
	      slider.step = max <= 1 ? '0.01' : String(Math.max((max - min) / 200, 0.001));
	      slider.value = String(min);
	      slider.dataset.numericColumn = column;
	      slider.dataset.numericMin = String(min);
	      valueLabel.textContent = '>= ' + formatSliderValue(slider.value);
	      slider.addEventListener('input', function() {
	        valueLabel.textContent = '>= ' + formatSliderValue(slider.value);
	        resetPage();
	        render();
	      });
	      head.appendChild(name);
	      head.appendChild(valueLabel);
	      row.appendChild(head);
	      row.appendChild(slider);
	      numericFilterPanel.appendChild(row);
	    });
	  }
	  function passesNumericFilters(feature) {
	    return Array.from(numericFilterPanel.querySelectorAll('[data-numeric-column]')).every(function(slider) {
	      const min = Number(slider.dataset.numericMin);
	      const threshold = Number(slider.value);
	      if (!Number.isFinite(threshold) || threshold <= min) return true;
	      const value = numericFeatureValue(feature, slider.dataset.numericColumn);
	      return value !== null && value >= threshold;
	    });
	  }
	  function populateFilterValues(row) {
	    const columnSelect = row.querySelector('[data-filter-column]');
	    const valuesSelect = row.querySelector('[data-filter-values]');
	    const previous = selectedOptions(valuesSelect);
	    valuesSelect.innerHTML = '';
	    const column = columnSelect.value;
	    if (!column) return;
	    uniqueSorted(state.sample_metadata.map(function(sample) { return metadataValue(sample, column); }))
	      .forEach(function(value) { addOption(valuesSelect, value, value); });
	    Array.from(valuesSelect.options).forEach(function(option) {
	      option.selected = previous.indexOf(option.value) !== -1;
	    });
	  }
	  function passesTermFilter(feature) {
	    const pathways = selectedOptions(pathwaySelect);
	    const superclasses = selectedOptions(superclassSelect);
	    const classes = selectedOptions(classSelect);
	    const components = selectedOptions(componentSelect);
	    if (pathways.length && pathways.indexOf(featureValue(feature, 'npc_pathway')) === -1) return false;
	    if (superclasses.length && superclasses.indexOf(featureValue(feature, 'npc_superclass')) === -1) return false;
	    if (classes.length && classes.indexOf(featureValue(feature, 'npc_class')) === -1) return false;
	    if (components.length && components.indexOf(featureValue(feature, 'component_id')) === -1) return false;
	    if (dropSingletonsToggle.checked && featureValue(feature, 'component_id') === '-1') return false;
	    if (!passesNumericFilters(feature)) return false;
	    return true;
	  }
  function matchingFeatures() {
    return state.feature_metadata.filter(passesTermFilter);
  }
  function combinedQuery() {
    return [searchInput.value, globalSearchInput.value].join(' ').trim().toLowerCase();
  }
  function buildEntities() {
    const level = levelSelect.value;
    const query = combinedQuery();
    const features = matchingFeatures();
    if (level === 'feature') {
      return features.map(function(feature) {
        return { id: feature.feature_id, label: feature.feature_label, featureIds: [feature.feature_id], meta: feature };
      }).filter(function(entity) {
        return !query || JSON.stringify(entity.meta).toLowerCase().indexOf(query) !== -1;
      });
    }
	    const column = level === 'pathway' ? 'npc_pathway' : (level === 'superclass' ? 'npc_superclass' : (level === 'component' ? 'component_id' : 'npc_class'));
	    const byTerm = {};
	    features.forEach(function(feature) {
	      const term = featureValue(feature, column);
	      if (term === 'NA') return;
	      if (!byTerm[term]) byTerm[term] = [];
	      byTerm[term].push(feature.feature_id);
	    });
	    return Object.keys(byTerm).sort(function(a,b){ return a.localeCompare(b); }).map(function(term) {
	      const label = level === 'component' ? 'Component ' + term + ' (' + byTerm[term].length + ' features)' : term + ' (' + byTerm[term].length + ' features)';
	      return { id: term, label: label, featureIds: byTerm[term], meta: { level: level, term: term, n_features: byTerm[term].length } };
	    }).filter(function(entity) {
	      return !query || entity.label.toLowerCase().indexOf(query) !== -1;
	    });
  }
		  function populateItems() {
	    const current = itemSelect.value;
	    const entities = sortEntities(buildEntities());
    itemSelect.innerHTML = '';
    entities.slice(0, 1000).forEach(function(entity) { addOption(itemSelect, entity.id, entity.label); });
    if (current && Array.from(itemSelect.options).some(function(option) { return option.value === current; })) itemSelect.value = current;
	    countLabel.textContent = entities.length + ' matching ' + levelSelect.value + (entities.length === 1 ? '' : 's');
	  }
	  function resetPage() {
	    currentPage = 1;
	  }
	  function selectedSamples() {
	    const filters = sampleFilterRows.map(function(row) {
	      const column = row.querySelector('[data-filter-column]').value;
	      const values = selectedOptions(row.querySelector('[data-filter-values]'));
	      return { column: column, values: values };
	    }).filter(function(filter) { return filter.column && filter.values.length; });
	    return state.sample_metadata.map(function(sample, index) { return { sample: sample, index: index }; })
	      .filter(function(item) {
	        return filters.every(function(filter) {
	          return filter.values.indexOf(metadataValue(item.sample, filter.column)) !== -1;
	        });
	      });
	  }
	  function populateCompositionValues() {
	    const previousA = compositionASelect.value;
	    const previousB = compositionBSelect.value;
	    compositionASelect.innerHTML = '';
	    compositionBSelect.innerHTML = '';
	    const column = compositionGroupSelect.value;
	    const values = orderedValues(uniqueSorted(selectedSamples().map(function(item) {
	      return metadataValue(item.sample, column);
	    })), column === groupSelect.value ? groupOrder() : []);
	    values.forEach(function(value) {
	      addOption(compositionASelect, value, value);
	      addOption(compositionBSelect, value, value);
	    });
	    if (previousA && values.indexOf(previousA) !== -1) {
	      compositionASelect.value = previousA;
	    } else if (values.length) {
	      compositionASelect.value = values[0];
	    }
	    if (previousB && values.indexOf(previousB) !== -1) {
	      compositionBSelect.value = previousB;
	    } else if (values.length > 1) {
	      compositionBSelect.value = values[1];
	    } else if (values.length) {
	      compositionBSelect.value = values[0];
	    }
	  }
	  function currentGroupValues() {
	    return orderedValues(uniqueSorted(selectedSamples().map(function(item) {
	      return metadataValue(item.sample, groupSelect.value);
	    })), groupOrder());
	  }
	  function currentColorValues() {
	    const colorColumn = colorSelect.value === '__group__' ? groupSelect.value : colorSelect.value;
	    const values = uniqueSorted(selectedSamples().map(function(item) {
	      return metadataValue(item.sample, colorColumn);
	    }));
	    return orderedValues(values, colorColumn === groupSelect.value ? groupOrder() : []);
	  }
	  function colorLegendTitle() {
	    return colorSelect.value === '__group__' ? prettyColumn(groupSelect.value) : prettyColumn(colorSelect.value);
	  }
	  function renderSharedLegend() {
	    const useSharedLegend = legendModeSelect.value === 'shared';
	    const compositionActive = compositionPanel && !compositionPanel.hidden;
	    sharedLegend.hidden = !useSharedLegend || compositionActive;
	    if (!useSharedLegend || compositionActive) {
	      sharedLegend.innerHTML = '';
	      return;
	    }
	    const values = currentColorValues();
	    const title = document.createElement('span');
	    title.className = 'shared-legend-title';
	    title.textContent = colorLegendTitle();
	    sharedLegend.innerHTML = '';
	    sharedLegend.appendChild(title);
	    values.forEach(function(value, index) {
	      const item = document.createElement('span');
	      item.className = 'legend-item';
	      const fallbackColor = palette[index % palette.length];
	      const currentColor = hexColorOrFallback(colorFor(value, index), fallbackColor);
	      const swatch = document.createElement('input');
	      swatch.className = 'legend-swatch';
	      swatch.type = 'color';
	      swatch.value = currentColor;
	      swatch.title = 'Pick color for ' + value;
	      const label = document.createElement('span');
	      label.textContent = value;
	      const code = document.createElement('input');
	      code.className = 'legend-color-code';
	      code.type = 'text';
	      code.value = currentColor;
	      code.title = 'Color code for ' + value;
	      swatch.addEventListener('input', function() {
	        setCustomColor(value, swatch.value);
	        code.value = swatch.value;
	        render();
	      });
	      code.addEventListener('change', function() {
	        const nextColor = hexColorOrFallback(code.value, swatch.value);
	        code.value = nextColor;
	        swatch.value = nextColor;
	        setCustomColor(value, nextColor);
	        render();
	      });
	      item.appendChild(swatch);
	      item.appendChild(label);
	      item.appendChild(code);
	      sharedLegend.appendChild(item);
	    });
	  }
	  function seedCurrentGroups() {
	    const groups = currentGroupValues();
	    groupOrderInput.value = groups.join('\n');
	    const existingColors = parseColorMap(groupColorsInput.value);
	    groupColorsInput.value = groups.map(function(group, index) {
	      return group + ' = ' + (existingColors[group] || palette[index % palette.length]);
	    }).join('\n');
	  }
	  const intensityChunksById = {};
	  (state.intensity_chunks || []).forEach(function(chunk) { intensityChunksById[chunk.id] = chunk; });
	  const intensityCache = {};
	  const chunkPromises = {};
	  function loadScript(src) {
	    return new Promise(function(resolve, reject) {
	      const script = document.createElement('script');
	      script.src = src;
	      script.async = true;
	      script.onload = resolve;
	      script.onerror = function() { reject(new Error('Could not load ' + src)); };
	      document.head.appendChild(script);
	    });
	  }
	  function loadChunk(chunkId) {
	    if (!chunkId) return Promise.resolve();
	    if (chunkPromises[chunkId]) return chunkPromises[chunkId];
	    const chunk = intensityChunksById[chunkId];
	    if (!chunk) return Promise.reject(new Error('Unknown intensity chunk ' + chunkId));
	    chunkPromises[chunkId] = loadScript(chunk.path).then(function() {
	      const chunkData = (window.MAPP_DATA_EXPLORER_INTENSITY_CHUNKS || {})[chunkId] || {};
	      Object.keys(chunkData).forEach(function(featureId) {
	        intensityCache[featureId] = chunkData[featureId];
	      });
	      delete (window.MAPP_DATA_EXPLORER_INTENSITY_CHUNKS || {})[chunkId];
	    });
	    return chunkPromises[chunkId];
	  }
	  function loadFeatureIntensities(featureIds) {
	    const chunkIds = Array.from(new Set(featureIds.map(function(featureId) {
	      return state.feature_chunk_map ? state.feature_chunk_map[featureId] : null;
	    }).filter(Boolean)));
	    return Promise.all(chunkIds.map(loadChunk));
	  }
  async function rawEntityValues(entity) {
    await loadFeatureIntensities(entity.featureIds);
    const values = state.sample_ids.map(function() { return 0; });
    entity.featureIds.forEach(function(featureId) {
      const featureValues = intensityCache[featureId] || [];
      featureValues.forEach(function(value, index) {
        const numeric = Number(value);
        if (Number.isFinite(numeric)) values[index] += numeric;
      });
    });
    return values;
  }
  const totals = state.sample_totals || state.sample_ids.map(function() { return 0; });
	  async function transformedValues(entity) {
    const rawValues = await rawEntityValues(entity);
    return rawValues.map(function(value, index) {
      if (valueModeSelect.value === 'log10') return Math.log10(value + 1);
      if (valueModeSelect.value === 'percent_total') return totals[index] > 0 ? 100 * value / totals[index] : null;
      return value;
    });
  }
	  function yTitle() {
    if (valueModeSelect.value === 'log10') return 'log10 intensity + 1';
    if (valueModeSelect.value === 'percent_total') return 'Percent of sample total intensity';
    return 'Raw intensity';
  }
	  function compositionValueTitle() {
	    if (compositionValueModeSelect.value === 'percent_selected') return 'Percent of displayed composition';
	    if (compositionValueModeSelect.value === 'percent_sample_total') return 'Percent of total sample intensity';
	    return 'Summed raw intensity';
	  }
	  function formatValue(value) {
	    if (value === null || value === undefined || !Number.isFinite(Number(value))) return 'NA';
	    if (valueModeSelect.value === 'raw') return Number(value).toExponential(3);
	    return Number(value).toPrecision(4);
	  }
	  function entitySummaryScore(entity, mode) {
	    const featureIds = entity.featureIds || [];
	    const values = featureIds.map(function(featureId) {
	      const feature = featuresById[featureId] || {};
	      const column = mode === 'mean_desc' ? 'feature_mean_intensity' : 'feature_max_intensity';
	      const value = Number(feature[column]);
	      return Number.isFinite(value) ? value : 0;
	    });
	    if (!values.length) return -Infinity;
	    if (mode === 'mean_desc') return values.reduce(function(sum, value) { return sum + value; }, 0) / values.length;
	    return Math.max.apply(null, values);
	  }
	  function sortEntities(entities) {
	    const mode = sortModeSelect.value;
	    if (mode === 'label') {
	      return entities.slice();
	    }
	    return entities.slice().sort(function(a, b) {
	      const aScore = entitySummaryScore(a, mode);
	      const bScore = entitySummaryScore(b, mode);
	      if (bScore !== aScore) return bScore - aScore;
	      return a.label.localeCompare(b.label);
	    });
	  }
	  function wrapPlotLabel(value, width, maxLines) {
	    const text = valueText(value);
	    if (text.length <= width) return text;
	    const words = text.split(/[\s_/:-]+/).filter(Boolean);
	    const lines = [];
	    let line = '';
	    words.forEach(function(word) {
	      const next = line ? line + ' ' + word : word;
	      if (next.length > width && line) {
	        lines.push(line);
	        line = word;
	      } else {
	        line = next;
	      }
	    });
	    if (line) lines.push(line);
	    const clipped = lines.slice(0, maxLines);
	    if (lines.length > maxLines) clipped[maxLines - 1] = clipped[maxLines - 1].replace(/\s+$/, '') + '...';
	    return clipped.join('<br>');
	  }
	  function axisSuffix(index) {
	    return index === 0 ? '' : String(index + 1);
	  }
	  async function plotEntity(entity, element) {
	    element.innerHTML = '<div class="composition-empty">Loading intensities...</div>';
	    const values = await transformedValues(entity);
	    element.innerHTML = '';
	    const sampleItems = selectedSamples();
    const rows = sampleItems.map(function(item) {
      const sample = item.sample;
      const colorColumn = colorSelect.value === '__group__' ? groupSelect.value : colorSelect.value;
      return {
        value: values[item.index],
        sample: sample,
        group: metadataValue(sample, groupSelect.value),
        color: metadataValue(sample, colorColumn),
        facet: facetSelect.value ? metadataValue(sample, facetSelect.value) : ''
      };
    }).filter(function(row) { return row.value !== null && row.value !== undefined && Number.isFinite(Number(row.value)); });
	    const order = groupOrder();
	    const facets = facetSelect.value ? uniqueSorted(rows.map(function(row) { return row.facet; })) : [''];
	    const groups = orderedValues(uniqueSorted(rows.map(function(row) { return row.group; })), order);
	    const colorValues = colorSelect.value === '__group__' ? groups : orderedValues(uniqueSorted(rows.map(function(row) { return row.color; })), colorSelect.value === groupSelect.value ? order : []);
    const colorIndex = {};
    colorValues.forEach(function(value, index) { colorIndex[value] = index; });
	    const traces = [];
	    const legendShown = new Set();
	    const annotations = [];
	    const isMiniPlot = element.classList.contains('mini');
	    const facetColumns = facets.length <= 1 ? 1 : Math.min(facets.length, isMiniPlot ? 2 : 3);
	    const facetRows = Math.ceil(facets.length / facetColumns);
	    const facetGapX = facets.length > 1 ? 0.075 : 0;
	    const facetGapY = facets.length > 1 ? 0.15 : 0;
	    const facetWidth = (1 - facetGapX * (facetColumns - 1)) / facetColumns;
	    const facetHeight = (1 - facetGapY * (facetRows - 1)) / facetRows;
	    if (facets.length > 1) {
	      element.style.height = (isMiniPlot ? Math.max(320, facetRows * 250) : Math.max(520, facetRows * 340)) + 'px';
	    } else {
	      element.style.height = '';
	    }
	    facets.forEach(function(facet, facetIndex) {
	      const facetRows = rows.filter(function(row) { return row.facet === facet; });
	      const suffix = axisSuffix(facetIndex);
	      colorValues.forEach(function(colorValue) {
	        const traceGroups = colorSelect.value === '__group__' ? [colorValue] : groups;
	        traceGroups.forEach(function(group) {
	          const traceRows = facetRows.filter(function(row) { return row.color === colorValue && row.group === group; });
	          if (!traceRows.length) return;
	          const trace = {
	            x: traceRows.map(function(row) { return row.group; }),
	            y: traceRows.map(function(row) { return row.value; }),
            text: traceRows.map(function(row) {
              return 'Sample: ' + metadataValue(row.sample, 'sample_id') +
                '<br>' + prettyColumn(groupSelect.value) + ': ' + row.group +
                '<br>Value: ' + formatValue(row.value);
            }),
            hoverinfo: 'text',
            name: colorValue,
            legendgroup: colorValue,
	            showlegend: legendModeSelect.value === 'per_plot' && !legendShown.has(colorValue),
            marker: { color: colorFor(colorValue, colorIndex[colorValue] || 0), size: 6, opacity: 0.82 },
	            line: { color: colorFor(colorValue, colorIndex[colorValue] || 0) }
	          };
          legendShown.add(colorValue);
          if (plotTypeSelect.value === 'violin') {
            trace.type = 'violin';
            trace.box = { visible: true };
            trace.meanline = { visible: true };
            trace.points = pointsToggle.checked ? 'all' : false;
          } else if (plotTypeSelect.value === 'points') {
            trace.type = 'scatter';
            trace.mode = 'markers';
          } else {
            trace.type = 'box';
            trace.boxpoints = pointsToggle.checked ? 'all' : false;
          }
	          trace.xaxis = 'x' + suffix;
	          trace.yaxis = 'y' + suffix;
	          traces.push(trace);
	        });
	      });
	      if (facet) {
	        const facetRow = Math.floor(facetIndex / facetColumns);
	        const facetColumn = facetIndex % facetColumns;
	        const x0 = facetColumn * (facetWidth + facetGapX);
	        const x1 = x0 + facetWidth;
	        const y1 = 1 - facetRow * (facetHeight + facetGapY);
	        annotations.push({
	          text: wrapPlotLabel(facet, isMiniPlot ? 16 : 24, 2),
	          xref: 'paper',
	          yref: 'paper',
	          x: (x0 + x1) / 2,
	          y: Math.min(1.08, y1 + 0.055),
	          showarrow: false,
	          font: { size: isMiniPlot ? 9 : 10, color: '#30343a' },
	          align: 'center',
	          bgcolor: 'rgba(255,255,255,0.82)',
	          borderpad: 2
	        });
	      }
	    });
    const yValues = rows.map(function(row) { return Number(row.value); });
    const minY = Math.min.apply(null, yValues);
    const maxY = Math.max.apply(null, yValues);
    const pad = Number.isFinite(minY) && Number.isFinite(maxY) && maxY !== minY ? (maxY - minY) * 0.06 : 1;
    const yRange = Number.isFinite(minY) && Number.isFinite(maxY) ? [Math.max(0, minY - pad), maxY + pad] : undefined;
    const yAxis = { title: yTitle(), gridcolor: '#E5E7EB', zeroline: false, range: yRange, tickformat: valueModeSelect.value === 'raw' ? '.2e' : '.3f' };
	    const layout = {
	      title: { text: '', font: { size: 12 } },
	      font: { family: 'Arial, sans-serif', size: 10, color: '#14161a' },
		      margin: { l: 58, r: legendModeSelect.value === 'per_plot' ? 120 : 16, t: facets.length > 1 ? 58 : 24, b: 58 },
	      paper_bgcolor: 'white',
	      plot_bgcolor: 'white',
	      xaxis: { title: prettyColumn(groupSelect.value), tickangle: -20, zeroline: false, automargin: true },
	      yaxis: yAxis,
	      boxmode: 'group',
	      violinmode: 'group',
      annotations: annotations,
	      showlegend: legendModeSelect.value === 'per_plot',
	      legend: { title: { text: colorLegendTitle() }, x: 1.02, y: 1 }
	    };
	    if (facets.length > 1) {
	      facets.forEach(function(facet, index) {
	        const suffix = axisSuffix(index);
	        const facetRow = Math.floor(index / facetColumns);
	        const facetColumn = index % facetColumns;
	        const x0 = facetColumn * (facetWidth + facetGapX);
	        const x1 = x0 + facetWidth;
	        const y1 = 1 - facetRow * (facetHeight + facetGapY);
	        const y0 = y1 - facetHeight;
	        const isLeftColumn = facetColumn === 0;
	        const isBottomRow = facetRow === facetRows - 1;
	        layout['xaxis' + suffix] = {
	          domain: [x0, x1],
	          title: isBottomRow ? prettyColumn(groupSelect.value) : '',
	          tickangle: -20,
	          zeroline: false,
	          automargin: true,
	          matches: index === 0 ? undefined : 'x'
	        };
	        layout['yaxis' + suffix] = Object.assign({}, yAxis, {
	          domain: [y0, y1],
	          title: index === 0 ? yTitle() : '',
	          showticklabels: isLeftColumn,
	          ticks: isLeftColumn ? 'outside' : '',
	          matches: index === 0 ? undefined : 'y'
	        });
	      });
	    }
	    return Plotly.react(element, traces, layout, { displaylogo: false, responsive: true, scrollZoom: false });
  }
	  function renderInfo(entity) {
	    if (!entity) {
	      info.innerHTML = '<div class="inspector-empty"><div>No selection</div><p>Select an entity or use grid mode.</p></div>';
	      return;
	    }
	    Array.from(document.querySelectorAll('.plot-card')).forEach(function(card) {
	      card.classList.toggle('is-selected', card.dataset.entityId === String(entity.id));
	    });
	    const rows = Object.keys(entity.meta).map(function(key) {
	      return '<tr><th>' + key + '</th><td>' + valueText(entity.meta[key]) + '</td></tr>';
	    }).join('');
    info.innerHTML = '<section class="inspector-card"><div class="inspector-title">' + entity.label + '</div><div class="inspector-subtitle">' + entity.featureIds.length + ' feature(s)</div></section><section class="inspector-card"><table class="feature-table">' + rows + '</table></section>';
	  }
	  function activateWorkspaceTab(tabName) {
	    const showDrilldown = tabName === 'drilldown' && !drilldownTab.hidden;
	    const showComposition = tabName === 'composition';
	    overviewTab.classList.toggle('is-active', !showDrilldown && !showComposition);
	    drilldownTab.classList.toggle('is-active', showDrilldown);
	    compositionTab.classList.toggle('is-active', showComposition);
	    overviewPanel.hidden = showDrilldown || showComposition;
	    compositionPanel.hidden = !showComposition;
	    drilldownPanel.hidden = !showDrilldown;
	    renderSharedLegend();
	    window.requestAnimationFrame(function() {
	      if (showComposition) {
	        renderComposition();
	        [compositionPlotA, compositionPlotB].forEach(function(plot) { if (plot) Plotly.Plots.resize(plot); });
	      } else {
	        Array.from(document.querySelectorAll(showDrilldown ? '[data-drilldown-grid] .plot' : '[data-overview-panel] .plot')).forEach(resetPlotZoom);
	      }
	    });
	  }
	  function featureEntitiesFrom(entity) {
	    return sortEntities(entity.featureIds.map(function(featureId) {
	      const feature = featuresById[featureId];
	      if (!feature) return null;
	      return {
	        id: feature.feature_id,
	        label: feature.feature_label,
	        featureIds: [feature.feature_id],
	        meta: feature
	      };
	    }).filter(Boolean));
	  }
	  function clearDrilldown(activateOverview) {
	    if (activateOverview === undefined) activateOverview = true;
	    drilldownTab.hidden = true;
	    drilldownTab.classList.remove('is-active');
	    drilldownTitle.textContent = '';
	    drilldownTab.textContent = 'Exploded features';
	    drilldownGrid.innerHTML = '';
	    if (activateOverview) activateWorkspaceTab('overview');
	  }
	  function samplesForComposition(value) {
	    const column = compositionGroupSelect.value;
	    return selectedSamples().filter(function(item) {
	      return metadataValue(item.sample, column) === value;
	    });
	  }
	  function aggregateCachedFeatureForSamples(featureId, sampleItems) {
	    const values = intensityCache[featureId] || [];
	    let total = 0;
	    sampleItems.forEach(function(item) {
	      const numeric = Number(values[item.index]);
	      if (Number.isFinite(numeric)) total += numeric;
	    });
	    return total;
	  }
	  function sampleTotalForSamples(sampleItems) {
	    return sampleItems.reduce(function(sum, item) {
	      const value = Number(totals[item.index]);
	      return sum + (Number.isFinite(value) ? value : 0);
	    }, 0);
	  }
	  async function buildCompositionTree(groupValue) {
	    const sampleItems = samplesForComposition(groupValue);
	    const depth = compositionDepthSelect.value;
	    const features = matchingFeatures().filter(function(feature) {
	      return featureValue(feature, 'npc_pathway') !== 'NA';
	    });
	    await loadFeatureIntensities(features.map(function(feature) { return feature.feature_id; }));
	    const nodes = {};
	    let focusLabel = groupValue || 'Selected samples';
	    function addNode(id, label, parent, value, level, filterColumn, filterValue, color) {
	      if (!nodes[id]) {
	        nodes[id] = {
	          id: id,
	          label: label,
	          parent: parent,
	          value: 0,
	          level: level,
	          filterColumn: filterColumn || '',
	          filterValue: filterValue || '',
	          color: color || '#D6D6D6',
	          features: new Set()
	        };
	      }
	      nodes[id].value += value;
	      return nodes[id];
	    }
	    const root = addNode('root', groupValue || 'Selected samples', '', 0, 'root', '', '', '#F5F5F5');
	    features.forEach(function(feature) {
	      const raw = aggregateCachedFeatureForSamples(feature.feature_id, sampleItems);
	      if (!Number.isFinite(raw) || raw <= 0) return;
	      const pathway = featureValue(feature, 'npc_pathway') === 'NA' ? 'Unclassified' : featureValue(feature, 'npc_pathway');
	      const superclass = featureValue(feature, 'npc_superclass') === 'NA' ? 'Other' : featureValue(feature, 'npc_superclass');
	      const npcClass = featureValue(feature, 'npc_class') === 'NA' ? 'Other' : featureValue(feature, 'npc_class');
	      const taxonomyColor = referenceNpcColor(pathway, superclass, '#B7B7B7');
	      const pathwayId = 'pathway|' + pathway;
	      const superclassId = pathwayId + '|superclass|' + superclass;
	      const classId = superclassId + '|class|' + npcClass;
	      root.value += raw;
	      [root].forEach(function(node) { node.features.add(feature.feature_id); });
	      addNode(pathwayId, pathway, 'root', raw, 'pathway', 'npc_pathway', pathway, taxonomyColor).features.add(feature.feature_id);
	      if (['superclass', 'class', 'feature'].indexOf(depth) !== -1) {
	        addNode(superclassId, superclass, pathwayId, raw, 'superclass', 'npc_superclass', superclass, taxonomyColor).features.add(feature.feature_id);
	      }
	      if (['class', 'feature'].indexOf(depth) !== -1) {
	        addNode(classId, npcClass, superclassId, raw, 'class', 'npc_class', npcClass, taxonomyColor).features.add(feature.feature_id);
	      }
	      if (depth === 'feature') {
	        const featureId = classId + '|feature|' + feature.feature_id;
	        addNode(featureId, feature.feature_label, classId, raw, 'feature', 'feature_id', feature.feature_id, taxonomyColor).features.add(feature.feature_id);
	      }
	    });
	    if (compositionFocusId !== 'root' && nodes[compositionFocusId]) {
	      focusLabel = nodes[compositionFocusId].label;
	      Object.keys(nodes).forEach(function(id) {
	        if (id !== compositionFocusId && id.indexOf(compositionFocusId + '|') !== 0) {
	          delete nodes[id];
	        }
	      });
	      nodes[compositionFocusId].parent = '';
	      nodes[compositionFocusId].label = focusLabel;
	    } else if (compositionFocusId !== 'root') {
	      focusLabel = compositionFocusId.split('|').pop() || focusLabel;
	      Object.keys(nodes).forEach(function(id) { delete nodes[id]; });
	      addNode(compositionFocusId, focusLabel, '', 0, 'focus', '', '', '#F5F5F5');
	    }
	    const selectedTotal = nodes[compositionFocusId] ? nodes[compositionFocusId].value : root.value;
	    const sampleGrandTotal = sampleTotalForSamples(sampleItems);
	    const divisor = compositionValueModeSelect.value === 'percent_sample_total' ? sampleGrandTotal : selectedTotal;
	    Object.keys(nodes).forEach(function(id) {
	      if (compositionValueModeSelect.value !== 'raw') {
	        nodes[id].value = divisor > 0 ? 100 * nodes[id].value / divisor : 0;
	      }
	      nodes[id].n_features = nodes[id].features.size;
	    });
	    return {
	      nodes: Object.values(nodes).filter(function(node) { return node.id === 'root' || node.value > 0; }),
	      sampleCount: sampleItems.length,
	      featureCount: features.length,
	      focusLabel: focusLabel,
	      selectedTotal: selectedTotal,
	      sampleGrandTotal: sampleGrandTotal
	    };
	  }
	  function treemapHoverText(node) {
	    return '<b>' + node.label + '</b>' +
	      '<br>Level: ' + node.level +
	      '<br>Value: ' + (compositionValueModeSelect.value === 'raw' ? Number(node.value).toExponential(3) : Number(node.value).toFixed(3) + '%') +
	      '<br>Features: ' + node.n_features +
	      '<extra></extra>';
	  }
	  async function renderCompositionPlot(groupValue, element, titleElement, metaElement) {
	    element.innerHTML = '<div class="composition-empty">Loading composition...</div>';
	    const tree = await buildCompositionTree(groupValue);
	    if (!tree.nodes.length || tree.nodes.every(function(node) { return !node.value; })) {
	      element.innerHTML = '<div class="composition-empty">No classified signal for this group with the current filters.</div>';
	      titleElement.textContent = groupValue || 'No group';
	      metaElement.textContent = '0 features';
	      return;
	    }
	    titleElement.textContent = groupValue || 'Selected samples';
	    metaElement.textContent = tree.sampleCount + ' sample(s), ' + tree.featureCount + ' candidate feature(s)' + (compositionFocusId === 'root' ? '' : ', focus: ' + tree.focusLabel);
	    const trace = {
	      type: 'treemap',
	      ids: tree.nodes.map(function(node) { return node.id; }),
	      labels: tree.nodes.map(function(node) { return node.label; }),
	      parents: tree.nodes.map(function(node) { return node.parent; }),
	      values: tree.nodes.map(function(node) { return node.value; }),
	      branchvalues: 'total',
	      maxdepth: compositionDepthSelect.value === 'feature' ? 4 : 3,
	      textinfo: 'label+percent parent',
	      hovertemplate: tree.nodes.map(treemapHoverText),
	      pathbar: { visible: false },
	      root: { color: '#F5F5F5' },
	      marker: {
	        colors: tree.nodes.map(function(node) { return node.color; }),
	        line: { width: 1, color: '#FFFFFF' }
	      },
	      tiling: { packing: 'squarify', pad: 2 }
	    };
	    const layout = {
	      margin: { l: 8, r: 8, t: 8, b: 8 },
	      paper_bgcolor: 'white',
	      font: { family: 'Arial, sans-serif', size: 12, color: '#14161a' },
	      uniformtext: { minsize: 9, mode: 'hide' }
	    };
	    element.innerHTML = '';
	    Plotly.react(element, [trace], layout, { displaylogo: false, responsive: true, scrollZoom: false });
	    element.on('plotly_click', function(event) {
	      const point = event.points && event.points[0];
	      if (!point) return;
	      const nodeId = point.id || (point.data && point.data.ids ? point.data.ids[point.pointNumber] : null);
	      const node = tree.nodes.find(function(item) { return item.id === nodeId; });
	      if (!node || !node.filterColumn || !node.filterValue) return;
	      const originalEvent = event.event || {};
	      if (!originalEvent.metaKey && !originalEvent.ctrlKey && !originalEvent.altKey) {
	        compositionFocusId = node.id;
	        renderComposition();
	        return;
	      }
	      if (node.filterColumn === 'npc_pathway') {
	        levelSelect.value = 'pathway';
	        pathwaySelect.selectedIndex = -1;
	        Array.from(pathwaySelect.options).forEach(function(option) { option.selected = option.value === node.filterValue; });
	      } else if (node.filterColumn === 'npc_superclass') {
	        levelSelect.value = 'superclass';
	        superclassSelect.selectedIndex = -1;
	        Array.from(superclassSelect.options).forEach(function(option) { option.selected = option.value === node.filterValue; });
	      } else if (node.filterColumn === 'npc_class') {
	        levelSelect.value = 'class';
	        classSelect.selectedIndex = -1;
	        Array.from(classSelect.options).forEach(function(option) { option.selected = option.value === node.filterValue; });
	      } else if (node.filterColumn === 'feature_id') {
	        levelSelect.value = 'feature';
	        searchInput.value = node.filterValue;
	      }
	      resetPage();
	      render();
	      activateWorkspaceTab('overview');
	    });
	  }
	  function resetCompositionPlots() {
	    compositionFocusId = 'root';
	    renderComposition();
	  }
	  function renderComposition() {
	    populateCompositionValues();
	    return Promise.all([
	      renderCompositionPlot(compositionASelect.value, compositionPlotA, compositionTitleA, compositionMetaA),
	      renderCompositionPlot(compositionBSelect.value, compositionPlotB, compositionTitleB, compositionMetaB)
	    ]);
	  }
	  function renderDrilldown(entity) {
	    if (!entity || entity.featureIds.length <= 1) {
	      clearDrilldown();
	      return;
	    }
	    const featureEntities = featureEntitiesFrom(entity);
	    const gridColumns = Math.max(1, Number(gridColumnsInput.value) || 4);
	    drilldownGrid.style.setProperty('--grid-columns', String(gridColumns));
	    drilldownTitle.textContent = 'Exploded features: ' + entity.label;
	    drilldownTab.textContent = 'Exploded: ' + entity.label.replace(/\s*\([0-9]+\s+features\)\s*$/, '');
	    drilldownGrid.innerHTML = '';
	    drilldownTab.hidden = false;
	    activateWorkspaceTab('drilldown');
	    const pendingPlots = [];
	    featureEntities.forEach(function(featureEntity, index) {
	      const card = document.createElement('article');
	      card.className = 'plot-card';
	      card.dataset.entityId = featureEntity.id;
	      card.addEventListener('click', function() { renderInfo(featureEntity); });
	      const header = document.createElement('div');
	      header.className = 'plot-card-header';
	      const title = document.createElement('div');
	      title.className = 'plot-card-title';
	      title.textContent = featureEntity.label;
	      const meta = document.createElement('div');
	      meta.className = 'plot-card-meta';
	      meta.textContent = 'feature';
	      header.appendChild(title);
	      header.appendChild(meta);
	      const plot = document.createElement('div');
	      plot.className = 'plot mini';
	      plot.id = 'drilldown_plot_' + index;
	      card.appendChild(header);
	      card.appendChild(plot);
	      drilldownGrid.appendChild(card);
	      pendingPlots.push({ entity: featureEntity, plot: plot });
	    });
	    window.requestAnimationFrame(function() {
	      pendingPlots.forEach(function(item) {
	        Promise.resolve(plotEntity(item.entity, item.plot)).then(function() {
	          resetPlotZoom(item.plot);
	        });
	      });
	    });
	  }
		  function render() {
			    populateItems();
			    const entities = sortEntities(buildEntities());
		    renderSharedLegend();
		    const selected = entities.find(function(entity) { return entity.id === itemSelect.value; }) || entities[0];
	    const gridColumns = Math.max(1, Number(gridColumnsInput.value) || 4);
	    const gridRows = Math.max(1, Number(gridRowsInput.value) || 10);
	    const gridMaxPlots = gridColumns * gridRows;
	    const totalPages = gridToggle.checked ? Math.max(1, Math.ceil(entities.length / gridMaxPlots)) : 1;
	    currentPage = Math.min(Math.max(1, currentPage), totalPages);
	    const pageStart = (currentPage - 1) * gridMaxPlots;
	    const pageEnd = pageStart + gridMaxPlots;
	    plotGrid.style.setProperty('--grid-columns', gridToggle.checked ? String(gridColumns) : '1');
	    const toPlot = gridToggle.checked ? entities.slice(pageStart, pageEnd) : (selected ? [selected] : []);
	    paginationBar.hidden = !gridToggle.checked || entities.length <= gridMaxPlots;
	    paginationLabel.textContent = 'Page ' + currentPage + ' / ' + totalPages;
	    paginationCount.textContent = entities.length ? (pageStart + 1) + '-' + Math.min(pageEnd, entities.length) + ' of ' + entities.length : '0 of 0';
	    previousPageButton.disabled = currentPage <= 1;
	    nextPageButton.disabled = currentPage >= totalPages;
	    plotGrid.innerHTML = '';
	    clearDrilldown(false);
    const pendingPlots = [];
	    toPlot.forEach(function(entity, index) {
	      const card = document.createElement('article');
	      card.className = 'plot-card';
	      card.dataset.entityId = entity.id;
	      card.addEventListener('click', function() {
	        itemSelect.value = entity.id;
	        renderInfo(entity);
	      });
      const header = document.createElement('div');
      header.className = 'plot-card-header';
      const title = document.createElement('div');
      title.className = 'plot-card-title';
      title.textContent = entity.label;
	      const meta = document.createElement('div');
	      meta.className = 'plot-card-meta';
	      meta.textContent = entity.featureIds.length + ' f.';
	      const actions = document.createElement('div');
	      actions.className = 'plot-card-actions';
	      actions.appendChild(meta);
	      if (entity.featureIds.length > 1) {
	        const explodeButton = document.createElement('button');
	        explodeButton.className = 'plot-card-action';
	        explodeButton.type = 'button';
	        explodeButton.textContent = 'Explode';
	        explodeButton.title = 'Open member features in a dashboard tab';
	        explodeButton.addEventListener('click', function(event) {
	          event.stopPropagation();
	          itemSelect.value = entity.id;
	          renderInfo(entity);
	          renderDrilldown(entity);
	        });
	        actions.appendChild(explodeButton);
	      }
	      header.appendChild(title);
	      header.appendChild(actions);
      const plot = document.createElement('div');
      plot.className = 'plot' + (toPlot.length > 1 ? ' mini' : '');
      plot.id = 'plot_' + index;
      card.appendChild(header);
      card.appendChild(plot);
      plotGrid.appendChild(card);
      pendingPlots.push({ entity: entity, plot: plot });
    });
	    window.requestAnimationFrame(function() {
	      pendingPlots.forEach(function(item) {
	        Promise.resolve(plotEntity(item.entity, item.plot)).then(function() {
	          resetPlotZoom(item.plot);
	        });
	      });
	    });
		    renderInfo(selected);
		    if (!compositionPanel.hidden) renderComposition();
		  }

  populateMetadataSelect(groupSelect, false);
	  populateMetadataSelect(facetSelect, true);
	  populateMetadataSelect(colorSelect, false);
	  populateMetadataSelect(compositionGroupSelect, false);
	  addOption(colorSelect, '__group__', 'Same as x-axis grouping');
	  colorSelect.value = '__group__';
		  sampleFilterRows.forEach(function(row) {
		    populateMetadataSelect(row.querySelector('[data-filter-column]'), true);
		    populateFilterValues(row);
		  });
		  populateTermSelect(pathwaySelect, 'npc_pathway');
		  populateTermSelect(superclassSelect, 'npc_superclass');
		  populateTermSelect(classSelect, 'npc_class');
		  populateTermSelect(componentSelect, 'component_id');
		  Array.from(document.querySelectorAll('select[multiple]')).forEach(enableClickToggleMultiSelect);
		  populateNumericFilters();
	  groupSelect.value = state.metadata_columns.indexOf('attribute_treatment') !== -1 ? 'attribute_treatment' : state.metadata_columns[0];
	  compositionGroupSelect.value = groupSelect.value;
	  levelSelect.value = 'pathway';
	  sortModeSelect.value = 'max_desc';
	  gridToggle.checked = true;
	  populateItems();
	  populateCompositionValues();
		  [
	    levelSelect, searchInput, globalSearchInput, itemSelect, groupSelect, facetSelect, colorSelect,
	    pathwaySelect, superclassSelect, classSelect, valueModeSelect,
	    componentSelect, dropSingletonsToggle, plotTypeSelect, sortModeSelect, legendModeSelect, gridToggle, pointsToggle, gridColumnsInput, gridRowsInput, groupOrderInput, groupColorsInput,
	    compositionGroupSelect, compositionASelect, compositionBSelect, compositionDepthSelect, compositionValueModeSelect
		  ].forEach(function(control) {
		    control.addEventListener('change', function() {
		      if (control !== itemSelect) resetPage();
		      if (control === compositionDepthSelect) compositionFocusId = 'root';
		      render();
		    });
		    control.addEventListener('input', function() {
		      if (control === searchInput || control === globalSearchInput || control === gridColumnsInput || control === gridRowsInput || control === groupOrderInput || control === groupColorsInput) {
		        resetPage();
		        render();
		      }
		    });
		  });
	  sampleFilterRows.forEach(function(row) {
	    const columnSelect = row.querySelector('[data-filter-column]');
	    const valuesSelect = row.querySelector('[data-filter-values]');
	    columnSelect.addEventListener('change', function() {
	      populateFilterValues(row);
	      resetPage();
	      render();
	    });
	    valuesSelect.addEventListener('change', function() {
	      resetPage();
	      render();
	    });
	  });
	  previousPageButton.addEventListener('click', function() {
	    currentPage = Math.max(1, currentPage - 1);
	    render();
	  });
	  nextPageButton.addEventListener('click', function() {
	    currentPage += 1;
	    render();
	  });
	  document.querySelector('[data-clear-npc-filters]').addEventListener('click', function() {
	    pathwaySelect.selectedIndex = -1;
	    superclassSelect.selectedIndex = -1;
	    classSelect.selectedIndex = -1;
	    componentSelect.selectedIndex = -1;
	    dropSingletonsToggle.checked = false;
	    resetPage();
	    render();
	  });
	  overviewTab.addEventListener('click', function() { activateWorkspaceTab('overview'); });
	  drilldownTab.addEventListener('click', function() { activateWorkspaceTab('drilldown'); });
	  compositionTab.addEventListener('click', function() { activateWorkspaceTab('composition'); });
	  drilldownCloseButton.addEventListener('click', clearDrilldown);
	  compositionResetButton.addEventListener('click', resetCompositionPlots);
	  useCurrentGroupsButton.addEventListener('click', function() {
	    seedCurrentGroups();
	    resetPage();
	    render();
	  });
	  function resetPlotZoom(plot) {
	    if (!plot || !plot.layout) return;
	    const update = {};
	    Object.keys(plot.layout).forEach(function(key) {
	      if (/^[xy]axis[0-9]*$/.test(key)) {
	        update[key + '.autorange'] = true;
	      }
	    });
	    Plotly.relayout(plot, update).then(function() {
	      Plotly.Plots.resize(plot);
	    });
	  }
	  document.querySelector('[data-fit-plots]').addEventListener('click', function() {
	    Array.from(document.querySelectorAll('.plot')).forEach(resetPlotZoom);
	  });
	  document.querySelector('[data-clear-filters]').addEventListener('click', function() {
	    searchInput.value = '';
	    globalSearchInput.value = '';
	    pathwaySelect.selectedIndex = -1;
	    superclassSelect.selectedIndex = -1;
	    classSelect.selectedIndex = -1;
	    componentSelect.selectedIndex = -1;
	    dropSingletonsToggle.checked = false;
	    numericFilterPanel.querySelectorAll('[data-numeric-column]').forEach(function(slider) {
	      slider.value = slider.dataset.numericMin;
	      const valueLabel = slider.closest('[data-numeric-filter]').querySelector('[data-numeric-value]');
	      if (valueLabel) valueLabel.textContent = '>= ' + formatSliderValue(slider.value);
	    });
	    sampleFilterRows.forEach(function(row) {
	      row.querySelector('[data-filter-column]').value = '';
	      row.querySelector('[data-filter-values]').innerHTML = '';
	    });
	    groupOrderInput.value = '';
	    groupColorsInput.value = '';
	    compositionFocusId = 'root';
	    resetPage();
	    render();
	  });
  render();
});

