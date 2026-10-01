
document.addEventListener('DOMContentLoaded', function () {
  const state = window.MAPP_DATA_EXPLORER;
  if (!state) {
    document.body.innerHTML = '<main class="workspace"><section class="plot-card"><div class="plot-card-header"><div class="plot-card-title">MAPP data explorer</div></div><p class="muted" style="padding:1rem">Payload missing: data_explorer_assets/data_explorer_payload.js</p></section></main>';
    return;
  }

  const levelSelect = document.querySelector('[data-level]');
  const searchInput = document.querySelector('[data-search]');
  const globalSearchInput = document.querySelector('[data-global-search]');
  const itemSelect = document.querySelector('[data-item]');
  const groupSelect = document.querySelector('[data-group]');
  const facetSelect = document.querySelector('[data-facet]');
  const colorSelect = document.querySelector('[data-color]');
  const filterColumnSelect = document.querySelector('[data-filter-column]');
  const filterValuesSelect = document.querySelector('[data-filter-values]');
  const pathwaySelect = document.querySelector('[data-pathway]');
  const superclassSelect = document.querySelector('[data-superclass]');
  const classSelect = document.querySelector('[data-class]');
  const valueModeSelect = document.querySelector('[data-value-mode]');
  const plotTypeSelect = document.querySelector('[data-plot-type]');
  const gridToggle = document.querySelector('[data-grid-toggle]');
  const pointsToggle = document.querySelector('[data-points-toggle]');
  const gridColumnsInput = document.querySelector('[data-grid-columns]');
  const gridRowsInput = document.querySelector('[data-grid-rows]');
  const plotGrid = document.querySelector('[data-plot-grid]');
  const info = document.querySelector('[data-info]');
  const countLabel = document.querySelector('[data-count]');
  const titleLabel = document.querySelector('[data-title]');
  const summaryLabel = document.querySelector('[data-summary]');

  titleLabel.textContent = state.title;
  summaryLabel.textContent = state.sample_ids.length + ' samples - ' + state.feature_metadata.length + ' features';

  const palette = ['#2563EB','#DC2626','#059669','#7C3AED','#D97706','#0891B2','#BE123C','#4B5563','#EA580C','#0F766E','#9333EA','#65A30D'];
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
  function metadataValue(sample, column) { return column ? valueText(sample[column]) : ''; }
  function featureValue(feature, column) { return valueText(feature[column]); }
  function colorFor(value, index) { return palette[index % palette.length]; }

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
  function populateFilterValues() {
    filterValuesSelect.innerHTML = '';
    const column = filterColumnSelect.value;
    if (!column) return;
    uniqueSorted(state.sample_metadata.map(function(sample) { return metadataValue(sample, column); }))
      .forEach(function(value) { addOption(filterValuesSelect, value, value); });
  }
  function passesTermFilter(feature) {
    const pathways = selectedOptions(pathwaySelect);
    const superclasses = selectedOptions(superclassSelect);
    const classes = selectedOptions(classSelect);
    if (pathways.length && pathways.indexOf(featureValue(feature, 'npc_pathway')) === -1) return false;
    if (superclasses.length && superclasses.indexOf(featureValue(feature, 'npc_superclass')) === -1) return false;
    if (classes.length && classes.indexOf(featureValue(feature, 'npc_class')) === -1) return false;
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
    const column = level === 'pathway' ? 'npc_pathway' : (level === 'superclass' ? 'npc_superclass' : 'npc_class');
    const byTerm = {};
    features.forEach(function(feature) {
      const term = featureValue(feature, column);
      if (term === 'NA') return;
      if (!byTerm[term]) byTerm[term] = [];
      byTerm[term].push(feature.feature_id);
    });
    return Object.keys(byTerm).sort(function(a,b){ return a.localeCompare(b); }).map(function(term) {
      return { id: term, label: term + ' (' + byTerm[term].length + ' features)', featureIds: byTerm[term], meta: { level: level, term: term, n_features: byTerm[term].length } };
    }).filter(function(entity) {
      return !query || entity.label.toLowerCase().indexOf(query) !== -1;
    });
  }
  function populateItems() {
    const current = itemSelect.value;
    const entities = buildEntities();
    itemSelect.innerHTML = '';
    entities.slice(0, 1000).forEach(function(entity) { addOption(itemSelect, entity.id, entity.label); });
    if (current && Array.from(itemSelect.options).some(function(option) { return option.value === current; })) itemSelect.value = current;
    countLabel.textContent = entities.length + ' matching ' + levelSelect.value + (entities.length === 1 ? '' : 's');
  }
  function selectedSamples() {
    const column = filterColumnSelect.value;
    const values = selectedOptions(filterValuesSelect);
    return state.sample_metadata.map(function(sample, index) { return { sample: sample, index: index }; })
      .filter(function(item) { return !column || !values.length || values.indexOf(metadataValue(item.sample, column)) !== -1; });
  }
  function rawEntityValues(entity) {
    const values = state.sample_ids.map(function() { return 0; });
    entity.featureIds.forEach(function(featureId) {
      const featureValues = state.intensities[featureId] || [];
      featureValues.forEach(function(value, index) {
        const numeric = Number(value);
        if (Number.isFinite(numeric)) values[index] += numeric;
      });
    });
    return values;
  }
  const totals = state.sample_ids.map(function(sampleId, index) {
    let total = 0;
    state.feature_metadata.forEach(function(feature) {
      const values = state.intensities[feature.feature_id] || [];
      const numeric = Number(values[index]);
      if (Number.isFinite(numeric)) total += numeric;
    });
    return total;
  });
  function transformedValues(entity) {
    const rawValues = rawEntityValues(entity);
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
  function formatValue(value) {
    if (value === null || value === undefined || !Number.isFinite(Number(value))) return 'NA';
    if (valueModeSelect.value === 'raw') return Number(value).toExponential(3);
    return Number(value).toPrecision(4);
  }
  function plotEntity(entity, element) {
    const values = transformedValues(entity);
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
    const facets = facetSelect.value ? uniqueSorted(rows.map(function(row) { return row.facet; })) : [''];
    const groups = uniqueSorted(rows.map(function(row) { return row.group; }));
    const colorValues = colorSelect.value === '__group__' ? groups : uniqueSorted(rows.map(function(row) { return row.color; }));
    const colorIndex = {};
    colorValues.forEach(function(value, index) { colorIndex[value] = index; });
    const traces = [];
    const legendShown = new Set();
    const annotations = [];
    facets.forEach(function(facet, facetIndex) {
      const facetRows = rows.filter(function(row) { return row.facet === facet; });
      colorValues.forEach(function(colorValue) {
        const traceGroups = colorSelect.value === '__group__' ? [colorValue] : groups;
        traceGroups.forEach(function(group) {
          const traceRows = facetRows.filter(function(row) { return row.color === colorValue && row.group === group; });
          if (!traceRows.length) return;
          const axisSuffix = facetIndex === 0 ? '' : String(facetIndex + 1);
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
            showlegend: !legendShown.has(colorValue),
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
          if (facet) {
            trace.xaxis = 'x' + axisSuffix;
            trace.yaxis = 'y' + axisSuffix;
          }
          traces.push(trace);
        });
      });
      if (facet) annotations.push({ text: facet, xref: 'paper', yref: 'paper', x: (facetIndex + 0.5) / facets.length, y: 1.03, showarrow: false, font: { size: 11 } });
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
      margin: { l: 58, r: 10, t: facets.length > 1 ? 72 : 24, b: 66 },
      paper_bgcolor: 'white',
      plot_bgcolor: 'white',
      xaxis: { title: prettyColumn(groupSelect.value), tickangle: -25, zeroline: false },
      yaxis: yAxis,
      boxmode: 'group',
      violinmode: 'group',
      annotations: annotations,
      legend: { title: { text: colorSelect.value === '__group__' ? prettyColumn(groupSelect.value) : prettyColumn(colorSelect.value) }, x: 1.02, y: 1 }
    };
    if (facets.length > 1) {
      layout.grid = { rows: 1, columns: facets.length, pattern: 'independent' };
      facets.forEach(function(facet, index) {
        const suffix = index === 0 ? '' : String(index + 1);
        layout['xaxis' + suffix] = { title: prettyColumn(groupSelect.value), tickangle: -25, zeroline: false };
        layout['yaxis' + suffix] = Object.assign({}, yAxis, index === 0 ? {} : { title: '', showticklabels: false, ticks: '' });
      });
    }
    Plotly.react(element, traces, layout, { displaylogo: false, responsive: true, scrollZoom: false });
  }
  function renderInfo(entity) {
    if (!entity) {
      info.innerHTML = '<div class="inspector-empty"><div>No selection</div><p>Select an entity or use grid mode.</p></div>';
      return;
    }
    const rows = Object.keys(entity.meta).map(function(key) {
      return '<tr><th>' + key + '</th><td>' + valueText(entity.meta[key]) + '</td></tr>';
    }).join('');
    info.innerHTML = '<section class="inspector-card"><div class="inspector-title">' + entity.label + '</div><div class="inspector-subtitle">' + entity.featureIds.length + ' feature(s)</div></section><section class="inspector-card"><table class="feature-table">' + rows + '</table></section>';
  }
  function render() {
    populateItems();
    const entities = buildEntities();
    const selected = entities.find(function(entity) { return entity.id === itemSelect.value; }) || entities[0];
    const gridColumns = Math.max(1, Number(gridColumnsInput.value) || 4);
    const gridRows = Math.max(1, Number(gridRowsInput.value) || 10);
    const gridMaxPlots = gridColumns * gridRows;
    plotGrid.style.setProperty('--grid-columns', gridToggle.checked ? String(gridColumns) : '1');
    const toPlot = gridToggle.checked ? entities.slice(0, gridMaxPlots) : (selected ? [selected] : []);
    plotGrid.innerHTML = '';
    const pendingPlots = [];
    toPlot.forEach(function(entity, index) {
      const card = document.createElement('article');
      card.className = 'plot-card';
      card.addEventListener('click', function() { renderInfo(entity); });
      const header = document.createElement('div');
      header.className = 'plot-card-header';
      const title = document.createElement('div');
      title.className = 'plot-card-title';
      title.textContent = entity.label;
      const meta = document.createElement('div');
      meta.className = 'plot-card-meta';
      meta.textContent = entity.featureIds.length + ' f.';
      header.appendChild(title);
      header.appendChild(meta);
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
        plotEntity(item.entity, item.plot);
        setTimeout(function() { Plotly.Plots.resize(item.plot); }, 0);
      });
    });
    renderInfo(selected);
  }

  populateMetadataSelect(groupSelect, false);
  populateMetadataSelect(facetSelect, true);
  populateMetadataSelect(colorSelect, false);
  addOption(colorSelect, '__group__', 'Same as x-axis grouping');
  colorSelect.value = '__group__';
  populateMetadataSelect(filterColumnSelect, true);
  populateTermSelect(pathwaySelect, 'npc_pathway');
  populateTermSelect(superclassSelect, 'npc_superclass');
  populateTermSelect(classSelect, 'npc_class');
  groupSelect.value = state.metadata_columns.indexOf('attribute_treatment') !== -1 ? 'attribute_treatment' : state.metadata_columns[0];
  populateFilterValues();
  populateItems();
  [
    levelSelect, searchInput, globalSearchInput, itemSelect, groupSelect, facetSelect, colorSelect, filterColumnSelect,
    filterValuesSelect, pathwaySelect, superclassSelect, classSelect, valueModeSelect,
    plotTypeSelect, gridToggle, pointsToggle, gridColumnsInput, gridRowsInput
  ].forEach(function(control) {
    control.addEventListener('change', function() {
      if (control === filterColumnSelect) populateFilterValues();
      render();
    });
    control.addEventListener('input', function() {
      if (control === searchInput || control === globalSearchInput || control === gridColumnsInput || control === gridRowsInput) render();
    });
  });
  document.querySelector('[data-fit-plots]').addEventListener('click', function() {
    Array.from(document.querySelectorAll('.plot')).forEach(function(plot) { Plotly.Plots.resize(plot); });
  });
  document.querySelector('[data-clear-filters]').addEventListener('click', function() {
    searchInput.value = '';
    globalSearchInput.value = '';
    pathwaySelect.selectedIndex = -1;
    superclassSelect.selectedIndex = -1;
    classSelect.selectedIndex = -1;
    filterColumnSelect.value = '';
    populateFilterValues();
    render();
  });
  render();
});

