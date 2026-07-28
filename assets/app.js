"use strict";
window.PSMM_API_BASE = 'https://badge-renewed-oat.ngrok-free.dev';

const state = {
  manifest: null,
  paper: null,
  data: null,
  tab: "discover",
  query: "",
  selectedKind: null,
  selectedId: null,
  includeAccepted: true,
  includeHypothesis: false,
  includeRejected: false,
  showSharedContext: false,
  orphanOnly: false,
  entityScope: "paper",
  entityType: "all",
  enrichedTraitFilter: "all",
  relationClass: "all",
  normalizedOnly: false,
  pathStart: "",
  pathEnd: "",
  pathStartId: "",
  pathEndId: "",
  pathMaxEdges: 5,
  pathUseRelations: true,
  pathUseHyperedges: true,
  pathUseDependencies: true,
  pathUseOntologyBridges: true,
  pathUseContext: false,
  pathIncludeHypothesis: true,
  pathIncludeRejected: false,
  pathResults: [],
  pathStatus: "",
  discoverStart: "",
  discoverEnd: "",
  discoverStartId: "",
  discoverEndId: "",
  discoverLens: "all",
  discoverMaxEdges: 5,
  discoverResults: [],
  discoverStatus: "",
  annotationInput: "",
  annotationResults: [],
  annotationEnrichment: [],
  annotationStatus: "",
  annotationEditing: false,
  annotationCategory: "auto",
  annotationSelectionIds: {},
  relationCompoundInput: "",
  relationFastaInput: "",
  relationActiveSubTab: "compound",
  relationSearchMethod: "seq2graph",
  relationAttributeFilters: {
    genes: true,
    metabolites: true,
    pathways: true,
    tissues: true,
    species: true,
    experimental_conditions: true,
    plant_traits: true,
    molecular_traits: true,
    human_traits: false
  },
  relationExtractionResults: [],
  relationExtractionStatus: "",
  relationExtractionPage: 0,
  relationOutputAttributeFilter: "all",
  relationOutputSpeciesFilter: "all",
  relationOutputTissueFilter: "all",
  relationOutputEnrichmentContextOnly: false,
  relationOutputDirectOnly: false,
  relationOutputBestContextOnly: false,
  relationSequenceMatches: [],
  relationCompoundMatches: [],
  relationEvalue: 0.001,
  relationMinSeqId: "0.8",
  relationK: 5,
  relationMinSimilarity: "",
  relationSelectedMatchEntity: null,
  showAdvancedSearchOptions: false,
  relationOutputBestContextOnly: false,
  sequenceIndex: null,
  sequenceIndexLoading: false,
  sequenceIndexPromise: null,
  disclosureOpen: {},
  focusedRelationId: "",
  listPage: 0,
  listPageSize: 12,
  globalPathIndex: null,
  globalPathIndexes: null,
  globalPathLoading: false,
  globalPathPromise: null,
  returnStack: [],
  enrichedTraits: [],
  indexes: null
};

const els = {
  buildText: document.getElementById("buildText"),
  paperSelect: document.getElementById("paperSelect"),
  searchInput: document.getElementById("searchInput"),
  paperTitle: document.getElementById("paperTitle"),
  paperMeta: document.getElementById("paperMeta"),
  statsGrid: document.getElementById("statsGrid"),
  filterPanel: document.getElementById("filterPanel"),
  listTitle: document.getElementById("listTitle"),
  listCount: document.getElementById("listCount"),
  resultList: document.getElementById("resultList"),
  mainPanel: document.getElementById("mainPanel"),
  inspectorPanel: document.getElementById("inspectorPanel"),
  modal: document.getElementById("entityModal"),
  modalBody: document.getElementById("modalBody")
};

const eventPalette = {
  metabolite_or_compound_event: "#0f766e",
  phenotype_or_trait_event: "#8b5e83",
  stress_response_event: "#ad6528",
  gene_expression_regulation_event: "#34699a",
  protein_or_molecular_activity_event: "#4f7f58",
  biochemical_reaction_event: "#a9473f",
  localization_or_expression_event: "#665a8e",
  experimental_observation_event: "#8a743a",
  background_fact_event: "#6e7a75",
  unknown: "#727d79"
};

const entityPalette = {
  gene_protein: "#b23a48",
  gene: "#b23a48",
  protein: "#b23a48",
  compound: "#b66a1f",
  pathway_or_process: "#6256a5",
  plant_trait: "#3f6475",
  molecular_trait_or_function: "#3f6475",
  experimental_condition: "#246b88",
  taxon: "#6b783c",
  genotype: "#7c6a43",
  anatomical_structure: "#7e6077",
  cellular_component: "#5d7980",
  condition_parameter: "#6c756f",
  entity: "#68726f",
  unknown: "#68726f"
};

const dependencyPalette = {
  activates_or_induces: "#0f766e",
  produces_or_enables: "#2f7d55",
  supports_trait_outcome: "#a4475b",
  represses_or_reduces: "#4b6b85",
  causal_upstream_of: "#6958a5",
  part_of_pathway: "#a46225",
  supports_mechanism_for: "#3b6f92",
  same_experimental_contrast: "#806f3d",
  correlation_or_association: "#84606b",
  shared_context: "#747d78",
  background_mechanism: "#5d7d4c",
  causal_dependency: "#6958a5",
  author_interpreted_link: "#934555",
  hypothesized_link: "#747a31",
  none: "#9aa3a0",
  unknown: "#737b78"
};

const discoveryLowSignalTypes = new Set([
  "condition_parameter",
  "assay_method",
  "developmental_stage",
  "genotype",
  "taxon",
  "anatomical_structure"
]);

const discoveryLowSignalOntologies = new Set([
  "UO",
  "NCBITaxon"
]);

const lowSignalLabelPattern = /\b(\d+\s*(h|hr|hour|hours|min|minute|minutes|day|days)|hpi|dpi|hour|hours|minute|minutes|day|days|week|weeks|month|months|celsius|kelvin|gram|grams|mg|ug|μg|kg|mm|cm|meter|metre|percent|percentage|mol|mmol|micromolar|nanomolar)\b/i;

function esc(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function fmt(value) {
  return new Intl.NumberFormat().format(Number(value || 0));
}

function clean(value) {
  return String(value || "unknown").replace(/_event$/, "").replaceAll("_", " ");
}

function cleanOptionalDisplay(value) {
  return String(value || "").replace(/_event$/, "").replaceAll("_", " ").trim();
}

function canonicalTier(tier) {
  return String(tier || "");
}

function isHypothesisTier(tier) {
  return canonicalTier(tier) === "hypothesis";
}

function tierClass(tier) {
  return canonicalTier(tier) || "candidate";
}

function tierLabel(tier) {
  const canonical = canonicalTier(tier);
  if (canonical === "accepted") return "Supported";
  if (canonical === "hypothesis") return "Hypothesis";
  if (canonical === "rejected") return "Rejected";
  return clean(canonical || tier || "candidate");
}

function shortId(value) {
  const parts = String(value || "").split(".");
  return parts[parts.length - 1] || String(value || "");
}

function asArray(value) {
  return Array.isArray(value) ? value : value ? [value] : [];
}

function sentenceText(sentenceId) {
  const sentence = state.indexes?.sentenceById.get(sentenceId);
  if (!sentence) return sentenceId;
  return `${sentenceId}: ${sentence.text}`;
}

function colorForEvent(type) {
  return eventPalette[type] || eventPalette.unknown;
}

function colorForEntity(type) {
  return entityPalette[type] || entityPalette.unknown;
}

function colorForDependency(type) {
  return dependencyPalette[type] || dependencyPalette.unknown;
}

function normalizeType(value) {
  const first = Array.isArray(value) ? value[0] : value;
  return first || "unknown";
}

function ontologyLabel(entity) {
  if (!entity) return "";
  const concepts = selectedConcepts(entity);
  if (concepts.length) return concepts.map(conceptDisplayLabel).join(", ");
  const label = entity.selected_label || "";
  const ontologyId = entity.selected_ontology_id || "";
  if (label && ontologyId) return `${label} (${ontologyId})`;
  return label || ontologyId || geneProteinOntologyLabel(entity) || entity.normalized_label || "";
}

function selectedConcepts(entity) {
  return asArray(entity?.selected_concepts)
    .filter((concept) => concept && typeof concept === "object" && (concept.id || concept.ontology_id));
}

function conceptDisplayLabel(concept) {
  const id = concept.id || concept.ontology_id || "";
  const label = concept.label || id;
  return label && id ? `${label} (${id})` : label || id;
}

function entityOntologyIds(entity) {
  return uniqueStrings([
    entity?.selected_ontology_id,
    entity?.ontology_id,
    ...asArray(entity?.selected_ontology_ids),
    ...asArray(entity?.ontology_ids),
    ...selectedConcepts(entity).map((concept) => concept.id || concept.ontology_id),
    ...geneProteinOntologyIds(entity)
  ]).filter(Boolean);
}

function entityName(entity) {
  if (!entity) return "Unknown entity";
  return entity.canonical_form || entity.normalized_label || entity.node_id;
}

function entityStableId(entity) {
  return entity?.node_id || entity?.id || "";
}

function contextEntityMergeKey(entity) {
  if (!entity) return "";
  const ids = entityOntologyIds(entity).map((id) => String(id || "").trim().toLowerCase()).filter(Boolean).sort();
  if (!ids.length) return `node:${String(entityStableId(entity)).toLowerCase()}`;
  return ids.length === 1 ? `ontology:${ids[0]}` : `ontology-set:${ids.join("|")}`;
}

function contextEntityMemberIds(entity) {
  return uniqueStrings([entityStableId(entity), ...asArray(entity?.merged_node_ids)]).filter(Boolean);
}

function mergeContextEntitiesByOntology(entities) {
  const groups = new Map();
  asArray(entities).filter(Boolean).forEach((entity) => {
    const key = contextEntityMergeKey(entity);
    if (!key) return;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(entity);
  });
  return Array.from(groups.values()).map((items) => {
    const uniqueItems = uniqueBy(items, entityStableId);
    if (uniqueItems.length === 1) return uniqueItems[0];
    const representative = uniqueItems[0];
    const aliases = uniqueStrings(uniqueItems.flatMap((entity) => [
      entityName(entity),
      entity.canonical_form,
      entity.normalized_label,
      entity.selected_label,
      ...asArray(entity.aliases)
    ])).filter(Boolean);
    return {
      ...representative,
      canonical_form: entityName(representative),
      aliases,
      ontology_ids: uniqueStrings(uniqueItems.flatMap(entityOntologyIds)),
      selected_ontology_ids: uniqueStrings(uniqueItems.flatMap((entity) => asArray(entity.selected_ontology_ids))),
      merged_node_ids: uniqueStrings(uniqueItems.map(entityStableId)),
      context_merge_count: uniqueItems.length
    };
  });
}

function entitySearchText(entity) {
  return [
    entity.node_id,
    entity.global_node_id,
    entity.canonical_form,
    entity.normalized_label,
    entity.selected_label,
    entity.selected_ontology_id,
    entity.selected_description,
    asArray(entity.selected_ontology_ids).join(" "),
    asArray(entity.selected_labels).join(" "),
    asArray(entity.selected_descriptions).join(" "),
    selectedConcepts(entity).map((concept) => [concept.id, concept.label, concept.description].filter(Boolean).join(" ")).join(" "),
    entity.entity_type,
    asArray(entity.aliases).join(" "),
    compoundSearchText(entity),
    geneProteinSearchText(entity)
  ].join(" ").toLowerCase();
}

function badges(values, className = "", limit = 14) {
  const items = asArray(values).filter(Boolean);
  if (!items.length) return `<span class="muted">-</span>`;
  const shown = items.slice(0, limit).map((value) => {
    const cls = className ? ` ${className}` : "";
    return `<span class="badge${cls}">${esc(clean(value))}</span>`;
  }).join("");
  return shown + (items.length > limit ? `<span class="badge">+${items.length - limit}</span>` : "");
}

function enrichmentBadges(enrichments, limit = 14) {
  const items = asArray(enrichments).filter(Boolean);
  if (!items.length) return `<span class="muted">-</span>`;
  
  const uniqueFiltered = [];
  const seenConcepts = new Set();
  
  for (const e of items) {
    const cat = e.category || 'molecular_traits';
    if (state.relationAttributeFilters && state.relationAttributeFilters[cat] === false) {
      continue;
    }
    const concept = e.trait_concept || e.term;
    if (!seenConcepts.has(concept)) {
      seenConcepts.add(concept);
      uniqueFiltered.push(e);
    }
  }

  if (!uniqueFiltered.length) return `<span class="muted">No matches for active filters</span>`;

  const categoryToEntityPalette = {
    genes: "gene",
    tissues: "anatomical_structure",
    plant_traits: "plant_trait",
    metabolites: "compound",
    species: "taxon",
    molecular_traits: "molecular_trait_or_function",
    pathways: "pathway_or_process",
    experimental_conditions: "experimental_condition",
    human_traits: "cellular_component"
  };

  const shown = uniqueFiltered.slice(0, limit).map((e) => {
    const cat = e.category || 'molecular_traits';
    const mappedType = categoryToEntityPalette[cat] || 'unknown';
    const color = colorForEntity(mappedType);
    const label = e.trait_label || e.trait_concept;
    return `<span class="badge enrichment" style="border-left: 3px solid ${color}; padding-left: 6px;" title="Category: ${esc(cat)}">${esc(clean(label))} (${esc(concept)})</span>`;
  }).join("");

  return shown + (uniqueFiltered.length > limit ? `<span class="badge">+${uniqueFiltered.length - limit}</span>` : "");
}

function installGlobalHandlers() {
  els.paperSelect.addEventListener("change", () => loadPaper(els.paperSelect.value));
  els.searchInput.addEventListener("input", () => {
    state.query = els.searchInput.value;
    state.pathResults = [];
    state.listPage = 0;
    render();
  });

  document.body.addEventListener("input", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    if (target.id === "pathStartInput") state.pathStart = target.value;
    if (target.id === "pathEndInput") state.pathEnd = target.value;
    if (target.id === "pathMaxEdges") state.pathMaxEdges = Number(target.value || 5);
    if (target.id === "discoverStartInput") state.discoverStart = target.value;
    if (target.id === "discoverEndInput") state.discoverEnd = target.value;
    if (target.id === "discoverMaxEdges") state.discoverMaxEdges = Number(target.value || 5);
    if (target.id === "annotationInput") state.annotationInput = target.value;
  });

  document.body.addEventListener("change", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    const key = target.getAttribute("data-state-key");
    if (!key) return;
    if (target instanceof HTMLInputElement && target.type === "checkbox") {
      state[key] = target.checked;
    } else if (target instanceof HTMLInputElement && target.type === "radio") {
      if (target.checked) state[key] = target.value;
    } else if (target instanceof HTMLInputElement) {
      if (target.type === "number") {
        state[key] = target.value === "" ? "" : Number(target.value);
      } else {
        state[key] = target.value;
      }
    } else if (target instanceof HTMLSelectElement) {
      state[key] = target.value;
    }
    if (key === "entityScope" || key === "entityType") {
      state.selectedKind = null;
      state.selectedId = null;
    }
    if (key && key.startsWith("relationOutput")) {
      state.relationExtractionPage = 0;
    }
    state.pathResults = [];
    state.discoverResults = [];
    state.listPage = 0;
    render();
  });

  document.body.addEventListener("mouseover", (event) => {
    const target = event.target instanceof Element ? event.target.closest("[data-relation-context-id]") : null;
    if (!target) return;
    updateRelationContextFocus(
      target.getAttribute("data-relation-context-id") || "",
      target.getAttribute("data-relation-event-id") || ""
    );
  });

  document.addEventListener("click", (event) => {
    const clicked = event.target instanceof Element ? event.target : event.target?.parentElement;
    closeRelationOutputMoreMenus(clicked);
  }, true);

  document.addEventListener("click", (event) => {
    if (event.__psfdActionHandled) return;
    const clicked = event.target instanceof Element ? event.target : event.target?.parentElement;
    if (!clicked) return;
    const annotationTarget = clicked.closest(annotationControlSelector());
    if (!annotationTarget) return;
    const handled = runAnnotationControlAction(annotationTarget);
    if (!handled) return;
    event.__psfdActionHandled = true;
    event.preventDefault();
    event.stopPropagation();
  }, true);

  document.addEventListener("click", (event) => {
    if (event.__psfdActionHandled) return;
    const clicked = event.target instanceof Element ? event.target : event.target?.parentElement;
    if (!clicked) return;
    const actionTarget = clicked.closest("[data-action]");
    if (!actionTarget) return;
    const handled = runButtonAction(actionTarget.getAttribute("data-action"), actionTarget.getAttribute("data-id") || "", actionTarget);
    if (!handled) return;
    event.__psfdActionHandled = true;
    event.preventDefault();
    event.stopPropagation();
  }, true);

  document.body.addEventListener("click", (event) => {
    if (event.__psfdActionHandled) return;
    const clicked = event.target instanceof Element ? event.target : event.target?.parentElement;
    if (!clicked) return;
    const closeTarget = clicked.closest("[data-close-modal]");
    if (closeTarget) {
      event.__psfdActionHandled = true;
      event.preventDefault();
      event.stopPropagation();
      closeEntityModal();
      return;
    }
    const relationSearchTarget = clicked.closest("[data-relation-search]");
    if (relationSearchTarget) {
      event.__psfdActionHandled = true;
      event.preventDefault();
      event.stopPropagation();
      state.relationActiveSubTab = "compound";
      state.relationCompoundInput = relationSearchTarget.getAttribute("data-relation-search");
      const compoundInput = document.getElementById("relationCompoundInput");
      if (compoundInput) compoundInput.value = state.relationCompoundInput;
      render();
      setTimeout(() => runRelationExtraction(), 0);
      return;
    }
    const tab = clicked.closest("button[data-tab]");
    if (tab) {
      event.__psfdActionHandled = true;
      event.preventDefault();
      event.stopPropagation();
      state.tab = tab.getAttribute("data-tab");
      state.pathResults = [];
      state.listPage = 0;
      render();
      return;
    }
    const annotationTarget = clicked.closest(annotationControlSelector());
    if (annotationTarget) {
      const handled = runAnnotationControlAction(annotationTarget);
      if (!handled) return;
      event.__psfdActionHandled = true;
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    const actionTarget = clicked.closest("[data-action]");
    if (!actionTarget) return;
    const action = actionTarget.getAttribute("data-action");
    const id = actionTarget.getAttribute("data-id") || "";
    const handled = runButtonAction(action, id, actionTarget);
    if (!handled) return;
    event.__psfdActionHandled = true;
    event.preventDefault();
    event.stopPropagation();
  }, true);
}

function captureViewState() {
  return {
    paper: state.paper,
    tab: state.tab,
    selectedKind: state.selectedKind,
    selectedId: state.selectedId,
    query: state.query,
    includeAccepted: state.includeAccepted,
    includeHypothesis: state.includeHypothesis,
    includeRejected: state.includeRejected,
    showSharedContext: state.showSharedContext,
    orphanOnly: state.orphanOnly,
    entityScope: state.entityScope,
    entityType: state.entityType,
    relationClass: state.relationClass,
    normalizedOnly: state.normalizedOnly,
    listPage: state.listPage
  };
}

function pushReturnState() {
  const view = captureViewState();
  if (!view.paper && !view.tab) return;
  const last = state.returnStack[state.returnStack.length - 1];
  if (last && sameViewState(last, view)) return;
  state.returnStack.push(view);
  if (state.returnStack.length > 30) state.returnStack.shift();
}

function sameViewState(a, b) {
  return [
    "paper",
    "tab",
    "selectedKind",
    "selectedId",
    "query",
    "entityScope",
    "entityType",
    "enrichedTraitFilter",
    "relationClass",
    "listPage"
  ].every((key) => String(a?.[key] ?? "") === String(b?.[key] ?? ""));
}

async function restoreReturnState() {
  const view = state.returnStack.pop();
  if (!view) return;
  if (view.paper && view.paper !== state.paper) {
    await loadPaper(view.paper, { preservePath: true, skipRender: true });
  }
  applyViewState(view);
  render();
  if (typeof requestAnimationFrame === "function") {
    requestAnimationFrame(() => els.mainPanel?.scrollIntoView({ block: "start", behavior: "smooth" }));
  }
}

function applyViewState(view) {
  [
    "tab",
    "selectedKind",
    "selectedId",
    "query",
    "includeAccepted",
    "includeHypothesis",
    "includeRejected",
    "showSharedContext",
    "orphanOnly",
    "entityScope",
    "entityType",
    "enrichedTraitFilter",
    "relationClass",
    "normalizedOnly",
    "listPage"
  ].forEach((key) => {
    if (Object.prototype.hasOwnProperty.call(view, key)) state[key] = view[key];
  });
  if (els.searchInput) els.searchInput.value = state.query || "";
}

function returnControl() {
  if (!state.returnStack.length) return "";
  return `<button class="return-button" type="button" data-action="return-view">Return</button>`;
}

function closeRelationOutputMoreMenus(clicked) {
  document.querySelectorAll(".relation-output-more-context[open]").forEach((details) => {
    if (clicked && details.contains(clicked)) return;
    details.removeAttribute("open");
  });
}

function annotationControlSelector() {
  return "[data-annotation-action], [data-annotation-example], [data-annotation-select-match], [data-annotation-tab], [data-annotation-search], [data-relation-extract-action], [data-sequence-example], [data-relation-tab]";
}

function runAnnotationControlAction(target) {
  const action = target.getAttribute("data-annotation-action");
  if (action === "annotate") {
    const liveInput = document.getElementById("annotationInput");
    if (liveInput) state.annotationInput = liveInput.value;
    window.setTimeout(() => runAnnotationLookup(), 0);
    return true;
  }
  if (action === "download-annotations") {
    window.setTimeout(() => exportAnnotationTable(), 0);
    return true;
  }
  if (action === "download-enrichment") {
    window.setTimeout(() => exportEnrichmentTable(), 0);
    return true;
  }
  const relationAction = target.getAttribute("data-relation-extract-action");
  if (relationAction === "extract") {
    window.setTimeout(() => runRelationExtraction(), 0);
    return true;
  }
  if (relationAction === "download") {
    window.setTimeout(() => exportRelationExtractionTable(), 0);
    return true;
  }
  const relationTab = target.getAttribute("data-relation-tab");
  if (relationTab !== null) {
    const compoundInput = document.getElementById("relationCompoundInput");
    const fastaInput = document.getElementById("relationFastaInput");
    if (compoundInput) state.relationCompoundInput = compoundInput.value;
    if (fastaInput) state.relationFastaInput = fastaInput.value;
    window.setTimeout(() => {
      state.relationActiveSubTab = relationTab;
      render();
    }, 0);
    return true;
  }
  const sequenceExample = target.getAttribute("data-sequence-example");
  if (sequenceExample !== null) {
    window.setTimeout(() => setRelationExtractionExample(sequenceExample), 0);
    return true;
  }
  const example = target.getAttribute("data-annotation-example");
  if (example !== null) {
    window.setTimeout(() => setAnnotationExample(example), 0);
    return true;
  }
  const selectedFastaMatch = target.getAttribute("data-annotation-select-fasta-match");
  if (selectedFastaMatch !== null) {
    window.setTimeout(() => {
      state.relationSelectedMatchEntity = selectedFastaMatch;
      render();
    }, 0);
    return true;
  }
  const selectedMatch = target.getAttribute("data-annotation-select-match");
  if (selectedMatch !== null) {
    const term = target.getAttribute("data-term") || "";
    if (!term || !selectedMatch) return true;
    window.setTimeout(() => {
      state.annotationSelectionIds[term] = selectedMatch;
      state.annotationEnrichment = computeAnnotationEnrichment();
      state.annotationStatus = `Showing ${annotationMeaningCategory(state.globalPathIndexes?.entityById?.get(selectedMatch) || {})} meaning for ${term}.`;
      render();
    }, 0);
    return true;
  }
  const tab = target.getAttribute("data-annotation-tab");
  if (tab !== null) {
    window.setTimeout(() => {
      state.tab = tab || state.tab;
      state.pathResults = [];
      state.listPage = 0;
      render();
    }, 0);
    return true;
  }
  const search = target.getAttribute("data-annotation-search");
  if (search !== null) {
    const searchTab = target.getAttribute("data-annotation-search-tab") || "entities";
    const searchPmcid = target.getAttribute("data-annotation-pmcid") || "";
    window.setTimeout(() => {
      openAnnotationSearch(search || "", searchTab, searchPmcid).catch(reportButtonActionError);
    }, 0);
    return true;
  }
  return false;
}

function runButtonAction(action, id, actionTarget) {
  switch (action) {
    case "return-view":
      restoreReturnState().catch(reportButtonActionError);
      return true;
    case "select-dependency":
      navigateLocalItem("dependency", id);
      return true;
    case "select-event":
      navigateLocalItem("event", id);
      return true;
    case "select-relation":
      navigateLocalItem("relation", id);
      return true;
    case "focus-relation-context":
      updateRelationContextFocus(id, actionTarget.closest("[data-relation-event-id]")?.getAttribute("data-relation-event-id") || "");
      return true;
    case "select-entity":
      navigateLocalItem("entity", id);
      return true;
    case "open-entity":
      openEntityModal(id);
      return true;
    case "show-participants":
      openParticipantGroupModal(id, actionTarget.getAttribute("data-group") || "");
      return true;
    case "path-start":
    case "discover-start":
      setPathEndpoint("start", id);
      return true;
    case "path-end":
    case "discover-end":
      setPathEndpoint("end", id);
      return true;
    case "find-paths":
      runPathSearch();
      return true;
    case "find-hypotheses":
      runHypothesisSearch();
      return true;
    case "annotate-entities":
      runAnnotationLookup();
      return true;
    case "download-annotations":
      exportAnnotationTable();
      return true;
    case "download-enrichment":
      exportEnrichmentTable();
      return true;
    case "set-annotation-example":
      setAnnotationExample(actionTarget.getAttribute("data-example") || "").catch(reportButtonActionError);
      return true;
    case "set-entity-type":
      state.entityType = actionTarget.getAttribute("data-value") || "all";
      state.listPage = 0;
      render();
      return true;
    case "toggle-advanced-search":
      state.showAdvancedSearchOptions = !state.showAdvancedSearchOptions;
      render();
      return true;
    case "toggle-disclosure":
      toggleDisclosure(id);
      return true;
    case "export-hypothesis":
      exportHypothesisReport(Number(actionTarget.getAttribute("data-index") || 0));
      return true;
    case "select-global":
      selectGlobalItem(
        actionTarget.getAttribute("data-kind") || "",
        id,
        actionTarget.getAttribute("data-pmcid") || ""
      ).catch(reportButtonActionError);
      return true;
    case "list-prev":
      state.listPage = Math.max(0, state.listPage - 1);
      render();
      return true;
    case "list-next":
      state.listPage += 1;
      render();
      return true;
    case "load-compound":
      loadCompoundData(id);
      return true;
    case "load-fasta":
      loadFastaData(id, actionTarget.getAttribute("data-accession") || "", actionTarget);
      return true;
    case "download-fasta":
      downloadFastaData(id, actionTarget.getAttribute("data-accession") || "", actionTarget);
      return true;
    case "load-phytozome-fasta":
      loadPhytozomeFastaData(id, actionTarget.getAttribute("data-gene-id") || "", actionTarget);
      return true;
    case "download-phytozome-fasta":
      downloadPhytozomeFastaData(id, actionTarget.getAttribute("data-gene-id") || "", actionTarget);
      return true;
    default:
      return false;
  }
}

function reportButtonActionError(error) {
  console.error(error);
  state.annotationStatus = `Could not open the selected object: ${error.message || error}`;
  if (state.tab === "discover") render();
}

async function init() {
  els.mainPanel.innerHTML = document.getElementById("loadingTemplate").innerHTML;
  installGlobalHandlers();
  const manifest = await fetchJson("data/manifest.json");
  state.manifest = manifest;
  state.enrichedTraits = await fetchJson("enriched_traits").catch(() => []);
  els.buildText.textContent = `Generated ${manifest.generated_at}`;
  els.paperSelect.innerHTML = manifest.papers.map((paper) => (
    `<option value="${esc(paper.pmcid)}">${esc(paper.pmcid)}</option>`
  )).join("");
  const defaultPaper = manifest.papers
    .slice()
    .sort((a, b) => (b.stats.accepted_dependencies || 0) - (a.stats.accepted_dependencies || 0))[0];
  await loadPaper(defaultPaper.pmcid);
}

async function fetchJson(path) {
  const url = path.startsWith('http') ? path : `${window.PSMM_API_BASE}/api/${path}`;
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) throw new Error(`Could not load ${url}: ${response.status}`);
  return response.json();
}

function normalizePaperRelations(data) {
  const entityById = new Map(asArray(data.entities).map((item) => [item.node_id, item]));
  const rawRelations = asArray(data.relations);
  const relations = mergeDuplicateRelations(rawRelations, {
    entityById,
    idKey: "record_id",
    subjectKey: "subject_node_id",
    objectKey: "object_node_id",
    contextKey: "context_node_ids",
    eventKey: "event_ids",
    pmcid: data.pmcid || data.article?.pmcid || ""
  });
  return {
    ...data,
    raw_relations: rawRelations,
    relations,
    stats: {
      ...(data.stats || {}),
      raw_relations: rawRelations.length,
      relations: relations.length,
      merged_duplicate_relations: Math.max(0, rawRelations.length - relations.length)
    }
  };
}

function normalizeGlobalRelations(payload) {
  const entityById = new Map(asArray(payload.entities).map((item) => [item.id, item]));
  const relations = mergeDuplicateRelations(asArray(payload.relations), {
    entityById,
    idKey: "id",
    subjectKey: "subject_entity_id",
    objectKey: "object_entity_id",
    contextKey: "context_entity_ids",
    eventKey: "event_ids",
    global: true
  });
  return {
    ...payload,
    relations,
    stats: {
      ...(payload.stats || {}),
      entities: asArray(payload.entities).length,
      concepts: asArray(payload.concepts).length,
      raw_relations: asArray(payload.relations).length,
      relations: relations.length,
      merged_duplicate_relations: Math.max(0, asArray(payload.relations).length - relations.length)
    }
  };
}

function mergeDuplicateRelations(relations, options) {
  const keyToGroup = new Map();
  const groups = [];

  relations.forEach((rel) => {
    const keys = relationMergeKeys(rel, options);
    const matchedGroups = uniqueBy(keys.map((key) => keyToGroup.get(key)).filter(Boolean), (group) => group.uid);
    let group = matchedGroups[0];
    if (!group) {
      group = { uid: `group.${groups.length + 1}`, keys: new Set(), relations: [], mergedInto: null };
      groups.push(group);
    }
    matchedGroups.slice(1).forEach((other) => {
      if (other === group || other.mergedInto) return;
      other.relations.forEach((item) => group.relations.push(item));
      other.keys.forEach((key) => {
        group.keys.add(key);
        keyToGroup.set(key, group);
      });
      other.mergedInto = group;
    });
    keys.forEach((key) => {
      group.keys.add(key);
      keyToGroup.set(key, group);
    });
    group.relations.push(rel);
  });

  return groups
    .filter((group) => !group.mergedInto)
    .map((group) => mergeRelationGroup(group.relations, options));
}

function relationMergeKeys(rel, options) {
  const keys = [];
  const pmcid = rel.pmcid || options.pmcid || "";
  const predicate = normalizeMergeText(rel.predicate || rel.predicate_class || "");
  const exactTriple = normalizeMergeText(rel.triple || `${rel.subject || ""} ${rel.predicate || ""} ${rel.object || ""}`);
  if (exactTriple) keys.push(`exact|${pmcid}|${exactTriple}`);
  const subjectKey = relationEndpointOntologyKey(rel, options.subjectKey, options.entityById);
  const objectKey = relationEndpointOntologyKey(rel, options.objectKey, options.entityById);
  if (predicate && subjectKey && objectKey) {
    keys.push(`ontology|${pmcid}|${predicate}|${subjectKey}|${objectKey}`);
  }
  return keys.length ? keys : [`id|${pmcid}|${relationIdValue(rel, options)}`];
}

function relationEndpointOntologyKey(rel, field, entityById) {
  const id = rel[field];
  const entity = entityById.get(id);
  const ids = entity ? entityOntologyIds(entity) : [];
  if (!ids.length) return "";
  return ids.map((value) => String(value).trim()).filter(Boolean).sort().join("|");
}

function normalizeMergeText(value) {
  return String(value || "").replace(/\s+/g, " ").trim().toLowerCase();
}

function relationIdValue(rel, options) {
  return rel[options.idKey] || rel.record_id || rel.id || "";
}

function mergeRelationGroup(groupRelations, options) {
  const primary = { ...groupRelations[0] };
  const idKey = options.idKey;
  const subjectIdsKey = options.global ? "subject_entity_ids" : "subject_node_ids";
  const objectIdsKey = options.global ? "object_entity_ids" : "object_node_ids";
  const contextKey = options.contextKey;
  const eventKey = options.eventKey;
  const mergedIds = uniqueStrings(groupRelations.map((rel) => relationIdValue(rel, options)));

  primary.merged_relation_ids = mergedIds;
  primary.duplicate_count = mergedIds.length;
  primary[idKey] = relationIdValue(primary, options) || mergedIds[0];
  primary.source_relation_ids = uniqueStrings(groupRelations.flatMap((rel) => asArray(rel.source_relation_ids).concat(asArray(rel.source_relation_id))));
  primary[subjectIdsKey] = uniqueStrings(groupRelations.flatMap((rel) => asArray(rel[subjectIdsKey]).concat(asArray(rel[options.subjectKey]))));
  primary[objectIdsKey] = uniqueStrings(groupRelations.flatMap((rel) => asArray(rel[objectIdsKey]).concat(asArray(rel[options.objectKey]))));
  primary[contextKey] = uniqueStrings(groupRelations.flatMap((rel) => asArray(rel[contextKey])));
  primary[eventKey] = uniqueStrings(groupRelations.flatMap((rel) => asArray(rel[eventKey])));
  primary.evidence_sentence_ids = uniqueStrings(groupRelations.flatMap((rel) => asArray(rel.evidence_sentence_ids)));
  primary.evidence = mergeObjectArray(groupRelations.flatMap((rel) => asArray(rel.evidence)), (row) => row?.sentence_id || row?.text || JSON.stringify(row || {}));
  primary.evidence_context_sentences = mergeObjectArray(groupRelations.flatMap((rel) => asArray(rel.evidence_context_sentences)), (row) => row?.id || row?.text || JSON.stringify(row || {}));
  primary.context = mergeRelationContextObjects(groupRelations.map((rel) => rel.context));
  primary.taxon_tissue_context = mergeTaxonTissueContexts(groupRelations.map((rel) => rel.taxon_tissue_context));
  primary.relation_event_membership_count = primary[eventKey].length;
  primary.evidence_context_text = uniqueStrings(groupRelations.map((rel) => rel.evidence_context_text).filter(Boolean)).join(" ");
  primary.evidence_preview = uniqueStrings(groupRelations.map((rel) => rel.evidence_preview).filter(Boolean))[0] || primary.evidence_preview || "";
  if (mergedIds.length > 1) {
    primary.merge_summary = `${mergedIds.length} duplicate relation records merged`;
  }
  return primary;
}

function mergeRelationContextObjects(contexts) {
  const merged = {};
  contexts.filter(Boolean).forEach((context) => {
    Object.entries(context).forEach(([key, value]) => {
      merged[key] = uniqueStrings([...(merged[key] || []), ...asArray(value)]);
    });
  });
  return merged;
}

function mergeObjectArray(items, keyFn) {
  const seen = new Set();
  const merged = [];
  items.filter(Boolean).forEach((item) => {
    const key = String(keyFn(item) || "");
    if (!key || seen.has(key)) return;
    seen.add(key);
    merged.push(item);
  });
  return merged;
}

function mergeTaxonTissueContexts(contexts) {
  const merged = {};
  ["direct", "event", "entity_linked"].forEach((key) => {
    const taxa = mergeTaxonTissueItems(contexts.flatMap((context) => asArray(context?.[key]?.taxa)));
    const tissues = mergeTaxonTissueItems(contexts.flatMap((context) => asArray(context?.[key]?.tissues)));
    const assays = mergeTaxonTissueItems(contexts.flatMap((context) => asArray(context?.[key]?.assays)));
    const provenanceCount = contexts.reduce((sum, context) => sum + Number(context?.[key]?.provenance_count || 0), 0);
    merged[key] = {
      display: formatTaxonTissueDisplay([...taxa, ...tissues, ...assays]),
      taxa,
      tissues,
      assays,
      provenance_count: provenanceCount || taxa.length + tissues.length + assays.length
    };
  });
  merged.agreement = taxonTissueGroupFromItems(categoryAwareTaxonTissueAgreementItems(merged.event, merged.entity_linked));
  return merged;
}

function mergeTaxonTissueItems(items) {
  const byKey = new Map();
  items.filter(Boolean).forEach((item) => {
    const key = `${item.kind || ""}|${item.entity_id || item.ontology_id || item.label || ""}`;
    if (!key.trim()) return;
    if (!byKey.has(key)) {
      byKey.set(key, { ...item, provenance_count: Number(item.provenance_count || 0) });
      return;
    }
    const row = byKey.get(key);
    row.provenance_count = Number(row.provenance_count || 0) + Number(item.provenance_count || 0);
    if (item.mark === "*") row.mark = "*";
  });
  return Array.from(byKey.values()).sort((a, b) => String(a.label || "").localeCompare(String(b.label || "")));
}

function taxonTissueItemIsInformative(item) {
  if (!item) return false;
  const label = String(item.label || "").trim();
  const id = String(item.ontology_id || item.entity_id || "").trim();
  const normalizedLabel = label.toLowerCase();
  const normalizedId = id.toLowerCase();
  return Boolean(label || id)
    && normalizedLabel !== "unknown"
    && normalizedId !== "unknown"
    && normalizedLabel !== "-"
    && normalizedId !== "-";
}

function formatTaxonTissueDisplay(items) {
  return uniqueStrings(items.filter(taxonTissueItemIsInformative).map((item) => {
    const label = item.label || item.entity_id || "";
    const mark = item.mark || "";
    const ontology = item.ontology_id ? ` (${item.ontology_id})` : "";
    return `${label}${mark}${ontology}`.trim();
  })).join("; ");
}

function taxonTissueComparableKey(item) {
  if (!taxonTissueItemIsInformative(item)) return "";
  const kind = String(item.kind || "").toLowerCase();
  const id = String(item.ontology_id || item.entity_id || item.label || "").trim().toLowerCase();
  return kind && id ? `${kind}|${id}` : "";
}

const taxonTissueContextCategories = ["taxa", "tissues", "assays"];

function categoryAwareTaxonTissueAgreementItems(eventGroup = {}, entityLinkedGroup = {}) {
  const items = [];
  taxonTissueContextCategories.forEach((category) => {
    const eventItems = asArray(eventGroup?.[category]).filter(taxonTissueItemIsInformative);
    const linkedItems = asArray(entityLinkedGroup?.[category]).filter(taxonTissueItemIsInformative);
    if (!linkedItems.length) return;
    const eventKeys = new Set(eventItems.map(taxonTissueComparableKey).filter(Boolean));
    if (eventKeys.size) {
      linkedItems.forEach((item) => {
        if (!eventKeys.has(taxonTissueComparableKey(item))) return;
        items.push({
          ...item,
          agreement_status: item.agreement_status || "overlap",
          agreement_source: item.agreement_source || "event_and_entity_linked"
        });
      });
      return;
    }
    linkedItems.forEach((item) => {
      items.push({
        ...item,
        agreement_status: item.agreement_status || "entity_linked_fallback",
        agreement_source: item.agreement_source || "entity_linked_category_fallback"
      });
    });
  });
  return uniqueBy(items, taxonTissueComparableKey);
}

function taxonTissueGroupFromItems(items) {
  const taxa = mergeTaxonTissueItems(items.filter((item) => item?.kind === "taxa"));
  const tissues = mergeTaxonTissueItems(items.filter((item) => item?.kind === "tissues"));
  const assays = mergeTaxonTissueItems(items.filter((item) => item?.kind === "assays"));
  return {
    display: formatTaxonTissueDisplay([...taxa, ...tissues, ...assays]),
    taxa,
    tissues,
    assays,
    provenance_count: taxa.length + tissues.length + assays.length
  };
}

function relationTaxonTissueBaselineKeys(rel) {
  const context = relationTaxonTissueContext(rel);
  return new Set([
    ...asArray(context.direct?.taxa),
    ...asArray(context.direct?.tissues),
    ...asArray(context.direct?.assays),
    ...asArray(context.event?.taxa),
    ...asArray(context.event?.tissues),
    ...asArray(context.event?.assays)
  ].map(taxonTissueComparableKey).filter(Boolean));
}

function relationTaxonTissueDisplayItems(rel, key) {
  const context = relationTaxonTissueContext(rel);
  const group = context?.[key] || {};
  const baselineKeys = key === "entity_linked" ? relationTaxonTissueBaselineKeys(rel) : new Set();
  return [...asArray(group.taxa), ...asArray(group.tissues), ...asArray(group.assays)].map((item) => {
    if (key !== "entity_linked") return { ...item, mark: "" };
    const method = String(item.method || "");
    const isContextOnlyPropagation = method === "entity_linked_direct_context";
    const isTriplePropagation = method === "entity_linked_location_relation";
    const isAlreadyAssignedFromTripleOrEvent = baselineKeys.has(taxonTissueComparableKey(item));
    return {
      ...item,
      mark: isContextOnlyPropagation && !isTriplePropagation && !isAlreadyAssignedFromTripleOrEvent ? "*" : ""
    };
  });
}

function uniqueBy(items, keyFn) {
  const seen = new Set();
  return items.filter((item) => {
    const key = keyFn(item);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

async function loadPaper(pmcid, options = {}) {
  state.paper = pmcid;
  state.data = normalizePaperRelations(await fetchJson(`data/papers/${pmcid}.json`));
  state.indexes = buildIndexes(state.data);
  state.selectedKind = null;
  state.selectedId = null;
  if (!options.preservePath) {
    state.pathStart = "";
    state.pathEnd = "";
    state.pathStartId = "";
    state.pathEndId = "";
    state.pathResults = [];
  }
  state.listPage = 0;
  els.paperSelect.value = pmcid;
  if (!options.skipRender) render();
}

function buildIndexes(data) {
  const eventById = new Map(data.events.map((item) => [item.event_id, item]));
  const relationById = new Map();
  const dependencyById = new Map(data.dependencies.map((item) => [item.dependency_id, item]));
  const entityById = new Map(data.entities.map((item) => [item.node_id, item]));
  const sentenceById = new Map(data.sentences.map((item) => [item.id, item]));
  const rawRelationById = new Map();
  const rawRelationsByEvent = new Map();
  const relationsByEvent = new Map();
  const relationsByEntity = new Map();
  const eventsByEntity = new Map();
  const dependenciesByEvent = new Map();

  function push(map, key, value) {
    if (!key) return;
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(value);
  }

  data.relations.forEach((rel) => {
    [rel.record_id, ...asArray(rel.merged_relation_ids)].forEach((id) => {
      if (id) relationById.set(id, rel);
    });
    rel.event_ids.forEach((eventId) => push(relationsByEvent, eventId, rel));
    [...relationLocalSubjectIds(rel), ...relationLocalObjectIds(rel), ...asArray(rel.context_node_ids)].forEach((nodeId) => {
      push(relationsByEntity, nodeId, rel);
    });
  });

  asArray(data.raw_relations).forEach((rel) => {
    if (rel.record_id) rawRelationById.set(rel.record_id, rel);
    asArray(rel.event_ids).forEach((eventId) => push(rawRelationsByEvent, eventId, rel));
  });

  data.events.forEach((event) => {
    event.participant_node_ids.forEach((nodeId) => push(eventsByEntity, nodeId, event));
  });

  data.dependencies.forEach((dep) => {
    push(dependenciesByEvent, dep.upstream_event_id, dep);
    push(dependenciesByEvent, dep.downstream_event_id, dep);
  });

  return {
    eventById,
    relationById,
    dependencyById,
    entityById,
    sentenceById,
    rawRelationById,
    rawRelationsByEvent,
    relationsByEvent,
    relationsByEntity,
    eventsByEntity,
    dependenciesByEvent
  };
}

function render() {
  if (!state.data) return;
  document.body.dataset.tab = state.tab;
  if (state.tab === "entities" && state.entityScope === "all" && !state.globalPathIndex && !state.globalPathLoading) {
    loadGlobalPathIndex().then(render).catch((error) => {
      console.error(error);
      state.globalPathLoading = false;
    });
  }
  renderPaperSummary();
  renderTabs();
  renderFilters();
  const items = visibleItems();
  ensureSelection(items);
  renderList(items);
  renderMain();
  renderInspector();
}

function renderPaperSummary() {
  const article = state.data.article;
  const stats = state.data.stats;
  els.paperTitle.textContent = article.title || state.data.pmcid;
  els.paperMeta.innerHTML = `
    <div>${esc([article.journal, article.year].filter(Boolean).join(" | "))}</div>
    <div>${article.doi ? `<a href="https://doi.org/${esc(article.doi)}" target="_blank" rel="noreferrer">${esc(article.doi)}</a>` : esc(state.data.pmcid)}</div>
  `;
  els.statsGrid.innerHTML = [
    stat(stats.events, "events"),
    stat(stats.relations, "relations"),
    stat(stats.entities, "entities"),
    stat(stats.compound_classifications, "compound profiles"),
    stat(stats.gene_protein_normalizations, "gene/protein IDs"),
    stat(stats.gene_protein_family_entities, "family/domain IDs"),
    stat(stats.accepted_dependencies, "accepted deps"),
    stat(stats.events_without_accepted_dependency, "events no accepted dep")
  ].join("");
}

function stat(value, label) {
  return `<div class="stat"><strong>${fmt(value)}</strong><span>${esc(label)}</span></div>`;
}

function renderTabs() {
  document.querySelectorAll("button[data-tab]").forEach((button) => {
    button.classList.toggle("active", button.getAttribute("data-tab") === state.tab);
  });
}

function renderFilters() {
  if (state.tab === "discover") {
    els.filterPanel.innerHTML = `
      <div class="compact-card">
        <strong>Annotation</strong>
        <span class="muted">Paste genes, proteins, compounds, aliases, or ontology IDs to map them to PSFD records.</span>
      </div>
    `;
    return;
  }
  if (state.tab === "dependencies") {
    els.filterPanel.innerHTML = filterDrawer("Dependency Filters", `
      ${check("includeAccepted", "Accepted dependencies")}
      ${check("includeHypothesis", "Hypothesis-tier links")}
      ${check("includeRejected", "Rejected candidates")}
      ${check("showSharedContext", "Show shared-context links")}
    `);
    return;
  }
  if (state.tab === "events") {
    els.filterPanel.innerHTML = filterDrawer("Event Filters", `
      ${check("orphanOnly", "Only events without accepted dependencies")}
    `);
    return;
  }
  if (state.tab === "relations") {
    const classes = Array.from(new Set(state.data.relations.map((rel) => rel.predicate_class || "unknown"))).sort();
    els.filterPanel.innerHTML = filterDrawer("Relation Filters", `
      <select data-state-key="relationClass">
        <option value="all">All predicate classes</option>
        ${classes.map((item) => `<option value="${esc(item)}" ${state.relationClass === item ? "selected" : ""}>${esc(clean(item))}</option>`).join("")}
      </select>
    `);
    return;
  }
  if (state.tab === "entities") {
    const types = entityFilterTypes();
    els.filterPanel.innerHTML = filterDrawer("Entity Filters", `
      <select data-state-key="entityScope">
        <option value="paper" ${state.entityScope === "paper" ? "selected" : ""}>Current paper only</option>
        <option value="all" ${state.entityScope === "all" ? "selected" : ""}>All papers database</option>
      </select>
      <select data-state-key="entityType">
        <option value="all">All entity types</option>
        ${types.map((item) => `<option value="${esc(item)}" ${state.entityType === item ? "selected" : ""}>${esc(clean(item))}</option>`).join("")}
      </select>
      ${state.enrichedTraits?.length ? `
      <select data-state-key="enrichedTraitFilter">
        <option value="all">Any enriched trait (or none)</option>
        ${state.enrichedTraits.map((item) => `<option value="${esc(item.ontology_id)}" ${state.enrichedTraitFilter === item.ontology_id ? "selected" : ""}>Enriched: ${esc(item.label || item.ontology_id)}</option>`).join("")}
      </select>` : ""}
      ${check("normalizedOnly", "Only ontology-normalized entities")}
      ${state.entityScope === "all" ? `<div class="filter-note">${state.globalPathIndex ? `${fmt(state.globalPathIndex.entities.length)} entities across ${fmt(uniqueStrings(state.globalPathIndex.entities.map((entity) => entity.pmcid)).length)} papers.` : "Loading all-paper entity index..."}</div>` : ""}
    `, true);
    return;
  }
  els.filterPanel.innerHTML = filterDrawer("Path Search Options", `
    ${check("pathUseRelations", "Use relation edges")}
    ${check("pathUseHyperedges", "Use event hyperedges")}
    ${check("pathUseDependencies", "Use event dependencies")}
    ${check("pathUseOntologyBridges", "Use normalized ontology bridges")}
    ${check("pathUseContext", "Use relation context edges")}
    ${check("pathIncludeHypothesis", "Allow hypothesis-tier dependencies")}
    ${check("pathIncludeRejected", "Allow rejected dependency candidates")}
  `);
}

function filterDrawer(title, content, open = false) {
  return `
    <details class="filter-drawer" ${open ? "open" : ""}>
      <summary>
        <span>${esc(title)}</span>
        <span class="drawer-hint">Options</span>
      </summary>
      <div class="filter-drawer-body">${content}</div>
    </details>
  `;
}

function check(key, label) {
  return `
    <label class="check-row">
      <input type="checkbox" data-state-key="${esc(key)}" ${state[key] ? "checked" : ""}>
      ${esc(label)}
    </label>
  `;
}

function entityFilterTypes() {
  if (state.entityScope === "all" && state.globalPathIndex) {
    return Array.from(new Set(state.globalPathIndex.entities.map((entity) => entity.type || "unknown"))).sort();
  }
  return Array.from(new Set(state.data.entities.map((entity) => entity.entity_type || "unknown"))).sort();
}

function visibleItems() {
  if (state.tab === "discover") return [];
  if (state.tab === "dependencies") return visibleDependencies();
  if (state.tab === "events") return visibleEvents();
  if (state.tab === "relations") return visibleRelations();
  if (state.tab === "entities") return visibleEntities();
  return [];
}

function queryMatches(text) {
  const q = state.query.trim().toLowerCase();
  return !q || text.toLowerCase().includes(q);
}

function visibleDependencies() {
  return state.data.dependencies
    .filter((dep) => {
      if (dep.tier === "accepted" && !state.includeAccepted) return false;
      if (isHypothesisTier(dep.tier) && !state.includeHypothesis) return false;
      if (dep.tier === "rejected" && !state.includeRejected) return false;
      if (!state.showSharedContext && dep.dependency_type === "shared_context") return false;
      return queryMatches(dependencyText(dep));
    })
    .sort((a, b) => {
      const tierRank = { accepted: 0, hypothesis: 1, rejected: 2 };
      const rank = (tierRank[canonicalTier(a.tier)] ?? 9) - (tierRank[canonicalTier(b.tier)] ?? 9);
      if (rank) return rank;
      return Number(b.confidence || 0) - Number(a.confidence || 0) || a.dependency_id.localeCompare(b.dependency_id);
    });
}

function visibleEvents() {
  return state.data.events
    .filter((event) => !state.orphanOnly || !event.has_accepted_dependency)
    .filter((event) => queryMatches(eventText(event)))
    .sort((a, b) => {
      const da = a.dependency_counts?.accepted || 0;
      const db = b.dependency_counts?.accepted || 0;
      if (db !== da) return db - da;
      return Number(b.relation_count || 0) - Number(a.relation_count || 0) || a.event_id.localeCompare(b.event_id);
    });
}

function visibleRelations() {
  return state.data.relations
    .filter((rel) => state.relationClass === "all" || rel.predicate_class === state.relationClass)
    .filter((rel) => queryMatches(relationText(rel)))
    .sort((a, b) => a.record_id.localeCompare(b.record_id));
}

function visibleEntities() {
  if (state.entityScope === "all") return visibleGlobalEntities();
  return state.data.entities
    .filter((entity) => state.entityType === "all" || entity.entity_type === state.entityType)
    .filter((entity) => state.enrichedTraitFilter === "all" || (entity.enrichments || []).some((e) => e.trait_concept === state.enrichedTraitFilter))
    .filter((entity) => !state.normalizedOnly || entityOntologyIds(entity).length)
    .filter((entity) => queryMatches(entitySearchText(entity)))
    .sort((a, b) => {
      const compoundRank = (b.entity_type === "compound") - (a.entity_type === "compound");
      if (compoundRank) return compoundRank;
      return entityName(a).localeCompare(entityName(b));
    });
}

function visibleGlobalEntities() {
  if (!state.globalPathIndex) return [];
  return state.globalPathIndex.entities
    .map(globalEntityToBrowseEntity)
    .filter((entity) => state.entityType === "all" || entity.entity_type === state.entityType)
    .filter((entity) => state.enrichedTraitFilter === "all" || (entity.enrichments || []).some((e) => e.trait_concept === state.enrichedTraitFilter))
    .filter((entity) => !state.normalizedOnly || entityOntologyIds(entity).length)
    .filter((entity) => queryMatches(globalBrowseEntitySearchText(entity)))
    .sort((a, b) => {
      const compoundRank = (b.entity_type === "compound") - (a.entity_type === "compound");
      if (compoundRank) return compoundRank;
      const evidenceRank = Number(b.relation_count || 0) + Number(b.event_count || 0) - Number(a.relation_count || 0) - Number(a.event_count || 0);
      if (evidenceRank) return evidenceRank;
      return entityName(a).localeCompare(entityName(b)) || String(a.pmcid).localeCompare(String(b.pmcid));
    });
}

function globalEntityToBrowseEntity(entity) {
  return {
    _globalEntity: true,
    node_id: entity.id,
    id: entity.id,
    pmcid: entity.pmcid,
    paper_title: entity.paper_title,
    canonical_form: pathEntityName(entity),
    normalized_label: entity.normalized_label || "",
    entity_type: entity.type || "unknown",
    selected_ontology: entity.ontology || "",
    selected_ontology_id: entity.ontology_id || "",
    selected_label: entity.selected_label || "",
    selected_description: entity.selected_description || "",
    decision: entity.decision || "",
    relation_count: entity.relation_count || 0,
    event_count: entity.event_count || 0,
    compound_classification: entity.compound_classification || {},
    gene_protein_normalization: entity.gene_protein_normalization || {},
    ontology_ids: entity.ontology_ids || []
  };
}

function globalBrowseEntitySearchText(entity) {
  return [
    entitySearchText(entity),
    entity.pmcid,
    entity.paper_title,
    asArray(entity.ontology_ids).join(" ")
  ].join(" ");
}

function dependencyText(dep) {
  const source = state.indexes.eventById.get(dep.upstream_event_id);
  const target = state.indexes.eventById.get(dep.downstream_event_id);
  return [
    dep.dependency_id,
    dep.dependency_type,
    dep.tier,
    dep.reason_code,
    dep.bridge_entities?.join(" "),
    dep.supporting_relation_pairs?.join(" "),
    dep.evidence_sentence_ids?.join(" "),
    source ? eventText(source) : "",
    target ? eventText(target) : ""
  ].join(" ");
}

function eventText(event) {
  const rels = state.indexes.relationsByEvent.get(event.event_id) || [];
  const participants = event.participant_node_ids
    .map((id) => state.indexes.entityById.get(id))
    .filter(Boolean)
    .map(entitySearchText)
    .join(" ");
  return [
    event.event_id,
    event.event_label,
    event.event_type,
    event.event_scope,
    JSON.stringify(event.context || {}),
    event.evidence_sentence_ids?.join(" "),
    rels.map(relationText).join(" "),
    participants
  ].join(" ");
}

function relationText(rel) {
  const nodes = [...relationLocalSubjectIds(rel), ...relationLocalObjectIds(rel), ...asArray(rel.context_node_ids)]
    .map((id) => state.indexes.entityById.get(id))
    .filter(Boolean)
    .map(entitySearchText)
    .join(" ");
  return [
    rel.record_id,
    rel.source_relation_id,
    rel.triple,
    rel.subject,
    rel.predicate,
    rel.object,
    rel.predicate_class,
    JSON.stringify(rel.context || {}),
    rel.evidence_sentence_ids?.join(" "),
    rel.evidence_context_text,
    nodes
  ].join(" ");
}

function ensureSelection(items) {
  if (state.tab === "discover") return;
  if (state.tab === "paths") return;
  if (state.tab === "entities" && state.entityScope === "all" && !selectedExists()) return;
  if (selectedExists()) return;
  const first = items[0];
  if (!first) {
    state.selectedKind = null;
    state.selectedId = null;
    return;
  }
  if (state.tab === "dependencies") selectItem("dependency", first.dependency_id, false);
  if (state.tab === "events") selectItem("event", first.event_id, false);
  if (state.tab === "relations") selectItem("relation", first.record_id, false);
  if (state.tab === "entities") selectItem("entity", first.node_id, false);
}

function selectedExists() {
  if (state.selectedKind === "dependency") return state.indexes.dependencyById.has(state.selectedId);
  if (state.selectedKind === "event") return state.indexes.eventById.has(state.selectedId);
  if (state.selectedKind === "relation") return state.indexes.relationById.has(state.selectedId);
  if (state.selectedKind === "entity") return state.indexes.entityById.has(state.selectedId);
  return false;
}

function selectItem(kind, id, doRender = true) {
  state.selectedKind = kind;
  state.selectedId = id;
  if (doRender) render();
}

function navigateLocalItem(kind, id, doRender = true, options = {}) {
  if (!kind || !id) return;
  if (!options.skipReturn && doRender) pushReturnState();
  const tab = tabForKind(kind);
  if (tab) state.tab = tab;
  clearBrowserSearch();
  exposeSelectionInFilters(kind, id);
  selectItem(kind, id, false);
  closeEntityModal();
  if (doRender) {
    render();
    if (typeof requestAnimationFrame === "function") {
      requestAnimationFrame(() => {
        els.mainPanel?.scrollIntoView({ block: "start", behavior: "smooth" });
      });
    }
  }
}

function tabForKind(kind) {
  const tabs = {
    dependency: "dependencies",
    event: "events",
    relation: "relations",
    entity: "entities",
  };
  return tabs[kind] || "";
}

function clearBrowserSearch() {
  state.query = "";
  if (els.searchInput) els.searchInput.value = "";
}

function exposeSelectionInFilters(kind, id) {
  if (kind === "dependency") {
    const dep = state.indexes?.dependencyById?.get(id);
    if (dep?.tier === "accepted") state.includeAccepted = true;
    if (isHypothesisTier(dep?.tier)) state.includeHypothesis = true;
    if (dep?.tier === "rejected") state.includeRejected = true;
    if (dep?.dependency_type === "shared_context") state.showSharedContext = true;
  }
  if (kind === "event") state.orphanOnly = false;
  if (kind === "relation") state.relationClass = "all";
  if (kind === "entity") {
    state.entityScope = "paper";
    state.entityType = "all";
    state.normalizedOnly = false;
  }
  state.listPage = 0;
}

function renderList(items) {
  const titles = {
    discover: "Annotation",
    dependencies: "Dependency Signals",
    events: "Event Clusters",
    relations: "Relation Edges",
    entities: "Entities",
    paths: "Path Controls"
  };
  els.listTitle.textContent = titles[state.tab];
  if (state.tab === "discover") {
    els.listCount.textContent = "";
    els.resultList.innerHTML = `
      <div class="compact-card">
        <strong>Input</strong>
        <span class="muted">One gene, compound, ontology ID, or alias per line.</span>
      </div>
      <div class="compact-card">
        <strong>Annotate</strong>
        <span class="muted">Review normalized IDs, FASTA links, compound metadata, and evidence counts.</span>
      </div>
      <div class="compact-card">
        <strong>Send To Pathfinder</strong>
        <span class="muted">Use any match as a route start or endpoint.</span>
      </div>
    `;
    return;
  }
  if (state.tab === "paths") {
    els.listCount.textContent = "";
    els.resultList.innerHTML = `
      <div class="compact-card">
        Find hypothesis routes between any two entities using relations, events, dependencies, and shared ontology IDs.
      </div>
    `;
    return;
  }
  if (state.tab === "entities" && state.entityScope === "all" && state.globalPathLoading && !state.globalPathIndex) {
    els.listCount.textContent = "loading";
    els.resultList.innerHTML = `<div class="compact-card muted">Loading all-paper entity index...</div>`;
    return;
  }
  els.listCount.textContent = `${fmt(items.length)} shown`;
  if (!items.length) {
    els.resultList.innerHTML = `<div class="compact-card muted">No items match the current filters.</div>`;
    return;
  }
  const totalPages = Math.max(1, Math.ceil(items.length / state.listPageSize));
  state.listPage = Math.min(Math.max(0, state.listPage), totalPages - 1);
  const start = state.listPage * state.listPageSize;
  const end = Math.min(items.length, start + state.listPageSize);
  const pageItems = items.slice(start, end);
  els.listCount.textContent = `${fmt(start + 1)}-${fmt(end)} of ${fmt(items.length)}`;
  els.resultList.innerHTML = signalBrowser(items, pageItems, start, end, totalPages);
}

function signalBrowser(items, pageItems, start, end, totalPages) {
  return `
    ${signalToolbar(items, start, end, totalPages)}
    <div class="signal-list" role="list" aria-label="${esc(state.tab)} records">
      ${pageItems.map((item, index) => signalCard(item, start + index)).join("")}
    </div>
  `;
}

function signalToolbar(items, start, end, totalPages) {
  const selectedIndex = selectedIndexIn(items);
  const selectedText = selectedIndex >= 0 ? `selected ${fmt(selectedIndex + 1)}` : "select a card";
  const label = state.tab === "entities" && state.entityScope === "all" ? "all-paper entities" : clean(state.tab);
  return `
    <div class="signal-toolbar">
      <div>
        <span class="signal-eyebrow">Explore</span>
        <strong>${esc(label)}</strong>
        <span>${fmt(items.length)} records | ${fmt(start + 1)}-${fmt(end)} shown | ${esc(selectedText)}</span>
      </div>
      <div class="signal-pager">
        <button class="mini-button" type="button" data-action="list-prev" ${state.listPage <= 0 ? "disabled" : ""}>Previous</button>
        <span>Page ${fmt(state.listPage + 1)} / ${fmt(totalPages)}</span>
        <button class="mini-button" type="button" data-action="list-next" ${state.listPage >= totalPages - 1 ? "disabled" : ""}>Next</button>
      </div>
    </div>
  `;
}

function selectedIndexIn(items) {
  if (!state.selectedKind || !state.selectedId) return -1;
  return items.findIndex((item) => browseItemId(item) === state.selectedId);
}

function browseItemId(item) {
  if (state.tab === "dependencies") return item.dependency_id;
  if (state.tab === "events") return item.event_id;
  if (state.tab === "relations") return item.record_id;
  if (state.tab === "entities") return item.node_id;
  return "";
}

function signalCard(item, absoluteIndex) {
  const id = browseItemId(item);
  const selected = selectedRowId() === id;
  const color = signalColor(item);
  return `
    <button class="signal-card ${selected ? "selected" : ""}" type="button" role="listitem" ${signalActionAttrs(item, id)} style="--signal-color:${esc(color)}">
      <span class="signal-accent" aria-hidden="true"></span>
      <span class="signal-body">
        <span class="signal-topline">
          <span>${esc(signalKicker(item))}</span>
          <span>${fmt(absoluteIndex + 1)}</span>
        </span>
        <strong>${esc(signalTitle(item))}</strong>
        <span class="signal-path">${esc(signalContextLine(item))}</span>
        <span class="signal-meta">${signalPills(item)}</span>
      </span>
    </button>
  `;
}

function selectedRowId() {
  return selectedExists() ? state.selectedId : "";
}

function signalAction() {
  if (state.tab === "dependencies") return "select-dependency";
  if (state.tab === "events") return "select-event";
  if (state.tab === "relations") return "select-relation";
  if (state.tab === "entities") return "select-entity";
  return "";
}

function signalActionAttrs(item, id) {
  if (isGlobalEntityBrowseItem(item)) {
    return `data-action="select-global" data-kind="entity" data-id="${esc(id)}" data-pmcid="${esc(item.pmcid || "")}"`;
  }
  return `data-action="${esc(signalAction())}" data-id="${esc(id)}"`;
}

function isGlobalEntityBrowseItem(item) {
  return state.tab === "entities" && state.entityScope === "all" && Boolean(item?._globalEntity);
}

function signalColor(item) {
  if (state.tab === "dependencies") return colorForDependency(item.dependency_type);
  if (state.tab === "events") return colorForEvent(item.event_type);
  if (state.tab === "relations") return eventPalette[`${item.predicate_class}_event`] || dependencyPalette[item.predicate_class] || eventPalette.unknown;
  if (state.tab === "entities") return colorForEntity(item.entity_type);
  return "var(--accent)";
}

function signalKicker(item) {
  if (state.tab === "dependencies") return `${clean(item.tier || "candidate")} dependency`;
  if (state.tab === "events") return clean(item.event_scope || "event");
  if (state.tab === "relations") return `${clean(item.predicate_class || "relation")} relation`;
  if (state.tab === "entities") return isGlobalEntityBrowseItem(item) ? `${clean(item.entity_type || "entity")} | ${item.pmcid}` : clean(item.entity_type || "entity");
  return "";
}

function signalPills(item) {
  const values = signalPillValues(item).filter(Boolean).slice(0, 3);
  return values.map((value) => `<span>${esc(value)}</span>`).join("");
}

function signalPillValues(item) {
  if (state.tab === "dependencies") {
    return [
      evidenceCountLabel(item.evidence_sentence_ids),
      asArray(item.bridge_entities).length ? `${asArray(item.bridge_entities).length} bridge` : "",
      item.confidence ? `${Math.round(Number(item.confidence) * 100)}% confidence` : ""
    ];
  }
  if (state.tab === "events") {
    const accepted = item.dependency_counts?.accepted || 0;
    return [
      `${fmt(item.relation_count)} relations`,
      accepted ? `${fmt(accepted)} dependencies` : "unlinked",
      evidenceCountLabel(item.evidence_sentence_ids)
    ];
  }
  if (state.tab === "relations") {
    return [
      evidenceCountLabel(item.evidence_sentence_ids),
      item.event_ids?.length ? `${fmt(item.event_ids.length)} event` : "",
      item.merge_decision ? shortText(item.merge_decision, 18) : ""
    ];
  }
  if (state.tab === "entities") {
    return [
      entityOntologyIds(item).length ? "normalized" : clean(item.decision || "unreviewed"),
      item.gene_protein_normalization?.fasta_accessions?.length ? "FASTA" : "",
      item.event_count ? `${fmt(item.event_count)} events` : "",
      isGlobalEntityBrowseItem(item) ? item.pmcid : ""
    ];
  }
  return [];
}

function signalTitle(item) {
  if (state.tab === "dependencies") {
    return shortText(clean(item.dependency_type), 44);
  }
  if (state.tab === "events") return shortText(clean(item.event_type), 44);
  if (state.tab === "relations") return shortText(item.predicate || clean(item.predicate_class) || "relation", 44);
  if (state.tab === "entities") return shortText(entityName(item), 44);
  return "";
}

function signalContextLine(item) {
  if (state.tab === "dependencies") return dependencyTransition(item);
  if (state.tab === "events") return eventParticipantPreview(item, 3) || clean(item.event_scope);
  if (state.tab === "relations") return relationEndpointPreview(item);
  if (state.tab === "entities") {
    if (isGlobalEntityBrowseItem(item)) {
      return shortText([item.paper_title, entityMetadataPreview(item)].filter(Boolean).join(" | "), 80);
    }
    return entityMetadataPreview(item);
  }
  return "";
}

function shortText(value, limit = 56) {
  const text = String(value || "").replace(/\s+/g, " ").trim();
  if (text.length <= limit) return text;
  return `${text.slice(0, Math.max(0, limit - 3)).trim()}...`;
}

function compactOntologyLabel(entity) {
  const gene = entity?.gene_protein_normalization?.fasta_accessions?.[0];
  if (gene) return `UniProt ${gene.accession || gene}`;
  const geneOntology = geneProteinOntologyLabel(entity);
  if (geneOntology) return geneOntology;
  const ids = entityOntologyIds(entity);
  if (ids.length > 1) return ids.slice(0, 3).join(", ");
  if (ids.length === 1) return ids[0];
  if (entity?.selected_ontology_id) return entity.selected_ontology_id;
  if (entity?.selected_label) return entity.selected_label;
  return "";
}

function entityMetadataPreview(entity) {
  if (!entity) return "";
  const compound = compoundClassLine(entity);
  if (compound) return shortText(compound, 52);
  const protein = geneProteinLine(entity);
  if (protein) return shortText(protein, 52);
  const ontology = compactOntologyLabel(entity);
  if (ontology) return shortText(ontology, 52);
  return `${fmt(entity.mention_count)} mentions`;
}

function dependencyTransition(dep) {
  const source = state.indexes.eventById.get(dep.upstream_event_id);
  const target = state.indexes.eventById.get(dep.downstream_event_id);
  const sourceType = source ? shortText(clean(source.event_type), 22) : shortId(dep.upstream_event_id);
  const targetType = target ? shortText(clean(target.event_type), 22) : shortId(dep.downstream_event_id);
  const bridges = asArray(dep.bridge_entities).filter(Boolean).slice(0, 2).join(", ");
  if (bridges) return shortText(`${bridges} connects ${sourceType} to ${targetType}`, 86);
  return shortText(`${sourceType} -> ${targetType}`, 72);
}

function eventParticipantPreview(event, limit = 3) {
  const groups = eventParticipantGroups(event);
  const prioritized = [...groups.direct, ...groups.other, ...groups.context];
  const names = uniqueStrings(prioritized.map(entityName));
  if (!names.length) return "";
  const shown = names.slice(0, limit).map((name) => shortText(name, 18));
  const extra = names.length > limit ? ` +${names.length - limit}` : "";
  return shortText(`${shown.join(", ")}${extra}`, 58);
}

function relationEndpointPreview(rel) {
  const subject = state.indexes.entityById.get(rel.subject_node_id);
  const object = state.indexes.entityById.get(rel.object_node_id);
  const subjectLabel = shortText(subject ? entityName(subject) : rel.subject, 22);
  const objectLabel = shortText(object ? entityName(object) : rel.object, 22);
  return shortText(`${subjectLabel} -> ${objectLabel}`, 58);
}

function relationLocalSubjectIds(rel) {
  return uniqueStrings([...asArray(rel?.subject_node_ids), ...asArray(rel?.subject_node_id)]);
}

function relationLocalObjectIds(rel) {
  return uniqueStrings([...asArray(rel?.object_node_ids), ...asArray(rel?.object_node_id)]);
}

function relationGlobalSubjectIds(rel) {
  return uniqueStrings([...asArray(rel?.subject_entity_ids), ...asArray(rel?.subject_entity_id)]);
}

function relationGlobalObjectIds(rel) {
  return uniqueStrings([...asArray(rel?.object_entity_ids), ...asArray(rel?.object_entity_id)]);
}

function evidenceCountLabel(ids) {
  const count = asArray(ids).length;
  if (!count) return "";
  return `${fmt(count)} sent`;
}

function uniqueStrings(values) {
  const seen = new Set();
  return values.filter((value) => {
    const key = String(value || "").toLowerCase();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function renderMain() {
  if (state.tab === "discover") {
    renderDiscoverWorkbench();
    return;
  }
  if (state.tab === "paths") {
    renderPathExplorer();
    return;
  }
  if (state.tab === "entities" && state.entityScope === "all" && !selectedExists()) {
    renderGlobalEntityOverview();
    return;
  }
  if (!state.selectedKind) {
    els.mainPanel.innerHTML = `<div class="empty-state"><div><strong>No selection</strong><span>Select an item from the left panel.</span></div></div>`;
    return;
  }
  if (state.selectedKind === "dependency") renderDependencyMain(state.indexes.dependencyById.get(state.selectedId));
  if (state.selectedKind === "event") renderEventMain(state.indexes.eventById.get(state.selectedId));
  if (state.selectedKind === "relation") renderRelationMain(state.indexes.relationById.get(state.selectedId));
  if (state.selectedKind === "entity") renderEntityMain(state.indexes.entityById.get(state.selectedId));
}

function renderGlobalEntityOverview() {
  const loaded = Boolean(state.globalPathIndex);
  const matches = loaded ? visibleGlobalEntities() : [];
  const types = loaded ? summarizeGlobalEntityTypes(matches) : [];
  const paperCount = loaded ? uniqueStrings(state.globalPathIndex.entities.map((entity) => entity.pmcid)).length : 0;
  els.mainPanel.innerHTML = `
    <section class="hero-card global-entity-overview">
      <div class="hero-title">
        <div>
          <h2>All-Paper Entity Browser</h2>
          <p>Search genes, compounds, traits, conditions, and ontology IDs across the full PSFD demo database.</p>
        </div>
        <div>${badges(loaded ? [`${fmt(matches.length)} matches`, `${fmt(paperCount)} papers`] : ["loading global index"])}</div>
      </div>
      ${loaded ? `
        <div class="global-entity-metrics">
          ${stat(state.globalPathIndex.entities.length, "total entities")}
          ${stat(state.globalPathIndex.stats?.concepts || state.globalPathIndex.concepts?.length || 0, "normalized concepts")}
          ${stat(matches.length, "current matches")}
          ${stat(paperCount, "papers")}
        </div>
        <div class="global-category-grid">
          ${types.map((item) => `
            <button class="global-category-card ${state.entityType === item.type ? "selected" : ""}" type="button" data-action="set-entity-type" data-value="${esc(item.type)}" style="--entity-color:${colorForEntity(item.type)}">
              <span class="dot"></span>
              <strong>${esc(clean(item.type))}</strong>
              <span>${fmt(item.count)} entities</span>
            </button>
          `).join("")}
        </div>
        <div class="compact-card">
          <strong>How to use this view</strong>
          <span class="muted">Use the top search box for any alias, gene ID, compound, ontology ID, or paper-specific term. Use the entity-type filter to browse a category across all papers. Click a result to open the exact paper and entity record.</span>
        </div>
      ` : `<div class="empty-state"><strong>Loading all-paper data</strong><span>Fetching the global entity and path index.</span></div>`}
    </section>
  `;
}

function summarizeGlobalEntityTypes(entities) {
  const counts = new Map();
  entities.forEach((entity) => {
    const type = entity.entity_type || "unknown";
    counts.set(type, (counts.get(type) || 0) + 1);
  });
  return Array.from(counts.entries())
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count || a.type.localeCompare(b.type))
    .slice(0, 12);
}

function renderDependencyMain(dep) {
  if (!dep) return;
  els.mainPanel.innerHTML = `
    <section class="hero-card">
      ${returnControl()}
      <div class="hero-title">
        <div>
          <h2>${esc(state.data.pmcid)} dependency ${esc(shortId(dep.dependency_id))}</h2>
          <p>Read the biological claim from source event, through the dependency bridge, into the target event.</p>
          ${dependencyProvenancePills(dep)}
        </div>
        <div>${badges([tierLabel(dep.tier)], tierClass(dep.tier))} ${badges([clean(dep.dependency_type)])}</div>
      </div>
      ${mechanismMap(dep)}
    </section>
    <details class="secondary-disclosure dependency-explore">
      <summary>Explore related events and bridges</summary>
      ${dependencyJumpRail(dep)}
    </details>
    ${disclosureSection("Technical Dependency Provenance", `
      ${dependencyEvidence(dep)}
      ${supportingRelationPairs(dep)}
    `, "optional")}
  `;
}

function dependencyJumpRail(dep) {
  const source = state.indexes.eventById.get(dep.upstream_event_id);
  const target = state.indexes.eventById.get(dep.downstream_event_id);
  const bridgeLabel = dependencyBridgeLabel(dep);
  const bridgeMatches = dependenciesSharingBridge(dep);
  const bridgeMatchIds = new Set(bridgeMatches.map((item) => item.dependency_id));
  const eventMatches = dependenciesSharingEvents(dep).filter((item) => !bridgeMatchIds.has(item.dependency_id));
  const bridgeEvents = eventsSharingBridge(dep);
  const compounds = dependencyCompoundEntities(dep);
  const compoundNeighbors = compoundLinkedNeighborDependencies(dep);
  const compoundJump = compoundJumpConfig(compounds, compoundNeighbors);
  const jumps = [
    source ? {
      action: "select-event",
      id: source.event_id,
      color: colorForEvent(source.event_type),
      label: "Upstream event",
      title: eventJumpTitle(source),
      reason: "This is where the selected dependency starts.",
      cta: "Open event"
    } : null,
    target ? {
      action: "select-event",
      id: target.event_id,
      color: colorForEvent(target.event_type),
      label: "Downstream event",
      title: eventJumpTitle(target),
      reason: "This is the event the dependency points to.",
      cta: "Open event"
    } : null,
    bridgeMatches[0] ? {
      action: "select-dependency",
      id: bridgeMatches[0].dependency_id,
      color: colorForDependency(bridgeMatches[0].dependency_type),
      label: "Same bridge entity",
      title: bridgeLabel,
      reason: `${fmt(bridgeMatches.length)} other dependencies also use this bridge.`,
      cta: "Follow bridge"
    } : null,
    eventMatches[0] ? {
      action: "select-dependency",
      id: eventMatches[0].dependency_id,
      color: colorForDependency(eventMatches[0].dependency_type),
      label: "Same event context",
      title: clean(eventMatches[0].dependency_type),
      reason: `${fmt(eventMatches.length)} dependencies share the ${sharedEventLabel(dep, eventMatches[0])}.`,
      cta: "Open dependency"
    } : null,
    bridgeEvents[0] ? {
      action: "select-event",
      id: bridgeEvents[0].event_id,
      color: colorForEvent(bridgeEvents[0].event_type),
      label: "Bridge appears elsewhere",
      title: bridgeLabel,
      reason: `${fmt(bridgeEvents.length)} other events contain this bridge entity.`,
      cta: "Open event"
    } : null,
    compoundJump
  ].filter(Boolean);
  return `
    <div class="jump-rail compact-jump-rail">
      <div class="jump-rail-head">
        <div>
          <h2>Explore from this dependency</h2>
          <p>Each jump is connected by source event, target event, bridge entity, or compound presence.</p>
        </div>
        <span>${fmt(jumps.length)} routes</span>
      </div>
      <div class="jump-buttons">
        ${jumps.map(jumpChip).join("")}
      </div>
      ${moreNearbyLinks(dep, bridgeMatches, eventMatches, bridgeEvents, compoundNeighbors)}
    </div>
  `;
}

function dependencyBridgeLabel(dep) {
  return shortText(asArray(dep.bridge_entities).filter(Boolean).slice(0, 2).join(", ") || clean(dep.reason_code || "shared evidence"), 48);
}

function eventJumpTitle(event) {
  const participants = eventParticipantPreview(event, 2);
  if (participants) return `${clean(event.event_type)}: ${participants}`;
  return clean(event.event_type || shortId(event.event_id));
}

function compoundJumpConfig(compounds, compoundNeighbors) {
  if (compounds.length) {
    return {
      action: "open-entity",
      id: compounds[0].node_id,
      color: colorForEntity("compound"),
      label: "Compound in this dependency",
      title: entityName(compounds[0]),
      reason: `${fmt(compounds.length)} compound ${compounds.length === 1 ? "entity" : "entities"} found in the source or target event.`,
      cta: "Open compound"
    };
  }
  const neighbor = compoundNeighbors[0];
  if (!neighbor) return null;
  return {
    action: "select-dependency",
    id: neighbor.dep.dependency_id,
    color: colorForDependency(neighbor.dep.dependency_type),
    label: "Nearest compound route",
    title: entityName(neighbor.compounds[0]),
    reason: "This dependency has no compound; this related dependency does.",
    cta: "Open route"
  };
}

function jumpChip(jump) {
  return `
    <button class="jump-chip" type="button" data-action="${esc(jump.action)}" data-id="${esc(jump.id)}" style="--jump-color:${esc(jump.color)}">
      <span class="jump-label">${esc(jump.label)}</span>
      <strong>${esc(shortText(jump.title, 48))}</strong>
      <em>${esc(shortText(jump.reason, 96))}</em>
      <small>${esc(jump.cta || "Open")}</small>
    </button>
  `;
}

function moreNearbyLinks(dep, bridgeMatches, eventMatches, bridgeEvents, compoundNeighbors) {
  const total = bridgeMatches.length + eventMatches.length + bridgeEvents.length + compoundNeighbors.length;
  if (!total) return "";
  return `
    <details class="jump-more">
      <summary>
        <span>Optional: browse all related links</span>
        <small>${fmt(total)}</small>
      </summary>
      <div class="jump-more-grid">
        ${nearbyLinkGroup("Dependencies using this bridge", bridgeMatches.slice(0, 5).map((item) => dependencyBridgeCard(item, "shared bridge entity")))}
        ${nearbyLinkGroup("Dependencies sharing source/target", eventMatches.slice(0, 5).map((item) => dependencyBridgeCard(item, sharedEventLabel(dep, item))))}
        ${nearbyLinkGroup("Events mentioning the bridge", bridgeEvents.slice(0, 5).map(eventBridgeCard))}
        ${nearbyLinkGroup("Compound-linked dependencies", compoundNeighbors.slice(0, 5).map((item) => dependencyBridgeCard(item.dep, `${fmt(item.compounds.length)} compound${item.compounds.length === 1 ? "" : "s"}`)))}
      </div>
    </details>
  `;
}

function nearbyLinkGroup(title, cards) {
  if (!cards.length) return "";
  return `
    <div class="nearby-link-group">
      <h3>${esc(title)}</h3>
      <div class="bridge-card-list">${cards.join("")}</div>
    </div>
  `;
}

function bridgeKeys(dep) {
  return asArray(dep.bridge_entities).map(normalizeBridgeKey).filter(Boolean);
}

function normalizeBridgeKey(value) {
  return String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function dependenciesSharingBridge(dep) {
  const keys = new Set(bridgeKeys(dep));
  if (!keys.size) return [];
  return state.data.dependencies
    .filter((item) => item.dependency_id !== dep.dependency_id)
    .filter((item) => bridgeKeys(item).some((key) => keys.has(key)))
    .sort(dependencyNeighborSort(dep));
}

function dependenciesSharingEvents(dep) {
  const ids = new Set([dep.upstream_event_id, dep.downstream_event_id]);
  return state.data.dependencies
    .filter((item) => item.dependency_id !== dep.dependency_id)
    .filter((item) => ids.has(item.upstream_event_id) || ids.has(item.downstream_event_id))
    .sort(dependencyNeighborSort(dep));
}

function dependencyNeighborSort(dep) {
  const ids = new Set([dep.upstream_event_id, dep.downstream_event_id]);
  const tierRank = { accepted: 0, hypothesis: 1, rejected: 2 };
  return (a, b) => {
    const aShared = Number(ids.has(a.upstream_event_id)) + Number(ids.has(a.downstream_event_id));
    const bShared = Number(ids.has(b.upstream_event_id)) + Number(ids.has(b.downstream_event_id));
    if (bShared !== aShared) return bShared - aShared;
    const tierDiff = (tierRank[canonicalTier(a.tier)] ?? 9) - (tierRank[canonicalTier(b.tier)] ?? 9);
    if (tierDiff) return tierDiff;
    return String(a.dependency_id).localeCompare(String(b.dependency_id));
  };
}

function sharedEventLabel(current, candidate) {
  const pieces = [];
  if (candidate.upstream_event_id === current.upstream_event_id || candidate.downstream_event_id === current.upstream_event_id) pieces.push("source event");
  if (candidate.upstream_event_id === current.downstream_event_id || candidate.downstream_event_id === current.downstream_event_id) pieces.push("target event");
  return pieces.join(" + ") || "shared event";
}

function dependencyBridgeCard(dep, label) {
  const source = state.indexes.eventById.get(dep.upstream_event_id);
  const target = state.indexes.eventById.get(dep.downstream_event_id);
  const bridge = asArray(dep.bridge_entities).slice(0, 2).join(", ") || clean(dep.reason_code || "evidence");
  return `
    <button class="bridge-nav-card" type="button" data-action="select-dependency" data-id="${esc(dep.dependency_id)}" style="--bridge-color:${colorForDependency(dep.dependency_type)}">
      <span class="bridge-nav-kicker">${esc(label)}</span>
      <strong>${esc(clean(dep.dependency_type))}</strong>
      <span>${esc(shortText(`${clean(source?.event_type)} -> ${clean(target?.event_type)}`, 72))}</span>
      <small>${esc(bridge)}${dep.tier ? ` | ${esc(tierLabel(dep.tier))}` : ""}</small>
    </button>
  `;
}

function eventsSharingBridge(dep) {
  const keys = new Set(bridgeKeys(dep));
  if (!keys.size) return [];
  const selectedIds = new Set([dep.upstream_event_id, dep.downstream_event_id]);
  return state.data.events
    .filter((event) => !selectedIds.has(event.event_id))
    .filter((event) => eventBridgeKeys(event).some((key) => keys.has(key)))
    .sort((a, b) => Number(b.relation_count || 0) - Number(a.relation_count || 0) || a.event_id.localeCompare(b.event_id));
}

function eventBridgeKeys(event) {
  const groups = eventParticipantGroups(event);
  return uniqueStrings([...groups.direct, ...groups.context, ...groups.other].flatMap(entityBridgeKeys));
}

function entityBridgeKeys(entity) {
  return [
    entityName(entity),
    entity.normalized_label,
    entity.selected_label,
    ...entityOntologyIds(entity),
    ...asArray(entity.aliases)
  ].map(normalizeBridgeKey).filter(Boolean);
}

function eventBridgeCard(event) {
  return `
    <button class="bridge-nav-card event-link" type="button" data-action="select-event" data-id="${esc(event.event_id)}" style="--bridge-color:${colorForEvent(event.event_type)}">
      <span class="bridge-nav-kicker">event</span>
      <strong>${esc(clean(event.event_type))}</strong>
      <span>${esc(eventParticipantPreview(event, 3) || shortId(event.event_id))}</span>
      <small>${fmt(event.relation_count)} relations | ${fmt(event.dependency_counts?.accepted || 0)} deps</small>
    </button>
  `;
}

function dependencyCompoundEntities(dep) {
  const events = [dep.upstream_event_id, dep.downstream_event_id]
    .map((id) => state.indexes.eventById.get(id))
    .filter(Boolean);
  const entities = [];
  const seen = new Set();
  events.forEach((event) => {
    const groups = eventParticipantGroups(event);
    [...groups.direct, ...groups.context, ...groups.other].forEach((entity) => {
      if (entity?.entity_type !== "compound" || seen.has(entity.node_id)) return;
      seen.add(entity.node_id);
      entities.push(entity);
    });
  });
  return entities.sort((a, b) => entityName(a).localeCompare(entityName(b)));
}

function compoundLinkedNeighborDependencies(dep) {
  const shared = [...dependenciesSharingBridge(dep), ...dependenciesSharingEvents(dep)];
  const seen = new Set();
  return shared
    .filter((item) => {
      if (seen.has(item.dependency_id)) return false;
      seen.add(item.dependency_id);
      return true;
    })
    .map((item) => ({ dep: item, compounds: dependencyCompoundEntities(item) }))
    .filter((item) => item.compounds.length)
    .sort((a, b) => b.compounds.length - a.compounds.length || String(a.dep.dependency_id).localeCompare(String(b.dep.dependency_id)));
}

function mechanismMap(dep) {
  const source = state.indexes.eventById.get(dep.upstream_event_id);
  const target = state.indexes.eventById.get(dep.downstream_event_id);
  if (!source || !target) return "";
  const depColor = colorForDependency(dep.dependency_type);
  return `
    <div class="mechanism-board">
      ${eventMechanismPanel(source, "Source event")}
      ${dependencyBridgePanel(dep, depColor)}
      ${eventMechanismPanel(target, "Target event")}
      ${dependencyEvidenceDock(dep)}
    </div>
  `;
}

function dependencyEvidenceDock(dep) {
  const sourceRelations = state.indexes.relationsByEvent.get(dep.upstream_event_id) || [];
  const targetRelations = state.indexes.relationsByEvent.get(dep.downstream_event_id) || [];
  const pairs = dependencySupportingRelationPairs(dep);
  const source = state.indexes.eventById.get(dep.upstream_event_id);
  const target = state.indexes.eventById.get(dep.downstream_event_id);
  if (!sourceRelations.length && !targetRelations.length && !pairs.length) return "";
  const hiddenPairs = Math.max(0, pairs.length - 1);
  return `
    <section class="dependency-evidence-dock minimal-evidence-dock">
      <div class="dependency-evidence-head">
        <strong>Connection provenance</strong>
        <span>The source and target claims are shown with the dependency bridge that links them.</span>
      </div>
      ${pairs.length ? dependencyProofCard(dep, pairs[0]) : dependencyFallbackEventEvidence(dep, source, target)}
      ${hiddenPairs ? `<div class="evidence-more-note">${fmt(hiddenPairs)} additional supporting relation pair${hiddenPairs === 1 ? "" : "s"} are available in technical provenance below.</div>` : ""}
    </section>
  `;
}

function dependencySupportingRelationPairs(dep) {
  return asArray(dep.supporting_relation_pairs)
    .map((pair) => {
      const ids = String(pair || "").split("->").map((id) => id.trim()).filter(Boolean);
      const sourceRel = state.indexes.relationById.get(ids[0]);
      const targetRel = state.indexes.relationById.get(ids[1]);
      return { pair, ids, sourceRel, targetRel };
    })
    .filter((row) => row.sourceRel || row.targetRel || row.ids.length);
}

function dependencyProofCard(dep, pair) {
  return `
    <article class="dependency-proof-card simple-proof">
      <div class="dependency-proof-flow simple-proof-flow">
        ${relationProofCard(pair.sourceRel, "Source text")}
        <div class="dependency-proof-bridge">
          <span>Dependency bridge</span>
          <strong>${esc(clean(dep.dependency_type || "event dependency"))}</strong>
          ${asArray(dep.bridge_entities).length ? `<small>${esc(asArray(dep.bridge_entities).join(", "))}</small>` : ""}
          ${dep.reason_code ? `<small>${esc(clean(dep.reason_code))}</small>` : ""}
        </div>
        ${relationProofCard(pair.targetRel, "Target text")}
      </div>
    </article>
  `;
}

function relationProofCard(rel, role) {
  if (!rel) return `<div class="proof-relation-card muted">${esc(role)} relation was not found in this paper bundle.</div>`;
  const sentence = relationEvidenceSentence(rel);
  const contexts = relationContextEntities(rel);
  const sentenceId = sentence.id || asArray(rel.evidence_sentence_ids)[0] || "";
  return `
    <article class="proof-relation-card text-first-card">
      <div class="proof-relation-head">
        <div>
          <span>${esc(role)}</span>
          <small>${esc(sentenceId || rel.record_id)}</small>
        </div>
        <button class="mini-button subtle-open" type="button" data-action="select-relation" data-id="${esc(rel.record_id)}">Open</button>
      </div>
      ${relationProvenancePills(rel, { compact: true })}
      <p class="proof-evidence-text">${sentence.text ? highlightRelationSentence(sentence.text, rel, contexts) : `<span class="muted">No evidence text found for this relation.</span>`}</p>
      <button class="proof-triple-cue compact-triple-cue" type="button" data-action="select-relation" data-id="${esc(rel.record_id)}">${relationPlainTriple(rel)}</button>
    </article>
  `;
}

function relationPlainTriple(rel) {
  return `
    <span>${esc(rel.subject || "subject")}</span>
    <strong>${esc(clean(rel.predicate || rel.predicate_class || "relation"))}</strong>
    <span>${esc(rel.object || "object")}</span>
  `;
}

function sentenceMetadataLine(sentenceId) {
  if (!sentenceId) return "";
  const sentence = state.indexes.sentenceById.get(sentenceId);
  const items = [
    sentence?.section ? clean(sentence.section) : "",
    sentence?.passage_index ? `passage ${sentence.passage_index}` : "",
    sentence?.sentence_index ? `sentence ${sentence.sentence_index}` : "",
    sentenceId
  ].filter(Boolean);
  return items.map((item) => `<span>${esc(item)}</span>`).join("");
}

function cleanSectionName(value) {
  const text = String(value || "").replaceAll("_", " ").trim();
  if (!text) return "";
  return text.toLowerCase().replace(/\b[a-z]/g, (letter) => letter.toUpperCase());
}

function sentenceSections(sentenceIds) {
  return uniqueStrings(asArray(sentenceIds).map((id) => {
    const sentence = state.indexes?.sentenceById.get(id);
    return cleanSectionName(sentence?.section || "");
  }).filter(Boolean));
}

function relationEvidenceSections(rel) {
  return uniqueStrings([
    ...sentenceSections(rel?.evidence_sentence_ids),
    ...asArray(rel?.evidence).map((item) => cleanSectionName(item?.section_type || "")).filter(Boolean)
  ]);
}

function relationEvidenceMode(rel) {
  const value = rel?.assertion_modifier || rel?.relation_evaluation_verdict || rel?.record_type || "";
  return value ? clean(value).trim() : "";
}

function eventEvidenceSections(event, relations = null) {
  const eventRelations = relations || (state.indexes?.relationsByEvent.get(event?.event_id) || []);
  return uniqueStrings([
    ...sentenceSections(event?.evidence_sentence_ids),
    ...eventRelations.flatMap(relationEvidenceSections)
  ]);
}

function eventEvidenceModes(relations) {
  const counts = new Map();
  relations.forEach((rel) => {
    const mode = relationEvidenceMode(rel);
    if (!mode) return;
    counts.set(mode, (counts.get(mode) || 0) + 1);
  });
  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([mode, count]) => `${mode} ${count}`);
}

function dependencyEvidenceSections(dep) {
  const relations = dependencySupportingRelationPairs(dep).flatMap((pair) => [pair.sourceRel, pair.targetRel]).filter(Boolean);
  const sourceEvent = state.indexes?.eventById.get(dep?.upstream_event_id);
  const targetEvent = state.indexes?.eventById.get(dep?.downstream_event_id);
  return uniqueStrings([
    ...sentenceSections(dep?.evidence_sentence_ids),
    ...relations.flatMap(relationEvidenceSections),
    ...(sourceEvent ? eventEvidenceSections(sourceEvent) : []),
    ...(targetEvent ? eventEvidenceSections(targetEvent) : [])
  ]);
}

function dependencyEvidenceModes(dep) {
  const relations = dependencySupportingRelationPairs(dep).flatMap((pair) => [pair.sourceRel, pair.targetRel]).filter(Boolean);
  return eventEvidenceModes(relations);
}

function provenancePillGroup(items, label, options = {}) {
  const values = uniqueStrings(asArray(items).filter(Boolean));
  if (!values.length) return "";
  const limit = options.limit || 3;
  const shown = values.slice(0, limit);
  return `
    <div class="provenance-pill-group ${options.compact ? "compact" : ""}">
      <span class="provenance-label">${esc(label)}</span>
      ${shown.map((value) => `<span class="provenance-pill">${esc(value)}</span>`).join("")}
      ${values.length > limit ? `<span class="provenance-pill muted-pill">+${fmt(values.length - limit)}</span>` : ""}
    </div>
  `;
}

function relationProvenancePills(rel, options = {}) {
  return `
    <div class="claim-provenance ${options.compact ? "compact" : ""}">
      ${provenancePillGroup(relationEvidenceSections(rel), "section", { compact: options.compact, limit: options.compact ? 1 : 3 })}
      ${provenancePillGroup([relationEvidenceMode(rel)], "mode", { compact: options.compact, limit: 1 })}
      ${Number(rel.duplicate_count || 0) > 1 ? provenancePillGroup([`${fmt(rel.duplicate_count)} merged`], "records", { compact: options.compact, limit: 1 }) : ""}
    </div>
  `;
}

function eventProvenancePills(event, relations, options = {}) {
  return `
    <div class="claim-provenance ${options.compact ? "compact" : ""}">
      ${provenancePillGroup(eventEvidenceSections(event, relations), "section", { compact: options.compact, limit: options.compact ? 1 : 3 })}
      ${provenancePillGroup(eventEvidenceModes(relations), "relations", { compact: options.compact, limit: options.compact ? 1 : 3 })}
    </div>
  `;
}

function dependencyProvenancePills(dep, options = {}) {
  return `
    <div class="claim-provenance ${options.compact ? "compact" : ""}">
      ${provenancePillGroup(dependencyEvidenceSections(dep), "section", { compact: options.compact, limit: options.compact ? 1 : 3 })}
      ${provenancePillGroup([dep?.support_verdict || dep?.verdict, ...dependencyEvidenceModes(dep)], "support", { compact: options.compact, limit: options.compact ? 1 : 3 })}
    </div>
  `;
}

function dependencyFallbackEventEvidence(dep, source, target) {
  const cards = [
    eventEvidenceProofCard(source, "Source event"),
    eventEvidenceProofCard(target, "Target event")
  ].filter(Boolean).join("");
  return cards ? `<div class="dependency-proof-flow fallback">${cards}</div>` : `<div class="compact-card muted">No event evidence sentences were available for this dependency.</div>`;
}

function eventEvidenceProofCard(event, role) {
  if (!event) return "";
  const sentenceIds = asArray(event.evidence_sentence_ids);
  return `
    <article class="proof-relation-card">
      <div class="proof-relation-head">
        <span>${esc(role)}</span>
        <button class="mini-button" type="button" data-action="select-event" data-id="${esc(event.event_id)}">Open event</button>
      </div>
      <strong>${esc(event.event_label || event.event_id)}</strong>
      ${sentenceIds.length ? sentenceIds.map((id) => {
    const sentence = state.indexes.sentenceById.get(id);
    return `<p>${sentence?.text ? esc(sentence.text) : esc(id)}</p>`;
  }).join("") : `<p class="muted">No evidence sentence IDs.</p>`}
    </article>
  `;
}

function eventMechanismPanel(event, role) {
  const relations = (state.indexes.relationsByEvent.get(event.event_id) || []).slice(0, 4);
  const focused = focusedRelationForEvent(relations);
  const color = colorForEvent(event.event_type);
  const roleClass = role.toLowerCase().startsWith("source") ? "source-card" : "target-card";
  return `
    <article class="mechanism-event-card ${roleClass}" style="--event-color:${color}">
      <div class="mechanism-event-top">
        <span>${esc(role)}</span>
        <button class="subtle-link" type="button" data-action="select-event" data-id="${esc(event.event_id)}">inspect</button>
      </div>
      <h3>${esc(event.event_label || event.event_id)}</h3>
      <div class="mechanism-meta">
        ${badges([clean(event.event_type), `${event.relation_count} relations`, `${event.dependency_counts.accepted} deps`])}
      </div>
      ${eventProvenancePills(event, state.indexes.relationsByEvent.get(event.event_id) || [], { compact: true })}
      <div class="mechanism-section participants-section">
        <div class="mechanism-section-head">
          <span class="section-index">01</span>
          <div>
            <strong>Actors and context</strong>
            <span>core entities separated from conditions</span>
          </div>
        </div>
        ${participantGroupsMarkup(event, { directLimit: 5, contextLimit: 4, otherLimit: 2 })}
      </div>
      <div class="mechanism-section triples-section">
        <div class="mechanism-section-head">
          <span class="section-index">02</span>
          <div>
            <strong>Relations</strong>
            <span>each row is one extracted triple</span>
          </div>
        </div>
        <div class="mechanism-relation-stack compact-stack">
          ${relations.map((rel) => relationContextRow(rel, { compact: true, eventId: event.event_id, activeId: focused?.record_id || "" })).join("") || `<div class="mini-relation muted">No relations.</div>`}
        </div>
      </div>
    </article>
  `;
}

function dependencyBridgePanel(dep, color) {
  return `
    <article class="mechanism-bridge-card" style="--dep-color:${color}">
      <div class="bridge-line" aria-hidden="true"></div>
      <div class="bridge-card-core">
        <span class="bridge-eyebrow">Dependency link</span>
        <strong>${esc(clean(dep.dependency_type))}</strong>
        <span class="bridge-tier">${esc(tierLabel(dep.tier))}${dep.confidence ? ` | confidence ${esc(dep.confidence)}` : ""}</span>
        ${dependencyProvenancePills(dep, { compact: true })}
        <div class="bridge-facts">
          <div>
            <span>Bridge</span>
            <strong>${esc(asArray(dep.bridge_entities).join(", ") || "evidence")}</strong>
          </div>
          <div>
            <span>Reason</span>
            <strong>${esc(clean(dep.reason_code || "-"))}</strong>
          </div>
        </div>
      </div>
    </article>
  `;
}

function participantRank(entity) {
  const type = entity?.entity_type || "";
  if (type === "compound") return 0;
  if (type === "gene_protein" || type === "gene" || type === "protein") return 1;
  if (type === "pathway_or_process") return 2;
  if (type === "plant_trait" || type === "molecular_trait_or_function") return 3;
  if (type === "experimental_condition") return 4;
  return 5;
}

function eventParticipantGroups(event) {
  const relations = state.indexes.relationsByEvent.get(event.event_id) || [];
  const directIds = new Set();
  const contextIds = new Set();
  relations.forEach((rel) => {
    [...relationLocalSubjectIds(rel), ...relationLocalObjectIds(rel)].filter(Boolean).forEach((id) => directIds.add(id));
    asArray(rel.context_node_ids).filter(Boolean).forEach((id) => contextIds.add(id));
  });

  const roleById = new Map();
  asArray(event.participants).forEach((participant) => {
    if (participant?.node_id) roleById.set(participant.node_id, participant.participant_role || "");
  });

  const byId = new Map();
  asArray(event.participant_node_ids).forEach((id) => {
    const entity = state.indexes.entityById.get(id);
    if (entity) byId.set(id, entity);
  });
  directIds.forEach((id) => {
    const entity = state.indexes.entityById.get(id);
    if (entity) byId.set(id, entity);
  });
  contextIds.forEach((id) => {
    const entity = state.indexes.entityById.get(id);
    if (entity) byId.set(id, entity);
  });

  const groups = { direct: [], context: [], other: [] };
  Array.from(byId.values())
    .sort((a, b) => participantRank(a) - participantRank(b) || entityName(a).localeCompare(entityName(b)))
    .forEach((entity) => {
      const id = entity.node_id;
      const role = roleById.get(id) || "";
      if (directIds.has(id)) {
        groups.direct.push(entity);
      } else if (contextIds.has(id) || isContextParticipant(entity, role)) {
        groups.context.push(entity);
      } else {
        groups.other.push(entity);
      }
    });
  const directContextKeys = new Set(groups.direct.map(contextEntityMergeKey).filter(Boolean));
  groups.context = mergeContextEntitiesByOntology(groups.context.filter((entity) => !directContextKeys.has(contextEntityMergeKey(entity))));
  return groups;
}

function isContextParticipant(entity, role) {
  const type = entity?.entity_type || "";
  return /context|taxon|assay|condition|genotype|stage|location|anatomical|parameter/.test(`${role} ${type}`.toLowerCase());
}

function participantGroupsMarkup(event, limits = {}) {
  const groups = eventParticipantGroups(event);
  const sections = [
    {
      key: "direct",
      label: "Core actors",
      hint: "used in relations",
      eventId: event.event_id,
      items: groups.direct,
      limit: limits.directLimit ?? 8
    },
    {
      key: "context",
      label: "Context",
      hint: "conditions and setting",
      eventId: event.event_id,
      items: groups.context,
      limit: limits.contextLimit ?? 8
    },
    {
      key: "other",
      label: "Other participants",
      hint: "event-level",
      eventId: event.event_id,
      items: groups.other,
      limit: limits.otherLimit ?? 4
    }
  ].filter((section) => section.items.length);

  if (!sections.length) return `<div class="compact-card muted">No participant entities.</div>`;
  return `
    <div class="participant-groups">
      ${sections.map(participantGroupSection).join("")}
    </div>
  `;
}

function participantGroupSection(section) {
  const shown = section.items.slice(0, section.limit);
  const hidden = section.items.slice(section.limit);
  const hiddenCount = Math.max(0, section.items.length - section.limit);
  return `
    <div class="participant-group ${esc(section.key)}">
      <div class="participant-group-head">
        <strong>${esc(section.label)}</strong>
        <span>${fmt(section.items.length)} | ${esc(section.hint)}</span>
      </div>
      <div class="mechanism-entity-strip">
        ${shown.map((entity) => entityMiniChip(entity, section.key)).join("")}
        ${hiddenCount ? `
          <details class="participant-more-details">
            <summary>
              <strong>+${fmt(hiddenCount)} more</strong>
              <span>${esc(section.label)}</span>
            </summary>
            <div class="participant-hidden-grid">
              ${hidden.map((entity) => entityMiniChip(entity, section.key)).join("")}
            </div>
          </details>
        ` : ""}
      </div>
    </div>
  `;
}

function openParticipantGroupModal(eventId, groupKey) {
  const event = state.indexes.eventById.get(eventId);
  if (!event) return;
  const groups = eventParticipantGroups(event);
  const config = {
    direct: {
      label: "Relation entities",
      hint: "Subjects and objects extracted in the event relations.",
      items: groups.direct
    },
    context: {
      label: "Context entities",
      hint: "Experimental setting, stress, genotype, assay, or condition terms attached as context.",
      items: groups.context
    },
    other: {
      label: "Other participants",
      hint: "Event-level participants that were not direct relation endpoints or explicit context.",
      items: groups.other
    }
  };
  const selected = config[groupKey] || config.direct || { label: "Participants", hint: "", items: [] };
  els.modalBody.innerHTML = `
    <div class="participant-modal">
      <div class="section-header">
        <div>
          <h2 id="modalTitle">${esc(selected.label)}</h2>
          <span class="muted">${fmt(selected.items.length)} entities | ${esc(event.event_id)}</span>
        </div>
      </div>
      <p class="muted">${esc(selected.hint)}</p>
      <div class="participant-event-card">
        <strong>${esc(event.event_label || shortId(event.event_id))}</strong>
        <span>${esc([clean(event.event_type), event.event_scope, `${event.relation_count || 0} relations`].filter(Boolean).join(" | "))}</span>
      </div>
      <div class="participant-modal-grid">
        ${selected.items.length ? selected.items.map((entity) => participantDetailCard(entity, groupKey)).join("") : `<div class="compact-card muted">No entities in this group.</div>`}
      </div>
    </div>
  `;
  els.modal.classList.add("open");
  els.modal.setAttribute("aria-hidden", "false");
}

function participantDetailCard(entity, groupKey) {
  const ontologyIds = entityOntologyIds(entity);
  const mergeCount = Number(entity.context_merge_count || 0);
  return `
    <article class="participant-detail-card ${esc(groupKey)}-entity" style="--entity-color:${colorForEntity(entity.entity_type)}">
      <div class="participant-detail-main">
        <span class="dot"></span>
        <div>
          <strong>${esc(entityName(entity))}</strong>
          <span>${esc([clean(entity.entity_type), entity.normalized_label || entity.selected_label, mergeCount > 1 ? `${fmt(mergeCount)} merged labels` : ""].filter(Boolean).join(" | "))}</span>
        </div>
      </div>
      ${ontologyIds.length ? `<div class="participant-detail-ids">${badges(ontologyIds, "ontology", 3)}</div>` : ""}
      ${mergeCount > 1 ? `<div class="participant-detail-ids">${badges(asArray(entity.aliases), "", 6)}</div>` : ""}
      <div class="click-row">
        <button class="mini-button" type="button" data-action="open-entity" data-id="${esc(entity.node_id)}">Details</button>
        <button class="mini-button" type="button" data-action="path-start" data-id="${esc(entity.node_id)}">Route start</button>
        <button class="mini-button" type="button" data-action="path-end" data-id="${esc(entity.node_id)}">Route end</button>
      </div>
    </article>
  `;
}

function entityMiniChip(entity, role = "direct") {
  const secondary = entityVisualDescriptor(entity);
  const label = entityName(entity);
  const mergeCount = Number(entity.context_merge_count || 0);
  return `
    <button class="mini-entity-chip ${esc(role)}-entity" type="button" data-action="open-entity" data-id="${esc(entity.node_id)}" style="--entity-color:${colorForEntity(entity.entity_type)}" title="${esc(`${label}${secondary ? ` - ${secondary}` : ""}`)}">
      <span class="dot"></span>
      <span>
        <strong>${esc(label)}${mergeCount > 1 ? ` +${fmt(mergeCount - 1)}` : ""}</strong>
        <small>${esc([secondary, mergeCount > 1 ? `${fmt(mergeCount)} merged labels` : ""].filter(Boolean).join(" | "))}</small>
      </span>
    </button>
  `;
}

function relationMiniRow(rel) {
  const subject = state.indexes.entityById.get(rel.subject_node_id);
  const object = state.indexes.entityById.get(rel.object_node_id);
  const subjectLabel = subject ? entityName(subject) : rel.subject || "subject";
  const objectLabel = object ? entityName(object) : rel.object || "object";
  return `
    <button class="mini-relation" type="button" data-action="select-relation" data-id="${esc(rel.record_id)}">
      <span>${esc(subjectLabel)}</span>
      <strong>${esc(clean(rel.predicate || rel.predicate_class || "relates to"))}</strong>
      <span>${esc(objectLabel)}</span>
    </button>
  `;
}

function focusedRelationForEvent(relations) {
  return relations.find((rel) => rel.record_id === state.focusedRelationId) || relations[0] || null;
}

function relationContextEntities(rel) {
  const evidence = relationEvidenceSentence(rel).text;
  return asArray(rel?.context_node_ids)
    .map((id) => state.indexes.entityById.get(id))
    .filter(Boolean)
    .filter((entity) => relationContextMatchesEvidence(entity, evidence));
}

function rawRelationContextEntities(rel) {
  return asArray(rel?.context_node_ids)
    .map((id) => state.indexes.entityById.get(id))
    .filter(Boolean);
}

function relationContextSets(rel) {
  const localRaw = relationContextEntities(rel);
  const assignedRaw = rawRelationContextEntities(rel);
  const localKeys = new Set(localRaw.map(contextEntityMergeKey).filter(Boolean));
  const localGroupRaw = assignedRaw.filter((entity) => localKeys.has(contextEntityMergeKey(entity)));
  const broaderRaw = assignedRaw.filter((entity) => !localKeys.has(contextEntityMergeKey(entity)));
  const local = mergeContextEntitiesByOntology(localGroupRaw);
  const broader = mergeContextEntitiesByOntology(broaderRaw);
  return {
    local,
    broader,
    assigned: uniqueBy([...local, ...broader], contextEntityMergeKey)
  };
}

function contextChipLine(label, entities, options = {}) {
  const limit = options.limit ?? entities.length;
  const shown = entities.slice(0, limit);
  const hidden = Math.max(0, entities.length - shown.length);
  if (!shown.length && !options.emptyText) return "";
  return `
    <div class="relation-context-assignment ${options.compact ? "compact" : ""} ${options.focus ? "focus" : ""}">
      <span class="assignment-label">${esc(label)}</span>
      ${shown.length ? shown.map(relationContextEntityChip).join("") : `<span class="muted tiny">${esc(options.emptyText || "No context entities.")}</span>`}
      ${hidden ? `<span class="badge compact-count">+${fmt(hidden)}</span>` : ""}
    </div>
  `;
}

function compactContextChipLine(label, entities, limit) {
  const shown = entities.slice(0, limit);
  if (!shown.length) return "";
  return `
    <span class="context-strip-label">${esc(label)}</span>
    ${shown.map(relationContextEntityChip).join("")}
  `;
}

function relationContextMatchesEvidence(entity, evidenceText) {
  const evidence = String(evidenceText || "").trim();
  if (!entity || !evidence) return false;
  return entityHighlightLabels(entity).some((label) => {
    const pattern = relationTermPattern(label);
    if (!pattern) return false;
    return new RegExp(pattern, "i").test(evidence);
  });
}

function relationContextRow(rel, options = {}) {
  const subject = state.indexes.entityById.get(rel.subject_node_id);
  const object = state.indexes.entityById.get(rel.object_node_id);
  const subjectLabel = subject ? entityName(subject) : rel.subject || "subject";
  const objectLabel = object ? entityName(object) : rel.object || "object";
  const contextSets = relationContextSets(rel);
  const active = rel.record_id === (options.activeId || state.focusedRelationId);
  const eventId = options.eventId || asArray(rel.event_ids)[0] || "";
  if (options.compact) {
    const localLimit = contextSets.local.length ? 2 : 0;
    const broaderLimit = Math.max(1, 3 - localLimit);
    const shownCount = Math.min(contextSets.local.length, localLimit) + Math.min(contextSets.broader.length, broaderLimit);
    const totalCount = contextSets.assigned.length;
    return `
      <article class="relation-context-row compact ${active ? "active" : ""}" data-relation-context-id="${esc(rel.record_id)}" data-relation-event-id="${esc(eventId)}">
        <button class="relation-context-main compact-main" type="button" data-action="focus-relation-context" data-id="${esc(rel.record_id)}">
          <span>${esc(shortText(subjectLabel, 26))}</span>
          <strong>${esc(shortText(clean(rel.predicate || rel.predicate_class || "relates to"), 28))}</strong>
          <span>${esc(shortText(objectLabel, 26))}</span>
        </button>
        ${relationProvenancePills(rel, { compact: true })}
        <div class="compact-relation-meta">
          <div class="compact-context-strip">
            ${compactContextChipLine("local", contextSets.local, localLimit)}
            ${compactContextChipLine("broader", contextSets.broader, broaderLimit)}
            ${totalCount > shownCount ? `<span class="badge compact-count">+${fmt(totalCount - shownCount)}</span>` : ""}
          </div>
          <button class="mini-button ghost-open" type="button" data-action="select-relation" data-id="${esc(rel.record_id)}">Details</button>
        </div>
      </article>
    `;
  }
  return `
    <article class="relation-context-row ${options.compact ? "compact" : ""} ${active ? "active" : ""}" data-relation-context-id="${esc(rel.record_id)}" data-relation-event-id="${esc(eventId)}">
      <button class="relation-context-main" type="button" data-action="focus-relation-context" data-id="${esc(rel.record_id)}">
        <span>${esc(shortText(subjectLabel, options.compact ? 22 : 34))}</span>
        <strong>${esc(shortText(clean(rel.predicate || rel.predicate_class || "relates to"), options.compact ? 24 : 36))}</strong>
        <span>${esc(shortText(objectLabel, options.compact ? 22 : 34))}</span>
      </button>
      ${relationProvenancePills(rel, { compact: true })}
      <div class="relation-context-stack">
        ${contextChipLine("local context", contextSets.local, { emptyText: contextSets.assigned.length ? "No assigned context appears in the evidence sentence." : "No context entities assigned.", limit: 8 })}
        ${contextChipLine("broader context", contextSets.broader, { emptyText: "", limit: 8 })}
      </div>
      <div class="relation-context-actions">
        <button class="mini-button" type="button" data-action="select-relation" data-id="${esc(rel.record_id)}">Open</button>
      </div>
    </article>
  `;
}

function relationContextEntityChip(entity) {
  const mergeCount = Number(entity?.context_merge_count || 0);
  const titleParts = [
    entityName(entity),
    mergeCount > 1 ? `${fmt(mergeCount)} merged context entities` : "",
    entityOntologyIds(entity).join(", "),
    mergeCount > 1 ? asArray(entity.aliases).slice(0, 8).join(", ") : ""
  ].filter(Boolean);
  return `
    <button class="context-assignment-chip" type="button" data-action="open-entity" data-id="${esc(entity.node_id)}" style="--entity-color:${colorForEntity(entity.entity_type)}" title="${esc(titleParts.join(" | "))}">
      <span class="dot"></span>
      ${esc(shortText(entityName(entity), 28))}
      ${mergeCount > 1 ? `<span class="merge-count">+${fmt(mergeCount - 1)}</span>` : ""}
    </button>
  `;
}

function eventRelationContextPanel(event, relations, options = {}) {
  if (!relations.length) return `<div class="relation-context-focus muted">No relation evidence to highlight.</div>`;
  const rel = focusedRelationForEvent(relations);
  if (!rel) return "";
  const compact = Boolean(options.compact);
  return `
    <div class="relation-context-focus ${compact ? "compact" : ""}" data-context-event-id="${esc(event.event_id)}" data-context-compact="${compact ? "true" : "false"}">
      ${relationContextFocusContent(rel, { compact })}
    </div>
  `;
}

function relationContextFocusContent(rel, options = {}) {
  const contextSets = relationContextSets(rel);
  const sentence = relationEvidenceSentence(rel);
  const compact = Boolean(options.compact);
  if (compact) {
    return `
      <div class="relation-context-focus-head">
        <div>
          <strong>Evidence sentence</strong>
          <span>highlighted actors and assigned context</span>
        </div>
        <button class="mini-button ghost-open" type="button" data-action="select-relation" data-id="${esc(rel.record_id)}">Details</button>
      </div>
      <div class="relation-context-stack">
        ${contextChipLine("local", contextSets.local, { compact: true, focus: true, emptyText: contextSets.assigned.length ? "No assigned context appears in this sentence." : "No context assigned.", limit: 5 })}
        ${contextChipLine("broader", contextSets.broader, { compact: true, focus: true, limit: 5 })}
      </div>
      <div class="highlighted-sentence compact">
        ${sentence.text ? highlightRelationSentence(sentence.text, rel, contextSets.local) : `<span class="muted">No core evidence sentence is available for this relation.</span>`}
      </div>
    `;
  }
  return `
    <div class="relation-context-focus-head">
      <div>
        <strong>${compact ? "Selected provenance" : "Triple context"}</strong>
        <span>${esc(shortId(rel.record_id))}${sentence.id ? ` | ${esc(sentence.id)}` : ""}</span>
      </div>
      <button class="mini-button" type="button" data-action="select-relation" data-id="${esc(rel.record_id)}">Open relation</button>
    </div>
    <div class="selected-triple-line ${compact ? "compact" : ""}">
      <span>${esc(rel.subject || "subject")}</span>
      <strong>${esc(clean(rel.predicate || rel.predicate_class || "relation"))}</strong>
      <span>${esc(rel.object || "object")}</span>
    </div>
    <div class="relation-context-stack">
      ${contextChipLine("local context", contextSets.local, { focus: true, emptyText: contextSets.assigned.length ? "No assigned context appears in the evidence sentence." : "No context entities were assigned to this triple.", limit: 10 })}
      ${contextChipLine("broader assigned context", contextSets.broader, { focus: true, limit: 12 })}
    </div>
    <div class="highlighted-sentence ${compact ? "compact" : ""}">
      ${sentence.text ? highlightRelationSentence(sentence.text, rel, contextSets.local) : `<span class="muted">No core evidence sentence is available for this triple.</span>`}
    </div>
    ${!options.compact ? neighboringContextDisclosure(rel, "Neighboring event context") : ""}
  `;
}

function updateRelationContextFocus(relationId, eventId = "") {
  const rel = state.indexes?.relationById.get(relationId);
  if (!rel) return;
  state.focusedRelationId = relationId;
  document.querySelectorAll("[data-relation-context-id]").forEach((row) => {
    const sameRelation = row.getAttribute("data-relation-context-id") === relationId;
    const sameEvent = !eventId || row.getAttribute("data-relation-event-id") === eventId;
    row.classList.toggle("active", sameRelation && sameEvent);
  });
  document.querySelectorAll("[data-context-event-id]").forEach((panel) => {
    const isDependencyDock = panel.getAttribute("data-context-scope") === "dependency";
    if (eventId && !isDependencyDock && panel.getAttribute("data-context-event-id") !== eventId) return;
    const compact = panel.getAttribute("data-context-compact") === "true";
    panel.innerHTML = relationContextFocusContent(rel, { compact });
  });
}

function relationEvidenceSentence(rel) {
  const id = asArray(rel.evidence_sentence_ids)[0] || "";
  const sentence = id ? state.indexes.sentenceById.get(id) : null;
  const rawEvidence = asArray(rel.evidence).map((item) => item?.text || "").filter(Boolean).join(" ");
  return {
    id,
    text: rel.evidence_preview || rawEvidence || sentence?.text || ""
  };
}

function relationHighlightLabels(rel, contexts) {
  const subject = state.indexes.entityById.get(rel.subject_node_id);
  const object = state.indexes.entityById.get(rel.object_node_id);
  return [
    ...entityHighlightLabels(subject, rel.subject).map((label) => ({ label, className: "triple-term", title: "triple entity" })),
    ...entityHighlightLabels(object, rel.object).map((label) => ({ label, className: "triple-term", title: "triple entity" })),
    ...contexts.flatMap((entity) => entityHighlightLabels(entity).map((label) => ({ label, className: "context-term", title: "assigned context" })))
  ];
}

function entityHighlightLabels(entity, fallback = "") {
  if (!entity && !fallback) return [];
  return uniqueStrings([
    fallback,
    entity ? entityName(entity) : "",
    entity?.canonical_form,
    entity?.normalized_label,
    entity?.selected_label,
    entity?.selected_ontology_id,
    ...asArray(entity?.aliases)
  ])
    .map((label) => String(label || "").trim())
    .filter((label) => label.length >= 3 && !/^[A-Z]$/.test(label));
}

function highlightRelationSentence(text, rel, contexts) {
  const terms = relationHighlightLabels(rel, contexts);
  return highlightTextRanges(String(text || ""), terms);
}

function highlightTextRanges(text, terms) {
  const candidates = [];
  terms.forEach((term) => {
    const label = String(term.label || "").trim();
    if (!label) return;
    const pattern = relationTermPattern(label);
    if (!pattern) return;
    const regex = new RegExp(pattern, "gi");
    let match;
    while ((match = regex.exec(text)) !== null) {
      candidates.push({
        start: match.index,
        end: match.index + match[0].length,
        className: term.className,
        title: term.title
      });
      if (match.index === regex.lastIndex) regex.lastIndex += 1;
    }
  });
  candidates.sort((a, b) => a.start - b.start || (b.end - b.start) - (a.end - a.start));
  const ranges = [];
  candidates.forEach((candidate) => {
    if (ranges.some((range) => candidate.start < range.end && candidate.end > range.start)) return;
    ranges.push(candidate);
  });
  ranges.sort((a, b) => a.start - b.start);
  let html = "";
  let cursor = 0;
  ranges.forEach((range) => {
    html += esc(text.slice(cursor, range.start));
    html += `<mark class="${esc(range.className)}" title="${esc(range.title)}">${esc(text.slice(range.start, range.end))}</mark>`;
    cursor = range.end;
  });
  html += esc(text.slice(cursor));
  return html;
}

function relationTermPattern(label) {
  const cleanLabel = String(label || "").trim();
  if (cleanLabel.length < 3) return "";
  return escapeRegExp(cleanLabel)
    .replace(/\\-|[‐‑‒–—−]/g, "[\\\\-‐‑‒–—−]")
    .replace(/\s+/g, "\\s+");
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function eventIsland(event, role, cx, cy, side) {
  const eventColor = colorForEvent(event.event_type);
  const participants = event.participant_node_ids
    .map((id) => state.indexes.entityById.get(id))
    .filter(Boolean)
    .slice(0, 8);
  const relations = (state.indexes.relationsByEvent.get(event.event_id) || []).slice(0, 4);
  const labelLines = svgTextLines(event.event_label || event.event_id, 26, 3);
  const entityNodes = participants.map((entity, index) => {
    const angle = (-120 + index * (240 / Math.max(participants.length - 1, 1))) * Math.PI / 180;
    const x = cx + Math.cos(angle) * 158 * side;
    const y = cy + Math.sin(angle) * 108;
    const type = entity.entity_type || "unknown";
    const label = svgTextLines(entityName(entity), 16, 1)[0];
    return `
      <g class="svg-clickable entity-orbit" data-action="open-entity" data-id="${escAttr(entity.node_id)}" transform="translate(${x.toFixed(1)} ${y.toFixed(1)})">
        <line x1="${(cx - x).toFixed(1)}" y1="${(cy - y).toFixed(1)}" x2="0" y2="0"></line>
        <circle r="${type === "compound" ? 15 : 12}" fill="${colorForEntity(type)}"></circle>
        <text y="${type === "compound" ? 30 : 27}">${escSvg(label)}</text>
      </g>
    `;
  }).join("");
  const relationNodes = relations.map((rel, index) => {
    const y = cy + 92 + index * 26;
    const x = cx + side * ((index % 2) * 44 - 22);
    return `
      <g class="svg-clickable relation-orbit" data-action="select-relation" data-id="${escAttr(rel.record_id)}" transform="translate(${x.toFixed(1)} ${y.toFixed(1)})">
        <rect x="-78" y="-12" width="156" height="24" rx="12"></rect>
        <text>${escSvg(svgTextLines(rel.predicate || rel.predicate_class || "relation", 22, 1)[0])}</text>
      </g>
    `;
  }).join("");
  return `
    <g class="event-island">
      <ellipse class="event-halo" cx="${cx}" cy="${cy}" rx="164" ry="118" fill="${eventColor}" stroke="${eventColor}"></ellipse>
      <g class="svg-clickable event-core" data-action="select-event" data-id="${escAttr(event.event_id)}" transform="translate(${cx} ${cy})">
        <circle r="76" fill="${eventColor}"></circle>
        <text class="role" y="-42">${escSvg(role)}</text>
        ${labelLines.map((line, index) => `<text y="${-11 + index * 17}">${escSvg(line)}</text>`).join("")}
        <text class="small" y="50">${escSvg(`${event.relation_count} relations | ${event.dependency_counts.accepted} deps`)}</text>
      </g>
      ${entityNodes}
      ${relationNodes}
    </g>
  `;
}

function eventConstellation(event) {
  const relations = (state.indexes.relationsByEvent.get(event.event_id) || []).slice(0, 8);
  const focused = focusedRelationForEvent(relations);
  const color = colorForEvent(event.event_type);
  return `
    <div class="event-workbench" style="--event-color:${color}">
      <div class="event-workbench-core">
        <span>${esc(clean(event.event_type))}</span>
        <h3>${esc(event.event_label || event.event_id)}</h3>
        <div>${badges([event.event_scope, `${event.relation_count} relations`, event.has_accepted_dependency ? "dependency-linked" : "no accepted dependency"])}</div>
      </div>
      <div class="event-workbench-grid">
        <section>
          <h4>Actors and context</h4>
          ${participantGroupsMarkup(event)}
        </section>
        <section>
          <div class="event-section-title">
            <h4>Relations</h4>
            <span>hover or click a row to inspect evidence</span>
          </div>
          <div class="mechanism-relation-stack compact-stack">
            ${relations.map((rel) => relationContextRow(rel, { compact: true, eventId: event.event_id, activeId: focused?.record_id || "" })).join("") || `<div class="mini-relation muted">No relation rows.</div>`}
          </div>
        </section>
      </div>
    </div>
  `;
}

function svgTextLines(text, maxChars, maxLines) {
  const words = String(text || "").replaceAll("_", " ").split(/\s+/).filter(Boolean);
  const lines = [];
  let current = "";
  words.forEach((word) => {
    const next = current ? `${current} ${word}` : word;
    if (next.length > maxChars && current) {
      lines.push(current);
      current = word;
    } else {
      current = next;
    }
  });
  if (current) lines.push(current);
  if (lines.length > maxLines) {
    const kept = lines.slice(0, maxLines);
    kept[maxLines - 1] = kept[maxLines - 1].replace(/\.*$/, "") + "...";
    return kept;
  }
  return lines.length ? lines : ["event"];
}

function escSvg(value) {
  return esc(value);
}

function escAttr(value) {
  return esc(value);
}

function cssEscape(value) {
  if (window.CSS && typeof window.CSS.escape === "function") return window.CSS.escape(value);
  return String(value).replace(/["\\]/g, "\\$&");
}

function renderRelationCard(rel) {
  const subject = state.indexes.entityById.get(rel.subject_node_id);
  const object = state.indexes.entityById.get(rel.object_node_id);
  return `
    <article class="relation-card">
      <div class="relation-flow">
        ${entityChip(subject, rel.subject, rel.subject_type)}
        <button class="predicate ${predicateTone(rel.predicate)}" type="button" data-action="select-relation" data-id="${esc(rel.record_id)}">
          ${esc(rel.predicate || "predicate")}
          <span class="entity-normalized">${esc(shortId(rel.record_id))}</span>
        </button>
        ${entityChip(object, rel.object, rel.object_type)}
      </div>
      ${contextChips(rel)}
      ${taxonTissueContextBlock(rel, { compact: true })}
    </article>
  `;
}

function relationSummaryCard(rel) {
  return `
    <div class="compact-summary-card" style="--summary-color:${eventPalette[`${rel.predicate_class}_event`] || eventPalette.unknown}">
      <div>
        <strong>${esc(shortText(rel.predicate || clean(rel.predicate_class) || "relation", 34))}</strong>
        <span>${esc(relationEndpointPreview(rel))}</span>
      </div>
      <button class="mini-button" data-action="select-relation" data-id="${esc(rel.record_id)}" type="button">Open</button>
    </div>
  `;
}

function eventSummaryCard(event) {
  return `
    <div class="compact-summary-card" style="--summary-color:${colorForEvent(event.event_type)}">
      <div>
        <strong>${esc(shortText(clean(event.event_type), 34))}</strong>
        <span>${esc(eventParticipantPreview(event, 3) || shortId(event.event_id))}</span>
      </div>
      <button class="mini-button" type="button" data-action="select-event" data-id="${esc(event.event_id)}">Open</button>
    </div>
  `;
}

function entityChip(entity, fallbackLabel, fallbackType) {
  const type = entity?.entity_type || normalizeType(fallbackType);
  const label = entity ? entityName(entity) : fallbackLabel;
  const ontology = entity ? ontologyLabel(entity) : "";
  const action = entity ? `data-action="open-entity" data-id="${esc(entity.node_id)}"` : "disabled";
  return `
    <button class="entity-chip" type="button" ${action}>
      <span class="dot" style="background:${colorForEntity(type)}"></span>
      <span class="entity-label">
        ${esc(label || "entity")}
        ${ontology ? `<span class="entity-normalized">${esc(ontology)}</span>` : `<span class="entity-normalized">${esc(clean(type))}</span>`}
      </span>
    </button>
  `;
}

function contextChips(rel) {
  const entities = mergeContextEntitiesByOntology(rawRelationContextEntities(rel));
  if (!entities.length) return "";
  return `
    <div class="list-meta">
      <span class="badge">context</span>
      ${entities.map((entity) => {
    const mergeCount = Number(entity.context_merge_count || 0);
    return `<button class="mini-button" type="button" data-action="open-entity" data-id="${esc(entity.node_id)}" title="${esc(entityOntologyIds(entity).join(", "))}">${esc(entityName(entity))}${mergeCount > 1 ? ` +${fmt(mergeCount - 1)}` : ""}</button>`;
  }).join("")}
    </div>
  `;
}

function relationTaxonTissueContext(rel) {
  return rel?.taxon_tissue_context || {};
}

function relationTaxonTissueDisplay(rel, key) {
  const context = relationTaxonTissueContext(rel);
  if (key === "agreement") {
    const computedDisplay = cleanOptionalDisplay(formatTaxonTissueDisplay(
      categoryAwareTaxonTissueAgreementItems(context.event || {}, context.entity_linked || {})
    ));
    if (computedDisplay) return computedDisplay;
    const agreementDisplay = cleanOptionalDisplay(context?.agreement?.display || "");
    if (agreementDisplay) return agreementDisplay;
  }
  const display = formatTaxonTissueDisplay(relationTaxonTissueDisplayItems(rel, key));
  return cleanOptionalDisplay(display || context?.[key]?.display || "");
}

function relationTaxonTissueOverlapDisplay(rel) {
  const agreementDisplay = relationTaxonTissueDisplay(rel, "agreement");
  if (agreementDisplay) return agreementDisplay;
  const context = relationTaxonTissueContext(rel);
  const computedItems = categoryAwareTaxonTissueAgreementItems(context.event || {}, context.entity_linked || {});
  return cleanOptionalDisplay(formatTaxonTissueDisplay(computedItems));
}

function taxonTissueContextBlock(rel, options = {}) {
  const compact = Boolean(options.compact);
  const eventContext = relationTaxonTissueDisplay(rel, "event");
  const entityLinkedContext = relationTaxonTissueDisplay(rel, "entity_linked");
  if (!eventContext && !entityLinkedContext) return "";
  const maxLen = compact ? 110 : 1000;
  const line = (label, value, className) => value ? `
    <div class="taxon-tissue-line ${className}">
      <span>${esc(label)}</span>
      <strong title="${esc(value)}">${esc(shortText(value, maxLen))}</strong>
    </div>
  ` : "";
  return `
    <div class="taxon-tissue-context ${compact ? "compact" : ""}">
      ${line("Event taxon/tissue", eventContext, "event-context")}
      ${line("Entity-linked taxon/tissue", entityLinkedContext, "entity-linked-context")}
      ${entityLinkedContext ? `<small>* indicates context propagated through another relation containing the same endpoint entity.</small>` : ""}
    </div>
  `;
}

function predicateTone(predicate) {
  const text = String(predicate || "").toLowerCase();
  if (/(decreas|reduc|repress|impair|inhibit|negative|suppress)/.test(text)) return "negative";
  if (/(increas|activat|enhanc|improv|contribut|positive|stimulat|promot)/.test(text)) return "positive";
  if (/(produc|cataly|convert|substrate|precursor|participat|degrad|consume|metabol)/.test(text)) return "process";
  return "";
}

function dependencyEvidence(dep) {
  const sentences = dep.evidence_sentence_ids || [];
  return `
    <div class="two-col">
      <div class="kv">
        <div class="key">Dependency ID</div><div>${esc(dep.dependency_id)}</div>
        <div class="key">Verdict</div><div>${badges([tierLabel(dep.tier)], tierClass(dep.tier))} ${esc(dep.support_verdict || "")}</div>
        <div class="key">Evidence sections</div><div>${provenancePillGroup(dependencyEvidenceSections(dep), "section") || `<span class="muted">-</span>`}</div>
        <div class="key">Support basis</div><div>${provenancePillGroup([dep.support_verdict || dep.verdict, ...dependencyEvidenceModes(dep)], "support") || `<span class="muted">-</span>`}</div>
        <div class="key">Origin</div><div>${esc(dep.dependency_origin || "-")}</div>
        <div class="key">Candidates</div><div>${badges([...asArray(dep.candidate_dependency_ids), ...asArray(dep.origin_candidate_dependency_ids)], "", 10)}</div>
      </div>
      <div class="evidence-block">
        <strong>Evidence Sentences</strong>
        ${sentences.length ? sentences.map((id) => `<p>${esc(sentenceText(id))}</p>`).join("") : `<span class="muted">No evidence sentence IDs on this dependency row.</span>`}
      </div>
    </div>
  `;
}

function supportingRelationPairs(dep) {
  const pairs = asArray(dep.supporting_relation_pairs);
  if (!pairs.length) return `<div class="compact-card muted">No supporting relation pairs listed.</div>`;
  return `
    <div class="compact-list">
      ${pairs.slice(0, 20).map((pair) => {
    const ids = pair.split("->").map((id) => id.trim()).filter(Boolean);
    const rels = ids.map((id) => state.indexes.relationById.get(id)).filter(Boolean);
    return `
          <div class="compact-card supporting-relation-pair">
            <strong>${esc(pair)}</strong>
            ${rels.length ? `
              <div class="supporting-pair-grid">
                ${rels.map((rel) => relationContextRow(rel, { compact: true })).join("")}
              </div>
            ` : `
              <div class="click-row">
                ${ids.map((id) => state.indexes.relationById.has(id) ? `<button class="mini-button" data-action="select-relation" data-id="${esc(id)}" type="button">${esc(shortId(id))}</button>` : "").join("")}
              </div>
            `}
          </div>
        `;
  }).join("")}
    </div>
  `;
}

function renderEventMain(event) {
  if (!event) return;
  const deps = state.indexes.dependenciesByEvent.get(event.event_id) || [];
  const relations = state.indexes.relationsByEvent.get(event.event_id) || [];
  const focused = focusedRelationForEvent(relations);
  els.mainPanel.innerHTML = `
    <section class="hero-card">
      ${returnControl()}
      <div class="hero-title">
        <div>
          <h2>${esc(event.event_label || event.event_id)}</h2>
          <p>${esc(event.event_id)} | ${esc(clean(event.event_type))}</p>
          ${eventProvenancePills(event, relations)}
        </div>
        <div>${badges([event.has_accepted_dependency ? "connected" : "no accepted dependency", event.event_scope])}</div>
      </div>
    </section>
    <section class="hero-card event-mechanism-details">
      ${eventConstellation(event)}
      <div class="two-col">
        <div class="kv">
          <div class="key">Relations</div><div>${fmt(event.relation_count)}</div>
          <div class="key">Accepted deps</div><div>${fmt(event.dependency_counts.accepted)}</div>
          <div class="key">Hypothesis deps</div><div>${fmt(event.dependency_counts.hypothesis)}</div>
          <div class="key">Confidence</div><div>${esc(event.confidence || "-")}</div>
          <div class="key">Reason</div><div>${esc(event.reason_code || "-")}</div>
          <div class="key">Evidence sections</div><div>${provenancePillGroup(eventEvidenceSections(event, relations), "section") || `<span class="muted">-</span>`}</div>
          <div class="key">Relation modes</div><div>${provenancePillGroup(eventEvidenceModes(relations), "mode") || `<span class="muted">-</span>`}</div>
          <div class="key">Evidence</div><div>${badges(event.evidence_sentence_ids, "", 10)}</div>
        </div>
        <div class="evidence-block">
          <strong>Event Context</strong>
          <span class="muted tiny">Hover a triple in Relation hyperedges to update the context and sentence highlight.</span>
          ${eventRelationContextPanel(event, relations)}
        </div>
      </div>
    </section>
    ${eventProvenanceMap(event, relations)}
    ${disclosureSection("Relation Hyperedges In This Event", `
      <div class="relation-list">${relations.map((rel) => relationContextRow(rel, { eventId: event.event_id, activeId: focused?.record_id || "" })).join("") || `<div class="compact-card muted">No relations.</div>`}</div>
    `, fmt(relations.length))}
    ${eventOriginalRelationsDisclosure(event, relations)}
    ${disclosureSection("Dependencies Touching This Event", `
      ${dependencyButtons(deps, event.event_id)}
    `, fmt(deps.length))}
  `;
}

function eventOriginalRelations(event) {
  const fromEventIds = asArray(event?.relation_ids)
    .map((id) => state.indexes?.rawRelationById.get(id))
    .filter(Boolean);
  const fromIndex = state.indexes?.rawRelationsByEvent.get(event?.event_id) || [];
  const rawRelations = fromEventIds.length ? fromEventIds : fromIndex;
  return uniqueBy(rawRelations, (rel) => rel.record_id || rel.source_relation_id || rel.triple || JSON.stringify(rel));
}

function eventOriginalRelationsDisclosure(event, dedupedRelations) {
  const rawRelations = eventOriginalRelations(event);
  if (!rawRelations.length) return "";
  const dedupedCount = Number(dedupedRelations?.length || 0);
  const rawCount = rawRelations.length;
  const explanation = rawCount === dedupedCount
    ? "These are the original extracted triples before frontend ontology merging."
    : `The event title is generated from ${fmt(rawCount)} original extracted triples. The main relation view shows ${fmt(dedupedCount)} deduplicated row${dedupedCount === 1 ? "" : "s"} after exact and ontology-based merging.`;
  return disclosureSection("Original Extracted Triples Behind Title", `
    <div class="raw-event-relations">
      <p class="raw-event-note">${esc(explanation)}</p>
      <div class="raw-event-relation-list">
        ${rawRelations.map((rel) => eventRawRelationRow(rel, event.event_id)).join("")}
      </div>
    </div>
  `, `${fmt(rawCount)} original`, false, event.event_id);
}

function eventRawRelationRow(rel, eventId) {
  const context = relationTaxonTissueDisplay(rel, "direct") || relationContextDisplay(rel.context);
  const sentenceIds = asArray(rel.evidence_sentence_ids);
  const sentenceMeta = sentenceIds.map(sentenceMetadataLine).filter(Boolean).slice(0, 2).join(" ");
  return `
    <article class="raw-event-relation-row" data-relation-context-id="${esc(rel.record_id)}" data-relation-event-id="${esc(eventId)}">
      <div class="raw-event-triple">
        <span>${esc(rel.subject || "subject")}</span>
        <strong>${esc(clean(rel.predicate || rel.predicate_class || "relation"))}</strong>
        <span>${esc(rel.object || "object")}</span>
      </div>
      <div class="raw-event-relation-meta">
        ${sentenceMeta}
        ${relationEvidenceMode(rel) ? `<span>${esc(clean(relationEvidenceMode(rel)))}</span>` : ""}
        ${context ? `<span>${esc(context)}</span>` : ""}
      </div>
      <button class="mini-button" type="button" data-action="select-relation" data-id="${esc(rel.record_id)}">Open merged row</button>
    </article>
  `;
}

function relationContextDisplay(context) {
  const values = [];
  Object.entries(context || {}).forEach(([key, items]) => {
    asArray(items).forEach((item) => {
      const text = String(item || "").trim();
      if (text) values.push(`${clean(key)}: ${text}`);
    });
  });
  return uniqueStrings(values).join("; ");
}

function eventProvenanceMap(event, relations) {
  const groups = eventProvenanceGroups(relations);
  if (!groups.length) return "";
  return `
    <section class="section-card event-provenance-panel simple-event-evidence">
      <div class="section-header">
        <div>
          <h2>Evidence text</h2>
          <span class="muted">Sentences supporting this event. Select a triple pill to inspect its context.</span>
        </div>
        <span class="muted">${fmt(groups.length)} sentence${groups.length === 1 ? "" : "s"}</span>
      </div>
      <div class="event-provenance-grid">
        ${groups.slice(0, 6).map((group) => eventProvenanceCard(group, event)).join("")}
      </div>
    </section>
  `;
}

function eventProvenanceGroups(relations) {
  const bySentence = new Map();
  relations.forEach((rel) => {
    const sentenceIds = asArray(rel.evidence_sentence_ids);
    const keys = sentenceIds.length ? sentenceIds : [`relation:${rel.record_id}`];
    keys.forEach((key) => {
      if (!bySentence.has(key)) bySentence.set(key, { sentenceId: sentenceIds.length ? key : "", fallbackKey: key, relations: [] });
      bySentence.get(key).relations.push(rel);
    });
  });
  return Array.from(bySentence.values()).sort((a, b) => {
    const sentenceA = state.indexes.sentenceById.get(a.sentenceId);
    const sentenceB = state.indexes.sentenceById.get(b.sentenceId);
    const passageSort = Number(sentenceA?.passage_index || 0) - Number(sentenceB?.passage_index || 0);
    if (passageSort) return passageSort;
    const sentenceSort = Number(sentenceA?.sentence_index || 0) - Number(sentenceB?.sentence_index || 0);
    if (sentenceSort) return sentenceSort;
    return String(a.sentenceId || a.fallbackKey).localeCompare(String(b.sentenceId || b.fallbackKey));
  });
}

function eventProvenanceCard(group, event) {
  const sentence = group.sentenceId ? state.indexes.sentenceById.get(group.sentenceId) : null;
  const evidenceText = sentence?.text || group.relations.map((rel) => rel.evidence_preview).find(Boolean) || "";
  const terms = group.relations.flatMap((rel) => relationHighlightLabels(rel, relationContextEntities(rel)));
  const meta = sentenceMetadataLine(group.sentenceId);
  return `
    <article class="event-provenance-card simple-event-card">
      <div class="event-provenance-head">
        <div>
          <strong>Evidence sentence</strong>
          <span>${esc(group.relations.length)} triple${group.relations.length === 1 ? "" : "s"}</span>
        </div>
        ${meta ? `<div class="event-sentence-meta">${meta}</div>` : ""}
      </div>
      <p>${evidenceText ? highlightTextRanges(evidenceText, terms) : `<span class="muted">No evidence text found for this provenance group.</span>`}</p>
      <div class="event-triple-chips">
        ${group.relations.slice(0, 4).map((rel) => eventTripleChip(rel, event.event_id)).join("")}
        ${group.relations.length > 4 ? `<span class="event-more-chip">+${fmt(group.relations.length - 4)} more</span>` : ""}
      </div>
    </article>
  `;
}

function eventTripleChip(rel, eventId) {
  const active = rel.record_id === state.focusedRelationId;
  return `
    <button class="event-triple-chip ${active ? "active" : ""}" type="button" data-action="focus-relation-context" data-id="${esc(rel.record_id)}" data-relation-context-id="${esc(rel.record_id)}" data-relation-event-id="${esc(eventId)}">
      <span>${esc(shortText(rel.subject || "subject", 24))}</span>
      <strong>${esc(shortText(clean(rel.predicate || rel.predicate_class || "relation"), 28))}</strong>
      <span>${esc(shortText(rel.object || "object", 24))}</span>
    </button>
  `;
}

function dependencyButtons(deps, eventId) {
  if (!deps.length) return `<div class="compact-card muted">No dependency candidates touch this event.</div>`;
  return `
    <div class="compact-list">
      ${deps.slice(0, 40).map((dep) => {
    const otherId = dep.upstream_event_id === eventId ? dep.downstream_event_id : dep.upstream_event_id;
    const other = state.indexes.eventById.get(otherId);
    return `
          <div class="compact-card">
            <strong>${esc(clean(dep.dependency_type))}</strong> ${badges([tierLabel(dep.tier)], tierClass(dep.tier))}
            <div class="muted">${esc(other?.event_label || otherId)}</div>
            <button class="mini-button" type="button" data-action="select-dependency" data-id="${esc(dep.dependency_id)}">Open dependency</button>
          </div>
        `;
  }).join("")}
    </div>
  `;
}

function renderRelationMain(rel) {
  if (!rel) return;
  const eventIds = asArray(rel.event_ids);
  els.mainPanel.innerHTML = `
    <section class="hero-card">
      ${returnControl()}
      <div class="hero-title">
        <div>
          <h2>${esc(rel.triple || rel.record_id)}</h2>
          <p>${esc(rel.record_id)} | ${esc(clean(rel.predicate_class))}</p>
          ${relationProvenancePills(rel)}
        </div>
        <div>${badges([rel.merge_decision, rel.record_type].filter(Boolean))}</div>
      </div>
      ${renderRelationCard(rel)}
    </section>
    ${disclosureSection("Evidence And Context", `
      ${relationEvidence(rel)}
    `, "", true)}
    ${disclosureSection("Event Membership", `
      <div class="event-membership-grid">
        ${eventIds.map(relationEventMembershipCard).join("") || `<span class="muted">No event membership.</span>`}
      </div>
    `, fmt(eventIds.length))}
  `;
}

function relationEventMembershipCard(eventId) {
  const event = state.indexes?.eventById.get(eventId);
  if (!event) {
    return `<button class="event-membership-card missing" type="button" data-action="select-event" data-id="${esc(eventId)}">
      <strong>${esc(shortId(eventId))}</strong>
      <span>Event details unavailable in this paper bundle.</span>
    </button>`;
  }
  const acceptedDeps = Number(event.dependency_counts?.accepted || 0);
  const meta = [
    clean(event.event_type || "event"),
    `${fmt(event.relation_count || 0)} triple${Number(event.relation_count || 0) === 1 ? "" : "s"}`,
    acceptedDeps ? `${fmt(acceptedDeps)} linked dependenc${acceptedDeps === 1 ? "y" : "ies"}` : "no accepted dependency"
  ];
  return `
    <button class="event-membership-card" type="button" data-action="select-event" data-id="${esc(eventId)}">
      <strong>${esc(shortText(event.event_label || eventId, 118))}</strong>
      <span>${esc(meta.join(" | "))}</span>
    </button>
  `;
}

function relationEvidence(rel) {
  const sentences = rel.evidence_sentence_ids || [];
  const contextSets = relationContextSets(rel);
  const evidence = relationEvidenceSentence(rel);
  const taxonTissueAgreement = relationTaxonTissueAgreement(rel);
  return `
    <div class="two-col">
      <div class="kv">
        <div class="key">Source relation</div><div>${esc(rel.source_relation_id || "-")}</div>
        ${asArray(rel.source_relation_ids).length > 1 ? `<div class="key">Merged sources</div><div>${badges(rel.source_relation_ids, "", 12)}</div>` : ""}
        <div class="key">Passage</div><div>${esc(rel.current_passage_id || "-")}</div>
        <div class="key">Evidence section</div><div>${provenancePillGroup(relationEvidenceSections(rel), "section") || `<span class="muted">-</span>`}</div>
        <div class="key">Assertion mode</div><div>${provenancePillGroup([relationEvidenceMode(rel)], "mode") || `<span class="muted">-</span>`}</div>
        <div class="key">Evaluation</div><div>${badges([rel.relation_evaluation_verdict, rel.relation_evaluation_status].filter(Boolean))}</div>
        <div class="key">Context source</div><div>${esc(rel.context_enrichment_source || "-")}</div>
        <div class="key">Context enriched</div><div>${esc(String(rel.context_enriched))}</div>
        <div class="key">Sentence-local context</div><div>${contextSets.local.length ? contextSets.local.map(relationContextEntityChip).join("") : `<span class="muted">${contextSets.assigned.length ? "No assigned context appears in the relation evidence sentence." : "No context entities assigned."}</span>`}</div>
        <div class="key">Broader assigned context</div><div>${contextSets.broader.length ? contextSets.broader.map(relationContextEntityChip).join("") : `<span class="muted">-</span>`}</div>
        <div class="key">Event taxon/tissue</div><div>${relationTaxonTissueDisplay(rel, "event") ? esc(relationTaxonTissueDisplay(rel, "event")) : `<span class="muted">-</span>`}</div>
        <div class="key">Entity-linked taxon/tissue</div><div>${relationTaxonTissueDisplay(rel, "entity_linked") ? esc(relationTaxonTissueDisplay(rel, "entity_linked")) : `<span class="muted">-</span>`}</div>
      </div>
      <div class="evidence-block">
        <strong>Evidence Sentence</strong>
        ${taxonTissueContextBlock(rel)}
        ${evidence.text ? `<p>${highlightRelationSentence(evidence.text, rel, contextSets.local)}</p>` : sentences.length ? sentences.map((id) => `<p>${esc(sentenceText(id))}</p>`).join("") : `<span class="muted">No evidence sentence IDs.</span>`}
        ${neighboringContextDisclosure(rel, "Neighboring context")}
      </div>
    </div>
    ${taxonTissueAgreement}
  `;
}

const contextAgreementGroups = [
  { key: "taxa", label: "Taxon" },
  { key: "tissues", label: "Tissue" },
  { key: "assays", label: "Assay" }
];

function relationTaxonTissueAgreement(rel) {
  const context = rel?.taxon_tissue_context || {};
  const rows = contextAgreementGroups.map((group) => {
    const event = asArray(context.event?.[group.key]).filter(Boolean);
    const entityLinked = asArray(context.entity_linked?.[group.key]).filter(Boolean);
    const agreement = categoryAwareTaxonTissueAgreementItems(
      { [group.key]: event },
      { [group.key]: entityLinked }
    );
    return { ...group, event, entityLinked, agreement };
  });
  const hasAny = rows.some((row) => row.event.length || row.entityLinked.length || row.agreement.length);
  if (!hasAny) return "";
  return `
    <div class="context-agreement-panel">
      <div class="context-agreement-head">
        <strong>Context agreement</strong>
        <span>Computed independently for taxon, tissue, and assay context.</span>
      </div>
      <div class="context-agreement-table">
        <div class="context-agreement-header">Category</div>
        <div class="context-agreement-header">Event context</div>
        <div class="context-agreement-header">Entity-linked context</div>
        <div class="context-agreement-header">Agreement</div>
        ${rows.map((row) => `
          <div class="context-agreement-category">${esc(row.label)}</div>
          <div>${contextAgreementChips(row.event)}</div>
          <div>${contextAgreementChips(row.entityLinked, { linked: true })}</div>
          <div>${contextAgreementChips(row.agreement, { agreement: true })}</div>
        `).join("")}
      </div>
    </div>
  `;
}

function contextAgreementChips(items, options = {}) {
  if (!items.length) return `<span class="muted tiny">-</span>`;
  return `<div class="context-agreement-chips">${items.map((item) => contextAgreementChip(item, options)).join("")}</div>`;
}

function contextAgreementChip(item, options = {}) {
  const label = item?.label || item?.selected_label || item?.entity_id || "";
  const ontology = item?.ontology_id || "";
  const status = agreementStatusLabel(item?.agreement_status);
  const statusClass = item?.agreement_status === "overlap" ? "overlap" : item?.agreement_status === "entity_linked_fallback" ? "fallback" : "";
  const linked = options.linked || item?.mark === "*";
  return `
    <span class="context-agreement-chip ${options.agreement ? "agreement" : ""} ${statusClass}">
      <span>${esc(label)}${linked && !options.agreement ? "*" : ""}</span>
      ${ontology ? `<small>${esc(ontology)}</small>` : ""}
      ${options.agreement && status ? `<em>${esc(status)}</em>` : ""}
    </span>
  `;
}

function agreementStatusLabel(value) {
  if (value === "overlap") return "overlap";
  if (value === "entity_linked_fallback") return "entity-linked fallback";
  return value || "";
}

function neighboringContextDisclosure(rel, title) {
  const rows = asArray(rel.evidence_context_sentences).filter((row) => row && typeof row === "object" && (row.text || row.id));
  if (!rows.length && !rel.evidence_context_text) return "";
  const body = rows.length ? `
    <div class="context-provenance-list">
      ${rows.map((row) => contextSentenceCard(row, rel)).join("")}
    </div>
  ` : `<p>${esc(rel.evidence_context_text)}</p>`;
  const meta = rows.length ? `${fmt(rows.length)} sentences` : "";
  return disclosureSection(title, body, meta, false, rel.record_id);
}

function contextSentenceCard(row, rel) {
  const role = String(row.role || "neighboring context").toLowerCase();
  const isCore = role.includes("core");
  const section = clean(row.section || "unknown section");
  const passage = row.passage_id || rel.current_passage_id || "";
  const sentenceNumber = row.sentence_index ? `sentence ${row.sentence_index}` : "";
  const passageNumber = row.passage_index ? `passage ${row.passage_index}` : "";
  const metadata = [
    isCore ? "core evidence" : "neighbor context",
    section,
    passageNumber,
    sentenceNumber,
    row.id || ""
  ].filter(Boolean);
  const contexts = rawRelationContextEntities(rel);
  return `
    <article class="context-provenance-card ${isCore ? "core" : "neighbor"}">
      <div class="context-provenance-meta">
        ${metadata.map((item, index) => `<span class="${index === 0 ? "role" : ""}">${esc(item)}</span>`).join("")}
      </div>
      ${passage ? `<div class="context-provenance-passage">${esc(passage)}</div>` : ""}
      <p>${highlightRelationSentence(row.text || "", rel, contexts)}</p>
    </article>
  `;
}

function renderEntityMain(entity) {
  if (!entity) return;
  const relations = state.indexes.relationsByEntity.get(entity.node_id) || [];
  const events = state.indexes.eventsByEntity.get(entity.node_id) || [];
  els.mainPanel.innerHTML = `
    <section class="hero-card">
      ${returnControl()}
      <div class="hero-title">
        <div>
          <h2>${esc(entityName(entity))}</h2>
          <p>${esc(clean(entity.entity_type))}${ontologyLabel(entity) ? ` | ${esc(ontologyLabel(entity))}` : ""}</p>
        </div>
        ${actionMenu([
    { label: "Entity details", action: "open-entity", id: entity.node_id },
    { label: "Route start", action: "path-start", id: entity.node_id },
    { label: "Route end", action: "path-end", id: entity.node_id }
  ])}
      </div>
      ${entitySummary(entity)}
    </section>
    ${entityResearchPanel(entity, relations, events)}
    ${geneProteinExplorer(entity)}
    ${disclosureSection("Relations With This Entity", `
      <div class="relation-list">${relations.slice(0, 50).map(renderRelationCard).join("") || `<div class="compact-card muted">No relations.</div>`}</div>
    `, fmt(relations.length))}
    ${disclosureSection("Events With This Entity", `
      <div class="compact-list">
        ${events.slice(0, 40).map(eventSummaryCard).join("") || `<div class="compact-card muted">No events.</div>`}
      </div>
    `, fmt(events.length))}
  `;
}

function entitySummary(entity) {
  const compoundProfile = compoundClassificationProfile(entity);
  const geneProfile = geneProteinProfile(entity);
  const geneOntology = geneProteinOntologyLabel(entity);
  const geneOntologyLabel = geneOntology.split(":").slice(1).join(":");
  const concepts = selectedConcepts(entity);
  const ontologyNames = uniqueStrings([
    ...concepts.map((concept) => concept.ontology),
    entity.selected_ontology,
    geneOntology ? geneOntology.split(":", 1)[0] : ""
  ]).filter(Boolean);
  const ontologyIds = entityOntologyIds(entity);
  const selectedLabels = uniqueStrings([
    ...concepts.map((concept) => concept.label),
    ...asArray(entity.selected_labels),
    entity.selected_label,
    geneOntologyLabel
  ]).filter(Boolean);
  return `
    <div class="two-col">
      <div class="kv">
        <div class="key">Node ID</div><div>${esc(entity.node_id)}</div>
        <div class="key">Decision</div><div>${esc(entity.decision || "-")} ${entity.status ? `(${esc(entity.status)})` : ""}</div>
        <div class="key">Ontology</div><div>${ontologyNames.length ? badges(ontologyNames, "ontology", 6) : `<span class="muted">-</span>`}</div>
        <div class="key">Ontology IDs</div><div>${ontologyIds.length ? badges(ontologyIds, "ontology", 8) : `<span class="muted">-</span>`}</div>
        <div class="key">Selected labels</div><div>${selectedLabels.length ? badges(selectedLabels, "", 8) : `<span class="muted">-</span>`}</div>
        <div class="key">Aliases</div><div>${badges(entity.aliases, "", 8)}</div>
        ${entity.enrichments?.length ? `<div class="key">Enriched</div><div>${enrichmentBadges(entity.enrichments, 8)}</div>` : ""}
      </div>
      ${entityDescriptionBlock(entity)}
    </div>
    ${compoundProfile}
    ${geneProfile}
  `;
}

function entityDescriptionBlock(entity) {
  const describedConcepts = selectedConcepts(entity).filter((concept) => concept.description || concept.label || concept.id);
  if (describedConcepts.length > 1) {
    return `
      <div class="evidence-block">
        <strong>Ontology Descriptions</strong>
        <div class="compact-list">
          ${describedConcepts.map((concept) => `
            <div class="compact-card">
              <strong>${esc(conceptDisplayLabel(concept))}</strong>
              ${concept.description ? `<p>${esc(concept.description)}</p>` : `<p class="muted">No description text was provided for this ontology assignment.</p>`}
            </div>
          `).join("")}
        </div>
      </div>
    `;
  }
  if (entity.selected_description) {
    return `
      <div class="evidence-block">
        <strong>Ontology Description</strong>
        <p>${esc(entity.selected_description)}</p>
      </div>
    `;
  }
  if (entityOntologyIds(entity).length || entity.selected_label) {
    return `
      <div class="evidence-block">
        <strong>Ontology Description</strong>
        <p class="muted">This entity has ontology metadata, but no description text was provided by the normalization output.</p>
      </div>
    `;
  }
  if (entity.evidence_preview) {
    return `
      <div class="evidence-block">
        <strong>Evidence Preview</strong>
        <p>${esc(entity.evidence_preview)}</p>
        <span class="muted tiny">No ontology selection was assigned; this text is the source evidence sentence for the entity mention.</span>
      </div>
    `;
  }
  return `
    <div class="evidence-block">
      <strong>Ontology Description</strong>
      <p class="muted">No ontology description assigned.</p>
    </div>
  `;
}

function entityResearchPanel(entity, relations, events) {
  const neighbors = entityNeighbors(entity, relations).slice(0, 12);
  const directRelations = relations.filter((rel) => relationLocalSubjectIds(rel).includes(entity.node_id) || relationLocalObjectIds(rel).includes(entity.node_id)).length;
  const contextRelations = Math.max(0, relations.length - directRelations);
  const acceptedDeps = events.reduce((sum, event) => sum + Number(event.dependency_counts?.accepted || 0), 0);
  const normalizedIds = entityOntologyIds(entity);
  return `
    <section class="section-card research-panel">
      <div class="section-header">
        <h2>Research Snapshot</h2>
        <span class="muted">${esc(clean(entity.entity_type))}</span>
      </div>
      <div class="research-metrics">
        ${researchMetric(relations.length, "relations")}
        ${researchMetric(directRelations, "direct")}
        ${researchMetric(contextRelations, "context")}
        ${researchMetric(events.length, "events")}
        ${researchMetric(acceptedDeps, "event links")}
        ${researchMetric(normalizedIds.length, "ontology IDs")}
      </div>
      <div class="research-columns">
        <div>
          <h3>Most Connected Neighbors</h3>
          <div class="neighbor-grid">
            ${neighbors.length ? neighbors.map(neighborChip).join("") : `<div class="compact-card muted">No relation neighbors in this paper.</div>`}
          </div>
        </div>
        <div>
          <h3>Pathfinder Shortcuts</h3>
          <div class="compact-list">
            <div class="compact-card">
              <strong>Start a route from this entity</strong>
              <span class="muted">Use it as the source and connect it to a compound, gene, trait, or condition across all papers.</span>
              <div class="click-row"><button class="mini-button" type="button" data-action="path-start" data-id="${esc(entity.node_id)}">Set as start</button></div>
            </div>
            <div class="compact-card">
              <strong>End a route at this entity</strong>
              <span class="muted">Use it as the endpoint to find upstream genes, compounds, or events that could explain it.</span>
              <div class="click-row"><button class="mini-button" type="button" data-action="path-end" data-id="${esc(entity.node_id)}">Set as end</button></div>
            </div>
          </div>
        </div>
      </div>
    </section>
  `;
}

function researchMetric(value, label) {
  return `<div class="research-metric"><strong>${fmt(value)}</strong><span>${esc(label)}</span></div>`;
}

function entityNeighbors(entity, relations) {
  const byId = new Map();
  function add(nodeId, role, rel) {
    if (!nodeId || nodeId === entity.node_id) return;
    const neighbor = state.indexes.entityById.get(nodeId);
    if (!neighbor) return;
    if (!byId.has(nodeId)) {
      byId.set(nodeId, { entity: neighbor, roles: new Set(), predicates: new Set(), count: 0 });
    }
    const row = byId.get(nodeId);
    row.roles.add(role);
    if (rel.predicate) row.predicates.add(rel.predicate);
    row.count += 1;
  }
  relations.forEach((rel) => {
    relationLocalSubjectIds(rel).forEach((nodeId) => add(nodeId, relationLocalObjectIds(rel).includes(entity.node_id) ? "upstream" : "direct", rel));
    relationLocalObjectIds(rel).forEach((nodeId) => add(nodeId, relationLocalSubjectIds(rel).includes(entity.node_id) ? "downstream" : "direct", rel));
    asArray(rel.context_node_ids).forEach((nodeId) => add(nodeId, "context", rel));
  });
  return Array.from(byId.values())
    .sort((a, b) => b.count - a.count || entityName(a.entity).localeCompare(entityName(b.entity)));
}

function neighborChip(row) {
  const entity = row.entity;
  return `
    <button class="neighbor-chip" type="button" data-action="select-entity" data-id="${esc(entity.node_id)}" style="--entity-color:${esc(colorForEntity(entity.entity_type))}">
      <span class="dot"></span>
      <strong>${esc(shortText(entityName(entity), 34))}</strong>
      <small>${esc([clean(entity.entity_type), `${fmt(row.count)} relations`, Array.from(row.roles).join("/")].filter(Boolean).join(" | "))}</small>
    </button>
  `;
}

function actionMenu(items, label = "Actions") {
  const buttons = items
    .filter((item) => item && item.action && item.id)
    .map((item) => `<button class="mini-button" type="button" data-action="${esc(item.action)}" data-id="${esc(item.id)}">${esc(item.label)}</button>`)
    .join("");
  if (!buttons) return "";
  return `
    <details class="action-menu">
      <summary>${esc(label)}</summary>
      <div class="action-menu-body">${buttons}</div>
    </details>
  `;
}

function disclosureSection(title, body, meta = "", open = false, keySuffix = "") {
  const key = disclosureKey([title, keySuffix].filter(Boolean).join(" "));
  const isOpen = Object.prototype.hasOwnProperty.call(state.disclosureOpen, key)
    ? Boolean(state.disclosureOpen[key])
    : Boolean(open);
  return `
    <section class="section-card disclosure-section ${isOpen ? "open" : ""}" data-disclosure-key="${esc(key)}">
      <button class="disclosure-summary" type="button" data-action="toggle-disclosure" data-id="${esc(key)}" aria-expanded="${isOpen ? "true" : "false"}">
        <span>${esc(title)}</span>
        ${meta ? `<small>${esc(meta)}</small>` : ""}
      </button>
      <div class="disclosure-body" ${isOpen ? "" : "hidden"}>${body}</div>
    </section>
  `;
}

function disclosureKey(title) {
  return String(title || "section").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "section";
}

function toggleDisclosure(key) {
  if (!key) return;
  state.disclosureOpen[key] = !state.disclosureOpen[key];
  render();
}

function compoundMeta(entity) {
  return entity?.compound_classification || null;
}

function compoundSearchText(entity) {
  const compound = compoundMeta(entity);
  if (!compound) return "";
  const cf = compound.classyfire || {};
  const np = compound.npclassifier || {};
  const chebi = compound.chebi || {};
  const pubchem = compound.pubchem || {};
  const structure = compound.structure || {};
  const raw = compound.raw_fields || {};
  return [
    compound.compound_status,
    compound.classification_status,
    chebi.id,
    chebi.name,
    chebi.formula,
    chebi.inchikey,
    pubchem.cid,
    structure.inchikey,
    structure.smiles,
    cf.kingdom,
    cf.superclass,
    cf.class,
    cf.subclass,
    cf.direct_parent,
    np.pathway,
    np.superclass,
    np.class,
    Object.values(raw).join(" ")
  ].join(" ");
}

function entitySecondaryLine(entity) {
  return compoundClassLine(entity) || geneProteinLine(entity) || ontologyLabel(entity) || clean(entity?.entity_type);
}

function entityVisualDescriptor(entity) {
  if (!entity) return "";
  const compound = compoundClassLine(entity);
  if (compound) return shortText(stripOntologyIds(compound), 42);
  const geneProtein = geneProteinVisualLine(entity);
  if (geneProtein) return shortText(geneProtein, 42);
  const selected = stripOntologyIds(entity.selected_label || entity.normalized_label || "");
  const name = entityName(entity).toLowerCase();
  if (selected && selected.toLowerCase() !== name) return shortText(selected, 42);
  return entityVisualTypeLabel(entity);
}

function entityVisualTypeLabel(entity) {
  const type = entity?.entity_type || "";
  const labels = {
    compound: "compound",
    gene_protein: "gene or protein",
    gene: "gene",
    protein: "protein",
    plant_trait: "plant trait",
    molecular_trait_or_function: "molecular function",
    pathway_or_process: "pathway or process",
    experimental_condition: "condition",
    anatomical_part: "tissue or anatomy",
    taxon: "organism",
    assay_or_measurement: "assay",
    phenotype: "phenotype"
  };
  return labels[type] || clean(type || "entity");
}

function stripOntologyIds(value) {
  return String(value || "")
    .replace(/\s*\(([A-Z][A-Z0-9_]*|[A-Za-z]+):[^)]*\)/g, "")
    .replace(/\b(?:GO|PO|TO|PECO|CHEBI|ChEBI|PubChem|UniProt|InterPro|Pfam|Phytozome):\S+/g, "")
    .replace(/\s*\|\s*/g, " | ")
    .replace(/\s+/g, " ")
    .replace(/^\s*\|\s*|\s*\|\s*$/g, "")
    .trim();
}

function compoundStatusLabel(entity) {
  const compound = compoundMeta(entity);
  if (!compound) return "";
  if (compound.classification_status === "classified") return "compound profile";
  if (compound.classification_status === "no_structure") return "no structure";
  if (compound.classification_status === "not_normalized") return "not normalized";
  return compound.classification_status || "";
}

function compoundClassLine(entity) {
  const compound = compoundMeta(entity);
  if (!compound) return "";
  const np = compound.npclassifier || {};
  const cf = compound.classyfire || {};
  const parts = [
    np.pathway,
    np.superclass || cf.superclass,
    np.class || cf.class || cf.direct_parent
  ].filter(Boolean);
  return parts.slice(0, 2).join(" | ");
}

function compoundClassificationProfile(entity) {
  const compound = compoundMeta(entity);
  if (!compound) return "";
  const cf = compound.classyfire || {};
  const np = compound.npclassifier || {};
  const chebi = compound.chebi || {};
  const pubchem = compound.pubchem || {};
  const structure = compound.structure || {};
  const npPath = [np.pathway, np.superclass, np.class].filter(Boolean);
  const classyPath = [cf.kingdom, cf.superclass, cf.class, cf.subclass, cf.direct_parent].filter(Boolean);
  return `
    <div class="compound-taxonomy">
      <div class="taxonomy-card primary">
        <span>Compound class</span>
        <strong>${esc(npPath[0] || cf.superclass || chebi.name || entityName(entity))}</strong>
        <small>${esc(npPath.slice(1).join(" -> ") || classyPath.slice(2).join(" -> ") || compound.classification_status || "metadata attached")}</small>
      </div>
      <div class="taxonomy-card">
        <span>Identifiers</span>
        <strong>${esc([chebi.id, pubchem.cid ? `PubChem ${pubchem.cid}` : ""].filter(Boolean).join(" | ") || "-")}</strong>
        <small>${esc([chebi.formula, structure.source ? `structure: ${structure.source}` : ""].filter(Boolean).join(" | ") || compound.compound_status || "")}</small>
      </div>
      <div class="taxonomy-card">
        <span>ClassyFire</span>
        <strong>${esc(cf.class || cf.superclass || "-")}</strong>
        <small>${esc(cf.direct_parent || cf.subclass || "")}</small>
      </div>
    </div>
    ${compoundClassifierMetadata(entity)}
  `;
}

function compoundClassifierMetadata(entity) {
  const compound = compoundMeta(entity);
  if (!compound) return "";
  const cf = compound.classyfire || {};
  const np = compound.npclassifier || {};
  const chebi = compound.chebi || {};
  const pubchem = compound.pubchem || {};
  const structure = compound.structure || {};
  return `
    <details class="compound-metadata-details">
      <summary>
        <span>Classifier metadata</span>
        <small>Step 930 details and exact CSV fields</small>
      </summary>
      <div class="metadata-groups">
        ${metadataGroup("ChEBI / PubChem", [
    ["compound_status", compound.compound_status],
    ["classification_status", compound.classification_status],
    ["chebi_id", chebi.id],
    ["chebi_name", chebi.name],
    ["chebi_formula", chebi.formula],
    ["chebi_inchikey", chebi.inchikey],
    ["pubchem_cid", pubchem.cid],
    ["pubchem_link_type", pubchem.link_type],
    ["structure_source", structure.source],
    ["structure_inchikey", structure.inchikey],
    ["structure_smiles", structure.smiles]
  ])}
        ${metadataGroup("ClassyFire", [
    ["classyfire_cache_hit", yesNo(cf.cache_hit)],
    ["classyfire_kingdom", cf.kingdom],
    ["classyfire_superclass", cf.superclass],
    ["classyfire_class", cf.class],
    ["classyfire_subclass", cf.subclass],
    ["classyfire_direct_parent", cf.direct_parent]
  ])}
        ${metadataGroup("NPClassifier", [
    ["npclassifier_applicable", yesNo(np.applicable)],
    ["npclassifier_cache_hit", yesNo(np.cache_hit)],
    ["np_pathway", np.pathway],
    ["np_superclass", np.superclass],
    ["np_class", np.class],
    ["np_is_glycoside", yesNo(np.is_glycoside)],
    ["npclassifier_error", np.error]
  ])}
      </div>
      ${compoundRawMetadataTable(compound)}
    </details>
  `;
}

const metadataLabelMap = {
  compound_status: "Compound status",
  classification_status: "Classification status",
  chebi_id: "ChEBI ID",
  chebi_name: "ChEBI name",
  chebi_formula: "Formula",
  chebi_inchikey: "InChIKey",
  pubchem_cid: "PubChem CID",
  pubchem_link_type: "PubChem link",
  structure_source: "Structure source",
  structure_inchikey: "Structure InChIKey",
  structure_smiles: "SMILES",
  classyfire_cache_hit: "Cache hit",
  classyfire_kingdom: "Kingdom",
  classyfire_superclass: "Superclass",
  classyfire_class: "Class",
  classyfire_subclass: "Subclass",
  classyfire_direct_parent: "Direct parent",
  npclassifier_applicable: "Applicable",
  npclassifier_cache_hit: "Cache hit",
  np_pathway: "Pathway",
  np_superclass: "Superclass",
  np_class: "Class",
  np_is_glycoside: "Glycoside",
  npclassifier_error: "Error",
  selected_uniprot_accession: "UniProt accession",
  selected_uniprot_entry: "UniProt entry",
  selected_gene_name: "Gene name",
  selected_protein_name: "Protein name",
  selected_organism: "Organism",
  selected_taxon_id: "Taxon ID",
  selected_taxon_rank: "Taxon rank",
  reviewed_status: "Reviewed",
  source_database: "Source",
  phytozome_code: "Phytozome code",
  phytozome_gene_id: "Gene model",
  phytozome_ontology_id: "Ontology ID",
  phytozome_base_gene_id: "Base gene",
  phytozome_base_ontology_id: "Base ontology ID",
  phytozome_browser_name: "Browser name",
  phytozome_proteome_id: "Proteome ID",
  report_type: "Report type",
  sequence_length: "Sequence length",
  sequence_available: "Sequence available",
  matched_fasta_id: "Matched FASTA ID",
  phytozome_search_url: "Search URL",
  gene_report_url: "Report URL",
  source_file: "Source file",
  family_ontology_id: "Ontology ID",
  family_id: "Family ID",
  family_database: "Database",
  family_type: "Type",
  family_name: "Name",
  family_alias: "Alias",
  family_alias_type: "Alias type",
  linked_interpro_id: "Linked InterPro",
  linked_pfam_ids: "Linked Pfam",
  resource_url: "Resource URL",
  representative_uniprot_accession: "UniProt accession",
  representative_uniprot_entry: "UniProt entry",
  representative_organism: "Organism",
  representative_source_database: "Source",
  representative_reviewed_status: "Reviewed",
  representative_basis: "Basis",
  decision: "Decision",
  status: "Status",
  normalization_scope: "Scope",
  gene_query: "Gene query",
  gene_query_type: "Query type",
  lookup_query: "Lookup query",
  lookup_strategy: "Lookup strategy",
  match_type: "Match type",
  candidate_count: "Candidates",
  ambiguity_reason: "Ambiguity",
  notes: "Notes"
};

function metadataGroup(title, rows) {
  const shownRows = rows
    .map(([key, value]) => [key, metadataValue(value)])
    .filter(([, value]) => value);
  if (!shownRows.length) return "";
  return `
    <section class="metadata-group">
      <h3>${esc(title)}</h3>
      <div class="metadata-table">
        ${shownRows.map(([key, value]) => metadataRow(key, value)).join("")}
      </div>
    </section>
  `;
}

function metadataValue(value) {
  if (value === undefined || value === null) return "";
  if (typeof value === "boolean") return value ? "yes" : "no";
  if (Array.isArray(value)) return value.map(metadataValue).filter(Boolean).join(", ");
  if (typeof value === "object") return JSON.stringify(value);
  return String(value).trim();
}

function metadataLabel(key, preserveKey = false) {
  const text = String(key || "").trim();
  if (preserveKey) return text;
  return metadataLabelMap[text] || text
    .replace(/^selected_/, "")
    .replace(/^representative_/, "representative ")
    .replace(/^classyfire_/, "")
    .replace(/^npclassifier_/, "NPClassifier ")
    .replace(/^np_/, "NP ")
    .replace(/^chebi_/, "ChEBI ")
    .replace(/^pubchem_/, "PubChem ")
    .replace(/^phytozome_/, "Phytozome ")
    .replaceAll("_", " ");
}

function metadataRow(key, value, preserveKey = false) {
  const shown = metadataValue(value) || "-";
  return `
    <div class="metadata-row">
      <div class="metadata-key">${esc(metadataLabel(key, preserveKey))}</div>
      <div class="metadata-value">${esc(shown)}</div>
    </div>
  `;
}

function compoundRawMetadataTable(compound) {
  const raw = compound.raw_fields || {};
  const rows = Object.entries(raw);
  if (!rows.length) return "";
  return `
    <details class="raw-metadata">
      <summary>Exact CSV fields</summary>
      <div class="metadata-table raw">
        ${rows.map(([key, value]) => metadataRow(key, value, true)).join("")}
      </div>
    </details>
  `;
}

function yesNo(value) {
  if (value === true) return "yes";
  if (value === false) return "no";
  return value || "";
}

function geneProteinMeta(entity) {
  return entity?.gene_protein_normalization || null;
}

function geneProteinOntologyIds(entity) {
  const profile = geneProteinMeta(entity);
  if (!profile) return [];
  const ids = [];
  asArray(profile.fasta_accessions).forEach((item) => {
    const accession = item?.accession || "";
    if (accession) ids.push(`UniProt:${accession}`);
  });
  asArray(profile.phytozome_ids).forEach((item) => {
    if (item?.ontology_id) ids.push(item.ontology_id);
    if (item?.base_ontology_id) ids.push(item.base_ontology_id);
  });
  asArray(profile.family_ids).forEach((item) => {
    if (item?.ontology_id) ids.push(item.ontology_id);
  });
  asArray(profile.database_ids).forEach((item) => {
    if (item?.ontology_id) ids.push(item.ontology_id);
  });
  return uniqueStrings(ids);
}

function geneProteinOntologyLabel(entity) {
  const profile = geneProteinMeta(entity);
  if (!profile) return "";
  const phytozome = asArray(profile.phytozome_ids)[0];
  if (phytozome?.gene_id) return `Phytozome:${phytozome.gene_id}`;
  const family = asArray(profile.family_ids)[0];
  if (family?.ontology_id) return family.ontology_id;
  const databaseId = asArray(profile.database_ids)[0];
  if (databaseId?.ontology_id) return databaseId.ontology_id;
  const accession = asArray(profile.fasta_accessions)[0]?.accession || "";
  return accession ? `UniProt:${accession}` : "";
}

function geneProteinSearchText(entity) {
  const profile = geneProteinMeta(entity);
  if (!profile) return "";
  return [
    profile.canonical_form,
    asArray(profile.aliases).join(" "),
    JSON.stringify(profile.best || {}),
    JSON.stringify(profile.fasta_accessions || {}),
    JSON.stringify(profile.phytozome_ids || {}),
    JSON.stringify(profile.family_ids || {}),
    JSON.stringify(profile.database_ids || {}),
    asArray(profile.rows).map((row) => [
      row.gene_query,
      row.lookup_query,
      row.decision,
      row.status,
      row.normalization_scope,
      row.match_type,
      row.ambiguity_reason,
      JSON.stringify(row.phytozome || {}),
      JSON.stringify(row.family || {}),
      JSON.stringify(row.database_ids || {}),
      JSON.stringify(row.raw_fields || {})
    ].join(" ")).join(" ")
  ].join(" ");
}

function geneProteinLine(entity) {
  const profile = geneProteinMeta(entity);
  if (!profile) return "";
  const best = profile.best || {};
  const selected = best.selected || {};
  const phytozome = { ...(asArray(profile.phytozome_ids)[0] || {}), ...(best.phytozome || {}) };
  const family = { ...(asArray(profile.family_ids)[0] || {}), ...(best.family || {}) };
  const databaseId = asArray(profile.database_ids)[0] || {};
  const representative = best.representative || {};
  const accession = selected.uniprot_accession || representative.uniprot_accession || "";
  const gene = selected.gene_name || phytozome.gene_id || databaseId.identifier || family.alias || best.gene_query || "";
  const scope = best.normalization_scope || best.decision || "";
  return [accession || phytozome.ontology_id || family.ontology_id || databaseId.ontology_id, gene, clean(scope)].filter(Boolean).slice(0, 3).join(" | ");
}

function geneProteinVisualLine(entity) {
  const profile = geneProteinMeta(entity);
  if (!profile) return "";
  const best = profile.best || {};
  const family = { ...(asArray(profile.family_ids)[0] || {}), ...(best.family || {}) };
  const taxon = best.taxon_context || {};
  const scope = clean(best.normalization_scope || best.decision || "");
  const familyLabel = stripOntologyIds(family.label || family.name || family.alias || "");
  const taxonName = stripOntologyIds(taxon.scientific_name || taxon.name || "");
  if (familyLabel) return familyLabel;
  if (taxonName && /species|resolved|sequence/i.test(scope)) return `${taxonName} sequence`;
  if (scope && scope !== "unknown") return scope;
  return entityVisualTypeLabel(entity);
}

function geneProteinProfile(entity) {
  const profile = geneProteinMeta(entity);
  if (!profile) return "";
  const best = profile.best || {};
  const selected = best.selected || {};
  const phytozome = { ...(asArray(profile.phytozome_ids)[0] || {}), ...(best.phytozome || {}) };
  const family = { ...(asArray(profile.family_ids)[0] || {}), ...(best.family || {}) };
  const representative = best.representative || {};
  const taxon = best.taxon_context || {};
  const accessionCount = asArray(profile.fasta_accessions).length;
  const phytozomeCount = asArray(profile.phytozome_ids).length;
  const familyCount = asArray(profile.family_ids).length;
  const databaseIdCount = asArray(profile.database_ids).length;
  const databaseId = asArray(profile.database_ids)[0] || {};
  return `
    <div class="gene-protein-summary">
      <div class="taxonomy-card primary">
        <span>Gene/protein normalization</span>
        <strong>${esc(selected.uniprot_accession || representative.uniprot_accession || phytozome.gene_id || family.ontology_id || databaseId.ontology_id || best.decision || "unresolved")}</strong>
        <small>${esc([selected.gene_name || phytozome.base_gene_id || family.alias || best.gene_query, selected.protein_name || family.name, selected.organism || representative.organism || phytozome.code || family.database].filter(Boolean).join(" | ") || best.status || "")}</small>
      </div>
      ${phytozome.gene_id ? `
      <div class="taxonomy-card">
        <span>Phytozome</span>
        <strong>${esc(phytozome.gene_id || "-")}</strong>
        <small>${esc([phytozome.code, phytozome.base_gene_id, phytozome.sequence_length ? `${phytozome.sequence_length} aa` : ""].filter(Boolean).join(" | "))}</small>
      </div>
      ` : ""}
      ${family.ontology_id ? `
      <div class="taxonomy-card">
        <span>Family/domain ontology</span>
        <strong>${esc(family.ontology_id || "-")}</strong>
        <small>${esc([family.name, family.type, family.alias].filter(Boolean).join(" | "))}</small>
      </div>
      ` : ""}
      <div class="taxonomy-card">
        <span>Scope</span>
        <strong>${esc(clean(best.normalization_scope || "-"))}</strong>
        <small>${esc([best.lookup_strategy, best.match_type, best.ambiguity_reason].filter(Boolean).join(" | "))}</small>
      </div>
      <div class="taxonomy-card">
        <span>Taxon context</span>
        <strong>${esc(asArray(taxon.labels).join(", ") || selected.organism || representative.organism || "-")}</strong>
        <small>${esc([asArray(taxon.ids).join(", "), taxon.source].filter(Boolean).join(" | "))}</small>
      </div>
    </div>
    <details class="gene-protein-details">
      <summary>
        <span>Gene/protein metadata</span>
        <small>${fmt(profile.row_count || 0)} Step 10 rows | ${fmt(accessionCount)} UniProt | ${fmt(phytozomeCount)} Phytozome | ${fmt(familyCount)} family/domain</small>
      </summary>
      <div class="metadata-groups">
        ${metadataGroup("Selected UniProt", [
    ["selected_uniprot_accession", selected.uniprot_accession],
    ["selected_uniprot_entry", selected.uniprot_entry],
    ["selected_gene_name", selected.gene_name],
    ["selected_protein_name", selected.protein_name],
    ["selected_organism", selected.organism],
    ["selected_taxon_id", selected.taxon_id],
    ["selected_taxon_rank", selected.taxon_rank],
    ["reviewed_status", selected.reviewed_status],
    ["source_database", selected.source_database]
  ])}
        ${phytozome.gene_id ? metadataGroup("Selected Phytozome", [
    ["phytozome_code", phytozome.code],
    ["phytozome_gene_id", phytozome.gene_id],
    ["phytozome_ontology_id", phytozome.ontology_id],
    ["phytozome_base_gene_id", phytozome.base_gene_id],
    ["phytozome_base_ontology_id", phytozome.base_ontology_id],
    ["phytozome_browser_name", phytozome.browser_name],
    ["phytozome_proteome_id", phytozome.proteome_id],
    ["report_type", phytozome.report_type],
    ["sequence_length", phytozome.sequence_length],
    ["sequence_available", yesNo(phytozome.sequence_available)],
    ["matched_fasta_id", phytozome.fasta_id],
    ["phytozome_search_url", phytozome.search_url],
    ["gene_report_url", phytozome.gene_report_url],
    ["source_file", phytozome.source_file],
    ["source_database", phytozome.source_database]
  ]) : ""}
        ${family.ontology_id ? metadataGroup("Selected Family/Domain", [
    ["family_ontology_id", family.ontology_id],
    ["family_id", family.id],
    ["family_database", family.database],
    ["family_type", family.type],
    ["family_name", family.name],
    ["family_alias", family.alias],
    ["family_alias_type", family.alias_type],
    ["linked_interpro_id", family.linked_interpro_ontology_id],
    ["linked_pfam_ids", asArray(family.linked_pfam_ontology_ids).join(", ")],
    ["resource_url", family.resource_url],
    ["source_database", family.source_database]
  ]) : ""}
        ${databaseIdCount ? metadataGroup("Additional Gene Identifiers", asArray(profile.database_ids).slice(0, 18).map((item) => [
    item.ontology_id || item.identifier,
    [item.database, item.source_field, item.resource_url].filter(Boolean).join(" | ")
  ])) : ""}
        ${metadataGroup("Representative UniProt", [
    ["representative_uniprot_accession", representative.uniprot_accession],
    ["representative_uniprot_entry", representative.uniprot_entry],
    ["representative_organism", representative.organism],
    ["representative_source_database", representative.source_database],
    ["representative_reviewed_status", representative.reviewed_status],
    ["representative_basis", representative.basis]
  ])}
        ${metadataGroup("Normalization", [
    ["decision", best.decision],
    ["status", best.status],
    ["normalization_scope", best.normalization_scope],
    ["gene_query", best.gene_query],
    ["gene_query_type", best.gene_query_type],
    ["lookup_query", best.lookup_query],
    ["lookup_strategy", best.lookup_strategy],
    ["match_type", best.match_type],
    ["candidate_count", best.candidate_count],
    ["ambiguity_reason", best.ambiguity_reason],
    ["notes", best.notes]
  ])}
      </div>
      ${geneProteinRowsTable(profile)}
    </details>
  `;
}

function geneProteinRowsTable(profile) {
  const rows = asArray(profile.rows);
  if (!rows.length) return "";
  return `
    <details class="raw-metadata">
      <summary>Exact Step 10 rows</summary>
      <div class="gene-row-stack">
        ${rows.map((row, index) => `
          <div class="metadata-group">
            <h3>Row ${index + 1}: ${esc(row.gene_query || row.lookup_query || row.decision || "gene/protein")}</h3>
            <div class="metadata-table raw">
              ${Object.entries(row.raw_fields || {}).map(([key, value]) => metadataRow(key, value, true)).join("")}
            </div>
          </div>
        `).join("")}
      </div>
    </details>
  `;
}

function geneProteinExplorer(entity) {
  const profile = geneProteinMeta(entity);
  if (!profile) return "";
  const accessions = asArray(profile.fasta_accessions);
  const phytozomeIds = asArray(profile.phytozome_ids);
  const familyIds = asArray(profile.family_ids);
  const databaseIds = asArray(profile.database_ids);
  return `
    <div class="section-card fasta-panel">
      <div class="section-header">
        <h2>Sequence And Ontology IDs</h2>
        <span class="muted">${fmt(accessions.length)} UniProt | ${fmt(phytozomeIds.length)} Phytozome | ${fmt(familyIds.length)} family/domain | ${fmt(databaseIds.length)} database IDs</span>
      </div>
      ${databaseIds.length ? `
        <div class="fasta-list">
          ${databaseIds.map(geneDatabaseIdCard).join("")}
        </div>
      ` : ""}
      ${familyIds.length ? `
        <div class="fasta-list">
          ${familyIds.map(familyOntologyCard).join("")}
        </div>
      ` : ""}
      ${phytozomeIds.length ? `
        <div class="fasta-list">
          ${phytozomeIds.map((item) => phytozomeCard(entity, item)).join("")}
        </div>
      ` : ""}
      ${accessions.length ? `
        <div class="fasta-list">
          ${accessions.map((item) => fastaCard(entity, item)).join("")}
        </div>
      ` : `
        <div class="compact-card muted">
          ${phytozomeIds.length ? "This gene/protein entity is normalized to Phytozome, but no selected or representative UniProt accession is available for direct UniProt FASTA retrieval." : "This gene/protein entity has Step 10 ontology metadata, but no selected or representative UniProt accession for direct FASTA retrieval."}
        </div>
      `}
    </div>
  `;
}


function resourceMeta(values, limit = 5) {
  const items = uniqueStrings(asArray(values).map((value) => String(value || "").trim()).filter(Boolean));
  if (!items.length) return "";
  const visible = items.slice(0, limit);
  return `
    <div class="resource-meta">
      ${visible.map((item) => `<span>${esc(item)}</span>`).join("")}
      ${items.length > visible.length ? `<span>+${fmt(items.length - visible.length)} more</span>` : ""}
    </div>
  `;
}

function resourceRow(kind, title, meta, actions, modifier = "", extra = "") {
  return `
    <article class="fasta-card resource-row ${modifier}">
      <div class="resource-main">
        <span class="resource-kind">${esc(kind)}</span>
        <strong>${esc(title || "Unresolved resource")}</strong>
        ${resourceMeta(meta)}
      </div>
      ${actions ? `<div class="resource-actions">${actions}</div>` : ""}
      ${extra || ""}
    </article>
  `;
}

function geneDatabaseIdCard(item) {
  const actions = item.resource_url ? `<a class="mini-link" href="${esc(item.resource_url)}" target="_blank" rel="noreferrer">Open</a>` : "";
  return resourceRow(
    "Gene ID",
    item.ontology_id || item.identifier || "Gene identifier",
    [item.database, item.source_field],
    actions,
    "family-card"
  );
}

function familyOntologyCard(item) {
  const actions = [
    item.linked_interpro_ontology_id ? `<span class="badge ontology">${esc(item.linked_interpro_ontology_id)}</span>` : "",
    ...asArray(item.linked_pfam_ontology_ids).slice(0, 3).map((id) => `<span class="badge ontology">${esc(id)}</span>`),
    item.resource_url ? `<a class="mini-link" href="${esc(item.resource_url)}" target="_blank" rel="noreferrer">Open ontology</a>` : ""
  ].filter(Boolean).join("");
  return resourceRow(
    "Family/domain",
    item.ontology_id || item.id || "Family/domain",
    [item.database, item.type, item.name, item.alias],
    actions,
    "family-card"
  );
}

function phytozomeCard(entity, item) {
  const geneId = item.gene_id || "";
  const hasSequence = Boolean(item.sequence);
  const reportUrl = phytozomeGeneUrl(item);
  const searchUrl = phytozomeSearchUrl(item);
  const actions = [
    item.base_ontology_id ? `<span class="badge ontology">${esc(item.base_ontology_id)}</span>` : "",
    `<button class="mini-button primary-action" type="button" data-action="download-phytozome-fasta" data-id="${esc(entity.node_id)}" data-gene-id="${esc(geneId)}" ${hasSequence ? "" : "disabled"}>Download FASTA</button>`,
    `<button class="mini-button" type="button" data-action="load-phytozome-fasta" data-id="${esc(entity.node_id)}" data-gene-id="${esc(geneId)}" ${hasSequence ? "" : "disabled"}>Preview</button>`,
    `<a class="mini-link" href="${esc(reportUrl)}" target="_blank" rel="noreferrer">Open report</a>`,
    `<a class="mini-link" href="${esc(searchUrl)}" target="_blank" rel="noreferrer">Search</a>`,
    hasSequence ? "" : `<span class="mini-status muted">FASTA unavailable</span>`
  ].filter(Boolean).join("");
  return resourceRow(
    "Phytozome",
    item.gene_id || item.ontology_id || "Phytozome",
    [item.ontology_id, item.code, item.base_gene_id ? `base ${item.base_gene_id}` : "", item.sequence_length ? `${item.sequence_length} aa` : ""],
    actions,
    "phytozome-card",
    `<div class="fasta-live" data-fasta-content="${esc(`${entity.node_id}:phytozome:${geneId}`)}"></div>`
  );
}

function fastaCard(entity, item) {
  const accession = item.accession || "";
  const fastaUrl = uniprotFastaUrl(accession);
  const actions = [
    `<button class="mini-button primary-action" type="button" data-action="download-fasta" data-id="${esc(entity.node_id)}" data-accession="${esc(accession)}" ${accession ? "" : "disabled"}>Download FASTA</button>`,
    `<button class="mini-button" type="button" data-action="load-fasta" data-id="${esc(entity.node_id)}" data-accession="${esc(accession)}" ${accession ? "" : "disabled"}>Preview</button>`,
    accession ? `<a class="mini-link" href="${esc(fastaUrl)}" target="_blank" rel="noreferrer">Open UniProt</a>` : ""
  ].filter(Boolean).join("");
  return resourceRow(
    "UniProt",
    accession || "No accession",
    [item.kind, item.gene_name, item.protein_name, item.organism, item.reviewed_status],
    actions,
    "",
    `<div class="fasta-live" data-fasta-content="${esc(`${entity.node_id}:${accession}`)}"></div>`
  );
}

function uniprotFastaUrl(accession) {
  return `https://rest.uniprot.org/uniprotkb/${encodeURIComponent(accession)}.fasta`;
}

function phytozomeGeneUrl(item) {
  if (item.gene_report_url) return item.gene_report_url;
  const target = item.browser_name || item.proteome_id || item.code || "";
  const reportType = item.report_type || (item.base_gene_id && item.gene_id !== item.base_gene_id ? "transcript" : "gene");
  const reportId = reportType === "transcript" ? item.gene_id : (item.base_gene_id || item.gene_id);
  if (target && reportId) {
    return `https://phytozome-next.jgi.doe.gov/report/${encodeURIComponent(reportType)}/${encodeURIComponent(target)}/${encodeURIComponent(reportId)}`;
  }
  return "https://phytozome-next.jgi.doe.gov/";
}

function phytozomeSearchUrl(item) {
  if (item.search_url) return item.search_url;
  const query = item.gene_id || item.base_gene_id || item.ontology_id || "";
  if (query) return `https://phytozome-next.jgi.doe.gov/search?query=${encodeURIComponent(query)}`;
  return "https://phytozome-next.jgi.doe.gov/";
}

function wrapSequence(sequence, width = 80) {
  const cleanSequence = String(sequence || "").replace(/\s+/g, "");
  const lines = [];
  for (let index = 0; index < cleanSequence.length; index += width) {
    lines.push(cleanSequence.slice(index, index + width));
  }
  return lines.join("\n");
}

function phytozomeFastaText(item) {
  const sequence = String(item?.sequence || "").replace(/\s+/g, "");
  if (!sequence) return "";
  const header = String(item.fasta_header || item.gene_id || item.ontology_id || "Phytozome")
    .replace(/^>+/, "")
    .replace(/[\r\n]+/g, " ")
    .trim();
  return `>${header}\n${wrapSequence(sequence)}\n`;
}

function safeFastaFilename(value) {
  return `${String(value || "sequence").replace(/[^\w.-]+/g, "_")}.fasta`;
}

function compoundOntologyProperties(entity) {
  const compound = compoundMeta(entity);
  if (!compound) return "";
  const cf = compound.classyfire || {};
  const np = compound.npclassifier || {};
  const chebi = compound.chebi || {};
  const pubchem = compound.pubchem || {};
  const structure = compound.structure || {};
  return `
    ${compoundProperty("Step 930 status", compound.classification_status)}
    ${compoundProperty("ChEBI", [chebi.name, chebi.id].filter(Boolean).join(" | "))}
    ${compoundProperty("PubChem CID", pubchem.cid)}
    ${compoundProperty("Formula", chebi.formula)}
    ${compoundProperty("NP pathway", np.pathway)}
    ${compoundProperty("NP superclass", np.superclass)}
    ${compoundProperty("NP class", np.class)}
    ${compoundProperty("ClassyFire class", cf.class)}
    ${compoundProperty("ClassyFire superclass", cf.superclass)}
    ${compoundProperty("ClassyFire subclass", cf.subclass)}
    ${compoundProperty("Direct parent", cf.direct_parent)}
    ${compoundProperty("NPClassifier cache", yesNo(np.cache_hit))}
    ${compoundProperty("NP glycoside", yesNo(np.is_glycoside))}
    ${np.error ? compoundProperty("NPClassifier error", np.error) : ""}
    ${structure.smiles ? `<div class="smiles">${esc(structure.smiles)}</div>` : ""}
  `;
}

function renderDiscoverWorkbench() {
  if (!state.globalPathIndex && !state.globalPathLoading) {
    loadGlobalPathIndex().then(() => {
      if (state.tab === "discover") {
        refreshAnnotationReadyState();
      } else {
        render();
      }
    }).catch((error) => {
      state.annotationStatus = `Could not load annotation database: ${error.message}`;
      render();
    });
  }
  const ready = Boolean(state.globalPathIndex);
  const stats = state.globalPathIndex?.stats || {};
  els.mainPanel.innerHTML = `
    <section class="annotation-page">
      <div class="hero-title">
        <div>
          <h2>PSFD Relationship Annotation</h2>
          <p>Paste compound names or protein FASTA sequences, choose the biological attributes you need, then download endpoint relationships with context and ontology-normalized triples.</p>
        </div>
        <div data-annotation-stats>${badges(ready ? [`${fmt(stats.entities || 0)} entities`, `${fmt(stats.concepts || 0)} ontology IDs`, `${fmt(state.manifest?.papers?.length || 0)} papers`] : ["loading database"])}</div>
      </div>

      <section class="relation-extraction-panel">
        <div class="annotation-panel-head">
          <span>01</span>
          <div>
            <h3>Compound and FASTA relationship extraction</h3>
            <small>Endpoint triples from PSFD. FASTA homology search is processed on the FastAPI server.</small>
          </div>
        </div>

        <div class="relation-subtabs-container" role="tablist" aria-label="Query type">
          <button class="relation-subtab ${state.relationActiveSubTab === "compound" ? "active" : ""}" data-relation-tab="compound" type="button" role="tab" aria-selected="${state.relationActiveSubTab === "compound"}">Name Lookup</button>
          <button class="relation-subtab ${state.relationActiveSubTab === "sequence" ? "active" : ""}" data-relation-tab="sequence" type="button" role="tab" aria-selected="${state.relationActiveSubTab === "sequence"}">Sequence Search</button>
          <button class="relation-subtab ${state.relationActiveSubTab === "enrichment" ? "active" : ""}" data-relation-tab="enrichment" type="button" role="tab" aria-selected="${state.relationActiveSubTab === "enrichment"}">Enrichment Search</button>
        </div>

        <div class="relation-tab-content">
          ${state.relationActiveSubTab === "compound" ? `
            <div class="query-box compound-query-box" role="tabpanel">
              <textarea id="relationCompoundInput" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" placeholder="piperonylic acid&#10;APX1&#10;GABA">${esc(state.relationCompoundInput)}</textarea>
            </div>
          ` : state.relationActiveSubTab === "enrichment" ? `
            <div class="query-box enrichment-query-box" role="tabpanel">
              <select id="relationEnrichmentInput" size="12" style="width: 100%; min-height: 230px; border: 1px solid #b7cac3; border-radius: 8px; background: #fbfdfc; color: inherit; font-family: inherit; font-size: 14px; padding: 8px; outline: none; box-sizing: border-box;">
                <option value="" disabled ${!state.relationEnrichmentInput ? "selected" : ""}>Select an enrichment trait...</option>
                ${renderEnrichmentInputOptions()}
              </select>
            </div>
          ` : `
            <div class="query-box fasta-query-box" role="tabpanel">
              <textarea id="relationFastaInput" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" placeholder=">query_protein&#10;MSTNPKPQRKTKRNTNRRPQDVKFPGGGQIVGGV...">${esc(state.relationFastaInput)}</textarea>
              
              <div class="homology-selector-panel">
                <span>Homology Method:</span>
                <label class="radio-label">
                  <input type="radio" data-state-key="relationSearchMethod" name="relationSearchMethod" value="seq2graph" ${state.relationSearchMethod === "seq2graph" ? "checked" : ""}>
                  <span>Sequence Alignment (MMSeqs2)</span>
                </label>
                <label class="radio-label">
                  <input type="radio" data-state-key="relationSearchMethod" name="relationSearchMethod" value="embed2graph" ${state.relationSearchMethod === "embed2graph" ? "checked" : ""}>
                  <span>Deep Learning Embeddings (ESM-C + FAISS)</span>
                </label>
              </div>

              <div class="advanced-settings-toggle-container" style="margin-top: 12px;">
                <button type="button" class="btn btn-secondary advanced-settings-toggle-btn" data-action="toggle-advanced-search" style="font-size: 0.85em; padding: 4px 8px; cursor: pointer; border-radius: 4px; border: 1px solid #ccc; background: #f0f0f0;">
                  ${state.showAdvancedSearchOptions ? "Hide Advanced Search Tools ▴" : "Advanced Search Tools ▾"}
                </button>
              </div>

              ${state.showAdvancedSearchOptions ? `
                <div class="advanced-search-panel" style="margin-top: 12px; padding: 12px; border: 1px dashed #ccc; border-radius: 4px; background: #fafafa;">
                  ${state.relationSearchMethod === "seq2graph" ? `
                    <div class="advanced-params-group">
                      <h4 style="margin: 0 0 8px 0; font-size: 0.9em; color: #555;">MMSeqs2 Search Parameters</h4>
                      <div class="params-row" style="display: flex; gap: 16px;">
                        <label class="param-input-label" style="display: flex; flex-direction: column; font-size: 0.85em;">
                          <span style="margin-bottom: 4px; color: #666;">E-Value Threshold:</span>
                          <input type="number" step="any" min="0" data-state-key="relationEvalue" value="${state.relationEvalue !== undefined ? state.relationEvalue : 0.001}" placeholder="0.001" style="padding: 4px; width: 120px; border: 1px solid #ccc; border-radius: 4px;">
                        </label>
                        <label class="param-input-label" style="display: flex; flex-direction: column; font-size: 0.85em;">
                          <span style="margin-bottom: 4px; color: #666;">Min Sequence Identity:</span>
                          <input type="number" step="any" min="0" max="1" data-state-key="relationMinSeqId" value="${state.relationMinSeqId !== undefined ? state.relationMinSeqId : ""}" placeholder="e.g. 0.3" style="padding: 4px; width: 120px; border: 1px solid #ccc; border-radius: 4px;">
                        </label>
                      </div>
                    </div>
                  ` : `
                    <div class="advanced-params-group">
                      <h4 style="margin: 0 0 8px 0; font-size: 0.9em; color: #555;">ESM-C + FAISS Search Parameters</h4>
                      <div class="params-row" style="display: flex; gap: 16px;">
                        <label class="param-input-label" style="display: flex; flex-direction: column; font-size: 0.85em;">
                          <span style="margin-bottom: 4px; color: #666;">Max Result Hits (k):</span>
                          <input type="number" min="1" step="1" data-state-key="relationK" value="${state.relationK !== undefined ? state.relationK : 5}" placeholder="5" style="padding: 4px; width: 120px; border: 1px solid #ccc; border-radius: 4px;">
                        </label>
                        <label class="param-input-label" style="display: flex; flex-direction: column; font-size: 0.85em;">
                          <span style="margin-bottom: 4px; color: #666;">Min Similarity Threshold:</span>
                          <input type="number" step="any" min="0" max="1" data-state-key="relationMinSimilarity" value="${state.relationMinSimilarity !== undefined ? state.relationMinSimilarity : ""}" placeholder="e.g. 0.7" style="padding: 4px; width: 120px; border: 1px solid #ccc; border-radius: 4px;">
                        </label>
                      </div>
                    </div>
                  `}
                </div>
              ` : ""}
            </div>
          `}
        </div>

        <div class="attribute-filter-panel">
          <div>
            <h4>Choose PCO/PSFD attributes to extract for the submitted entities</h4>
            <small>Only triples where the submitted compound or matched protein is entity 1 or entity 2 are exported.</small>
          </div>
          <div class="attribute-grid">
            ${relationAttributeCheckbox("genes", "Genes")}
            ${relationAttributeCheckbox("tissues", "Site")}
            ${relationAttributeCheckbox("plant_traits", "Plant traits")}
            ${relationAttributeCheckbox("metabolites", "Metabolites")}
            ${relationAttributeCheckbox("species", "Species")}
            ${relationAttributeCheckbox("molecular_traits", "Molecular traits")}
            ${relationAttributeCheckbox("pathways", "Pathways")}
            ${relationAttributeCheckbox("experimental_conditions", "Experimental conditions")}
            ${relationAttributeCheckbox("human_traits", "Human traits")}
          </div>
        </div>
        <div class="annotation-examples sequence-examples">
          <button class="annotation-example" type="button" data-sequence-example="compound">Compound example</button>
          <button class="annotation-example" type="button" data-sequence-example="exact-fasta">Exact FASTA</button>
          <button class="annotation-example" type="button" data-sequence-example="homolog-fasta">Homolog FASTA</button>
          <button class="annotation-example" type="button" data-sequence-example="mixed">Mixed example</button>
        </div>
        <div class="annotation-actions">
          <button class="mini-button primary-action" type="button" data-relation-extract-action="extract">Extract relationships</button>
          <button class="mini-button" type="button" data-relation-extract-action="download" ${state.relationExtractionResults.length ? "" : "disabled"}>Download tab-delimited file</button>
        </div>
        <div class="annotation-status ${(state.relationExtractionStatus || "").includes("...") ? "loading" : ""}">${esc(state.relationExtractionStatus || "Submit compound names or protein FASTA sequences to extract PSFD relationships.")}</div>
        ${renderRelationExtractionResults()}
      </section>
    </section>
  `;
  bindAnnotationWorkspaceHandlers();
}

function relationAttributeCheckbox(id, label) {
  return `
    <label class="attribute-check">
      <input type="checkbox" data-relation-attribute="${esc(id)}" ${state.relationAttributeFilters[id] ? "checked" : ""}>
      <span>${esc(label)}</span>
    </label>
  `;
}

function getCollapsedFastaMatches(matches) {
  const grouped = {};
  for (const m of matches) {
    const key = m.accession || m.entity_label;
    if (!grouped[key]) {
      grouped[key] = [];
    }
    grouped[key].push(m);
  }
  
  const collapsed = [];
  for (const key in grouped) {
    const list = grouped[key];
    list.sort((a, b) => (b.kmer_score || 0) - (a.kmer_score || 0));
    const rep = { ...list[0] };
    rep.stackedCount = list.length;
    rep.allMatches = list;
    
    // Check enrichment filter
    if (state.relationOutputEnrichmentFilter && state.relationOutputEnrichmentFilter !== "all") {
        const hasEnrichment = rep.entity?.enrichments?.some(e => (e.trait_label || e.trait_concept) === state.relationOutputEnrichmentFilter);
        if (!hasEnrichment) continue;
    }
    
    collapsed.push(rep);
  }
  collapsed.sort((a, b) => (b.kmer_score || 0) - (a.kmer_score || 0));
  return collapsed;
}

function renderRelationExtractionResults() {
  if (!state.relationExtractionResults.length && !state.relationSequenceMatches.length) {
    return `
      <div class="annotation-empty compact relationship-empty-state">
        <strong>Ready for extraction</strong>
        <span>Submit compound names or FASTA sequences to see grouped relationships. The download keeps the full tab-delimited file.</span>
      </div>
    `;
  }
  const itemsPerPage = 100;
  const filteredRows = relationFilteredExtractionResults();
  const totalFiltered = filteredRows.length;
  const startIdx = (state.relationExtractionPage || 0) * itemsPerPage;
  const rows = filteredRows.slice(startIdx, startIdx + itemsPerPage);
  const collapsedMatches = getCollapsedFastaMatches(state.relationSequenceMatches);
  const uniqueQueries = new Set(collapsedMatches.map(m => m.query_name));
  const showQueryName = uniqueQueries.size > 1;
  const selectedMatch = state.relationSelectedMatchEntity ? state.relationSequenceMatches.find(m => (m.accession || m.entity_label) === state.relationSelectedMatchEntity) : null;
  const enrichmentsHtml = selectedMatch?.entity?.enrichments?.length ? `
    <div style="margin-top: 16px; margin-bottom: 16px; padding: 12px; border: 1px solid var(--border-color); border-radius: 6px; background: var(--bg-card);">
      <h3 style="margin-top: 0; margin-bottom: 8px;">Enriched Traits for ${esc(selectedMatch.entity_label)}</h3>
      <div>${enrichmentBadges(selectedMatch.entity.enrichments, 20)}</div>
    </div>
  ` : "";
  return `
    <div class="relation-extraction-results">
      ${relationOutputFilters()}
      ${state.relationSequenceMatches.length ? `
        <section class="sequence-match-strip">
          <div class="annotation-section-head">
            <h5>${state.relationSearchTab === 'enrichment' ? 'Enrichment matches' : 'FASTA matches'}</h5>
            <span>${fmt(collapsedMatches.length)} ${state.relationSearchTab === 'enrichment' ? (collapsedMatches.length === 1 ? "entity" : "entities") : (collapsedMatches.length === 1 ? "protein" : "proteins")} (${fmt(state.relationSequenceMatches.length)} total hits)</span>
          </div>
          <div class="sequence-match-grid">
            ${collapsedMatches.map(m => sequenceMatchCard(m, showQueryName)).join("")}
          </div>
        </section>
      ` : ""}
      <section class="relation-output-table">
        <div class="annotation-section-head">
          <div>
            <h5>Relationship results</h5>
            <small>Grouped by query. Use filters for review; download keeps every exact tab-delimited column.</small>
          </div>
          <span>${fmt(filteredRows.length)} of ${fmt(state.relationExtractionResults.length)} row${state.relationExtractionResults.length === 1 ? "" : "s"}</span>
        </div>
        ${relationOutputHelpDrawer()}
        ${relationDownloadSchema()}
        ${enrichmentsHtml}
        ${rows.length ? relationExtractionGroupedResults(rows) : `<div class="annotation-empty compact">No rows match the active filters.</div>`}
        ${totalFiltered > itemsPerPage ? `
          <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 16px;">
            <button class="secondary" onclick="state.relationExtractionPage = Math.max(0, (state.relationExtractionPage || 0) - 1); render();" ${startIdx === 0 ? "disabled" : ""}>Previous 100</button>
            <span class="muted tiny" style="font-weight: 500; font-size: 13px;">Showing ${fmt(startIdx + 1)} - ${fmt(Math.min(startIdx + itemsPerPage, totalFiltered))} of ${fmt(totalFiltered)} filtered</span>
            <button class="secondary" onclick="state.relationExtractionPage = (state.relationExtractionPage || 0) + 1; render();" ${startIdx + itemsPerPage >= totalFiltered ? "disabled" : ""}>Next 100</button>
          </div>
        ` : ""}
      </section>
    </div>
  `;
}

function renderEnrichmentInputOptions() {
  const enrichments = state.globalEnrichments || [];
  const grouped = {};
  enrichments.forEach(e => {
    const cat = e.category || 'molecular_traits';
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(e);
  });
  
  const categoryLabels = {
    genes: "Genes",
    tissues: "Site",
    plant_traits: "Plant Traits",
    metabolites: "Metabolites",
    species: "Species",
    molecular_traits: "Molecular Traits",
    pathways: "Pathways & Processes",
    experimental_conditions: "Experimental Conditions",
    human_traits: "Human Traits"
  };

  const order = [
    "plant_traits", "molecular_traits", "pathways", 
    "metabolites", "tissues", "experimental_conditions", 
    "species", "human_traits", "genes"
  ];

  const htmlParts = [];
  order.forEach(cat => {
    if (state.relationAttributeFilters && state.relationAttributeFilters[cat] === false) {
      return;
    }
    const list = grouped[cat];
    if (list && list.length) {
      const label = categoryLabels[cat] || clean(cat);
      htmlParts.push(`<optgroup label="${esc(label)}">`);
      list.forEach(e => {
        const val = e.label || e.ontology_id;
        htmlParts.push(`<option value="${esc(val)}" ${state.relationEnrichmentInput === val ? "selected" : ""}>${esc(val)}</option>`);
      });
      htmlParts.push(`</optgroup>`);
    }
  });

  return htmlParts.join("");
}


function relationOutputHelpDrawer() {
  return `
    <details class="relation-output-help">
      <summary>How to read this table</summary>
      <div class="relation-output-help-grid">
        <div><strong>Query</strong><span>The submitted compound or the closest PSFD-linked protein matched from FASTA.</span></div>
        <div><strong>Relation</strong><span>A PSFD triple where the query appears as entity 1 or entity 2.</span></div>
        <div><strong>Attribute</strong><span>The biological category of the other endpoint, filtered by your selected attributes.</span></div>
        <div><strong>Context to use</strong><span>The best compact context view. Open Compare sources to audit relation, event, and entity-linked context.</span></div>
      </div>
    </details>
  `;
}

function relationOutputFilters() {
  if (!state.relationExtractionResults.length && !state.relationSequenceMatches.length) return "";
  const options = relationOutputFilterOptions(state.relationExtractionResults);
  return `
    <div class="relation-output-filters" aria-label="Relationship output filters">
      ${relationOutputSelect("Enrichment (Protein Trait)", "relationOutputEnrichmentFilter", options.enrichments)}
      ${relationOutputSelect("Attribute", "relationOutputAttributeFilter", options.attributes)}
      ${relationOutputSelect("Species", "relationOutputSpeciesFilter", options.species)}
      ${relationOutputSelect("Site", "relationOutputTissueFilter", options.tissues)}
      <label class="relation-output-toggle">
        <input type="checkbox" data-state-key="relationOutputEnrichmentContextOnly" ${state.relationOutputEnrichmentContextOnly ? "checked" : ""}>
        <span>Must contain enrichment in context</span>
      </label>
      <label class="relation-output-toggle">
        <input type="checkbox" data-state-key="relationOutputDirectOnly" ${state.relationOutputDirectOnly ? "checked" : ""}>
        <span>Direct context only</span>
      </label>
      <label class="relation-output-toggle">
        <input type="checkbox" data-state-key="relationOutputBestContextOnly" ${state.relationOutputBestContextOnly ? "checked" : ""}>
        <span>Has best context</span>
      </label>
    </div>
  `;
}

function relationOutputSelect(label, key, values) {
  return `
    <label class="relation-output-select">
      <span>${esc(label)}</span>
      <select data-state-key="${esc(key)}">
        <option value="all">All</option>
        ${values.map((value) => `<option value="${esc(value)}" ${state[key] === value ? "selected" : ""}>${esc(value)}</option>`).join("")}
      </select>
    </label>
  `;
}

function relationOutputFilterOptions(rows) {
  const seqEnrichments = (state.relationSequenceMatches || []).flatMap(m => (m.entity?.enrichments || []).map(e => e.trait_label || e.trait_concept));
  const compoundEnrichments = (state.relationCompoundMatches || []).flatMap(c => (c.entity?.enrichments || []).map(e => e.trait_label || e.trait_concept));
  const enrichments = uniqueStrings([...seqEnrichments, ...compoundEnrichments].filter(Boolean)).sort((a, b) => a.localeCompare(b));
  const attributes = uniqueStrings(rows.map((row) => row.attribute_type).filter(Boolean)).sort((a, b) => a.localeCompare(b));
  const species = uniqueStrings(rows.flatMap((row) => relationOutputContextItemsByKind(row, "species"))).sort((a, b) => a.localeCompare(b));
  const tissues = uniqueStrings(rows.flatMap((row) => relationOutputContextItemsByKind(row, "tissue"))).sort((a, b) => a.localeCompare(b));
  return { enrichments, attributes, species, tissues };
}

function resetRelationOutputFilters() {
  state.relationExtractionPage = 0;
  state.relationOutputEnrichmentFilter = "all";
  state.relationOutputAttributeFilter = "all";
  state.relationOutputSpeciesFilter = "all";
  state.relationOutputTissueFilter = "all";
  state.relationOutputDirectOnly = false;
  state.relationOutputBestContextOnly = false;
  state.relationOutputEnrichmentContextOnly = false;
}

function relationFilteredExtractionResults() {
  const collapsedMatches = getCollapsedFastaMatches(state.relationSequenceMatches);
  const validEntityLabels = new Set(collapsedMatches.map(m => m.entity_label));
  
  return state.relationExtractionResults.filter((row) => {
    // If the left side (FASTA) is filtered by enrichment, filter rows to match those surviving hits
    if (state.relationSequenceMatches.length && row.query_name && !validEntityLabels.has(row.query_name)) {
        return false;
    }
    
    if (state.relationSelectedMatchEntity && row.query_name) {
      const selectedMatch = state.relationSequenceMatches.find(m => (m.accession || m.entity_label) === state.relationSelectedMatchEntity);
      if (selectedMatch && row.query_name !== selectedMatch.entity_label) return false;
    }
    
    if (state.relationOutputEnrichmentFilter !== "all") {
      const enrichmentTerm = state.relationOutputEnrichmentFilter.toLowerCase();
      const allEnrichmentObjects = (state.relationSequenceMatches || []).concat(state.relationCompoundMatches || [])
        .flatMap(m => m.entity?.enrichments || []);
      const matchedObject = allEnrichmentObjects.find(e => (e.trait_label || e.trait_concept).toLowerCase() === enrichmentTerm);
      const matchedConcept = matchedObject?.trait_concept?.toLowerCase();

      const filterMatches = (text) => {
        if (!text) return false;
        const lower = text.toLowerCase();
        if (lower.includes(enrichmentTerm)) return true;
        if (matchedConcept && lower.includes(matchedConcept)) return true;
        return false;
      };

      if (state.relationOutputEnrichmentContextOnly) {
        const allContexts = [row.subject_name, row.object_name, row.context, row.event_taxon_tissue_context, row.entity_linked_taxon_tissue_context, row.overlap_taxon_tissue_context].join(" ");
        if (!filterMatches(allContexts)) return false;
      } else {
        const allText = [row.subject_name, row.predicate, row.object_name, row.context, row.event_taxon_tissue_context, row.entity_linked_taxon_tissue_context, row.overlap_taxon_tissue_context].join(" ");
        if (!filterMatches(allText)) return false;
      }
    }
    
    if (state.relationOutputAttributeFilter !== "all" && row.attribute_type !== state.relationOutputAttributeFilter) return false;
    if (state.relationOutputSpeciesFilter !== "all" && !relationOutputContextItemsByKind(row, "species").includes(state.relationOutputSpeciesFilter)) return false;
    if (state.relationOutputTissueFilter !== "all" && !relationOutputContextItemsByKind(row, "tissue").includes(state.relationOutputTissueFilter)) return false;
    if (state.relationOutputDirectOnly && !splitRelationOutputItems(row.context).length) return false;
    if (state.relationOutputBestContextOnly && !relationOutputBestContextItems(row).length) return false;
    return true;
  });
}

function relationOutputContextItemsByKind(row, kind) {
  return uniqueStrings([
    row.context,
    row.event_taxon_tissue_context,
    row.entity_linked_taxon_tissue_context,
    row.overlap_taxon_tissue_context
  ].flatMap(splitRelationOutputItems)
   .filter((item) => relationOutputContextKind(item).key === kind)
   .map((item) => item.replace(/\*+$/, '')));
}

function relationOutputBestContextItems(row) {
  const preferred = [row.overlap_taxon_tissue_context, row.context, row.event_taxon_tissue_context, row.entity_linked_taxon_tissue_context];
  for (const value of preferred) {
    const items = splitRelationOutputItems(value);
    if (items.length) return items;
  }
  return [];
}

function relationExtractionGroupedResults(rows) {
  const groups = new Map();
  rows.forEach((row) => {
    const key = row.query_name || "Unknown query";
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(row);
  });
  return `
    <div class="relation-query-groups">
      ${Array.from(groups.entries()).map(([query, groupRows]) => relationExtractionQueryGroup(query, groupRows)).join("")}
    </div>
  `;
}

function relationExtractionQueryGroup(query, rows) {
  const attributes = uniqueStrings(rows.map((row) => row.attribute_type).filter(Boolean));
  const species = uniqueStrings(rows.flatMap((row) => relationOutputContextItemsByKind(row, "species")));
  const tissues = uniqueStrings(rows.flatMap((row) => relationOutputContextItemsByKind(row, "tissue")));
  return `
    <section class="relation-query-group">
      <div class="relation-query-group-head">
        <div>
          <strong>${esc(query)}</strong>
          <span>${fmt(rows.length)} relationship${rows.length === 1 ? "" : "s"}</span>
        </div>
        <div>
          <span>${fmt(attributes.length)} attributes</span>
          <span>${fmt(species.length)} species</span>
          <span>${fmt(tissues.length)} tissues/sites</span>
        </div>
      </div>
      ${relationExtractionResultsTable(rows)}
    </section>
  `;
}

function relationDownloadSchema() {
  const columns = [
    ["compound_or_gene_name", "Query entity"],
    ["relation", "Extracted relation"],
    ["context", "Directly stated context"],
    ["event_taxon_tissue_context", "Context from same event"],
    ["entity_linked_taxon_tissue_context", "Context from same entity elsewhere"],
    ["overlap_taxon_tissue_context", "Best-supported context"],
    ["attribute_type", "Attribute type"],
    ["ontology_normalized_relation", "Ontology-normalized relation"],
  ];
  return `
    <details class="download-schema-details">
      <summary>
        <span>Download format</span>
        <small>${fmt(columns.length)} tab-delimited columns</small>
      </summary>
      <div class="download-schema-grid">
        ${columns.map(([raw, label]) => `
          <div class="download-column-card">
            <strong>${esc(label)}</strong>
            <code>${esc(raw)}</code>
          </div>
        `).join("")}
      </div>
    </details>
  `;
}

function relationExtractionResultsTable(rows) {
  return `
    <div class="clean-table-wrap">
      <table class="clean-relation-output-table">
        <colgroup>
          <col class="col-relation">
          <col class="col-attribute">
          <col class="col-context-summary">
          <col class="col-row-details">
        </colgroup>
        <thead>
          <tr>
            <th>Relation</th>
            <th>Attribute</th>
            <th>Context sources</th>
            <th>All details</th>
          </tr>
        </thead>
        <tbody>
          ${rows.map(relationExtractionResultRow).join("")}
        </tbody>
      </table>
    </div>
  `;
}

function relationExtractionResultRow(row) {
  return `
    <tr>
      <td>${relationExtractionRelationButton(row)}</td>
      <td><span class="attribute-type-pill">${esc(row.attribute_type || "-")}</span></td>
      <td>${relationOutputContextSummary(row)}</td>
      <td>${relationOutputRowDetails(row)}</td>
    </tr>
  `;
}

function formatRelationLinks(row) {
  if (row.subject_name && row.predicate && row.object_name) {
    const btnStyle = "background:none;border:none;padding:0;color:#0366d6;text-decoration:none;cursor:pointer;font:inherit;font-weight:600;";
    const subjBtn = `<button type="button" style="${btnStyle}" data-relation-search="${esc(row.subject_name)}" onmouseover="this.style.textDecoration='underline'" onmouseout="this.style.textDecoration='none'">${esc(row.subject_name)}</button>`;
    const objBtn = `<button type="button" style="${btnStyle}" data-relation-search="${esc(row.object_name)}" onmouseover="this.style.textDecoration='underline'" onmouseout="this.style.textDecoration='none'">${esc(row.object_name)}</button>`;
    return `${subjBtn} ${esc(row.predicate)} ${objBtn}`;
  }

  const norm = row.normalized_relation;
  if (!norm) return esc(row.relation);
  const firstPipe = norm.indexOf('|');
  const lastPipe = norm.lastIndexOf('|');
  if (firstPipe !== -1 && lastPipe !== -1 && firstPipe !== lastPipe) {
    const firstSpaceAfterFirstPipe = norm.indexOf(' ', firstPipe);
    const lastSpaceBeforeLastPipe = norm.lastIndexOf(' ', lastPipe);
    if (firstSpaceAfterFirstPipe !== -1 && lastSpaceBeforeLastPipe !== -1 && firstSpaceAfterFirstPipe < lastSpaceBeforeLastPipe) {
      const subjectName = norm.substring(0, firstPipe);
      const objectName = norm.substring(lastSpaceBeforeLastPipe + 1, lastPipe);
      const predicate = norm.substring(firstSpaceAfterFirstPipe, lastSpaceBeforeLastPipe + 1);
      const btnStyle = "background:none;border:none;padding:0;color:#0366d6;text-decoration:none;cursor:pointer;font:inherit;font-weight:600;";
      return `<button type="button" style="${btnStyle}" data-relation-search="${esc(subjectName)}" onmouseover="this.style.textDecoration='underline'" onmouseout="this.style.textDecoration='none'">${esc(subjectName)}</button>${esc(predicate)}<button type="button" style="${btnStyle}" data-relation-search="${esc(objectName)}" onmouseover="this.style.textDecoration='underline'" onmouseout="this.style.textDecoration='none'">${esc(objectName)}</button>`;
    }
  }
  return esc(row.relation);
}

function relationExtractionRelationButton(row) {
  return `
    <div style="display: flex; flex-direction: column; gap: 4px; align-items: flex-start;">
      <span>${formatRelationLinks(row)}</span>
      <button class="relation-output-link" style="margin:0; padding:2px 6px; font-size:11px;" type="button" data-action="select-global" data-kind="relation" data-id="${esc(row.relation_id)}" data-pmcid="${esc(row.pmcid || "")}">
        ${esc([row.pmcid, "open triple"].filter(Boolean).join(" | "))}
      </button>
    </div>
  `;
}

function relationOutputContextCell(value, emptyText) {
  const items = splitRelationOutputItems(value);
  return `
    <div class="relation-table-context ${items.length ? "" : "empty"}">
      ${items.length
      ? items.map(relationOutputChip).join("")
      : `<small>${esc(emptyText)}</small>`}
    </div>
  `;
}

function relationOutputContextSummary(row) {
  const bundles = relationOutputContextBundles(row);
  const populated = bundles.filter((bundle) => splitRelationOutputItems(bundle.value).length);
  if (!populated.length) return `<span class="muted tiny">No context assigned.</span>`;
  const preferredOrder = ["agreement", "relation", "event", "linked"];
  const primary = preferredOrder
    .map((kind) => populated.find((bundle) => bundle.kind === kind))
    .find(Boolean) || populated[0];
  return `
    <div class="relation-context-summary">
      ${relationOutputPrimaryContext(primary)}
      ${populated.length > 1 ? relationOutputSourceCompare(populated) : ""}
    </div>
  `;
}

function relationOutputContextBundles(row) {
  return [
    { kind: "relation", label: "Directly stated", hint: "attached to this triple", value: row.context, empty: "No explicit relation context." },
    { kind: "event", label: "Same event", hint: "shared by event triples", value: row.event_taxon_tissue_context, empty: "No event-propagated taxon/tissue context." },
    { kind: "linked", label: "Same entity elsewhere", hint: "propagated from other triples", value: row.entity_linked_taxon_tissue_context, empty: "No entity-linked taxon/tissue context." },
    { kind: "agreement", label: "Best supported", hint: "overlap or fallback", value: row.overlap_taxon_tissue_context, empty: "No context overlap." },
  ];
}

function relationOutputPrimaryContext(bundle) {
  const items = splitRelationOutputItems(bundle.value);
  const shown = items.slice(0, 3);
  const hidden = items.slice(3);
  return `
    <div class="relation-context-primary ${esc(`context-kind-${bundle.kind}`)}">
      <div class="context-primary-head">
        <span><i aria-hidden="true"></i><strong>Context to use</strong></span>
        <small>${esc(bundle.label)} source</small>
      </div>
      <div class="context-bundle-chips">
        ${shown.map(relationOutputChip).join("")}
        ${hidden.length ? relationOutputMoreDetails(hidden) : ""}
      </div>
    </div>
  `;
}

function relationOutputSourceCompare(bundles) {
  return `
    <details class="context-source-compare">
      <summary>Compare ${fmt(bundles.length)} sources</summary>
      <div class="context-source-stack">
        ${bundles.map((bundle) => relationOutputContextBundle(bundle.kind, bundle.label, bundle.hint, bundle.value, 2)).join("")}
      </div>
    </details>
  `;
}

function relationOutputContextBundle(kind, label, hint, value, limit = 2) {
  const items = splitRelationOutputItems(value);
  const shown = items.slice(0, limit);
  const hidden = items.slice(limit);
  return `
    <div class="relation-output-context-bundle ${esc(`context-kind-${kind}`)}">
      <span class="context-bundle-label">
        <i aria-hidden="true"></i>
        <span>
          <strong>${esc(label)}</strong>
          <small>${esc(hint)}</small>
        </span>
      </span>
      <div class="context-bundle-chips">
        ${shown.map(relationOutputChip).join("")}
        ${hidden.length ? relationOutputMoreDetails(hidden) : ""}
      </div>
    </div>
  `;
}

function relationOutputMoreDetails(items) {
  return `
    <details class="relation-output-more-context">
      <summary>+${fmt(items.length)} more</summary>
      <div class="more-context-chip-list">
        ${items.map(relationOutputChip).join("")}
      </div>
    </details>
  `;
}

function relationOutputRowDetails(row) {
  const details = [
    ["Directly stated context", row.context, "No explicit relation context."],
    ["Context from same event", row.event_taxon_tissue_context, "No event-propagated taxon/tissue context."],
    ["Context from same entity elsewhere", row.entity_linked_taxon_tissue_context, "No entity-linked taxon/tissue context."],
    ["Best-supported context", row.overlap_taxon_tissue_context, "No context overlap."],
  ];
  return `
    <details class="relation-output-row-details">
      <summary>View all</summary>
      <div class="relation-output-detail-grid">
        ${details.map(([label, value, emptyText]) => `
          <div class="relation-output-detail-block">
            <strong>${esc(label)}</strong>
            ${relationOutputContextCell(value, emptyText)}
          </div>
        `).join("")}
        <div class="relation-output-detail-block wide">
          <strong>Ontology-normalized relation</strong>
          <code class="normalized-relation-code">${esc(row.normalized_relation || "-")}</code>
        </div>
      </div>
    </details>
  `;
}

function splitRelationOutputItems(value) {
  return uniqueStrings(String(value || "")
    .split(/\s*;\s*/)
    .map((item) => item.trim())
    .filter(Boolean));
}

function relationOutputChip(item) {
  const contextOnly = item.includes("*");
  const kind = relationOutputContextKind(item);
  const title = [
    kind.description,
    contextOnly ? "Added from broader context only" : ""
  ].filter(Boolean).join(". ");
  return `<span class="relation-output-chip context-entity-${esc(kind.key)} ${contextOnly ? "context-only" : ""}" title="${esc(title)}"><em>${esc(kind.label)}</em>${esc(item)}</span>`;
}

function relationOutputContextKind(item) {
  const text = String(item || "").toLowerCase();
  if (/ncbitaxon:\d+/i.test(item)) {
    return { key: "species", label: "Species", description: "Species or taxon context" };
  }
  if (
    /\b(?:po|uberon|bto|cl):\d+/i.test(item) ||
    /\b(leaf|leaves|root|roots|shoot|shoots|stem|stems|seedling|seedlings|seed|seeds|flower|flowers|fruit|fruits|tuber|tubers|hypocotyl|cotyledon|chloroplast|tissue|tissues|cell|cells|membrane|organ|organs|stage|stages|vegetative|reproductive|photosynthetic apparatus)\b/i.test(text)
  ) {
    return { key: "tissue", label: "Site", description: "Tissue, anatomy, cellular location, or stage context" };
  }
  return { key: "other", label: "Other", description: "Other experimental or biological context" };
}

function sequenceMatchCard(match, showQueryName = false) {
  let scoreLabel = "k-mer score";
  let scoreValue = `${Math.round(match.kmer_score * 100)}%`;
  
  if (match.score_type) {
    scoreLabel = match.score_type.replace(/_/g, ' ');
    if (match.score_type === "cosine_similarity") {
      scoreValue = match.kmer_score.toFixed(4);
    }
  } else if (match.search_method === "embed2graph") {
    scoreLabel = "cosine similarity";
    scoreValue = match.kmer_score.toFixed(4);
  }

  const stackBadge = match.stackedCount > 1 
    ? `<span style="font-size: 10px; background: #0070f3; color: white; padding: 1px 5px; border-radius: 10px; margin-left: 5px; display: inline-block; vertical-align: middle;">${match.stackedCount} hits</span>` 
    : "";

  const pmcidDisplay = match.stackedCount > 1 
    ? `${match.stackedCount} articles` 
    : match.pmcid;

  const matchKey = match.accession || match.entity_label;
  const isActive = state.relationSelectedMatchEntity === matchKey;

  return `
    <article class="sequence-match-card ${isActive ? "active" : ""}" style="cursor: pointer;" data-annotation-action="select-fasta-match" data-annotation-select-fasta-match="${esc(matchKey)}">
      ${showQueryName && match.query_name ? `<span>${esc(match.query_name)}</span>` : ""}
      <strong>${esc(match.entity_label)} ${stackBadge}</strong>
      <small>${esc([match.accession, pmcidDisplay].filter(Boolean).join(" | "))}</small>
      <div>
        <b>${scoreValue}</b>
        <em>${scoreLabel}</em>
      </div>
    </article>
  `;
}

async function runRelationExtraction() {
  console.log("Initiating relationship extraction process...");
  try {
    const compoundInput = document.getElementById("relationCompoundInput");
    const fastaInput = document.getElementById("relationFastaInput");
    const enrichmentInput = document.getElementById("relationEnrichmentInput");
    if (compoundInput) state.relationCompoundInput = compoundInput.value;
    if (fastaInput) state.relationFastaInput = fastaInput.value;
    if (enrichmentInput) state.relationEnrichmentInput = enrichmentInput.value;
    document.querySelectorAll("[data-relation-attribute]").forEach((input) => {
      state.relationAttributeFilters[input.getAttribute("data-relation-attribute")] = input.checked;
    });

    state.relationExtractionStatus = "Loading relationship data indices...";
    render();

    await loadGlobalPathIndex();

    const isCompoundTab = state.relationActiveSubTab === "compound";
    const isEnrichmentTab = state.relationActiveSubTab === "enrichment";
    
    const compoundEntities = isCompoundTab ? await relationCompoundEntities() : [];
    state.relationCompoundMatches = compoundEntities;
    
    const hasFasta = (!isCompoundTab && !isEnrichmentTab) && parseFastaRecords(state.relationFastaInput).length > 0;
    const hasEnrichment = isEnrichmentTab && state.relationEnrichmentInput;
    
    if (hasFasta) {
      state.relationExtractionStatus = "Querying FastAPI server for sequence matches...";
      render();
    } else if (hasEnrichment) {
      state.relationExtractionStatus = "Querying FastAPI server for enrichment matches...";
      render();
    } else {
      state.relationExtractionStatus = "Extracting relationships from index...";
      render();
    }

    const fastaMatches = (isEnrichmentTab && hasEnrichment) ? await relationEnrichmentMatches() : (!isEnrichmentTab && !isCompoundTab && hasFasta) ? await relationFastaMatches() : [];
    state.relationSequenceMatches = fastaMatches;
    if (fastaMatches.length > 0) {
      const collapsed = getCollapsedFastaMatches(fastaMatches);
      if (collapsed && collapsed.length > 0) {
        state.relationSelectedMatchEntity = collapsed[0].accession || collapsed[0].entity_label;
      } else {
        state.relationSelectedMatchEntity = null;
      }
    } else {
      state.relationSelectedMatchEntity = null;
    }
    const queryEntities = [
      ...compoundEntities.map((item) => ({ queryName: item.term, entity: item.entity, source: "compound" })),
      ...fastaMatches.map((match) => ({ queryName: match.entity_label, entity: match.entity, source: "fasta", match })),
    ];

    // Fetch the relationship rows directly from the backend API
    const extractResponse = await fetch(`${window.PSMM_API_BASE}/api/extract`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        compounds: isCompoundTab ? state.relationCompoundInput : "",
        fasta: (!isCompoundTab && !isEnrichmentTab) ? state.relationFastaInput : "",
        enrichments: isEnrichmentTab ? state.relationEnrichmentInput : "",
        attributes: state.relationAttributeFilters,
        method: state.relationSearchMethod,
        evalue: state.relationSearchMethod === "seq2graph" && state.relationEvalue !== "" ? Number(state.relationEvalue) : null,
        min_seq_id: state.relationSearchMethod === "seq2graph" && state.relationMinSeqId !== "" ? Number(state.relationMinSeqId) : null,
        k: state.relationSearchMethod === "embed2graph" && state.relationK !== "" ? Number(state.relationK) : null,
        min_similarity: state.relationSearchMethod === "embed2graph" && state.relationMinSimilarity !== "" ? Number(state.relationMinSimilarity) : null
      })
    });
    
    if (!extractResponse.ok) {
      throw new Error("Failed to extract relations from API.");
    }
    
    const rows = await extractResponse.json();
    state.relationExtractionResults = rows;
    resetRelationOutputFilters();
    const submittedCount = compoundEntities.length 
      + parseFastaRecords(state.relationFastaInput).length 
      + (isEnrichmentTab && state.relationEnrichmentInput ? 1 : 0);
    state.relationExtractionStatus = rows.length
      ? `${fmt(rows.length)} relationship rows extracted from ${fmt(queryEntities.length)} matched PSFD entities.`
      : submittedCount
        ? "No endpoint relationships matched the selected attribute filters."
        : "Enter at least one compound name, protein FASTA sequence, or enrichment term.";
    render();

    console.log(`SUCCESS: Relationship extraction completed. Extracted ${rows.length} rows.`);
    console.groupCollapsed("[LOG] Detailed relationship extraction query results");
    console.log("Matched query entities:", queryEntities);
    console.log("Extracted relation rows:", rows);
    console.groupEnd();

    return {
      success: true,
      queryEntities: queryEntities,
      extractedRows: rows
    };
  } catch (error) {
    console.error(error);
    state.relationExtractionStatus = `Relationship extraction failed: ${error.message}`;
    render();
    return {
      success: false,
      error: error.message
    };
  }
}

async function relationCompoundEntities() {
  const terms = uniqueStrings(String(state.relationCompoundInput || "")
    .split(/[\n;,]+/)
    .map((term) => term.trim())
    .filter(Boolean));
    
  if (!terms.length) return [];
  
  const response = await fetch(`${window.PSMM_API_BASE}/api/resolve_entities`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ terms: terms, category: "auto" })
  });
  if (!response.ok) throw new Error("Failed to resolve compound entities.");
  
  const results = await response.json();
  return results; // [{ term, entity }]
}

async function relationFastaMatches() {
  const queries = parseFastaRecords(state.relationFastaInput);
  if (!queries.length) return [];

  const matches = [];

  for (const query of queries) {
    try {
      const response = await fetch(`${window.PSMM_API_BASE}/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sequence: query.sequence,
          method: state.relationSearchMethod,
          evalue: state.relationSearchMethod === "seq2graph" && state.relationEvalue !== "" ? Number(state.relationEvalue) : null,
          min_seq_id: state.relationSearchMethod === "seq2graph" && state.relationMinSeqId !== "" ? Number(state.relationMinSeqId) : null,
          k: state.relationSearchMethod === "embed2graph" && state.relationK !== "" ? Number(state.relationK) : null,
          min_similarity: state.relationSearchMethod === "embed2graph" && state.relationMinSimilarity !== "" ? Number(state.relationMinSimilarity) : null
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`FastAPI returned ${response.status}:`, errorText);
        throw new Error(`Server returned status: ${response.status}. Details: ${errorText}`);
      }

      const results = await response.json();
      
      console.log(`SUCCESS: FastAPI search returned ${results.length} results.`);
      console.groupCollapsed("[LOG] Detailed FastAPI search results");
      console.log("Raw results:", results);
      console.groupEnd();

      for (const item of results) {
        if (!item.global_node_id) continue;

        const entities = item.entities || [];
        for (const entity of entities) {
          matches.push({
            query_name: query.name,
            entity,
            entity_label: pathEntityName(entity),
            pmcid: entity.pmcid || "",
            accession: item.uniprot_id,
            kmer_score: item.score || 1.0,
            score_type: item.score_type,
            search_method: state.relationSearchMethod,
            query_coverage: 1.0,
            target_coverage: 1.0,
          });
        }
      }
    } catch (err) {
      console.error(`FastAPI search failed for query ${query.name}:`, err);
      throw err;
    }
  }

  return matches;
}

async function relationEnrichmentMatches() {
  const terms = uniqueStrings(String(state.relationEnrichmentInput || "")
    .split(/[\n;,]+/)
    .map((term) => term.trim())
    .filter(Boolean));

  if (!terms.length) return [];

  const matches = [];
  for (const term of terms) {
    try {
      const response = await fetch(`${window.PSMM_API_BASE}/api/search_by_enrichment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ term })
      });
      if (!response.ok) throw new Error("Failed to search by enrichment.");
      const results = await response.json();
      for (const item of results) {
        if (!item.global_node_id) continue;
        for (const entity of item.entities || []) {
          matches.push({
            query_name: term,
            entity,
            entity_label: pathEntityName(entity),
            pmcid: entity.pmcid || "",
            accession: item.uniprot_id,
            kmer_score: item.score || 1.0,
            score_type: item.score_type,
            search_method: "enrichment",
            query_coverage: 1.0,
            target_coverage: 1.0,
          });
        }
      }
    } catch (err) {
      console.error(`FastAPI search failed for query ${term}:`, err);
      throw err;
    }
  }
  return matches;
}

function parseFastaRecords(text) {
  const raw = String(text || "").trim();
  if (!raw) return [];
  if (!raw.includes(">")) {
    const sequence = cleanProteinSequence(raw);
    return sequence ? [{ name: "query_1", sequence }] : [];
  }
  const records = [];
  let current = null;
  raw.split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed) return;
    if (trimmed.startsWith(">")) {
      if (current?.sequence) records.push({ ...current, sequence: cleanProteinSequence(current.sequence) });
      current = { name: trimmed.slice(1).trim() || `query_${records.length + 1}`, sequence: "" };
    } else if (current) {
      current.sequence += trimmed;
    }
  });
  if (current?.sequence) records.push({ ...current, sequence: cleanProteinSequence(current.sequence) });
  return records.filter((record) => record.sequence.length >= 20);
}

function cleanProteinSequence(sequence) {
  return String(sequence || "").toUpperCase().replace(/[^A-Z*]/g, "").replaceAll("*", "");
}

function relationRowsForQueryEntities(queryEntities) {
  const seen = new Set();
  const rows = [];
  const selectedKey = state.relationSelectedMatchEntity;
  queryEntities.forEach(({ queryName, entity, match }) => {
    if (selectedKey && match && (match.accession || match.entity_label) !== selectedKey) return;
    const relations = state.globalPathIndexes?.relationsByEntity?.get(entity.id) || [];
    relations.forEach((rel) => {
      if (!relationHasEndpoint(rel, entity.id)) return;
      const row = relationExtractionRow(queryName, entity, rel, match);
      if (!row) return;
      const key = `${row.query_name}|${row.relation_id}|${row.attribute_entity_id}`;
      if (seen.has(key)) return;
      seen.add(key);
      rows.push(row);
    });
  });
  return rows.sort((a, b) =>
    a.query_name.localeCompare(b.query_name) ||
    relationAttributeRank(a.attribute_key) - relationAttributeRank(b.attribute_key) ||
    a.relation.localeCompare(b.relation)
  );
}

function relationExtractionRow(queryName, queryEntity, rel, match) {
  const subject = state.globalPathIndexes?.entityById?.get(rel.subject_entity_id);
  const object = state.globalPathIndexes?.entityById?.get(rel.object_entity_id);
  if (!subject || !object) return null;
  const queryIsSubject = relationGlobalSubjectIds(rel).includes(queryEntity.id);
  const queryIsObject = relationGlobalObjectIds(rel).includes(queryEntity.id);
  const other = queryIsSubject && !queryIsObject ? object : subject;
  const attribute = relationAttributeCategory(other);
  if (!attribute || !state.relationAttributeFilters[attribute.key]) return null;
  const predicate = clean(rel.predicate || rel.predicate_class || "relates to");
  const contexts = annotationRelationContextEntities(rel).map((item) => `${item.label}${item.ontologyId ? ` (${item.ontologyId})` : ""}`);
  const eventTaxonTissueContext = relationTaxonTissueDisplay(rel, "event");
  const entityLinkedTaxonTissueContext = relationTaxonTissueDisplay(rel, "entity_linked");
  const overlapTaxonTissueContext = relationTaxonTissueOverlapDisplay(rel);
  return {
    query_name: pathEntityName(queryEntity) || queryName,
    pmcid: rel.pmcid || "",
    relation_id: rel.id,
    attribute_entity_id: other.id,
    attribute_key: attribute.key,
    relation: `${pathEntityName(subject)} ${predicate} ${pathEntityName(object)}`,
    context: uniqueStrings(contexts).join("; "),
    event_taxon_tissue_context: eventTaxonTissueContext,
    entity_linked_taxon_tissue_context: entityLinkedTaxonTissueContext,
    overlap_taxon_tissue_context: overlapTaxonTissueContext,
    attribute_type: attribute.label,
    normalized_relation: `${normalizedEntityForRelation(subject)} ${predicate} ${normalizedEntityForRelation(object)}`,
    score: match ? match.kmer_score : null,
    score_type: match ? match.score_type || (match.search_method === 'embed2graph' ? 'cosine_similarity' : 'k-mer score') : null,
  };
}

function normalizedEntityForRelation(entity) {
  const ids = annotationOntologyIds(entity);
  return `${pathEntityName(entity)}|${ids[0] || "unresolved"}`;
}

function relationAttributeCategory(entity) {
  const type = String(entity?.type || entity?.entity_type || "");
  const map = [
    { key: "genes", label: "Gene/protein", types: ["gene_protein", "gene", "protein"] },
    { key: "metabolites", label: "Metabolite/compound", types: ["compound"] },
    { key: "pathways", label: "Pathway/process", types: ["pathway_or_process"] },
    { key: "tissues", label: "Tissue/anatomy", types: ["anatomical_structure", "anatomical_part", "cellular_component", "developmental_stage"] },
    { key: "species", label: "Species/taxon", types: ["taxon"] },
    { key: "experimental_conditions", label: "Experimental condition", types: ["experimental_condition", "condition_parameter", "genotype", "genetic_perturbation"] },
    { key: "plant_traits", label: "Plant trait", types: ["plant_trait", "phenotype"] },
    { key: "molecular_traits", label: "Molecular trait/function", types: ["molecular_trait_or_function"] },
    { key: "human_traits", label: "Human trait", types: ["human_trait"] },
  ];
  return map.find((item) => item.types.includes(type)) || null;
}

function relationAttributeRank(key) {
  return Object.keys(state.relationAttributeFilters).indexOf(key);
}

async function setRelationExtractionExample(kind) {
  if (kind === "compound") {
    state.relationActiveSubTab = "compound";
    state.relationCompoundInput = "piperonylic acid\nGABA\nABA";
    state.relationFastaInput = "";
  } else if (kind === "fasta" || kind === "exact-fasta") {
    state.relationActiveSubTab = "sequence";
    state.relationCompoundInput = "";
    const sequence = "MGRAPCCDKASVKRGPWSPEEDEQLRSYVQSHGIGGNWIALPQKAGLNRCGKSCRLRWLNYLRPDIKHGGYTEQEDHIICSLYNSIGSRWSIIASKLPGRTDNDVKNYWNTKLKKKAMGAVQPRAAASAPSQCTSSAMAPALSPASSSVTSSSGDACFAAAATTTTTMYPPPTTPPQQQFIRFDAPPAAAAAASPTDLAPVPPPATVTADGDGGWASDALSLDDVFLGELTAGEPLFPYAELFSGFAGAAPDSKATLELSACYFPNMAEMWAASDHAYAKPQGLCNTLT";
    state.relationFastaInput = `>OsMYB55|A0A0P0WQQ7|exact_psfd_match\n${wrapSequence(sequence)}`;
  } else if (kind === "homolog-fasta") {
    state.relationActiveSubTab = "sequence";
    state.relationCompoundInput = "";
    const sequence = "MGRAPCCDKASVKRGPWSPEEDEQLRSYVQSHGIGGNWIALPQKAGLNRCGKSCRLRWLNYLRPDIKHGGYTEQEDHIICSLYNSIGSRWSIIASKLPGRTDNDVKNYWNTKLKKKAMGAVQPRAAASAPSQCTSSAMAPALSPASSSVTSSSGDACFAAAATTTTTMYPPPTTPPQQQFIRFDAPPAAAAAASPTDLAPVPPPATVTADGDGGWASDALSLDDVFLGELTAGEPLFPYAELFSGFAGAAPDSKATLELSACYFPNMAEMWAASDHAYAKPQGLCNTLT";
    state.relationFastaInput = `>novel_OsMYB55_like_query|derived_from_A0A0P0WQQ7|non_exact_demo\n${wrapSequence(homologLikeSequence(sequence))}`;
  } else {
    state.relationActiveSubTab = "compound";
    state.relationCompoundInput = "piperonylic acid\nGABA";
    const sequence = "MGRAPCCDKASVKRGPWSPEEDEQLRSYVQSHGIGGNWIALPQKAGLNRCGKSCRLRWLNYLRPDIKHGGYTEQEDHIICSLYNSIGSRWSIIASKLPGRTDNDVKNYWNTKLKKKAMGAVQPRAAASAPSQCTSSAMAPALSPASSSVTSSSGDACFAAAATTTTTMYPPPTTPPQQQFIRFDAPPAAAAAASPTDLAPVPPPATVTADGDGGWASDALSLDDVFLGELTAGEPLFPYAELFSGFAGAAPDSKATLELSACYFPNMAEMWAASDHAYAKPQGLCNTLT";
    state.relationFastaInput = `>novel_OsMYB55_like_query|derived_from_A0A0P0WQQ7|non_exact_demo\n${wrapSequence(homologLikeSequence(sequence))}`;
  }
  state.relationExtractionResults = [];
  state.relationSequenceMatches = [];
  state.relationCompoundMatches = [];
  state.relationSelectedMatchEntity = null;
  resetRelationOutputFilters();
  state.relationExtractionStatus = kind === "fasta" || kind === "exact-fasta"
    ? "Loaded an exact OsMYB55 FASTA record from the PSFD-linked sequence database."
    : kind === "homolog-fasta"
      ? "Loaded a non-identical OsMYB55-like FASTA query derived from a PSFD-linked sequence to demonstrate homolog matching."
      : "Example loaded. Click Extract relationships to retrieve endpoint triples from the PSFD data.";
  render();
}

function homologLikeSequence(sequence) {
  const cleanSeq = cleanProteinSequence(sequence);
  if (cleanSeq.length < 80) return cleanSeq;
  const replacements = {
    A: "S", C: "S", D: "E", E: "D", F: "Y", G: "A", H: "N", I: "V", K: "R", L: "I",
    M: "L", N: "Q", P: "A", Q: "N", R: "K", S: "T", T: "S", V: "I", W: "F", Y: "F",
  };
  const trimmed = cleanSeq.slice(12, cleanSeq.length - 8).split("");
  for (let index = 8; index < trimmed.length; index += 19) {
    trimmed[index] = replacements[trimmed[index]] || trimmed[index];
  }
  return trimmed.join("");
}

function wrapSequence(sequence, width = 70) {
  const cleanSeq = cleanProteinSequence(sequence);
  const lines = [];
  for (let index = 0; index < cleanSeq.length; index += width) {
    lines.push(cleanSeq.slice(index, index + width));
  }
  return lines.join("\n");
}

function exportRelationExtractionTable() {
  const filteredResults = relationFilteredExtractionResults();
  if (!filteredResults.length) return;
  const header = [
    "protein_or_compound_name",
    "search_engine",
    "similarity_score",
    "enrichments",
    "pmcid",
    "relation",
    "context",
    "event_taxon_tissue_context",
    "entity_linked_taxon_tissue_context",
    "overlap_taxon_tissue_context",
    "attribute_type",
    "ontology_normalized_relation"
  ];
  const sortedResults = [...filteredResults].sort((a, b) => (b.score || 0) - (a.score || 0));
  const rows = sortedResults.map((row) => {
    const match = (state.relationSequenceMatches || []).concat(state.relationCompoundMatches || [])
      .find(m => (m.entity_label || m.term) === row.query_name);
    
    const enrichments = match?.entity?.enrichments 
      ? uniqueStrings(match.entity.enrichments.map(e => e.trait_label || e.trait_concept)).join(", ")
      : "";
      
    const searchEngine = match?.search_method === 'embed2graph' ? 'Embedding Search' 
      : match?.search_method === 'seq2graph' ? 'Sequence Search' 
      : match?.source || row.score_type || "";

    const similarityScore = match?.kmer_score != null ? match.kmer_score : (row.score != null ? row.score : "");

    return [
      row.query_name,
      searchEngine,
      similarityScore,
      enrichments,
      row.pmcid,
      row.relation,
      row.context,
      row.event_taxon_tissue_context,
      row.entity_linked_taxon_tissue_context,
      row.overlap_taxon_tissue_context,
      row.attribute_type,
      row.normalized_relation
    ];
  });
  const content = [header, ...rows].map((row) => row.map(tsvCell).join("\t")).join("\n") + "\n";
  downloadFile("psfd_relationship_attributes.tsv", content, "text/tab-separated-values");
}

function tsvCell(value) {
  return String(value ?? "").replace(/\t/g, " ").replace(/\r?\n/g, " ");
}

function setAnnotationStatusText(text) {
  state.annotationStatus = text;
  const status = els.mainPanel.querySelector(".annotation-status");
  if (status) status.textContent = text;
}

function refreshAnnotationReadyState() {
  const stats = state.globalPathIndex?.stats || {};
  const badgeContainer = els.mainPanel.querySelector("[data-annotation-stats]");
  if (badgeContainer) {
    badgeContainer.innerHTML = badges([
      `${fmt(stats.entities || 0)} entities`,
      `${fmt(stats.concepts || 0)} ontology IDs`,
      `${fmt(state.manifest?.papers?.length || 0)} papers`
    ]);
  }
  if (!state.annotationStatus || /loading annotation database/i.test(state.annotationStatus)) {
    setAnnotationStatusText("Database ready. Click Annotate when your list is ready.");
  }
}

function annotationResultSummary() {
  if (!state.annotationResults.length) return "No submitted list yet";
  const matched = annotationRows().filter((row) => row.entity).length;
  const category = state.annotationCategory === "auto" ? "" : ` | ${annotationCategoryLabel(state.annotationCategory)}`;
  return `${fmt(matched)} matched | ${fmt(state.annotationResults.length - matched)} unmatched${category}`;
}

function renderAnnotationResults() {
  if (!state.annotationResults.length) {
    return `<div class="annotation-empty">Submit genes, proteins, compounds, aliases, or ontology IDs.</div>`;
  }
  const rows = annotationRows();
  return `
    <div class="annotation-summary-list">
      ${rows.map(annotationSummaryCard).join("")}
    </div>
  `;
}

function annotationRows() {
  return state.annotationResults.map((row) => {
    const selectedId = state.annotationSelectionIds[row.term] || "";
    const entity = row.matches.find((match) => match.id === selectedId) || row.matches[0] || null;
    return buildAnnotationRow(row.term, entity, row.matches.length, row.matches);
  });
}

function buildAnnotationRow(term, entity, matchCount = 0, matches = []) {
  if (!entity) {
    return {
      term,
      entity: null,
      match: "",
      type: "",
      pmcid: "",
      normalized: "",
      annotation: "No PSFD match",
      evidence: "",
      data: "",
      matchCount,
      matches
    };
  }
  const ids = annotationOntologyIds(entity);
  return {
    term,
    entity,
    match: pathEntityName(entity),
    type: clean(entity.type || entity.entity_type || "entity"),
    pmcid: entity.pmcid || "",
    normalized: ids.slice(0, 6).join(" | "),
    annotation: annotationEntitySummary(entity),
    evidence: `${fmt(entity.relation_count || 0)} relations, ${fmt(entity.event_count || 0)} events`,
    data: annotationDataFlags(entity).join(", "),
    matchCount,
    matches,
    selectedId: entity.id,
  };
}

function annotationSummaryCard(row) {
  if (!row.entity) {
    return `
      <article class="annotation-summary-card unmatched">
        <div class="annotation-summary-head">
          <div>
            <span>Input</span>
            <h4>${esc(row.term)}</h4>
          </div>
          <strong>No PSFD match</strong>
        </div>
        <p>Try a canonical gene ID, protein name, compound name, alias, or ontology ID.</p>
      </article>
    `;
  }
  const entity = row.entity;
  const profile = annotationEntityProfile(entity);
  return `
    <article class="annotation-summary-card" style="--entity-color:${esc(colorForEntity(entity.type || entity.entity_type))}">
      <div class="annotation-summary-head">
        <div>
          <span>${esc(row.term)}${row.matchCount > 1 ? ` | ${fmt(row.matchCount)} matches` : ""}</span>
          <h4>${esc(row.match)}</h4>
          <small>${esc([row.pmcid, row.type].filter(Boolean).join(" | "))}</small>
        </div>
        <div class="annotation-confidence">${esc(profile.status)}</div>
      </div>
      ${annotationMeaningChooser(row)}
      ${annotationOntologyPanel(profile.ontology)}
      <p class="annotation-plain-summary">${esc(profile.summary)}</p>
      ${annotationFactStrip(profile.facts)}
      ${annotationRecordPanel(profile.records, entity)}
      ${annotationMechanismPanel(profile.mechanisms)}
      ${annotationContextPanel(profile.contexts)}
      <div class="annotation-card-actions">
        ${profile.fastaButton || ""}
        <button class="mini-button" type="button" data-action="select-global" data-kind="entity" data-id="${esc(entity.id)}" data-pmcid="${esc(entity.pmcid)}">Inspect evidence</button>
      </div>
    </article>
  `;
}

function annotationOntologyPanel(ontology) {
  if (!ontology?.title) return "";
  return `
    <section class="annotation-ontology-panel">
      <div>
        <span>Ontology annotation${ontology.source ? ` | ${esc(ontology.source)}` : ""}</span>
        <strong>${esc(ontology.title)}</strong>
        ${ontology.id ? `<small>${esc(ontology.id)}</small>` : ""}
      </div>
      ${ontology.description ? `<p>${esc(ontology.description)}</p>` : ""}
    </section>
  `;
}

function annotationFactStrip(facts) {
  if (!facts.length) return "";
  return `
    <div class="annotation-fact-strip">
      ${facts.slice(0, 5).map((fact) => `
        <div class="annotation-fact">
          <span>${esc(fact[0])}</span>
          <strong>${esc(fact[1])}</strong>
        </div>
      `).join("")}
    </div>
  `;
}

function annotationMechanismPanel(mechanisms) {
  return `
    <section class="annotation-mechanism-panel">
      <div class="annotation-section-head">
        <h5>Main evidence</h5>
        <span>${fmt(mechanisms.length)} relation${mechanisms.length === 1 ? "" : "s"}</span>
      </div>
      ${mechanisms.length ? `
        <div class="annotation-mechanism-list">
          ${mechanisms.slice(0, 6).map((mechanism) => `
            <button class="annotation-mechanism-row" type="button" data-action="select-global" data-kind="relation" data-id="${esc(mechanism.id)}" data-pmcid="${esc(mechanism.pmcid)}" style="--entity-color:${esc(mechanism.color)}">
              <div>
                <span>${esc(mechanism.kind)}</span>
                <strong>${esc(mechanism.statement)}</strong>
              </div>
              <p>${esc(mechanism.contextSummary || "No explicit study context was attached to this relation.")}</p>
              <p class="annotation-mechanism-source">${esc(mechanism.provenance)}</p>
              ${mechanism.evidence ? `<small>${esc(mechanism.evidence)}</small>` : ""}
            </button>
          `).join("")}
        </div>
      ` : `<div class="annotation-empty compact">No direct relation evidence was extracted for this entity in the demo data.</div>`}
    </section>
  `;
}

function annotationContextPanel(contexts) {
  if (!contexts.length) return "";
  return `
    <section class="annotation-context-panel">
      <div class="annotation-section-head">
        <h5>Most frequent contexts</h5>
        <span>${fmt(contexts.length)} context${contexts.length === 1 ? "" : "s"}</span>
      </div>
      <div class="annotation-context-strip">
        ${contexts.slice(0, 10).map((context) => `
          <button class="annotation-context-chip" type="button" data-action="select-global" data-kind="entity" data-id="${esc(context.id)}" data-pmcid="${esc(context.pmcid)}" style="--entity-color:${esc(context.color)}">
            <strong>${esc(context.label)}</strong>
            <span>${esc([context.ontologyLabel || context.ontologyId, context.type, fmt(context.count)].filter(Boolean).join(" | "))}</span>
          </button>
        `).join("")}
      </div>
    </section>
  `;
}

function annotationMeaningChooser(row) {
  const choices = annotationMeaningChoices(row.matches);
  if (choices.length <= 1) return "";
  return `
    <section class="annotation-meaning-panel">
      <div class="annotation-section-head">
        <h5>Choose meaning</h5>
        <span>${fmt(choices.length)} categories</span>
      </div>
      <div class="annotation-meaning-grid">
        ${choices.map((choice) => {
    const active = choice.entity.id === row.selectedId;
    return `
            <button class="annotation-meaning-choice ${active ? "active" : ""}" type="button" data-annotation-select-match="${esc(choice.entity.id)}" data-term="${esc(row.term)}" style="--entity-color:${esc(colorForEntity(choice.entity.type || choice.entity.entity_type))}">
              <strong>${esc(choice.category)}</strong>
              <span>${esc(choice.label)}</span>
              <small>${esc(choice.detail)}</small>
            </button>
          `;
  }).join("")}
      </div>
    </section>
  `;
}

function annotationMeaningChoices(matches) {
  const byCategory = new Map();
  asArray(matches).forEach((entity) => {
    if (!entity?.id) return;
    const category = annotationMeaningCategory(entity);
    if (!byCategory.has(category)) {
      const ids = annotationOntologyIds(entity);
      const concept = annotationConceptForIds(ids);
      const records = annotationConceptEntities(entity, concept);
      byCategory.set(category, {
        category,
        entity,
        count: 0,
        label: annotationMeaningLabel(entity, concept),
        detail: annotationMeaningDetail(entity, ids, records),
      });
    }
    byCategory.get(category).count += 1;
  });
  return Array.from(byCategory.values())
    .map((choice) => ({
      ...choice,
      detail: choice.count > 1 ? `${choice.detail} | ${fmt(choice.count)} candidate matches` : choice.detail,
    }));
}

function annotationMeaningCategory(entity) {
  const type = String(entity.type || entity.entity_type || "").toLowerCase();
  if (isCompoundLikeGlobalEntity(entity)) return "Compound";
  if (type === "experimental_condition" || type === "condition_parameter") return "Condition / treatment";
  if (type === "pathway_or_process") return "Pathway / process";
  if (type === "gene_protein" || type === "gene" || type === "protein") return "Gene / protein";
  if (type === "plant_trait" || type === "molecular_trait_or_function" || type === "phenotype") return "Trait / function";
  if (type === "taxon") return "Organism";
  if (/anatomical|cellular|developmental/.test(type)) return "Anatomy / cell";
  if (/assay/.test(type)) return "Assay / measurement";
  return clean(type || "entity");
}

function annotationMeaningLabel(entity, concept = null) {
  return concept?.label || entity.selected_label || pathEntityName(entity);
}

function annotationMeaningDetail(entity, ids, records) {
  const pieces = [];
  if (ids[0]) pieces.push(ids[0]);
  pieces.push(`${fmt(records.length || 1)} PSFD record${(records.length || 1) === 1 ? "" : "s"}`);
  const papers = uniqueStrings((records.length ? records : [entity]).map((record) => record.pmcid).filter(Boolean));
  if (papers.length) pieces.push(`${fmt(papers.length)} paper${papers.length === 1 ? "" : "s"}`);
  return pieces.join(" | ");
}

function annotationRecordPanel(records, activeEntity) {
  if (!records || records.length <= 1) return "";
  return `
    <section class="annotation-record-panel">
      <div class="annotation-section-head">
        <h5>Same ontology records</h5>
        <span>${fmt(records.length)} records</span>
      </div>
      <div class="annotation-record-grid">
        ${records.slice(0, 8).map((record) => `
          <button class="annotation-record-chip ${record.id === activeEntity.id ? "active" : ""}" type="button" data-action="select-global" data-kind="entity" data-id="${esc(record.id)}" data-pmcid="${esc(record.pmcid)}" style="--entity-color:${esc(colorForEntity(record.type || record.entity_type))}">
            <strong>${esc(pathEntityName(record))}</strong>
            <span>${esc([record.pmcid, clean(record.type || record.entity_type || "entity")].filter(Boolean).join(" | "))}</span>
          </button>
        `).join("")}
        ${records.length > 8 ? `<div class="annotation-record-chip inert"><strong>+${fmt(records.length - 8)} more</strong><span>same ontology ID</span></div>` : ""}
      </div>
    </section>
  `;
}

function summaryMiniPanel(title, rows) {
  return `
    <section class="summary-mini-panel">
      <h5>${esc(title)}</h5>
      <div>
        ${rows.length ? rows.slice(0, 5).map(summaryMiniRow).join("") : `<p class="muted">No data available.</p>`}
      </div>
    </section>
  `;
}

function summaryMiniRow(row) {
  const content = `<span>${esc(row[0])}</span><strong>${esc(row[1])}</strong>`;
  const meta = row[2] || {};
  if (meta.action) {
    return `
      <button class="summary-mini-row clickable" type="button" data-action="${esc(meta.action)}" data-kind="${esc(meta.kind || "")}" data-id="${esc(meta.id || "")}" data-pmcid="${esc(meta.pmcid || "")}">
        ${content}
      </button>
    `;
  }
  if (meta.search) {
    return `
      <button class="summary-mini-row clickable" type="button" data-annotation-search="${esc(meta.search)}" data-annotation-search-tab="${esc(meta.tab || "entities")}" data-annotation-pmcid="${esc(meta.pmcid || "")}">
        ${content}
      </button>
    `;
  }
  return `<div class="summary-mini-row">${content}</div>`;
}

function summaryThemePanel(title, rows, emptyText) {
  return `
    <section class="summary-theme-panel">
      <h5>${esc(title)}</h5>
      <div>
        ${rows.length ? rows.slice(0, 6).map(summaryThemeRow).join("") : `<p class="muted">${esc(emptyText)}</p>`}
      </div>
    </section>
  `;
}

function summaryThemeRow(row) {
  const detail = row.detail || `${fmt(row.count)} evidence item${row.count === 1 ? "" : "s"}`;
  const content = `
    <strong>${esc(row.label)}</strong>
    <span>${esc(detail)}</span>
  `;
  if (row.action) {
    return `
      <button class="summary-theme-row clickable" type="button" data-action="${esc(row.action)}" data-kind="${esc(row.kind || "")}" data-id="${esc(row.id || "")}" data-pmcid="${esc(row.pmcid || "")}">
        ${content}
      </button>
    `;
  }
  if (row.search) {
    return `
      <button class="summary-theme-row clickable" type="button" data-annotation-search="${esc(row.search)}" data-annotation-search-tab="${esc(row.tab || "entities")}" data-annotation-pmcid="${esc(row.pmcid || "")}">
        ${content}
      </button>
    `;
  }
  return `<div class="summary-theme-row">${content}</div>`;
}

function annotationOntologyIds(entity) {
  const compound = entity.compound_classification || {};
  const chebi = compound.chebi || {};
  const pubchem = compound.pubchem || {};
  const normalization = compound.normalization || {};
  return uniqueStrings([
    ...entityOntologyIds(entity),
    normalization.selected_ontology_id,
    chebi.id,
    pubchem.cid ? `PubChem:${pubchem.cid}` : "",
  ]).filter(Boolean);
}

function annotationConceptForIds(ids) {
  const concepts = uniqueStrings(ids)
    .map((id) => state.globalPathIndexes?.conceptById?.get(id))
    .filter(Boolean);
  return concepts
    .sort((a, b) => asArray(b.entity_ids).length - asArray(a.entity_ids).length || String(a.id).localeCompare(String(b.id)))[0] || null;
}

function annotationConceptEntities(entity, concept) {
  const byId = state.globalPathIndexes?.entityById;
  const records = asArray(concept?.entity_ids)
    .map((id) => byId?.get(id))
    .filter(Boolean);
  return uniqueEntities([entity, ...records])
    .sort((a, b) => {
      if (a.id === entity.id) return -1;
      if (b.id === entity.id) return 1;
      return String(a.pmcid || "").localeCompare(String(b.pmcid || "")) || pathEntityName(a).localeCompare(pathEntityName(b));
    });
}

function annotationEndpointRelationsForEntities(entities) {
  const entityIds = new Set(entities.map((entity) => entity.id).filter(Boolean));
  const byId = new Map();
  entities.forEach((entity) => {
    (state.globalPathIndexes?.relationsByEntity?.get(entity.id) || []).forEach((rel) => {
      if (entityIds.has(rel.subject_entity_id) || entityIds.has(rel.object_entity_id)) byId.set(rel.id, rel);
    });
  });
  return Array.from(byId.values());
}

function annotationEntityProfile(entity) {
  const ids = annotationOntologyIds(entity);
  const concept = annotationConceptForIds(ids);
  const records = annotationConceptEntities(entity, concept);
  const endpointRelations = annotationEndpointRelationsForEntities(records);
  const selectedRelations = (state.globalPathIndexes?.relationsByEntity?.get(entity.id) || []).filter((rel) => relationHasEndpoint(rel, entity.id));
  const traits = annotationTraitRows(entity, selectedRelations);
  const mechanisms = annotationMechanismRowsForEntities(records, endpointRelations);
  const contexts = annotationContextRows(endpointRelations);
  const ontology = annotationOntologySummary(entity, ids, concept);
  const profile = entity.gene_protein_normalization || {};
  const compound = entity.compound_classification || {};
  const status = annotationStatusLabel(entity, profile, compound);
  const evidenceCount = endpointRelations.length || selectedRelations.length || Number(entity.relation_count || 0);
  return {
    status,
    summary: annotationPlainSummary(entity, endpointRelations, mechanisms, contexts, ontology, records),
    identity: annotationIdentityRows(entity, ids),
    metadata: annotationMetadataRows(entity, profile, compound),
    facts: annotationFactRows(entity, ids, evidenceCount, mechanisms, contexts, profile, compound, records),
    ontology,
    mechanisms,
    traits,
    contexts,
    records,
    concept,
    fastaButton: annotationFastaButton(entity, profile),
  };
}

function annotationStatusLabel(entity, profile, compound) {
  if ((profile.phytozome_ids || []).length) return "gene resolved";
  if ((profile.fasta_accessions || []).length) return "protein resolved";
  if ((profile.database_ids || []).length || (profile.family_ids || []).length) return "gene annotated";
  if ((compound.pubchem || {}).cid || (compound.chebi || {}).id) return "compound resolved";
  if (entityOntologyIds(entity).length) return "ontology mapped";
  return "partial match";
}

function annotationPlainSummary(entity, relations, mechanisms, contexts, ontology, records = []) {
  const name = pathEntityName(entity);
  const type = clean(entity.type || entity.entity_type || "entity");
  const definition = ontology?.description || conciseEntityDefinition(entity);
  const mechanismStatements = mechanisms.slice(0, 2).map((mechanism) => mechanism.statement);
  const contextNames = contexts.slice(0, 4).map((context) => context.label);
  const papers = uniqueStrings(records.map((record) => record.pmcid).filter(Boolean));
  const pieces = [];
  const cleanDefinition = String(definition || "").replace(/[\s.]+$/g, "");
  if (ontology?.title) {
    pieces.push(`${name} maps to ${ontology.title}${ontology.id ? ` (${ontology.id})` : ""}`);
    if (cleanDefinition && cleanDefinition.toLowerCase() !== String(ontology.title).toLowerCase()) pieces.push(cleanDefinition);
  } else if (cleanDefinition) {
    pieces.push(`${name}: ${cleanDefinition}`);
  } else {
    pieces.push(`${name} is annotated as ${type}`);
  }
  if (records.length > 1 && ontology?.id) {
    pieces.push(`This summary aggregates ${fmt(records.length)} PSFD record${records.length === 1 ? "" : "s"} from ${fmt(papers.length)} paper${papers.length === 1 ? "" : "s"} that share ${ontology.id}`);
  }
  if (mechanismStatements.length) {
    pieces.push(`The clearest PSFD evidence is ${mechanismStatements.join("; ")}`);
  } else {
    pieces.push(`PSFD has ${fmt(relations.length)} extracted relation${relations.length === 1 ? "" : "s"}, but no direct mechanistic relation was extracted for this entity`);
  }
  if (contextNames.length) pieces.push(`Study contexts include ${contextNames.join(", ")}`);
  return `${pieces.map((piece) => String(piece).replace(/[\s.]+$/g, "")).join(". ")}.`;
}

function annotationOntologySummary(entity, ids, concept = null) {
  const profile = entity.gene_protein_normalization || {};
  const compound = entity.compound_classification || {};
  const phytozome = asArray(profile.phytozome_ids)[0] || {};
  const accession = asArray(profile.fasta_accessions)[0] || {};
  const family = asArray(profile.family_ids)[0] || {};
  const databaseId = asArray(profile.database_ids)[0] || {};
  const chebi = compound.chebi || {};
  const pubchem = compound.pubchem || {};
  const id = ids[0] || chebi.id || (pubchem.cid ? `PubChem:${pubchem.cid}` : "") || "";
  const title = [
    concept?.label,
    entity.selected_label,
    chebi.name,
    phytozome.gene_id,
    accession.gene_name,
    accession.protein_name,
    accession.accession,
    family.name,
    databaseId.ontology_id,
    entity.normalized_label,
  ].map((value) => String(value || "").trim()).find(Boolean);
  if (!id && !title && !entity.ontology) return null;
  const conceptDescription = stripInlineHtml(concept?.description);
  const selectedDescription = stripInlineHtml(entity.selected_description);
  const fallback = conciseEntityDefinition(entity);
  const description = conceptDescription
    || (selectedDescription && !looksLikeEvidenceSentence(selectedDescription)
      ? selectedDescription
      : fallback);
  return {
    id,
    title: title || id || entity.ontology,
    source: id ? ontologySourceLabel(id) : clean(entity.ontology || "ontology"),
    description: description && description !== title ? description : "",
  };
}

function stripInlineHtml(value) {
  return String(value || "").replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
}

function annotationFactRows(entity, ids, evidenceCount, mechanisms, contexts, profile, compound, records = []) {
  const papers = uniqueStrings(records.map((record) => record.pmcid).filter(Boolean));
  const rows = [
    ["Category", clean(entity.type || entity.entity_type || "entity")],
    ["Same ontology records", records.length > 1 ? `${fmt(records.length)} in ${fmt(papers.length)} papers` : "1 record"],
    ["Evidence statements", fmt(mechanisms.length)],
    ["Contexts", fmt(contexts.length)],
    ["Evidence", `${fmt(evidenceCount)} relation${evidenceCount === 1 ? "" : "s"}`],
  ];
  const phytozome = asArray(profile.phytozome_ids)[0] || {};
  const accession = asArray(profile.fasta_accessions)[0] || {};
  const chebi = compound.chebi || {};
  const pubchem = compound.pubchem || {};
  if (phytozome.gene_id) rows.push(["Resolved as", phytozome.gene_id]);
  else if (accession.accession) rows.push(["Resolved as", accession.accession]);
  else if (chebi.id) rows.push(["Resolved as", chebi.id]);
  else if (pubchem.cid) rows.push(["Resolved as", `PubChem:${pubchem.cid}`]);
  else if (ids[0]) rows.push(["Resolved as", ids[0]]);
  return rows;
}

function annotationMechanismRows(entity, relations) {
  return annotationMechanismRowsForEntities([entity], relations);
}

function annotationMechanismRowsForEntities(entities, relations) {
  const entityIds = new Set(entities.map((item) => item.id).filter(Boolean));
  return relations
    .map((rel) => {
      const subject = state.globalPathIndexes?.entityById?.get(rel.subject_entity_id);
      const object = state.globalPathIndexes?.entityById?.get(rel.object_entity_id);
      const selectedIsSubject = entityIds.has(rel.subject_entity_id);
      const selectedIsObject = entityIds.has(rel.object_entity_id);
      if (!selectedIsSubject && !selectedIsObject) return null;
      const subjectLabel = subject ? pathEntityName(subject) : rel.subject || "subject";
      const objectLabel = object ? pathEntityName(object) : rel.object || "object";
      const predicate = clean(rel.predicate || rel.predicate_class || "relates to");
      const other = selectedIsSubject && !selectedIsObject ? object : selectedIsObject && !selectedIsSubject ? subject : object || subject;
      const contexts = annotationSortedContexts(annotationRelationContextEntities(rel));
      const evidenceId = asArray(rel.evidence_sentence_ids)[0] || "";
      const evidence = shortText(rel.evidence_preview || evidenceId || "", 360);
      const kind = annotationMechanismKind(rel, other);
      const triple = rel.triple || `${subjectLabel} ${predicate} ${objectLabel}`;
      return {
        id: rel.id,
        pmcid: rel.pmcid,
        kind,
        rank: annotationMechanismRank(kind),
        statement: shortText(`${subjectLabel} ${predicate} ${objectLabel}`, 170),
        triple,
        contextSummary: contexts.length
          ? `Context: ${contexts.slice(0, 4).map((context) => context.label).join(", ")}${contexts.length > 4 ? `, +${fmt(contexts.length - 4)} more` : ""}`
          : "",
        provenance: [`Triple: ${triple}`, rel.pmcid, evidenceId].filter(Boolean).join(" | "),
        evidence,
        color: colorForEntity(other?.type || other?.entity_type || entities[0]?.type || entities[0]?.entity_type),
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.rank - b.rank || b.evidence.length - a.evidence.length || a.statement.localeCompare(b.statement));
}

function annotationMechanismKind(rel, other) {
  const text = `${rel.predicate_class || ""} ${rel.predicate || ""} ${other?.type || other?.entity_type || ""}`;
  if (isTraitLikeEntity(other) || /trait|phenotype|physiolog|tolerance|resistance/i.test(text)) return "Trait or phenotype";
  if (/gene expression|abundance|regulat|transcription|protein/i.test(text)) return "Regulation";
  if (/metabol|biosynthesis|compound|chemical/i.test(text)) return "Metabolism";
  if (/stress|condition|exposure|treatment/i.test(text)) return "Stress response";
  if (/locali[sz]ation|cellular component/i.test(text)) return "Localization";
  if (/molecular|activity|function/i.test(text)) return "Molecular function";
  return "Relation evidence";
}

function annotationMechanismRank(kind) {
  const order = {
    "Trait or phenotype": 0,
    "Regulation": 1,
    "Metabolism": 2,
    "Stress response": 3,
    "Molecular function": 4,
    "Localization": 5,
    "Relation evidence": 6,
  };
  return order[kind] ?? 9;
}

function annotationTraitRows(entity, relations) {
  const byTrait = new Map();
  relations.forEach((rel) => {
    const subject = state.globalPathIndexes?.entityById?.get(rel.subject_entity_id);
    const object = state.globalPathIndexes?.entityById?.get(rel.object_entity_id);
    const candidates = [subject, object].filter((item) => item && item.id !== entity.id);
    let trait = candidates.find(isTraitLikeEntity);
    if (!trait && isTraitRelation(rel)) trait = candidates[0];
    if (!trait) return;
    if (!byTrait.has(trait.id)) {
      byTrait.set(trait.id, {
        id: trait.id,
        pmcid: trait.pmcid,
        label: pathEntityName(trait),
        type: clean(trait.type || trait.entity_type || "trait"),
        color: colorForEntity(trait.type || trait.entity_type),
        count: 0,
        predicates: new Map(),
        contexts: new Map(),
        evidence: new Set(),
      });
    }
    const row = byTrait.get(trait.id);
    row.count += 1;
    const predicate = clean(rel.predicate_class || rel.predicate || "relation");
    row.predicates.set(predicate, (row.predicates.get(predicate) || 0) + 1);
    asArray(rel.evidence_sentence_ids).forEach((id) => row.evidence.add(id));
    annotationRelationContextEntities(rel).forEach((context) => {
      const contextKey = context.mergeKey || context.id;
      if (!row.contexts.has(contextKey)) row.contexts.set(contextKey, { ...context, count: 0 });
      row.contexts.get(contextKey).count += 1;
    });
  });
  return Array.from(byTrait.values())
    .map((row) => {
      const predicates = Array.from(row.predicates.entries()).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
      const contexts = Array.from(row.contexts.values()).sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
      return {
        ...row,
        predicateSummary: predicates.slice(0, 2).map(([label, count]) => `${label}${count > 1 ? ` (${count})` : ""}`).join(", ") || `${fmt(row.count)} relation${row.count === 1 ? "" : "s"}`,
        contextSummary: contexts.slice(0, 4).map((item) => item.label).join(", "),
      };
    })
    .sort((a, b) => b.count - a.count || b.evidence.size - a.evidence.size || a.label.localeCompare(b.label));
}

function annotationContextRows(relations) {
  const byContext = new Map();
  relations.forEach((rel) => {
    annotationRelationContextEntities(rel).forEach((context) => {
      const contextKey = context.mergeKey || context.id;
      if (!byContext.has(contextKey)) byContext.set(contextKey, { ...context, count: 0 });
      byContext.get(contextKey).count += 1;
    });
  });
  return Array.from(byContext.values())
    .sort((a, b) => annotationContextPriority(a.type) - annotationContextPriority(b.type) || b.count - a.count || a.label.localeCompare(b.label));
}

function annotationSortedContexts(contexts) {
  return asArray(contexts)
    .slice()
    .sort((a, b) => annotationContextPriority(a.type) - annotationContextPriority(b.type) || a.label.localeCompare(b.label));
}

function annotationContextPriority(type) {
  const cleaned = String(type || "").toLowerCase();
  const priority = {
    "experimental condition": 0,
    "condition parameter": 1,
    "genetic perturbation": 2,
    "genotype": 3,
    "taxon": 4,
    "anatomical structure": 5,
    "cellular component": 6,
    "developmental stage": 7,
    "assay method": 8,
  };
  return priority[cleaned] ?? 9;
}

function annotationRelationContextEntities(rel) {
  return mergeContextEntitiesByOntology(asArray(rel.context_entity_ids)
    .map((id) => state.globalPathIndexes?.entityById?.get(id))
    .filter(Boolean)
    .filter(isUsefulAnnotationContext))
    .map((entity) => ({
      id: entityStableId(entity),
      mergeKey: contextEntityMergeKey(entity),
      memberIds: contextEntityMemberIds(entity),
      pmcid: entity.pmcid,
      label: pathEntityName(entity),
      type: clean(entity.type || entity.entity_type || "context"),
      ontologyId: annotationOntologyIds(entity)[0] || "",
      ontologyLabel: entity.selected_label || "",
      color: colorForEntity(entity.type || entity.entity_type),
      mergeCount: Number(entity.context_merge_count || 0),
      aliases: asArray(entity.aliases),
    }));
}

function relationHasEndpoint(rel, entityId) {
  return relationGlobalSubjectIds(rel).includes(entityId) || relationGlobalObjectIds(rel).includes(entityId);
}

function isTraitRelation(rel) {
  return /trait|phenotype|function|physiolog|molecular/i.test(`${rel.predicate_class || ""} ${rel.predicate || ""}`);
}

function isTraitLikeEntity(entity) {
  const type = String(entity?.type || entity?.entity_type || "");
  return new Set([
    "plant_trait",
    "molecular_trait_or_function",
    "phenotype",
    "pathway_or_process",
  ]).has(type);
}

function isUsefulAnnotationContext(entity) {
  const type = String(entity?.type || entity?.entity_type || "");
  return new Set([
    "experimental_condition",
    "condition_parameter",
    "genotype",
    "genetic_perturbation",
    "taxon",
    "anatomical_structure",
    "cellular_component",
    "developmental_stage",
    "assay_method",
  ]).has(type);
}

function conciseEntityDefinition(entity) {
  const profile = entity.gene_protein_normalization || {};
  const compound = entity.compound_classification || {};
  const phytozome = asArray(profile.phytozome_ids)[0] || {};
  const accession = asArray(profile.fasta_accessions)[0] || {};
  const family = asArray(profile.family_ids)[0] || {};
  const np = compound.npclassifier || {};
  const cf = compound.classyfire || {};
  const selected = String(entity.selected_description || "").replace(/\s+/g, " ").trim();
  if (selected && selected.length < 260 && !looksLikeEvidenceSentence(selected)) return selected;
  if (phytozome.gene_id) {
    return [phytozome.gene_id, phytozome.route_label || phytozome.code, phytozome.sequence_length ? `${phytozome.sequence_length} aa sequence` : ""]
      .filter(Boolean)
      .join("; ");
  }
  if (accession.accession) return [accession.accession, accession.gene_name || accession.protein_name].filter(Boolean).join("; ");
  if (family.name || family.ontology_id) return [family.name, family.ontology_id].filter(Boolean).join("; ");
  if (np.pathway || np.superclass || np.class) return [np.pathway, np.superclass, np.class].filter(Boolean).join("; ");
  if (cf.superclass || cf.class || cf.direct_parent) return [cf.superclass, cf.class, cf.direct_parent].filter(Boolean).join("; ");
  if (entity.selected_label || entity.normalized_label) return clean(entity.selected_label || entity.normalized_label);
  return "";
}

function looksLikeEvidenceSentence(text) {
  const cleaned = String(text || "").trim();
  if (cleaned.length > 320) return true;
  return /(observed|showed|demonstrated|we report|our study|in contrast|notably|figure|table|plants?|stress)/i.test(cleaned) && cleaned.length > 140;
}

function annotationIdentityRows(entity, ids) {
  return [
    ["Matched name", pathEntityName(entity), { action: "select-global", kind: "entity", id: entity.id, pmcid: entity.pmcid }],
    ["Entity type", clean(entity.type || entity.entity_type || "entity")],
    ["Best ID", ids[0] || "unmapped", ids[0] ? { search: ids[0], tab: "entities" } : null],
    ["Normalized label", entity.selected_label || entity.normalized_label || "-"],
    ["Paper", entity.pmcid || "-"],
  ];
}

function annotationMetadataRows(entity, profile, compound) {
  const rows = [];
  const phytozome = asArray(profile.phytozome_ids)[0] || {};
  const accession = asArray(profile.fasta_accessions)[0] || {};
  const family = asArray(profile.family_ids)[0] || {};
  const databaseIds = asArray(profile.database_ids);
  const chebi = compound.chebi || {};
  const pubchem = compound.pubchem || {};
  const cf = compound.classyfire || {};
  const np = compound.npclassifier || {};
  if (phytozome.gene_id) rows.push(["Phytozome", [phytozome.gene_id, phytozome.sequence_length ? `${phytozome.sequence_length} aa` : ""].filter(Boolean).join(" | ")]);
  if (accession.accession) rows.push(["UniProt", [accession.accession, accession.gene_name || accession.protein_name].filter(Boolean).join(" | ")]);
  if (family.ontology_id) rows.push(["Family/domain", [family.name, family.ontology_id].filter(Boolean).join(" | ")]);
  if (databaseIds.length) rows.push(["Gene IDs", databaseIds.slice(0, 3).map((item) => item.ontology_id).join(" | ")]);
  if (chebi.id || pubchem.cid) rows.push(["Chemical IDs", [chebi.id, pubchem.cid ? `PubChem:${pubchem.cid}` : ""].filter(Boolean).join(" | ")]);
  if (chebi.formula) rows.push(["Formula", chebi.formula]);
  if (np.class || cf.class) rows.push(["Compound class", [np.pathway, np.superclass || cf.superclass, np.class || cf.class].filter(Boolean).join(" | ")]);
  if (!rows.length && entity.selected_label) rows.push(["Ontology label", entity.selected_label]);
  return rows;
}

function annotationNeighborRows(entity, relations) {
  const byId = new Map();
  function add(id, rel) {
    if (!id || id === entity.id) return;
    const neighbor = state.globalPathIndexes?.entityById?.get(id);
    if (!neighbor) return;
    if (!byId.has(id)) byId.set(id, { entity: neighbor, count: 0, predicates: new Set() });
    const row = byId.get(id);
    row.count += 1;
    if (rel.predicate_class || rel.predicate) row.predicates.add(clean(rel.predicate_class || rel.predicate));
  }
  relations.forEach((rel) => {
    relationGlobalSubjectIds(rel).forEach((id) => add(id, rel));
    relationGlobalObjectIds(rel).forEach((id) => add(id, rel));
    asArray(rel.context_entity_ids).forEach((id) => add(id, rel));
  });
  return Array.from(byId.values())
    .sort((a, b) => b.count - a.count || pathEntityName(a.entity).localeCompare(pathEntityName(b.entity)))
    .slice(0, 8)
    .map((row) => ({
      label: pathEntityName(row.entity),
      count: row.count,
      detail: `${clean(row.entity.type || "entity")} | ${fmt(row.count)} relation${row.count === 1 ? "" : "s"}${row.predicates.size ? ` | ${Array.from(row.predicates).slice(0, 2).join(", ")}` : ""}`,
      action: "select-global",
      kind: "entity",
      id: row.entity.id,
      pmcid: row.entity.pmcid,
    }));
}

function annotationBridgeRows(entity, ids) {
  return ids
    .map((id) => state.globalPathIndexes?.conceptById?.get(id))
    .filter(Boolean)
    .filter((concept) => asArray(concept.entity_ids).length > 1 || asArray(concept.papers).length > 1)
    .sort((a, b) => asArray(b.papers).length - asArray(a.papers).length || asArray(b.entity_ids).length - asArray(a.entity_ids).length)
    .slice(0, 6)
    .map((concept) => ({
      label: concept.label || concept.id,
      count: asArray(concept.entity_ids).length,
      detail: `${concept.id} | ${fmt(asArray(concept.entity_ids).length)} entities | ${fmt(asArray(concept.papers).length)} papers`,
      search: concept.id,
      tab: "entities",
    }));
}

function renderAlternateMatches(row) {
  const matches = asArray(row.matches).filter((entity) => entity?.id && entity.id !== row.entity?.id).slice(0, 4);
  if (!matches.length) return "";
  return `
    <section class="annotation-alternates">
      <h5>Other possible matches</h5>
      <div>
        ${matches.map((entity) => `
          <button class="alternate-match" type="button" data-action="select-global" data-kind="entity" data-id="${esc(entity.id)}" data-pmcid="${esc(entity.pmcid)}" style="--entity-color:${esc(colorForEntity(entity.type || entity.entity_type))}">
            <strong>${esc(pathEntityName(entity))}</strong>
            <span>${esc([entity.pmcid, clean(entity.type || entity.entity_type || "entity")].filter(Boolean).join(" | "))}</span>
          </button>
        `).join("")}
      </div>
    </section>
  `;
}

function annotationFastaButton(entity, profile) {
  const phytozome = asArray(profile.phytozome_ids).find((item) => item.sequence) || {};
  if (phytozome.gene_id && phytozome.sequence) {
    return `<button class="mini-button primary-action" type="button" data-action="download-phytozome-fasta" data-id="${esc(entity.id)}" data-gene-id="${esc(phytozome.gene_id)}">Download FASTA</button>`;
  }
  const accession = asArray(profile.fasta_accessions)[0]?.accession || "";
  if (accession) {
    return `<button class="mini-button primary-action" type="button" data-action="download-fasta" data-id="${esc(entity.id)}" data-accession="${esc(accession)}">Download FASTA</button>`;
  }
  return "";
}

function topCountRows(values, limit = 6) {
  const counts = new Map();
  values.filter(Boolean).forEach((value) => {
    counts.set(value, (counts.get(value) || 0) + 1);
  });
  return Array.from(counts.entries())
    .map(([label, count]) => ({ label, count, detail: `${fmt(count)} evidence item${count === 1 ? "" : "s"}` }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))
    .slice(0, limit);
}

function annotationEntitySummary(entity) {
  const compound = entity.compound_classification || {};
  const cf = compound.classyfire || {};
  const np = compound.npclassifier || {};
  if (np.class || np.superclass || np.pathway) return [np.pathway, np.superclass, np.class].filter(Boolean).slice(0, 3).join(" | ");
  if (cf.class || cf.superclass) return [cf.superclass, cf.class, cf.direct_parent].filter(Boolean).slice(0, 3).join(" | ");
  const profile = entity.gene_protein_normalization || {};
  const family = asArray(profile.family_ids)[0] || {};
  if (family.name || family.ontology_id) return [family.name, family.ontology_id].filter(Boolean).join(" | ");
  const phytozome = asArray(profile.phytozome_ids)[0] || {};
  if (phytozome.gene_id) return [phytozome.gene_id, phytozome.route_label || phytozome.code].filter(Boolean).join(" | ");
  const accession = asArray(profile.fasta_accessions)[0] || {};
  if (accession.accession) return [accession.accession, accession.gene_name, accession.protein_name].filter(Boolean).join(" | ");
  const databaseId = asArray(profile.database_ids)[0] || {};
  if (databaseId.ontology_id) return [databaseId.ontology_id, databaseId.database].filter(Boolean).join(" | ");
  return entity.selected_label || entity.normalized_label || clean(entity.type || entity.entity_type || "entity");
}

function annotationDataFlags(entity) {
  const flags = [];
  const profile = entity.gene_protein_normalization || {};
  const compound = entity.compound_classification || {};
  if (asArray(profile.fasta_accessions).length || asArray(profile.phytozome_ids).some((item) => item.sequence)) flags.push("FASTA");
  if (asArray(profile.database_ids).length) flags.push("gene IDs");
  if (asArray(profile.family_ids).length) flags.push("family/domain");
  if (compound.classification_status) flags.push("compound class");
  if ((compound.pubchem || {}).cid) flags.push("PubChem");
  if ((compound.chebi || {}).id) flags.push("ChEBI");
  return uniqueStrings(flags);
}

function renderEnrichmentPanel() {
  if (!state.annotationResults.length) {
    return `<div class="annotation-empty">Batch overview appears after annotating a submitted list.</div>`;
  }
  const matchedRows = annotationRows().filter((row) => row.entity);
  if (!matchedRows.length) {
    return `<div class="annotation-empty">No matched entities to summarize.</div>`;
  }
  if (matchedRows.length < 2) {
    return `<div class="annotation-empty">Submit at least two matched genes, proteins, or compounds to summarize shared traits, contexts, and metadata across the list.</div>`;
  }
  if (!state.annotationEnrichment.length) {
    return `<div class="annotation-empty">No shared traits or contexts were detected for the matched list.</div>`;
  }
  const groups = groupSignalRows(state.annotationEnrichment);
  return `
    <div class="research-signal-grid">
      ${groups.map((group) => `
        <section class="research-signal-group">
          <div class="research-signal-head">
            <h5>${esc(group.category)}</h5>
            <span>${fmt(group.rows.length)} signal${group.rows.length === 1 ? "" : "s"}</span>
          </div>
          ${group.rows.slice(0, 6).map(researchSignalCard).join("")}
        </section>
      `).join("")}
    </div>
  `;
}

function researchSignalCard(term) {
  const attrs = term.target_id
    ? `type="button" data-action="select-global" data-kind="${esc(term.target_kind || "entity")}" data-id="${esc(term.target_id)}" data-pmcid="${esc(term.target_pmcid || "")}"`
    : "";
  const tag = term.target_id ? "button" : "div";
  return `
    <${tag} class="research-signal-card ${term.target_id ? "" : "inert"}" ${attrs}>
      <div>
        <strong>${esc(term.label)}</strong>
        <span>${esc(term.detail || "")}</span>
      </div>
      <div class="research-signal-score">
        <strong>${fmt(term.count)}</strong>
        <span>${esc(term.unit || "hits")}</span>
      </div>
      ${term.entities?.length ? `<small>${esc(term.entities.slice(0, 4).join(", "))}${term.entities.length > 4 ? ` +${term.entities.length - 4}` : ""}</small>` : ""}
    </${tag}>
  `;
}

function groupSignalRows(rows) {
  const order = ["Trait signals", "Context signals", "Coverage", "Metadata"];
  const byCategory = new Map();
  rows.forEach((row) => {
    if (!byCategory.has(row.category)) byCategory.set(row.category, []);
    byCategory.get(row.category).push(row);
  });
  return Array.from(byCategory.entries())
    .map(([category, groupRows]) => ({
      category,
      rows: groupRows.sort((a, b) => b.count - a.count || a.label.localeCompare(b.label)),
    }))
    .sort((a, b) => {
      const rankA = order.includes(a.category) ? order.indexOf(a.category) : order.length;
      const rankB = order.includes(b.category) ? order.indexOf(b.category) : order.length;
      return rankA - rankB || a.category.localeCompare(b.category);
    });
}

function annotationExampleButton(label, value) {
  return `
    <button class="annotation-example" type="button" data-action="set-annotation-example" data-example="${esc(value)}">
      ${esc(label)}
    </button>
  `;
}

function annotationCategoryOptions() {
  return annotationCategories().map((item) => (
    `<option value="${esc(item.id)}" ${state.annotationCategory === item.id ? "selected" : ""}>${esc(item.label)}</option>`
  )).join("");
}

function annotationCategories() {
  return [
    { id: "auto", label: "Best match", help: "Ranks the most likely biology first, while keeping alternate category matches visible." },
    { id: "compound", label: "Compounds", types: ["compound"], help: "Use for metabolites, hormones, chemical names, ChEBI IDs, or PubChem IDs." },
    { id: "gene_protein", label: "Genes/proteins", types: ["gene_protein", "gene", "protein"], help: "Use for gene symbols, protein names, Phytozome IDs, UniProt IDs, or family/domain IDs." },
    { id: "pathway_or_process", label: "Pathways/processes", types: ["pathway_or_process"], help: "Use for signaling, biosynthesis, metabolism, and biological process terms." },
    { id: "experimental_condition", label: "Conditions/treatments", types: ["experimental_condition"], help: "Use when the query means an exposure, treatment, stress, dose, or experimental condition." },
    { id: "trait_function", label: "Traits/functions", types: ["plant_trait", "molecular_trait_or_function", "phenotype"], help: "Use for measured traits, molecular functions, phenotypes, or physiological readouts." },
    { id: "anatomy", label: "Anatomy/cell/tissue", types: ["anatomical_structure", "anatomical_part", "cellular_component", "developmental_stage"], help: "Use for organs, tissues, cell compartments, or developmental stages." },
    { id: "context", label: "Genotype/context", types: ["genotype", "genetic_perturbation", "regulatory_motif"], help: "Use for knockouts, overexpression, mutants, motifs, and other experimental context entities." },
    { id: "taxon", label: "Organisms", types: ["taxon"], help: "Use for species, cultivars, or broader taxonomic terms." },
    { id: "assay", label: "Assays/measurements", types: ["assay_method", "assay_or_measurement"], help: "Use for instruments, assays, protocols, or measurement systems." },
  ];
}

function annotationCategoryLabel(category) {
  return annotationCategories().find((item) => item.id === category)?.label || "Best match";
}

function annotationCategoryHelpText() {
  return annotationCategories().find((item) => item.id === state.annotationCategory)?.help || "";
}

function bindAnnotationWorkspaceHandlers() {
  const input = document.getElementById("annotationInput");
  if (input) {
    ["pointerdown", "mousedown", "click", "dblclick", "keydown", "keyup", "beforeinput", "compositionstart", "compositionend"].forEach((eventName) => {
      input.addEventListener(eventName, (event) => {
        event.stopPropagation();
        state.annotationEditing = true;
      });
    });
    input.addEventListener("focus", () => {
      state.annotationEditing = true;
    });
    input.addEventListener("blur", () => {
      state.annotationEditing = false;
      state.annotationInput = input.value;
    });
    input.addEventListener("input", (event) => {
      event.stopPropagation();
      state.annotationInput = input.value;
    });
    input.addEventListener("paste", (event) => {
      event.stopPropagation();
      setTimeout(() => {
        state.annotationInput = input.value;
      }, 0);
    });
  }

  bindRelationTextInput("relationCompoundInput", "relationCompoundInput");
  bindRelationTextInput("relationFastaInput", "relationFastaInput");

  document.querySelectorAll("[data-relation-attribute]").forEach((checkbox) => {
    checkbox.addEventListener("change", (event) => {
      event.stopPropagation();
      state.relationAttributeFilters[checkbox.getAttribute("data-relation-attribute")] = checkbox.checked;
      render();
    });
  });

  const category = document.getElementById("annotationCategory");
  if (category) {
    category.addEventListener("change", async () => {
      state.annotationCategory = category.value || "auto";
      state.annotationStatus = state.annotationResults.length
        ? `Category changed to ${annotationCategoryLabel(state.annotationCategory)}. Updating annotations...`
        : `Category set to ${annotationCategoryLabel(state.annotationCategory)}. Click Annotate when your list is ready.`;
      if (state.annotationResults.length && String(state.annotationInput || "").trim()) {
        await runAnnotationLookup();
      } else {
        render();
      }
    });
  }

  // Annotation click controls are handled by the delegated global router.
}

function bindRelationTextInput(id, stateKey) {
  const input = document.getElementById(id);
  if (!input) return;
  ["pointerdown", "mousedown", "click", "dblclick", "keydown", "keyup", "beforeinput", "compositionstart", "compositionend"].forEach((eventName) => {
    input.addEventListener(eventName, (event) => {
      event.stopPropagation();
    });
  });
  input.addEventListener("blur", () => {
    state[stateKey] = input.value;
  });
  input.addEventListener("input", (event) => {
    event.stopPropagation();
    state[stateKey] = input.value;
  });
  input.addEventListener("paste", (event) => {
    event.stopPropagation();
    setTimeout(() => {
      state[stateKey] = input.value;
    }, 0);
  });
}

async function openAnnotationSearch(query, tab = "entities", pmcid = "") {
  if (pmcid && pmcid !== state.paper) {
    await loadPaper(pmcid, { preservePath: true });
  }
  state.tab = tab || "entities";
  state.query = query || "";
  state.listPage = 0;
  state.pathResults = [];
  if (state.tab === "entities" && !pmcid) state.entityScope = "all";
  if (els.searchInput) els.searchInput.value = state.query;
  render();
}

function discoveryEntityOptions() {
  return state.globalPathIndex.entities
    .slice()
    .sort((a, b) => pathEntityName(a).localeCompare(pathEntityName(b)))
    .map((entity) => {
      const ontologyIds = entityOntologyIds(entity);
      const ontology = ontologyIds.length ? ` | ${ontologyIds.slice(0, 2).join(", ")}` : "";
      return `<option value="${esc(pathEntityName(entity))} | ${esc(entity.pmcid)}${esc(ontology)} [${esc(entity.id)}]"></option>`;
    })
    .join("");
}

function discoverLensOptions() {
  return discoveryLenses().map((item) => (
    `<option value="${esc(item.id)}" ${state.discoverLens === item.id ? "selected" : ""}>${esc(item.label)}</option>`
  )).join("");
}

function discoveryLenses() {
  return [
    { id: "all", label: "All biology" },
    { id: "stress", label: "Stress response" },
    { id: "compound", label: "Compound biosynthesis" },
    { id: "gene", label: "Gene regulation" },
    { id: "phenotype", label: "Phenotype outcome" }
  ];
}

function discoverLensLabel(lens) {
  return discoveryLenses().find((item) => item.id === lens)?.label || "All biology";
}

function renderLensCatalog() {
  const entities = state.globalPathIndex.entities
    .filter((entity) => entityMatchesLens(entity, state.discoverLens))
    .sort((a, b) => entityEvidenceWeight(b) - entityEvidenceWeight(a) || pathEntityName(a).localeCompare(pathEntityName(b)))
    .slice(0, 8);
  if (!entities.length) {
    return `<div class="compact-card muted">No entities match the current biological lens.</div>`;
  }
  return `
    <div class="lens-catalog">
      ${entities.map((entity) => `
        <article class="lens-card">
          <div>
            <strong>${esc(pathEntityName(entity))}</strong>
            <span>${esc([entity.pmcid, clean(entity.type), entityOntologyIds(entity).slice(0, 2).join(", ")].filter(Boolean).join(" | "))}</span>
          </div>
          <div class="click-row">
            <button class="mini-button" type="button" data-action="path-start" data-id="${esc(entity.id)}">Start</button>
            <button class="mini-button" type="button" data-action="path-end" data-id="${esc(entity.id)}">End</button>
            <button class="mini-button" type="button" data-action="select-global" data-kind="entity" data-id="${esc(entity.id)}" data-pmcid="${esc(entity.pmcid)}">Open</button>
          </div>
        </article>
      `).join("")}
    </div>
  `;
}

function entityMatchesLens(entity, lens) {
  if (lens === "all") return true;
  const text = globalEntitySearchText(entity);
  const type = String(entity.type || "").toLowerCase();
  if (lens === "compound") {
    return type.includes("compound") || /metabol|biosynth|pathway|chebi|pubchem|classyfire|npclassifier/.test(text);
  }
  if (lens === "gene") {
    return /gene|protein|uniprot|phytozome|expression|transcription|enzyme|regulat/.test(text);
  }
  if (lens === "phenotype") {
    return /phenotype|trait|yield|growth|tolerance|resistance|closure|quality/.test(text);
  }
  if (lens === "stress") {
    return /stress|drought|heat|cold|salt|water|temperature|abiotic|response/.test(text);
  }
  return true;
}

function entityEvidenceWeight(entity) {
  return Number(entity.relation_count || 0) * 3 + Number(entity.event_count || 0) * 2 + (entityOntologyIds(entity).length ? 4 : 0);
}

function isLowSignalDiscoveryEntity(entity) {
  if (!entity) return false;
  const type = String(entity.type || entity.entity_type || "").trim();
  const ontology = String(entity.ontology || entity.selected_ontology || "").trim();
  const ontologyIds = entityOntologyIds(entity);
  const label = [pathEntityName(entity), entity.selected_label, entity.normalized_label].filter(Boolean).join(" ");
  if (discoveryLowSignalTypes.has(type)) return true;
  if (discoveryLowSignalOntologies.has(ontology)) return true;
  if (ontologyIds.some((id) => /^(UO|NCBITaxon):/i.test(String(id || "")))) return true;
  return lowSignalLabelPattern.test(label);
}

function isLowSignalDiscoveryConcept(concept) {
  if (!concept) return false;
  const ontology = String(concept.ontology || "").trim();
  const typeKeys = Object.keys(concept.types || {});
  if (discoveryLowSignalOntologies.has(ontology)) return true;
  if (/^(UO|NCBITaxon):/i.test(String(concept.id || ""))) return true;
  if (typeKeys.length && typeKeys.every((type) => discoveryLowSignalTypes.has(type))) return true;
  return lowSignalLabelPattern.test([concept.label, concept.description].filter(Boolean).join(" "));
}

async function setDiscoverEndpoint(which, id) {
  await loadGlobalPathIndex();
  const entity = pathEntityById(id) || state.indexes.entityById.get(id);
  if (!entity) return;
  return setPathEndpoint(which, id);
}

async function runHypothesisSearch() {
  await loadGlobalPathIndex();
  const start = resolveGlobalEntityQuery(state.discoverStart) || state.discoverStartId;
  const end = resolveGlobalEntityQuery(state.discoverEnd) || state.discoverEndId;
  state.discoverStartId = start || "";
  state.discoverEndId = end || "";
  state.discoverStatus = "";
  if (!start || !end) {
    state.discoverResults = [];
    state.discoverStatus = "Choose two valid entities or ontology IDs.";
    render();
    return;
  }
  const paths = findPaths(start, end, Number(state.discoverMaxEdges || 5), discoveryPathOptions(), 40);
  state.discoverResults = rankHypothesisPaths(paths, state.discoverLens).slice(0, 12);
  if (!state.discoverResults.length) {
    state.discoverStatus = paths.length
      ? "Only context/unit metadata bridges were found, so they were filtered out."
      : "No biologically meaningful hypothesis paths found with the current depth.";
  } else if (paths.length > state.discoverResults.length) {
    state.discoverStatus = `${fmt(paths.length - state.discoverResults.length)} weak context or metadata paths filtered.`;
  }
  render();
}

function discoveryPathOptions() {
  return {
    pathUseRelations: true,
    pathUseHyperedges: true,
    pathUseDependencies: true,
    pathUseOntologyBridges: true,
    pathUseContext: false,
    pathIncludeHypothesis: true,
    pathIncludeRejected: false,
    discoveryMode: true
  };
}

function rankHypothesisPaths(paths, lens) {
  return paths
    .filter(isMeaningfulHypothesisPath)
    .map((path) => ({ ...path, hypothesis: analyzeHypothesisPath(path, lens) }))
    .sort((a, b) => b.hypothesis.score - a.hypothesis.score || a.edges.length - b.edges.length);
}

function isMeaningfulHypothesisPath(path) {
  if (!path?.nodes?.length || !path?.edges?.length) return false;
  if (path.edges.some((edge) => edge.kind === "context")) return false;
  const innerNodes = path.nodes.slice(1, -1);
  for (const node of innerNodes) {
    if (node.startsWith("concept:")) {
      const concept = state.globalPathIndexes.conceptById.get(node.slice("concept:".length));
      if (isLowSignalDiscoveryConcept(concept)) return false;
    }
    if (node.startsWith("entity:")) {
      const entity = state.globalPathIndexes.entityById.get(node.slice("entity:".length));
      if (isLowSignalDiscoveryEntity(entity)) return false;
    }
  }
  return true;
}

function analyzeHypothesisPath(path, lens = "all") {
  const papers = pathPaperSet(path);
  const edgeKinds = path.edges.map((edge) => edge.kind);
  const hasOntology = edgeKinds.includes("ontology") || path.nodes.some((node) => node.startsWith("concept:"));
  const hasDependency = edgeKinds.includes("dependency");
  const hasRelation = edgeKinds.includes("relation");
  const hasContext = edgeKinds.includes("context");
  const hasEvent = edgeKinds.includes("hyperedge");
  const direct = path.edges.length === 1 && hasRelation;
  const crossPaper = papers.size > 1;
  const acceptedDependencies = path.edges.filter((edge) => {
    if (edge.kind !== "dependency") return false;
    return state.globalPathIndexes.dependencyById.get(edge.id)?.tier === "accepted";
  }).length;
  const reviewDependencies = path.edges.filter((edge) => {
    if (edge.kind !== "dependency") return false;
    return isHypothesisTier(state.globalPathIndexes.dependencyById.get(edge.id)?.tier);
  }).length;
  const lensScore = pathMatchesLens(path, lens) ? 18 : 0;
  const score = Math.max(0,
    72 -
    path.edges.length * 5 +
    (direct ? 16 : 0) +
    (hasOntology ? 12 : 0) +
    (hasDependency ? 10 : 0) +
    acceptedDependencies * 7 +
    reviewDependencies * 3 +
    (crossPaper ? 10 : 0) +
    (hasEvent ? 6 : 0) +
    (hasContext ? 3 : 0) +
    lensScore
  );
  const tags = [];
  if (direct) tags.push("directly observed");
  if (!direct && path.edges.length > 1) tags.push("indirect hypothesis");
  if (crossPaper) tags.push("cross-paper bridge");
  if (hasOntology) tags.push("normalized ID bridge");
  if (hasDependency) tags.push("event dependency");
  if (hasEvent) tags.push("shared event biology");
  if (reviewDependencies) tags.push("hypothesis-tier evidence");
  if (!direct && (hasOntology || crossPaper || hasDependency)) tags.push("potential novel relation");
  return { score, tags: uniqueStrings(tags), papers: Array.from(papers), direct, crossPaper };
}

function pathMatchesLens(path, lens) {
  if (lens === "all") return true;
  const text = [
    ...path.nodes.map((node) => {
      const info = pathNodeInfo(node);
      return [info.label, info.subtitle, info.type].join(" ");
    }),
    ...path.edges.map((edge) => edgeReportText(edge))
  ].join(" ").toLowerCase();
  if (lens === "compound") return /compound|metabol|biosynth|pathway|chebi|pubchem|produces|accumulates/.test(text);
  if (lens === "gene") return /gene|protein|uniprot|phytozome|expression|transcription|enzyme|regulat|activates|repress/.test(text);
  if (lens === "phenotype") return /phenotype|trait|yield|growth|tolerance|resistance|closure|quality|outcome/.test(text);
  if (lens === "stress") return /stress|drought|heat|cold|salt|water|temperature|abiotic|response/.test(text);
  return true;
}

function renderHypothesisResults() {
  if (!state.discoverStartId || !state.discoverEndId) {
    return `<div class="compact-card muted">Choose two entities, then generate hypotheses. Normalized ontology IDs can bridge different papers even when the surface names differ.</div>`;
  }
  if (!state.discoverResults.length) {
    return `<div class="compact-card muted">No hypothesis paths yet for the current query.</div>`;
  }
  return state.discoverResults.map((path, index) => {
    const analysis = path.hypothesis || analyzeHypothesisPath(path, state.discoverLens);
    return `
      <article class="hypothesis-card">
        <div class="path-card-header">
          <div>
            <strong>Hypothesis ${index + 1}</strong>
            <span>${fmt(path.edges.length)} steps | evidence score ${fmt(Math.round(analysis.score))} | ${esc(analysis.papers.join(" -> ") || "ontology bridge")}</span>
          </div>
          <button class="mini-button" type="button" data-action="export-hypothesis" data-index="${index}">Export report</button>
        </div>
        <div class="hypothesis-tags">${badges(analysis.tags, "ontology", 8)}</div>
        ${renderPathRibbon(path)}
        <div class="hypothesis-summary">${esc(hypothesisSummary(path, analysis))}</div>
        ${renderPathNarrative(path)}
      </article>
    `;
  }).join("");
}

function hypothesisSummary(path, analysis) {
  const start = pathNodeInfo(path.nodes[0]);
  const end = pathNodeInfo(path.nodes[path.nodes.length - 1]);
  if (analysis.direct) {
    return `${start.label} and ${end.label} are directly connected by an extracted relation.`;
  }
  if (analysis.crossPaper && analysis.tags.includes("normalized ID bridge")) {
    return `${start.label} and ${end.label} connect through normalized identifiers across multiple papers, which is useful for finding non-obvious bridges.`;
  }
  if (analysis.tags.includes("event dependency")) {
    return `${start.label} and ${end.label} are connected through event-level mechanisms and dependency evidence.`;
  }
  return `${start.label} and ${end.label} are connected through an indirect evidence chain.`;
}

async function runAnnotationLookup() {
  try {
    const liveInput = document.getElementById("annotationInput");
    if (liveInput) state.annotationInput = liveInput.value;
    await loadGlobalPathIndex();
    const terms = uniqueStrings(String(state.annotationInput || "")
      .split(/[\n;,]+/)
      .map((term) => term.trim())
      .filter(Boolean));
    if (!terms.length) {
      state.annotationResults = [];
      state.annotationEnrichment = [];
      state.annotationStatus = "Paste at least one entity name or ontology ID.";
      render();
      return;
    }
    state.annotationStatus = "Annotating...";
    state.annotationResults = terms.map((term) => ({
      term,
      matches: rankedEntityMatches(term, state.annotationCategory).slice(0, 12)
    }));
    const termSet = new Set(terms);
    Object.keys(state.annotationSelectionIds).forEach((term) => {
      if (!termSet.has(term)) delete state.annotationSelectionIds[term];
    });
    state.annotationEnrichment = computeAnnotationEnrichment();
    const matched = state.annotationResults.filter((row) => row.matches.length).length;
    const category = state.annotationCategory === "auto" ? "" : ` in ${annotationCategoryLabel(state.annotationCategory)}`;
    state.annotationStatus = `${fmt(matched)} of ${fmt(terms.length)} queries matched${category}.`;
    render();
    if (typeof requestAnimationFrame === "function") {
      requestAnimationFrame(() => {
        els.mainPanel.querySelector(".annotation-output-panel")?.scrollIntoView({ block: "start", behavior: "smooth" });
      });
    }
  } catch (error) {
    console.error(error);
    state.annotationStatus = `Annotation failed: ${error.message}`;
    render();
  }
}

async function setAnnotationExample(value) {
  state.annotationInput = value;
  const liveInput = document.getElementById("annotationInput");
  if (liveInput) liveInput.value = value;
  state.annotationResults = [];
  state.annotationEnrichment = [];
  state.annotationSelectionIds = {};
  state.annotationStatus = "";
  await runAnnotationLookup();
}

function rankedEntityMatches(term, category = "auto") {
  const query = String(term || "").trim().toLowerCase();
  if (!query) return [];
  const shortQuery = query.length <= 3;
  return state.globalPathIndex.entities
    .map((entity) => {
      const name = pathEntityName(entity).toLowerCase();
      const ontology = String(entity.ontology_id || "").toLowerCase();
      const ontologyIds = asArray(entity.ontology_ids).map((id) => String(id || "").toLowerCase());
      const ontologyLocalIds = ontologyIds.map((id) => id.includes(":") ? id.split(":").slice(1).join(":") : id);
      const selected = String(entity.selected_label || "").toLowerCase();
      const search = globalEntitySearchText(entity);
      const compoundText = compoundAliasSearchText(entity);
      let score = 0;
      if (ontology === query) score += 120;
      if (ontologyIds.includes(query)) score += 120;
      if (ontologyLocalIds.includes(query)) score += 110;
      if (name === query || selected === query) score += 100;
      if (shortQuery) {
        if (textHasQueryToken([name, selected].join(" "), query)) score += 48;
        if (textHasQueryToken(search, query)) score += 24;
      } else {
        if (name.includes(query) || selected.includes(query)) score += 50;
        if (search.includes(query)) score += 30;
      }
      if (isCompoundLikeGlobalEntity(entity)) {
        if (name === query || selected === query || textHasQueryToken(compoundText, query)) score += 45;
        if (!shortQuery && compoundText.includes(query)) score += 30;
      }
      if (isChemicalExposureGlobalEntity(entity) && !querySuggestsCondition(query)) score -= 40;
      score += Math.min(20, entityEvidenceWeight(entity));
      return { entity, score };
    })
    .filter((item) => item.score > (shortQuery ? 44 : 20) && entityMatchesAnnotationCategory(item.entity, category))
    .sort((a, b) => b.score - a.score || pathEntityName(a.entity).localeCompare(pathEntityName(b.entity)))
    .map((item) => item.entity);
}

function entityMatchesAnnotationCategory(entity, category = "auto") {
  if (!category || category === "auto") return true;
  const selected = annotationCategories().find((item) => item.id === category);
  if (!selected) return true;
  const type = String(entity.type || entity.entity_type || "").toLowerCase();
  if (selected.types?.includes(type)) return true;
  if (category === "compound") return isCompoundLikeGlobalEntity(entity);
  if (category === "gene_protein") {
    return Boolean(Object.keys(entity.gene_protein_normalization || {}).length) || geneProteinOntologyIds(entity).length > 0;
  }
  return false;
}

function isCompoundLikeGlobalEntity(entity) {
  const type = String(entity.type || entity.entity_type || "").toLowerCase();
  const ids = [entity.ontology_id, ...asArray(entity.ontology_ids)].join(" ");
  return type === "compound" || Boolean(Object.keys(entity.compound_classification || {}).length) || /\b(?:CHEBI|ChEBI|PubChem):/i.test(ids);
}

function isChemicalExposureGlobalEntity(entity) {
  const type = String(entity.type || entity.entity_type || "").toLowerCase();
  if (type !== "experimental_condition") return false;
  const ontologyIds = entityOntologyIds(entity);
  const text = [
    entity.label,
    entity.selected_label,
    entity.normalized_label,
    entity.selected_description,
    ...ontologyIds,
  ].join(" ").toLowerCase();
  return ontologyIds.some((id) => /^PECO:/i.test(String(id || ""))) && /\b(exposure|treatment|treated|application|hormone|acid)\b/.test(text);
}

function querySuggestsCondition(query) {
  return /\b(exposure|treatment|treated|condition|stress|application|spray|dose|medium)\b/i.test(String(query || ""));
}

function compoundAliasSearchText(entity) {
  const compound = entity.compound_classification || {};
  const chebi = compound.chebi || {};
  const pubchem = compound.pubchem || {};
  const normalization = compound.normalization || {};
  const raw = compound.raw_fields || {};
  return [
    entity.label,
    entity.selected_label,
    entity.normalized_label,
    entity.ontology_id,
    compound.canonical_form,
    compound.aliases,
    normalization.selected_label,
    normalization.selected_ontology_id,
    chebi.id,
    chebi.name,
    pubchem.cid ? `PubChem:${pubchem.cid}` : "",
    raw.canonical_form,
    raw.aliases,
    raw.selected_label,
    raw.selected_ontology_id,
  ].join(" ").toLowerCase();
}

function textHasQueryToken(text, query) {
  const escaped = String(query || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  if (!escaped) return false;
  return new RegExp(`(^|[^a-z0-9])${escaped}([^a-z0-9]|$)`, "i").test(String(text || ""));
}

function computeAnnotationEnrichment() {
  if (!state.globalPathIndex || !state.annotationResults.length) return [];
  const selected = uniqueEntities(annotationRows().map((row) => row.entity).filter(Boolean));
  if (selected.length < 2) return [];
  const rows = [];
  const withTraits = [];
  const withContexts = [];
  const withMetadata = [];
  selected.forEach((entity) => {
    const relations = (state.globalPathIndexes?.relationsByEntity?.get(entity.id) || []).filter((rel) => relationHasEndpoint(rel, entity.id));
    const traits = annotationTraitRows(entity, relations);
    const mechanisms = annotationMechanismRows(entity, relations);
    const contexts = annotationContextRows(relations);
    if (traits.length || mechanisms.some((mechanism) => mechanism.kind === "Trait or phenotype")) withTraits.push(entity);
    if (contexts.length) withContexts.push(entity);
    if (annotationDataFlags(entity).length) withMetadata.push(entity);
    mechanisms
      .filter((mechanism) => mechanism.kind === "Trait or phenotype" || mechanism.kind === "Regulation" || mechanism.kind === "Metabolism")
      .forEach((mechanism) => {
        upsertAnnotationSignal(rows, {
          category: "Biology in list",
          label: mechanism.statement,
          count: 1,
          unit: "relations",
          detail: mechanism.contextSummary || mechanism.kind,
          entity,
          target: { id: mechanism.id, pmcid: mechanism.pmcid, label: mechanism.statement },
          targetKind: "relation",
        });
      });
    contexts.forEach((context) => {
      upsertAnnotationSignal(rows, {
        category: "Shared contexts",
        label: context.label,
        count: context.count,
        unit: "relations",
        detail: clean(context.type),
        entity,
        target: context,
      });
    });
  });

  addSignal(rows, "Coverage", "Matched entities", selected.length, `${fmt(selected.length)} submitted entities matched PSFD records.`, selected);
  addSignal(rows, "Coverage", "Entities with trait or mechanism evidence", withTraits.length, `${fmt(withTraits.length)} matched entities have direct relation evidence to traits, regulation, or metabolism.`, withTraits);
  addSignal(rows, "Coverage", "Entities with extracted context", withContexts.length, `${fmt(withContexts.length)} matched entities have relation-specific context.`, withContexts);
  if (withMetadata.length) addSignal(rows, "Metadata", "Entities with external metadata", withMetadata.length, "Sequence, ontology, compound, or classifier metadata is available.", withMetadata);

  return rows
    .filter((row) => row.count > 0 && row.label)
    .sort((a, b) => b.count - a.count || a.category.localeCompare(b.category) || a.label.localeCompare(b.label))
    .slice(0, 40);
}

function addSignal(rows, category, label, count, detail, entities = []) {
  rows.push({
    category,
    label,
    count,
    unit: "entities",
    detail,
    entities: entities.map(pathEntityName).filter(Boolean),
  });
}

function upsertAnnotationSignal(rows, item) {
  const key = `${item.category}::${item.label}`.toLowerCase();
  let row = rows.find((candidate) => candidate.key === key);
  if (!row) {
    row = {
      key,
      category: item.category,
      label: item.label,
      count: 0,
      unit: item.unit,
      detail: item.detail,
      entities: [],
      target_id: item.target?.id || "",
      target_pmcid: item.target?.pmcid || "",
      target_kind: item.targetKind || "entity",
    };
    rows.push(row);
  }
  row.count += Number(item.count || 0);
  if (item.entity) row.entities = uniqueStrings([...row.entities, pathEntityName(item.entity)]);
  if (!row.detail && item.detail) row.detail = item.detail;
}

function aggregateAnnotationSignals(rows, entities, category, collect, unit) {
  const byLabel = new Map();
  entities.forEach((entity) => {
    uniqueStrings(collect(entity).filter(Boolean)).forEach((label) => {
      if (!label) return;
      const key = label.toLowerCase();
      if (!byLabel.has(key)) byLabel.set(key, { label, count: 0, entities: new Set() });
      const row = byLabel.get(key);
      row.count += 1;
      row.entities.add(pathEntityName(entity));
    });
  });
  Array.from(byLabel.values())
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))
    .slice(0, 8)
    .forEach((row) => {
      rows.push({
        category,
        label: row.label,
        count: row.count,
        unit,
        detail: `${fmt(row.count)} ${unit}`,
        entities: Array.from(row.entities),
      });
    });
}

function uniqueEntities(entities) {
  const seen = new Set();
  return entities.filter((entity) => {
    const id = entity?.id || "";
    if (!id || seen.has(id)) return false;
    seen.add(id);
    return true;
  });
}

function termCountsForEntities(entities) {
  const counts = new Map();
  entities.forEach((entity) => {
    const seen = new Set();
    entityEnrichmentTerms(entity).forEach((term) => {
      if (!term.key || seen.has(term.key)) return;
      seen.add(term.key);
      if (!counts.has(term.key)) counts.set(term.key, { ...term, count: 0 });
      counts.get(term.key).count += 1;
    });
  });
  return counts;
}

function entityEnrichmentTerms(entity) {
  const terms = [];
  function add(category, label) {
    const cleaned = String(label || "").replace(/\s+/g, " ").trim();
    if (!cleaned || cleaned === "-") return;
    const key = `${category}::${cleaned}`.toLowerCase();
    terms.push({ key, category, label: cleaned });
  }

  add("Entity type", clean(entity.type || entity.entity_type || "entity"));
  const ontologyIds = entityOntologyIds(entity);
  ontologyIds.forEach((id) => add("Ontology source", ontologySourceLabel(id)));

  const profile = entity.gene_protein_normalization || {};
  const best = profile.best || {};
  if (profile.row_count) add("Normalization scope", clean(best.normalization_scope || best.decision || ""));
  asArray(profile.fasta_accessions).forEach(() => add("Gene database", "UniProt"));
  asArray(profile.phytozome_ids).forEach(() => add("Gene database", "Phytozome"));
  asArray(profile.database_ids).forEach((item) => add("Gene database", item.database));
  asArray(profile.family_ids).forEach((family) => {
    add("Gene family/domain", family.name || family.alias || family.ontology_id);
    add("Gene family database", family.database);
  });

  const compound = entity.compound_classification || {};
  const cf = compound.classyfire || {};
  const np = compound.npclassifier || {};
  add("NPClassifier pathway", np.pathway);
  add("Compound superclass", np.superclass || cf.superclass);
  add("Compound class", np.class || cf.class || cf.direct_parent);

  const relations = state.globalPathIndexes?.relationsByEntity?.get(entity.id) || [];
  relations.forEach((rel) => {
    add("Relation class", clean(rel.predicate_class || rel.predicate || ""));
  });
  const events = state.globalPathIndexes?.eventsByEntity?.get(entity.id) || [];
  events.forEach((event) => {
    add("Event type", clean(event.type || ""));
  });
  return terms;
}

function ontologySourceLabel(ontologyId) {
  const prefix = String(ontologyId || "").split(":", 1)[0];
  const labels = {
    UniProt: "UniProt",
    Phytozome: "Phytozome",
    PhytozomeBase: "Phytozome",
    InterPro: "InterPro",
    Pfam: "Pfam",
    RefSeq: "RefSeq",
    NCBIGene: "NCBI Gene",
    EnsemblPlants: "Ensembl Plants",
    Gramene: "Gramene",
    TAIR: "TAIR",
    CHEBI: "ChEBI",
    ChEBI: "ChEBI",
    PubChem: "PubChem"
  };
  return labels[prefix] || prefix || "unmapped";
}

function hypergeometricPValue(k, K, N, n) {
  k = Math.max(0, Number(k || 0));
  K = Math.max(0, Number(K || 0));
  N = Math.max(0, Number(N || 0));
  n = Math.max(0, Number(n || 0));
  if (!k || !K || !N || !n) return 1;
  const max = Math.min(K, n);
  const logDenominator = logChoose(N, n);
  const logs = [];
  for (let i = k; i <= max; i += 1) {
    if (n - i > N - K) continue;
    logs.push(logChoose(K, i) + logChoose(N - K, n - i) - logDenominator);
  }
  return Math.min(1, Math.exp(logSumExp(logs)));
}

function logChoose(n, k) {
  if (k < 0 || k > n) return -Infinity;
  k = Math.min(k, n - k);
  let sum = 0;
  for (let i = 1; i <= k; i += 1) {
    sum += Math.log(n - k + i) - Math.log(i);
  }
  return sum;
}

function logSumExp(values) {
  if (!values.length) return -Infinity;
  const max = Math.max(...values);
  return max + Math.log(values.reduce((sum, value) => sum + Math.exp(value - max), 0));
}

function formatFold(value) {
  if (!Number.isFinite(value)) return "inf";
  return `${value.toFixed(value >= 10 ? 0 : 1)}x`;
}

function formatPValue(value) {
  if (!Number.isFinite(value)) return "-";
  if (value < 0.001) return value.toExponential(1);
  return value.toFixed(3);
}

function exportAnnotationTable() {
  const rows = annotationRows();
  if (!rows.length) return;
  const header = [
    "input",
    "category_filter",
    "best_match",
    "type",
    "paper",
    "normalized_ids",
    "ontology_annotation",
    "summary",
    "facts",
    "metadata",
    "main_evidence",
    "contexts",
    "match_count",
  ];
  const body = rows.map((row) => {
    const profile = row.entity ? annotationEntityProfile(row.entity) : null;
    return [
      row.term,
      annotationCategoryLabel(state.annotationCategory),
      row.match,
      row.type,
      row.pmcid,
      row.normalized,
      profile?.ontology ? [profile.ontology.title, profile.ontology.id, profile.ontology.source].filter(Boolean).join(" | ") : "",
      profile?.summary || row.annotation,
      profile ? profile.facts.map((item) => `${item[0]}: ${item[1]}`).join(" | ") : "",
      profile ? profile.metadata.map((item) => `${item[0]}: ${item[1]}`).join(" | ") : "",
      profile ? profile.mechanisms.map((item) => `${item.statement}${item.contextSummary ? ` [${item.contextSummary}]` : ""}`).join(" | ") : "",
      profile ? profile.contexts.map((item) => `${item.label} (${item.type}; ${item.count})`).join(" | ") : "",
      row.matchCount,
    ];
  });
  downloadCsv("psfd_annotations.csv", [header, ...body]);
}

function exportEnrichmentTable() {
  if (!state.annotationEnrichment.length) return;
  const header = ["category", "signal", "count", "unit", "detail", "matched_entities"];
  const body = state.annotationEnrichment.map((term) => [
    term.category,
    term.label,
    term.count,
    term.unit,
    term.detail,
    asArray(term.entities).join(" | ")
  ]);
  downloadCsv("psfd_research_signals.csv", [header, ...body]);
}

function downloadCsv(filename, rows) {
  const content = `${rows.map((row) => row.map(csvCell).join(",")).join("\n")}\n`;
  downloadFile(filename, content, "text/csv");
}

function csvCell(value) {
  const text = String(value ?? "");
  return `"${text.replaceAll('"', '""')}"`;
}

function annotationMatchCard(entity, index = 0) {
  const ids = entityOntologyIds(entity);
  const compound = entity.compound_classification || {};
  const geneProfile = entity.gene_protein_normalization || {};
  const metadata = annotationMetadata(entity);
  return `
    <div class="annotation-match">
      <div class="annotation-match-main">
        <div class="annotation-match-title">
          <div>
            <strong>${esc(pathEntityName(entity))}</strong>
            <span>${esc([entity.pmcid, clean(entity.type), ids[0] || "unmapped"].filter(Boolean).join(" | "))}</span>
          </div>
          <div class="annotation-rank">${index === 0 ? "Best match" : `Match ${index + 1}`}</div>
        </div>
        <div class="annotation-id-strip">
          ${ids.length ? badges(ids, "ontology", 6) : `<span class="badge review">unmapped</span>`}
        </div>
        ${metadata ? `<div class="annotation-metadata">${metadata}</div>` : ""}
        <small>${esc(entityResearchLine(entity))}</small>
        ${Object.keys(geneProfile).length ? annotationGeneActions(entity, geneProfile) : ""}
        ${Object.keys(compound).length ? annotationCompoundActions(entity, compound) : ""}
      </div>
      <div class="click-row">
        <button class="mini-button" type="button" data-action="path-start" data-id="${esc(entity.id)}">Route start</button>
        <button class="mini-button" type="button" data-action="path-end" data-id="${esc(entity.id)}">Route end</button>
        <button class="mini-button" type="button" data-action="select-global" data-kind="entity" data-id="${esc(entity.id)}" data-pmcid="${esc(entity.pmcid)}">Open</button>
      </div>
    </div>
  `;
}

function annotationMetadata(entity) {
  const rows = [
    ["Normalized label", entity.selected_label || entity.normalized_label || ""],
    ["Decision", entity.decision || ""],
    ["Evidence", `${fmt(entity.relation_count || 0)} relations | ${fmt(entity.event_count || 0)} events`]
  ];
  return rows
    .filter(([, value]) => value)
    .map(([key, value]) => `<div><span>${esc(key)}</span><strong>${esc(value)}</strong></div>`)
    .join("");
}

function annotationGeneActions(entity, profile) {
  const phytozome = asArray(profile.phytozome_ids)[0] || {};
  const uniprot = asArray(profile.fasta_accessions)[0] || {};
  const family = asArray(profile.family_ids)[0] || {};
  const databaseId = asArray(profile.database_ids)[0] || {};
  const pieces = [];
  if (phytozome.gene_id) {
    pieces.push(`<span class="annotation-resource">Phytozome ${esc(phytozome.gene_id)}</span>`);
    if (phytozome.sequence) {
      pieces.push(`<button class="mini-button primary-action" type="button" data-action="download-phytozome-fasta" data-id="${esc(entity.id)}" data-gene-id="${esc(phytozome.gene_id)}">Download FASTA</button>`);
    }
    pieces.push(`<a class="mini-link" href="${esc(phytozomeGeneUrl(phytozome))}" target="_blank" rel="noreferrer">Phytozome report</a>`);
  }
  if (uniprot.accession) {
    pieces.push(`<span class="annotation-resource">UniProt ${esc(uniprot.accession)}</span>`);
    pieces.push(`<button class="mini-button primary-action" type="button" data-action="download-fasta" data-id="${esc(entity.id)}" data-accession="${esc(uniprot.accession)}">Download FASTA</button>`);
    pieces.push(`<a class="mini-link" href="https://www.uniprot.org/uniprotkb/${esc(uniprot.accession)}" target="_blank" rel="noreferrer">UniProt</a>`);
  }
  if (family.ontology_id) {
    pieces.push(`<span class="annotation-resource">${esc(family.ontology_id)}</span>`);
    if (family.name) pieces.push(`<span class="annotation-resource">${esc(family.name)}</span>`);
    if (family.resource_url) pieces.push(`<a class="mini-link" href="${esc(family.resource_url)}" target="_blank" rel="noreferrer">Family/domain</a>`);
  }
  if (databaseId.ontology_id) {
    pieces.push(`<span class="annotation-resource">${esc(databaseId.ontology_id)}</span>`);
    if (databaseId.resource_url) pieces.push(`<a class="mini-link" href="${esc(databaseId.resource_url)}" target="_blank" rel="noreferrer">${esc(databaseId.database || "Database")}</a>`);
  }
  if (!pieces.length) return "";
  return `<div class="annotation-resource-row">${pieces.join("")}</div>`;
}

function annotationCompoundActions(entity, compound) {
  const chebi = compound.chebi || {};
  const pubchem = compound.pubchem || {};
  const cf = compound.classyfire || {};
  const np = compound.npclassifier || {};
  const pieces = [];
  if (chebi.formula) pieces.push(`<span class="annotation-resource">Formula ${esc(chebi.formula)}</span>`);
  if (cf.class || cf.superclass) pieces.push(`<span class="annotation-resource">${esc([cf.superclass, cf.class].filter(Boolean).join(" | "))}</span>`);
  if (np.class || np.superclass) pieces.push(`<span class="annotation-resource">NP ${esc([np.superclass, np.class].filter(Boolean).join(" | "))}</span>`);
  if (pubchem.cid) pieces.push(`<a class="mini-link" href="https://pubchem.ncbi.nlm.nih.gov/compound/${esc(pubchem.cid)}" target="_blank" rel="noreferrer">PubChem</a>`);
  if (chebi.id) pieces.push(`<a class="mini-link" href="https://www.ebi.ac.uk/chebi/searchId.do?chebiId=${esc(chebi.id)}" target="_blank" rel="noreferrer">ChEBI</a>`);
  if (!pieces.length) return "";
  return `<div class="annotation-resource-row">${pieces.join("")}</div>`;
}

function entityResearchLine(entity) {
  const details = [];
  if (entity.compound_classification?.classyfire?.class) details.push(entity.compound_classification.classyfire.class);
  if (entity.compound_classification?.npclassifier?.class) details.push(entity.compound_classification.npclassifier.class);
  const geneIds = asArray(entity.gene_protein_normalization?.phytozome_ids).map((item) => item.gene_id).filter(Boolean);
  const fastaIds = asArray(entity.gene_protein_normalization?.fasta_accessions).map((item) => item.accession).filter(Boolean);
  const familyIds = asArray(entity.gene_protein_normalization?.family_ids).map((item) => item.ontology_id).filter(Boolean);
  const databaseIds = asArray(entity.gene_protein_normalization?.database_ids).map((item) => item.ontology_id).filter(Boolean);
  details.push(...geneIds.slice(0, 1), ...fastaIds.slice(0, 1), ...familyIds.slice(0, 1), ...databaseIds.slice(0, 1));
  details.push(`${fmt(entity.relation_count || 0)} relations`, `${fmt(entity.event_count || 0)} events`);
  return details.filter(Boolean).join(" | ");
}

function exportHypothesisReport(index) {
  const path = state.pathResults[index] || state.discoverResults[index];
  if (!path) return;
  const markdown = hypothesisMarkdown(path, index);
  const start = pathNodeInfo(path.nodes[0]);
  const end = pathNodeInfo(path.nodes[path.nodes.length - 1]);
  downloadTextFile(
    safeFastaFilename(`psfd_hypothesis_${shortSlug(start.label)}_to_${shortSlug(end.label)}`).replace(/\.fasta$/, ".md"),
    markdown
  );
}

function hypothesisMarkdown(path, index) {
  const analysis = path.hypothesis || analyzeHypothesisPath(path, state.discoverLens);
  const start = pathNodeInfo(path.nodes[0]);
  const end = pathNodeInfo(path.nodes[path.nodes.length - 1]);
  const lines = [
    `# PSFD Hypothesis ${index + 1}`,
    "",
    `**Question:** ${start.label} -> ${end.label}`,
    `**Biological lens:** ${discoverLensLabel(state.discoverLens)}`,
    `**Evidence score:** ${Math.round(analysis.score)}`,
    `**Evidence labels:** ${analysis.tags.join(", ") || "none"}`,
    `**Papers:** ${analysis.papers.join(", ") || "ontology bridge"}`,
    "",
    "## Interpretation",
    hypothesisSummary(path, analysis),
    "",
    "## Path",
    path.nodes.map((node, nodeIndex) => {
      const info = pathNodeInfo(node);
      const edge = path.edges[nodeIndex];
      const nodeLine = `${nodeIndex + 1}. ${info.kind.toUpperCase()}: ${info.label}${info.subtitle ? ` (${info.subtitle})` : ""}`;
      return edge ? `${nodeLine}\n   - ${edgeReportText(edge)}` : nodeLine;
    }).join("\n"),
    "",
    "## Evidence Steps",
    ...path.edges.map((edge, edgeIndex) => `${edgeIndex + 1}. ${edgeReportText(edge)}`),
    "",
    "## Provenance",
    `Generated from PSFD visual demo live API data on ${new Date().toISOString()}.`,
    "Use the in-page Open buttons to inspect the source event, relation, dependency, or entity records."
  ];
  return `${lines.join("\n")}\n`;
}

function edgeReportText(edge) {
  if (edge.kind === "relation" || edge.kind === "context") {
    const rel = state.globalPathIndexes.relationById.get(edge.id);
    return [
      `${edge.kind === "context" ? "Relation context" : "Relation"}: ${rel?.triple || rel?.predicate || edge.label}`,
      rel?.pmcid ? `paper ${rel.pmcid}` : "",
      rel?.evidence_preview ? `evidence "${rel.evidence_preview}"` : "",
      rel?.id ? `record ${rel.id}` : edge.id
    ].filter(Boolean).join(" | ");
  }
  if (edge.kind === "hyperedge") {
    const event = state.globalPathIndexes.eventById.get(edge.id);
    return [
      `Event: ${event?.label || edge.id}`,
      event?.pmcid ? `paper ${event.pmcid}` : "",
      event?.type ? clean(event.type) : "",
      `${event?.relation_count || 0} relations`
    ].filter(Boolean).join(" | ");
  }
  if (edge.kind === "dependency") {
    const dep = state.globalPathIndexes.dependencyById.get(edge.id);
    return [
      `Dependency: ${clean(dep?.type || edge.label)}`,
      dep?.pmcid ? `paper ${dep.pmcid}` : "",
      dep?.tier ? `tier ${tierLabel(dep.tier)}` : "",
      dep?.confidence ? `confidence ${dep.confidence}` : "",
      dep?.bridge_entities?.length ? `bridge ${dep.bridge_entities.join(", ")}` : "",
      dep?.id ? `record ${dep.id}` : edge.id
    ].filter(Boolean).join(" | ");
  }
  const concept = state.globalPathIndexes.conceptById.get(edge.id);
  return [
    `Ontology bridge: ${concept?.label || edge.id}`,
    concept?.ontology || "",
    concept?.papers?.length ? `${concept.papers.length} papers` : "",
    edge.id
  ].filter(Boolean).join(" | ");
}

function pathPaperSet(path) {
  const papers = new Set();
  path.nodes.forEach((node) => {
    const info = pathNodeInfo(node);
    if (info.pmcid) papers.add(info.pmcid);
  });
  path.edges.forEach((edge) => {
    if (edge.pmcid) papers.add(edge.pmcid);
    if (edge.kind === "ontology") {
      const concept = state.globalPathIndexes.conceptById.get(edge.id);
      asArray(concept?.papers).forEach((paper) => papers.add(paper));
    }
  });
  return papers;
}

function shortSlug(value) {
  return String(value || "entity")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 42) || "entity";
}

function downloadTextFile(filename, content) {
  downloadFile(filename, content, "text/markdown");
}

function downloadFile(filename, content, type = "text/plain") {
  const blob = new Blob([content], { type });
  const blobUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = blobUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(blobUrl), 1200);
}

function renderPathExplorer() {
  if (!state.globalPathIndex) {
    loadGlobalPathIndex()
      .then(() => render())
      .catch((error) => {
        state.pathStatus = `Could not load cross-paper path index: ${error.message}`;
        render();
      });
    els.mainPanel.innerHTML = `
      <section class="hero-card">
        <div class="empty-state">
          <div>
            <strong>Loading cross-paper Pathfinder</strong>
            <span>Preparing all papers and normalized ontology bridges.</span>
          </div>
        </div>
      </section>
    `;
    return;
  }

  const entityOptions = state.globalPathIndex.entities
    .slice()
    .sort((a, b) => pathEntityName(a).localeCompare(pathEntityName(b)))
    .map((entity) => {
      const ontologyIds = entityOntologyIds(entity);
      const ontology = ontologyIds.length ? ` | ${ontologyIds.slice(0, 2).join(", ")}` : "";
      return `<option value="${esc(pathEntityName(entity))} | ${esc(entity.pmcid)}${esc(ontology)} [${esc(entity.id)}]"></option>`;
    })
    .join("");
  const stats = state.globalPathIndex.stats;
  els.mainPanel.innerHTML = `
    <section class="hero-card pathfinder-hero">
      ${returnControl()}
      <div class="hero-title">
        <div>
          <h2>Pathfinder</h2>
          <p>Build a hypothesis route between two annotated genes, compounds, traits, or ontology concepts across the PSFD papers.</p>
        </div>
        <div>${badges([`${fmt(stats.entities)} entities`, `${fmt(stats.concepts)} ontology bridges`, `${fmt(stats.dependencies)} event links`])}</div>
      </div>
      ${pathEndpointBoard()}
      <div class="path-form">
        <label><span>Start entity</span><input id="pathStartInput" type="text" list="entityOptions" value="${esc(state.pathStart)}" placeholder="compound, gene, trait"></label>
        <label><span>End entity</span><input id="pathEndInput" type="text" list="entityOptions" value="${esc(state.pathEnd)}" placeholder="compound, gene, trait"></label>
        <label><span>Lens</span><select data-state-key="discoverLens">${discoverLensOptions()}</select></label>
        <label><span>Depth</span><input id="pathMaxEdges" type="number" min="1" max="8" value="${esc(state.pathMaxEdges)}"></label>
        <datalist id="entityOptions">${entityOptions}</datalist>
      </div>
      <div class="click-row">
        <button class="mini-button primary-action" type="button" data-action="find-paths">Find hypothesis routes</button>
        ${pathOptionsSummary()}
        ${state.pathStatus ? `<span class="badge review">${esc(state.pathStatus)}</span>` : ""}
      </div>
    </section>
    <section class="section-card path-results-panel">
      <div class="section-header"><h2>Hypothesis Routes</h2><span class="muted">${fmt(state.pathResults.length)} paths</span></div>
      ${pathLegend()}
      ${renderPathResults()}
      <details class="path-suggestions">
        <summary>Suggested entities for ${esc(discoverLensLabel(state.discoverLens))}</summary>
        ${renderLensCatalog()}
      </details>
    </section>
  `;
}

function pathEndpointBoard() {
  const start = state.pathStartId ? pathEntityById(state.pathStartId) : null;
  const end = state.pathEndId ? pathEntityById(state.pathEndId) : null;
  return `
    <div class="path-endpoint-board">
      ${pathEndpointCard("Start", start)}
      <div class="path-endpoint-arrow">connects to</div>
      ${pathEndpointCard("End", end)}
    </div>
  `;
}

function pathEndpointCard(label, entity) {
  return `
    <div class="path-endpoint-card ${entity ? "active" : ""}">
      <span>${esc(label)}</span>
      <strong>${esc(entity ? pathEntityName(entity) : "Choose entity")}</strong>
      <small>${esc(entity ? [entity.pmcid, clean(entity.type), entityOntologyIds(entity).slice(0, 2).join(", ")].filter(Boolean).join(" | ") : "Use annotation results or type a name/ID below")}</small>
    </div>
  `;
}

function pathOptionsSummary() {
  const active = [
    state.pathUseRelations ? "relations" : "",
    state.pathUseHyperedges ? "events" : "",
    state.pathUseDependencies ? "dependencies" : "",
    state.pathUseOntologyBridges ? "ontology bridges" : "",
    state.pathUseContext ? "context" : "",
    state.pathIncludeHypothesis ? "hypothesis links" : "",
    state.pathIncludeRejected ? "rejected links" : "",
  ].filter(Boolean);
  const visible = active.slice(0, 4);
  const extra = active.length > visible.length ? `+${active.length - visible.length}` : "";
  return `<div class="path-option-pills">${badges([...visible, extra].filter(Boolean), "ontology", 5)}</div>`;
}

function pathLegend() {
  return `
    <details class="path-legend">
      <summary>Route evidence types</summary>
      <div>
        <span><i class="legend-dot relation"></i> relation</span>
        <span><i class="legend-dot hyperedge"></i> event membership</span>
        <span><i class="legend-dot dependency"></i> event dependency</span>
        <span><i class="legend-dot ontology"></i> normalized ID bridge</span>
        <span><i class="legend-dot context"></i> context edge</span>
      </div>
    </details>
  `;
}

async function loadGlobalPathIndex() {
  // Global Path Index is disabled because the 5GB file crashes the browser.
  // The backend API now handles global sequence annotation and entity resolution.
  if (!state.globalPathIndex) {
    state.globalPathIndex = { entities: [] };
    try {
      const stats = await fetchJson("stats");
      state.globalPathIndex.stats = stats;
    } catch (error) {
      console.error("Could not load database stats:", error);
    }
    try {
      const response = await fetch(`${window.PSMM_API_BASE}/api/enriched_traits`);
      if (response.ok) {
        state.globalEnrichments = await response.json();
      } else {
        state.globalEnrichments = [];
      }
    } catch (error) {
      console.error("Could not load enriched traits:", error);
      state.globalEnrichments = [];
    }
    state.globalPathIndexes = {
      entitiesByGlobalId: new Map(),
      conceptById: new Map(),
      entityById: new Map(),
      relationsByEntity: new Map(),
      eventsByEntity: new Map(),
      relationById: new Map(),
      eventById: new Map(),
      dependencyById: new Map()
    };
  }
  return Promise.resolve();
}

function buildGlobalPathIndexes(payload) {
  const relationsByEntity = new Map();
  const eventsByEntity = new Map();
  const relationById = new Map();
  const entitiesByHash = new Map();
  const entitiesByGlobalId = new Map();
  function push(map, key, value) {
    if (!key) return;
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(value);
  }
  payload.entities.forEach((entity) => {
    if (entity.id) {
      const hash = entity.id.split(".").pop();
      push(entitiesByHash, hash, entity);
      
      const globalId = `global.entity.${hash}`;
      push(entitiesByGlobalId, globalId, entity);
    }
  });
  payload.relations.forEach((relation) => {
    [relation.id, ...asArray(relation.merged_relation_ids)].forEach((id) => {
      if (id) relationById.set(id, relation);
    });
    relationGlobalSubjectIds(relation).forEach((id) => push(relationsByEntity, id, relation));
    relationGlobalObjectIds(relation).forEach((id) => push(relationsByEntity, id, relation));
    asArray(relation.context_entity_ids).forEach((id) => push(relationsByEntity, id, relation));
  });
  payload.events.forEach((event) => {
    asArray(event.participant_entity_ids).forEach((id) => push(eventsByEntity, id, event));
  });
  return {
    entityById: new Map(payload.entities.map((item) => [item.id, item])),
    conceptById: new Map(payload.concepts.map((item) => [item.id, item])),
    eventById: new Map(payload.events.map((item) => [item.id, item])),
    relationById,
    dependencyById: new Map(payload.dependencies.map((item) => [item.id, item])),
    relationsByEntity,
    eventsByEntity,
    entitiesByHash,
    entitiesByGlobalId
  };
}

async function setPathEndpoint(which, id) {
  await loadGlobalPathIndex();
  const entity = pathEntityById(id) || state.indexes.entityById.get(id);
  if (!entity) return;
  pushReturnState();
  if (which === "start") {
    state.pathStartId = id;
    state.pathStart = formatPathInput(entity, id);
  } else {
    state.pathEndId = id;
    state.pathEnd = formatPathInput(entity, id);
  }
  state.tab = "paths";
  state.pathResults = [];
  closeEntityModal();
  render();
}

async function runPathSearch() {
  await loadGlobalPathIndex();
  const start = resolveGlobalEntityQuery(state.pathStart) || state.pathStartId;
  const end = resolveGlobalEntityQuery(state.pathEnd) || state.pathEndId;
  state.pathStartId = start || "";
  state.pathEndId = end || "";
  state.pathStatus = "";
  if (!start || !end) {
    state.pathResults = [];
    state.pathStatus = "Choose a valid start and end entity.";
    render();
    return;
  }
  const rawPaths = findPaths(
    start,
    end,
    Number(state.pathMaxEdges || 5),
    { ...currentPathOptions(), discoveryMode: true },
    48
  );
  state.pathResults = rankHypothesisPaths(rawPaths, state.discoverLens).slice(0, 12);
  if (!state.pathResults.length) {
    state.pathStatus = rawPaths.length
      ? "Only weak context or metadata bridges were found, so they were filtered out."
      : "No biologically meaningful routes found with the current depth.";
  } else if (rawPaths.length > state.pathResults.length) {
    state.pathStatus = `${fmt(rawPaths.length - state.pathResults.length)} lower-signal routes hidden.`;
  }
  render();
}

function resolveGlobalEntityQuery(query) {
  if (!state.globalPathIndex) return "";
  const text = String(query || "").trim();
  const bracket = text.match(/\[(PMC[^\]]+entity[^\]]+)\]$/);
  if (bracket && state.globalPathIndexes.entityById.has(bracket[1])) return bracket[1];
  if (state.globalPathIndexes.entityById.has(text)) return text;
  const lowered = text.toLowerCase();
  if (!lowered) return "";
  const exact = state.globalPathIndex.entities.find((entity) => (
    pathEntityName(entity).toLowerCase() === lowered ||
    String(entity.selected_label || "").toLowerCase() === lowered ||
    String(entity.ontology_id || "").toLowerCase() === lowered ||
    asArray(entity.ontology_ids).some((id) => String(id || "").toLowerCase() === lowered)
  ));
  if (exact) return exact.id;
  const partial = state.globalPathIndex.entities.find((entity) => globalEntitySearchText(entity).includes(lowered));
  return partial?.id || "";
}

function currentPathOptions() {
  return {
    pathUseRelations: state.pathUseRelations,
    pathUseHyperedges: state.pathUseHyperedges,
    pathUseDependencies: state.pathUseDependencies,
    pathUseOntologyBridges: state.pathUseOntologyBridges,
    pathUseContext: state.pathUseContext,
    pathIncludeHypothesis: state.pathIncludeHypothesis,
    pathIncludeRejected: state.pathIncludeRejected
  };
}

function findPaths(startEntityId, endEntityId, maxEdges, options = currentPathOptions(), resultLimit = 16) {
  if (startEntityId === endEntityId) return [];
  const graph = buildPathGraph(options);
  const start = `entity:${startEntityId}`;
  const end = `entity:${endEntityId}`;
  const queue = [{ node: start, nodes: [start], edges: [] }];
  const results = [];
  let expansions = 0;
  while (queue.length && results.length < resultLimit && expansions < 24000) {
    const item = queue.shift();
    expansions += 1;
    if (item.edges.length >= maxEdges) continue;
    const nextEdges = graph.get(item.node) || [];
    for (const edge of nextEdges) {
      if (item.nodes.includes(edge.to)) continue;
      const next = {
        node: edge.to,
        nodes: [...item.nodes, edge.to],
        edges: [...item.edges, edge]
      };
      if (edge.to === end) {
        results.push(next);
        if (results.length >= resultLimit) break;
      } else {
        queue.push(next);
      }
    }
  }
  return results;
}

function buildPathGraph(options = currentPathOptions()) {
  const data = state.globalPathIndex;
  const entityById = state.globalPathIndexes?.entityById || new Map(data.entities.map((entity) => [entity.id, entity]));
  const graph = new Map();
  function add(from, to, edge) {
    if (!from || !to) return;
    if (!graph.has(from)) graph.set(from, []);
    graph.get(from).push({ ...edge, from, to });
  }
  function addUndirected(a, b, edge) {
    add(a, b, edge);
    add(b, a, { ...edge, reverse: true });
  }

  if (options.pathUseRelations) {
    data.relations.forEach((rel) => {
      const subjectEntity = entityById.get(rel.subject_entity_id);
      const objectEntity = entityById.get(rel.object_entity_id);
      if (options.discoveryMode && (isLowSignalDiscoveryEntity(subjectEntity) || isLowSignalDiscoveryEntity(objectEntity))) {
        return;
      }
      relationGlobalSubjectIds(rel).forEach((subjectId) => {
        relationGlobalObjectIds(rel).forEach((objectId) => {
          const subjectNode = subjectId ? `entity:${subjectId}` : "";
          const objectNode = objectId ? `entity:${objectId}` : "";
          addUndirected(subjectNode, objectNode, {
            kind: "relation",
            id: rel.id,
            pmcid: rel.pmcid,
            label: rel.predicate || "relation"
          });
        });
      });
      if (!options.pathUseContext) return;
      asArray(rel.context_entity_ids).forEach((ctx) => {
        const contextEntity = entityById.get(ctx);
        if (options.discoveryMode && isLowSignalDiscoveryEntity(contextEntity)) return;
        const c = `entity:${ctx}`;
        [...relationGlobalSubjectIds(rel), ...relationGlobalObjectIds(rel)].forEach((endpointId) => {
          addUndirected(c, `entity:${endpointId}`, { kind: "context", id: rel.id, pmcid: rel.pmcid, label: "context" });
        });
      });
    });
  }

  if (options.pathUseHyperedges) {
    data.events.forEach((event) => {
      const eventNode = `event:${event.id}`;
      asArray(event.participant_entity_ids).forEach((nodeId) => {
        if (options.discoveryMode && isLowSignalDiscoveryEntity(entityById.get(nodeId))) return;
        addUndirected(`entity:${nodeId}`, eventNode, {
          kind: "hyperedge",
          id: event.id,
          pmcid: event.pmcid,
          label: "event hyperedge"
        });
      });
    });
  }

  if (options.pathUseDependencies) {
    data.dependencies.forEach((dep) => {
      if (isHypothesisTier(dep.tier) && !options.pathIncludeHypothesis) return;
      if (dep.tier === "rejected" && !options.pathIncludeRejected) return;
      if (!["accepted", "hypothesis", "rejected"].includes(canonicalTier(dep.tier))) return;
      addUndirected(`event:${dep.source_event_id}`, `event:${dep.target_event_id}`, {
        kind: "dependency",
        id: dep.id,
        pmcid: dep.pmcid,
        label: clean(dep.type),
        directedFrom: dep.source_event_id,
        directedTo: dep.target_event_id
      });
    });
  }

  if (options.pathUseOntologyBridges) {
    data.concepts.forEach((concept) => {
      if (asArray(concept.entity_ids).length < 2) return;
      if (options.discoveryMode && isLowSignalDiscoveryConcept(concept)) return;
      const conceptNode = `concept:${concept.id}`;
      concept.entity_ids.forEach((entityId) => {
        addUndirected(`entity:${entityId}`, conceptNode, {
          kind: "ontology",
          id: concept.id,
          label: concept.label || concept.id
        });
      });
    });
  }
  return graph;
}

function renderPathResults() {
  if (!state.pathStartId || !state.pathEndId) {
    return `<div class="compact-card muted">Choose two entities, then find hypothesis routes. Annotation cards can send entities here as a start or endpoint.</div>`;
  }
  if (!state.pathResults.length) {
    return `<div class="compact-card muted">No hypothesis routes found within ${fmt(state.pathMaxEdges)} edges using the current path filters.</div>`;
  }
  return state.pathResults.map(pathResultCard).join("");
}

function pathResultCard(path, index) {
  const analysis = path.hypothesis || analyzeHypothesisPath(path, state.discoverLens);
  const start = pathNodeInfo(path.nodes[0]);
  const end = pathNodeInfo(path.nodes[path.nodes.length - 1]);
  const concepts = pathConceptList(path).slice(0, 4);
  return `
    <article class="path-card path-card-rich route-card">
      <div class="path-card-header">
        <div>
          <strong>Route ${index + 1}</strong>
          <span>${fmt(path.edges.length)} steps | ${esc(pathPaperSummary(path))}</span>
        </div>
        <div class="route-actions">
          <span class="route-score">${fmt(Math.round(analysis.score))}</span>
          <button class="mini-button" type="button" data-action="export-hypothesis" data-index="${index}">Export</button>
        </div>
      </div>
      <div class="route-headline">
        <strong>${esc(start.label)}</strong>
        <span>${esc(pathEvidenceMode(path))}</span>
        <strong>${esc(end.label)}</strong>
      </div>
      <div class="hypothesis-summary">${esc(hypothesisSummary(path, analysis))}</div>
      <div class="hypothesis-tags">${badges(analysis.tags.slice(0, 5), "ontology", 5)}</div>
      ${concepts.length ? `<div class="route-concepts">${badges(concepts, "ontology", 4)}</div>` : ""}
      ${renderPathRibbon(path)}
      <details class="path-detail-drawer">
        <summary>Evidence steps</summary>
        ${renderPathNarrative(path)}
      </details>
    </article>
  `;
}

function pathEvidenceMode(path) {
  const kinds = new Set(path.edges.map((edge) => edge.kind));
  if (kinds.has("relation") && path.edges.length === 1) return "direct relation";
  if (kinds.has("dependency")) return "event mechanism";
  if (kinds.has("ontology")) return "normalized ontology bridge";
  if (kinds.has("hyperedge")) return "shared event";
  if (kinds.has("context")) return "relation context";
  return "graph route";
}

function renderPathRibbon(path) {
  const pieces = [];
  path.nodes.forEach((node, index) => {
    pieces.push(pathNodePill(node));
    if (path.edges[index]) pieces.push(pathEdgePill(path.edges[index]));
  });
  return `<div class="path-ribbon">${pieces.join("")}</div>`;
}

function renderPathNarrative(path) {
  return `
    <div class="path-narrative">
      ${path.edges.map((edge, index) => {
    const from = pathNodeInfo(path.nodes[index]);
    const to = pathNodeInfo(path.nodes[index + 1]);
    return edgeDetailCard(edge, from, to, index);
  }).join("")}
    </div>
  `;
}

function pathNodeInfo(nodeKey) {
  const splitAt = nodeKey.indexOf(":");
  const kind = nodeKey.slice(0, splitAt);
  const id = nodeKey.slice(splitAt + 1);
  if (kind === "entity") {
    const entity = state.globalPathIndexes.entityById.get(id);
    return {
      kind,
      id,
      pmcid: entity?.pmcid || "",
      label: pathEntityName(entity),
      subtitle: [entity?.pmcid, entity?.ontology_id].filter(Boolean).join(" | "),
      type: entity?.type || "entity"
    };
  }
  if (kind === "event") {
    const event = state.globalPathIndexes.eventById.get(id);
    return {
      kind,
      id,
      pmcid: event?.pmcid || "",
      label: event?.label || shortId(id),
      subtitle: [event?.pmcid, clean(event?.type)].filter(Boolean).join(" | "),
      type: event?.type || "event"
    };
  }
  const concept = state.globalPathIndexes.conceptById.get(id);
  return {
    kind,
    id,
    pmcid: "",
    label: concept?.label || id,
    subtitle: [concept?.ontology, id, `${concept?.papers?.length || 0} papers`].filter(Boolean).join(" | "),
    type: "ontology"
  };
}

function pathNodePill(nodeKey) {
  const info = pathNodeInfo(nodeKey);
  if (info.kind === "concept") {
    return `
      <div class="path-node concept" title="${esc(info.subtitle)}">
        <span>${esc(shortText(info.label, 28))}</span>
      </div>
    `;
  }
  const actionKind = info.kind === "event" ? "event" : "entity";
  return `
    <button class="path-node ${esc(info.kind)}" type="button" data-action="select-global" data-kind="${actionKind}" data-id="${esc(info.id)}" data-pmcid="${esc(info.pmcid)}" title="${esc(info.subtitle)}">
      <span>${esc(shortText(info.label, 28))}</span>
    </button>
  `;
}

function pathEdgePill(edge) {
  return `
    <div class="path-edge ${esc(edge.kind)}" title="${esc(clean(edge.label))}">
      <span>${esc(edgeKindLabel(edge.kind))}</span>
    </div>
  `;
}

function edgeDetailCard(edge, from, to, index) {
  if (edge.kind === "relation" || edge.kind === "context") {
    const rel = state.globalPathIndexes.relationById.get(edge.id);
    return `
      <div class="path-step-card relation-step">
        <div class="path-step-index">${index + 1}</div>
        <div>
          <h3>${esc(edge.kind === "context" ? "Shared relation context" : "Relation edge")}</h3>
          <p>${esc(from.label)} ${esc(edge.kind === "context" ? "shares context in" : "connects by")} <strong>${esc(rel?.predicate || edge.label)}</strong> ${esc(to.label)}.</p>
          <div class="path-step-meta">${badges([rel?.pmcid, rel?.predicate_class, rel?.id].filter(Boolean))}</div>
          ${rel?.triple ? `<div class="path-step-evidence">${esc(rel.triple)}</div>` : ""}
          ${rel?.evidence_preview ? `<div class="path-step-evidence muted">${esc(rel.evidence_preview)}</div>` : ""}
          ${rel ? `<button class="mini-button" type="button" data-action="select-global" data-kind="relation" data-id="${esc(rel.id)}" data-pmcid="${esc(rel.pmcid)}">Open relation</button>` : ""}
        </div>
      </div>
    `;
  }
  if (edge.kind === "hyperedge") {
    const event = state.globalPathIndexes.eventById.get(edge.id);
    return `
      <div class="path-step-card hyperedge-step">
        <div class="path-step-index">${index + 1}</div>
        <div>
          <h3>Event hyperedge membership</h3>
          <p>${esc(from.label)} and ${esc(to.label)} are connected through the event <strong>${esc(event?.label || edge.id)}</strong>.</p>
          <div class="path-step-meta">${badges([event?.pmcid, clean(event?.type), `${event?.relation_count || 0} relations`].filter(Boolean))}</div>
          ${event ? `<button class="mini-button" type="button" data-action="select-global" data-kind="event" data-id="${esc(event.id)}" data-pmcid="${esc(event.pmcid)}">Open event</button>` : ""}
        </div>
      </div>
    `;
  }
  if (edge.kind === "dependency") {
    const dep = state.globalPathIndexes.dependencyById.get(edge.id);
    return `
      <div class="path-step-card dependency-step">
        <div class="path-step-index">${index + 1}</div>
        <div>
          <h3>Event dependency</h3>
          <p>${esc(from.label)} links to ${esc(to.label)} by <strong>${esc(clean(dep?.type || edge.label))}</strong>.</p>
          <div class="path-step-meta">${badges([dep?.pmcid, dep?.tier, dep?.confidence ? `confidence ${dep.confidence}` : "", dep?.reason_code].filter(Boolean), dep?.tier || "")}</div>
          ${dep?.bridge_entities?.length ? `<div class="path-step-evidence">Bridge: ${esc(dep.bridge_entities.join(", "))}</div>` : ""}
          ${dep ? `<button class="mini-button" type="button" data-action="select-global" data-kind="dependency" data-id="${esc(dep.id)}" data-pmcid="${esc(dep.pmcid)}">Open dependency</button>` : ""}
        </div>
      </div>
    `;
  }
  const concept = state.globalPathIndexes.conceptById.get(edge.id);
  return `
    <div class="path-step-card ontology-step">
      <div class="path-step-index">${index + 1}</div>
      <div>
        <h3>Normalized ontology bridge</h3>
        <p>${esc(from.label)} and ${esc(to.label)} meet at the normalized concept <strong>${esc(concept?.label || edge.id)}</strong>.</p>
        <div class="path-step-meta">${badges([edge.id, concept?.ontology, `${concept?.papers?.length || 0} papers`].filter(Boolean), "ontology")}</div>
        ${concept?.description ? `<div class="path-step-evidence muted">${esc(concept.description)}</div>` : ""}
      </div>
    </div>
  `;
}

function edgeKindLabel(kind) {
  const labels = {
    relation: "relation",
    context: "context",
    hyperedge: "event",
    dependency: "dependency",
    ontology: "ontology"
  };
  return labels[kind] || kind;
}

function pathPaperList(path) {
  const papers = new Set();
  path.nodes.forEach((node) => {
    const info = pathNodeInfo(node);
    if (info.pmcid) papers.add(info.pmcid);
  });
  path.edges.forEach((edge) => {
    if (edge.pmcid) papers.add(edge.pmcid);
  });
  return Array.from(papers).slice(0, 6).join(" -> ") || "ontology bridge";
}

function pathPaperSummary(path) {
  const papers = pathPaperList(path).split(" -> ").filter(Boolean);
  if (!papers.length || papers[0] === "ontology bridge") return "ontology bridge";
  if (papers.length === 1) return papers[0];
  return `${fmt(papers.length)} papers`;
}

function pathConceptList(path) {
  return path.nodes
    .filter((node) => node.startsWith("concept:"))
    .map((node) => node.slice("concept:".length));
}

function pathEntityById(id) {
  return state.globalPathIndexes?.entityById.get(id) || null;
}

function pathEntityName(entity) {
  if (!entity) return "Unknown entity";
  return entity.label || entity.canonical_form || entity.selected_label || entity.normalized_label || entity.id || entity.node_id;
}

function formatPathInput(entity, id) {
  const label = pathEntityName(entity);
  const pmcid = entity.pmcid || state.paper || "";
  const ontologyIds = entityOntologyIds(entity);
  const ontology = ontologyIds.length ? ` | ${ontologyIds.slice(0, 2).join(", ")}` : "";
  return `${label} | ${pmcid}${ontology} [${id}]`;
}

function globalEntitySearchText(entity) {
  return [
    entity.id,
    entity.pmcid,
    entity.label,
    entity.normalized_label,
    entity.selected_label,
    entity.ontology_id,
    asArray(entity.ontology_ids).join(" "),
    selectedConcepts(entity).map((concept) => [concept.id, concept.label, concept.description].filter(Boolean).join(" ")).join(" "),
    entity.ontology,
    entity.type,
    entity.selected_description,
    compoundSearchText({ compound_classification: entity.compound_classification }),
    geneProteinSearchText({ gene_protein_normalization: entity.gene_protein_normalization })
  ].join(" ").toLowerCase();
}

async function selectGlobalItem(kind, id, pmcid) {
  if (!kind || !id) return;
  pushReturnState();
  closeEntityModal();
  if (pmcid && pmcid !== state.paper) {
    await loadPaper(pmcid, { preservePath: true, skipRender: true });
  }
  if (kind === "entity") state.entityScope = "paper";
  if (!localObjectExists(kind, id)) {
    throw new Error(`${clean(kind)} ${shortId(id)} was not found in ${pmcid || state.paper}.`);
  }
  navigateLocalItem(kind, id, true, { skipReturn: true });
}

function localObjectExists(kind, id) {
  if (!state.indexes || !id) return false;
  if (kind === "dependency") return state.indexes.dependencyById.has(id);
  if (kind === "event") return state.indexes.eventById.has(id);
  if (kind === "relation") return state.indexes.relationById.has(id);
  if (kind === "entity") return state.indexes.entityById.has(id);
  return false;
}

function renderInspector() {
  const selected = selectedObject();
  const sourceRows = Object.entries(state.data.source_files || {})
    .map(([key, value]) => `<div class="key">${esc(key)}</div><div>${esc(value)}</div>`)
    .join("");
  if (!selected) {
    els.inspectorPanel.innerHTML = `
      <h2>Inspector</h2>
      <div class="kv">
        <div class="key">Paper</div><div>${esc(state.data.pmcid)}</div>
        <div class="key">Mode</div><div>${esc(state.tab)}</div>
      </div>
      ${sourceFilesDetails(sourceRows)}
    `;
    return;
  }
  if (state.selectedKind === "dependency") {
    els.inspectorPanel.innerHTML = dependencyInspector(selected, sourceRows);
  } else if (state.selectedKind === "event") {
    els.inspectorPanel.innerHTML = eventInspector(selected, sourceRows);
  } else if (state.selectedKind === "relation") {
    els.inspectorPanel.innerHTML = relationInspector(selected, sourceRows);
  } else if (state.selectedKind === "entity") {
    els.inspectorPanel.innerHTML = entityInspector(selected, sourceRows);
  }
}

function selectedObject() {
  if (state.selectedKind === "dependency") return state.indexes.dependencyById.get(state.selectedId);
  if (state.selectedKind === "event") return state.indexes.eventById.get(state.selectedId);
  if (state.selectedKind === "relation") return state.indexes.relationById.get(state.selectedId);
  if (state.selectedKind === "entity") return state.indexes.entityById.get(state.selectedId);
  return null;
}

function dependencyInspector(dep, sourceRows) {
  return `
    <h2>Inspector</h2>
    <div class="kv">
      <div class="key">Selected</div><div>dependency</div>
      <div class="key">ID</div><div>${esc(dep.dependency_id)}</div>
      <div class="key">Tier</div><div>${badges([tierLabel(dep.tier)], tierClass(dep.tier))}</div>
      <div class="key">Type</div><div>${esc(clean(dep.dependency_type))}</div>
      <div class="key">Reason</div><div>${esc(clean(dep.reason_code || "-"))}</div>
      <div class="key">Bridge</div><div>${badges(dep.bridge_entities)}</div>
      <div class="key">Evidence</div><div>${badges(dep.evidence_sentence_ids, "", 8)}</div>
    </div>
    ${sourceFilesDetails(sourceRows)}
  `;
}

function eventInspector(event, sourceRows) {
  return `
    <h2>Inspector</h2>
    <div class="kv">
      <div class="key">Selected</div><div>event</div>
      <div class="key">ID</div><div>${esc(event.event_id)}</div>
      <div class="key">Type</div><div>${esc(clean(event.event_type))}</div>
      <div class="key">Scope</div><div>${esc(event.event_scope || "-")}</div>
      <div class="key">Relations</div><div>${fmt(event.relation_count)}</div>
      <div class="key">Accepted deps</div><div>${fmt(event.dependency_counts.accepted)}</div>
      <div class="key">Evidence</div><div>${badges(event.evidence_sentence_ids, "", 8)}</div>
    </div>
    <h3>Participants</h3>
    ${participantGroupsMarkup(event, { directLimit: 12, contextLimit: 12, otherLimit: 8 })}
    ${sourceFilesDetails(sourceRows)}
  `;
}

function relationInspector(rel, sourceRows) {
  return `
    <h2>Inspector</h2>
    <div class="kv">
      <div class="key">Selected</div><div>relation</div>
      <div class="key">ID</div><div>${esc(rel.record_id)}</div>
      <div class="key">Predicate</div><div>${esc(rel.predicate)}</div>
      <div class="key">Class</div><div>${esc(clean(rel.predicate_class))}</div>
      <div class="key">Merge</div><div>${esc(rel.merge_decision || "-")}</div>
      <div class="key">Evidence</div><div>${badges(rel.evidence_sentence_ids, "", 8)}</div>
    </div>
    ${sourceFilesDetails(sourceRows)}
  `;
}

function entityInspector(entity, sourceRows) {
  const classLine = compoundClassLine(entity);
  const geneOntology = geneProteinOntologyLabel(entity);
  const ontologyNames = uniqueStrings([
    ...selectedConcepts(entity).map((concept) => concept.ontology),
    entity.selected_ontology,
    geneOntology ? geneOntology.split(":", 1)[0] : ""
  ]).filter(Boolean);
  const ontologyIds = entityOntologyIds(entity);
  return `
    <h2>Inspector</h2>
    <div class="kv">
      <div class="key">Selected</div><div>entity</div>
      <div class="key">Canonical</div><div>${esc(entityName(entity))}</div>
      <div class="key">Type</div><div>${esc(clean(entity.entity_type))}</div>
      <div class="key">Decision</div><div>${esc(entity.decision || "-")}</div>
      <div class="key">Ontology</div><div>${ontologyNames.length ? badges(ontologyNames, "ontology", 4) : `<span class="muted">-</span>`}</div>
      <div class="key">IDs</div><div>${ontologyIds.length ? badges(ontologyIds, "ontology", 6) : `<span class="muted">-</span>`}</div>
      ${classLine ? `<div class="key">Compound class</div><div>${esc(classLine)}</div>` : ""}
      <div class="key">Relations</div><div>${fmt(entity.relation_count)}</div>
      <div class="key">Events</div><div>${fmt(entity.event_count)}</div>
    </div>
    <h3>Lookups</h3>
    ${externalLinks(entity)}
    ${sourceFilesDetails(sourceRows)}
  `;
}

function sourceFilesDetails(sourceRows) {
  return `
    <details class="source-details">
      <summary>Source files</summary>
      <div class="kv">${sourceRows || `<div class="key">Source</div><div>-</div>`}</div>
    </details>
  `;
}

function openEntityModal(id) {
  const entity = state.indexes.entityById.get(id);
  if (!entity) return;
  const relations = state.indexes.relationsByEntity.get(id) || [];
  const events = state.indexes.eventsByEntity.get(id) || [];
  els.modalBody.innerHTML = `
    <h2 id="modalTitle">${esc(entityName(entity))}</h2>
    <p class="muted">${esc(clean(entity.entity_type))}${ontologyLabel(entity) ? ` | ${esc(ontologyLabel(entity))}` : ""}</p>
    ${entitySummary(entity)}
    <div class="section-card">
      <div class="section-header">
        <h2>Actions</h2>
        ${actionMenu([
    { label: "Open entity page", action: "select-entity", id },
    { label: "Route start", action: "path-start", id },
    { label: "Route end", action: "path-end", id }
  ])}
      </div>
    </div>
    <div class="section-card">
      <div class="section-header"><h2>External Lookups</h2></div>
      ${externalLinks(entity)}
    </div>
    ${geneProteinExplorer(entity)}
    ${compoundExplorer(entity)}
    <div class="two-col">
      <div class="section-card">
        <div class="section-header"><h2>Related Relations</h2><span class="muted">${fmt(relations.length)}</span></div>
        <div class="compact-list">
          ${relations.slice(0, 10).map(relationSummaryCard).join("") || `<div class="compact-card muted">No relations.</div>`}
        </div>
      </div>
      <div class="section-card">
        <div class="section-header"><h2>Related Events</h2><span class="muted">${fmt(events.length)}</span></div>
        <div class="compact-list">
          ${events.slice(0, 10).map(eventSummaryCard).join("") || `<div class="compact-card muted">No events.</div>`}
        </div>
      </div>
    </div>
  `;
  els.modal.classList.add("open");
  els.modal.setAttribute("aria-hidden", "false");
}

function closeEntityModal() {
  els.modal.classList.remove("open");
  els.modal.setAttribute("aria-hidden", "true");
}

function compoundExplorer(entity) {
  const chemical = chemicalIdentifier(entity);
  if (!chemical) {
    if (entity?.entity_type !== "compound" && entity?.selected_ontology !== "CHEBI") return "";
    return `
      <div class="section-card compound-panel">
        <div class="section-header"><h2>Chemical Structure</h2></div>
        <div class="compact-card muted">This compound does not have a PubChem or ChEBI ID in Step 9, so the in-page chemical loader is unavailable.</div>
      </div>
    `;
  }
  const buttonText = chemical.source === "pubchem" ? "Load compound data" : "Load ChEBI data";
  const helperText = chemical.source === "pubchem"
    ? "Load in-page properties and a molecular structure when PubChem has one."
    : "Load ChEBI metadata and try to resolve a PubChem conformer from the ChEBI label or synonyms.";
  return `
    <div class="section-card compound-panel">
      <div class="section-header">
        <h2>Compound Profile</h2>
        <button class="mini-button" type="button" data-action="load-compound" data-id="${esc(entity.node_id)}">${esc(buttonText)}</button>
      </div>
      <div class="compound-live" data-compound-content="${esc(entity.node_id)}">
        <div class="compound-placeholder">
          <strong>${esc(entityOntologyIds(entity)[0] || entity.selected_ontology_id || entityName(entity))}</strong>
          <span>${esc(helperText)}</span>
        </div>
      </div>
    </div>
  `;
}

function chemicalIdentifier(entity) {
  const cid = pubchemCid(entity);
  if (cid) return { source: "pubchem", id: cid };
  const chebi = chebiId(entity);
  if (chebi) return { source: "chebi", id: chebi };
  return null;
}

function pubchemCid(entity) {
  const ontologyId = entityOntologyIds(entity).find((id) => /^PubChem:\d+$/i.test(String(id || ""))) || "";
  const match = String(ontologyId).match(/^PubChem:(\d+)$/i);
  if (match) return match[1];
  return String(entity?.compound_classification?.pubchem?.cid || "");
}

function chebiId(entity) {
  const ontologyId = entityOntologyIds(entity).find((id) => /^CHEBI:\d+$/i.test(String(id || ""))) || "";
  const match = String(ontologyId).match(/^CHEBI:(\d+)$/i);
  if (match) return `CHEBI:${match[1]}`;
  return String(entity?.compound_classification?.chebi?.id || "");
}

async function loadCompoundData(entityId) {
  const entity = state.indexes.entityById.get(entityId);
  const container = document.querySelector(`[data-compound-content="${cssEscape(entityId)}"]`);
  const chemical = chemicalIdentifier(entity);
  if (!entity || !chemical || !container) return;
  if (chemical.source === "chebi") {
    await loadChebiData(entity, chemical.id, container);
    return;
  }
  await loadPubChemData(entity, chemical.id, container);
}

function fastaContentContainer(entityId, accession, trigger) {
  const local = trigger?.closest(".fasta-card")?.querySelector(".fasta-live");
  if (local) return local;
  return document.querySelector(`[data-fasta-content="${cssEscape(`${entityId}:${accession}`)}"]`);
}

function phytozomeFastaContentContainer(entityId, geneId, trigger) {
  const local = trigger?.closest(".fasta-card")?.querySelector(".fasta-live");
  if (local) return local;
  return document.querySelector(`[data-fasta-content="${cssEscape(`${entityId}:phytozome:${geneId}`)}"]`);
}

function phytozomeRecordForEntity(entity, geneId) {
  const profile = geneProteinMeta(entity);
  return asArray(profile?.phytozome_ids).find((item) => (
    item.gene_id === geneId || item.ontology_id === geneId || item.base_gene_id === geneId
  )) || null;
}

async function loadFastaData(entityId, accession, trigger = null) {
  const entity = state.indexes.entityById.get(entityId) || pathEntityById(entityId);
  if (!entity || !accession) return;
  const container = fastaContentContainer(entityId, accession, trigger);
  if (!container) return;
  container.innerHTML = `<div class="compound-placeholder"><strong>Loading ${esc(accession)}</strong><span>Fetching UniProt FASTA.</span></div>`;
  try {
    const response = await fetch(uniprotFastaUrl(accession));
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const fasta = await response.text();
    const blob = new Blob([fasta], { type: "text/plain" });
    const blobUrl = URL.createObjectURL(blob);
    container.innerHTML = `
      <div class="fasta-result">
        <div class="section-header">
          <h3>${esc(accession)} FASTA</h3>
          <a class="mini-link" href="${esc(blobUrl)}" download="${esc(accession)}.fasta">Download .fasta</a>
        </div>
        <pre class="fasta-sequence">${esc(fasta)}</pre>
      </div>
    `;
  } catch (error) {
    container.innerHTML = `
      <div class="compact-card muted">
        Could not load FASTA in-page: ${esc(error.message)}. Use the Open FASTA link to retrieve it directly from UniProt.
      </div>
    `;
  }
}

function loadPhytozomeFastaData(entityId, geneId, trigger = null) {
  const entity = state.indexes.entityById.get(entityId) || pathEntityById(entityId);
  const item = phytozomeRecordForEntity(entity, geneId);
  const container = phytozomeFastaContentContainer(entityId, geneId, trigger);
  if (!entity || !item || !container) return;
  const fasta = phytozomeFastaText(item);
  if (!fasta) {
    container.innerHTML = `
      <div class="compact-card muted">
        No Phytozome FASTA sequence is available for ${esc(geneId)} in this demo build.
      </div>
    `;
    return;
  }
  const blob = new Blob([fasta], { type: "text/plain" });
  const blobUrl = URL.createObjectURL(blob);
  const filename = safeFastaFilename(geneId || item.gene_id || "phytozome_sequence");
  container.innerHTML = `
    <div class="fasta-result">
      <div class="section-header">
        <h3>${esc(item.gene_id || "Phytozome")} FASTA</h3>
        <a class="mini-link" href="${esc(blobUrl)}" download="${esc(filename)}">Download .fasta</a>
      </div>
      <pre class="fasta-sequence">${esc(fasta)}</pre>
    </div>
  `;
}

function downloadPhytozomeFastaData(entityId, geneId, trigger = null) {
  const entity = state.indexes.entityById.get(entityId) || pathEntityById(entityId);
  const item = phytozomeRecordForEntity(entity, geneId);
  const container = phytozomeFastaContentContainer(entityId, geneId, trigger);
  if (!entity || !item) return;
  const fasta = phytozomeFastaText(item);
  if (!fasta) {
    if (container) {
      container.innerHTML = `
        <div class="compact-card muted">
          No Phytozome FASTA sequence is available for ${esc(geneId)} in this demo build.
        </div>
      `;
    }
    return;
  }
  const blob = new Blob([fasta], { type: "text/plain" });
  const blobUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const filename = safeFastaFilename(geneId || item.gene_id || "phytozome_sequence");
  link.href = blobUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(blobUrl), 1200);
  if (container) {
    container.innerHTML = `<div class="compact-card">Downloaded ${esc(filename)} from the Phytozome source record.</div>`;
  }
}

async function downloadFastaData(entityId, accession, trigger = null) {
  const entity = state.indexes.entityById.get(entityId) || pathEntityById(entityId);
  if (!entity || !accession) return;
  const container = fastaContentContainer(entityId, accession, trigger);
  if (container) {
    container.innerHTML = `<div class="compact-card muted">Preparing ${esc(accession)} FASTA download.</div>`;
  }
  try {
    const response = await fetch(uniprotFastaUrl(accession));
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const fasta = await response.text();
    const blob = new Blob([fasta], { type: "text/plain" });
    const blobUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = blobUrl;
    link.download = `${accession}.fasta`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(blobUrl), 1200);
    if (container) {
      container.innerHTML = `<div class="compact-card">Downloaded ${esc(accession)}.fasta from UniProt.</div>`;
    }
  } catch (error) {
    if (container) {
      container.innerHTML = `
        <div class="compact-card muted">
          Could not download FASTA in-page: ${esc(error.message)}. Use the Open FASTA link to retrieve it directly from UniProt.
        </div>
      `;
    }
  }
}

async function loadPubChemData(entity, cid, container) {
  container.innerHTML = `<div class="compound-placeholder"><strong>Loading PubChem ${esc(cid)}</strong><span>Fetching properties and conformer.</span></div>`;
  const propertyFields = [
    "MolecularFormula",
    "MolecularWeight",
    "XLogP",
    "TPSA",
    "HBondDonorCount",
    "HBondAcceptorCount",
    "RotatableBondCount",
    "IUPACName",
    "CanonicalSMILES"
  ].join(",");
  try {
    const propertyUrl = `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/${encodeURIComponent(cid)}/property/${propertyFields}/JSON`;
    const [properties, sdf] = await Promise.all([
      fetchJsonAbsolute(propertyUrl),
      fetchSdf(cid)
    ]);
    const props = properties?.PropertyTable?.Properties?.[0] || {};
    const molecule = sdf ? parseSdf(sdf) : null;
    container.innerHTML = `
      <div class="compound-grid">
        <div>
          ${molecule ? renderMoleculeSvg(molecule) : compoundImageFallback(cid, entity)}
        </div>
        <div class="compound-properties">
          <h3>${esc(props.IUPACName || entity.selected_label || entityName(entity))}</h3>
          ${compoundOntologyProperties(entity)}
          ${compoundProperty("Formula", props.MolecularFormula)}
          ${compoundProperty("Molecular weight", props.MolecularWeight)}
          ${compoundProperty("XLogP", props.XLogP)}
          ${compoundProperty("TPSA", props.TPSA)}
          ${compoundProperty("H-bond donors", props.HBondDonorCount)}
          ${compoundProperty("H-bond acceptors", props.HBondAcceptorCount)}
          ${compoundProperty("Rotatable bonds", props.RotatableBondCount)}
          ${props.CanonicalSMILES ? `<div class="smiles">${esc(props.CanonicalSMILES)}</div>` : ""}
        </div>
      </div>
    `;
  } catch (error) {
    container.innerHTML = `
      <div class="compound-grid">
        <div>${compoundImageFallback(cid, entity)}</div>
        <div class="compound-properties">
          <h3>${esc(entity.selected_label || entityName(entity))}</h3>
          ${compoundOntologyProperties(entity)}
          <div class="compact-card muted">Live PubChem enrichment failed: ${esc(error.message)}. The local ontology metadata is still shown above.</div>
        </div>
      </div>
    `;
  }
}

async function loadChebiData(entity, id, container) {
  container.innerHTML = `<div class="compound-placeholder"><strong>Loading ${esc(id)}</strong><span>Fetching ChEBI metadata and structure candidates.</span></div>`;
  try {
    const term = await fetchChebiTerm(id);
    const annotation = term.annotation || {};
    const names = [
      term.label,
      entity.selected_label,
      entity.canonical_form,
      ...asArray(term.synonyms).slice(0, 8)
    ].filter(Boolean);
    const cid = await resolvePubChemCidByNames(names);
    let props = {};
    let molecule = null;
    if (cid) {
      const propertyFields = [
        "MolecularFormula",
        "MolecularWeight",
        "XLogP",
        "TPSA",
        "HBondDonorCount",
        "HBondAcceptorCount",
        "RotatableBondCount",
        "IUPACName",
        "CanonicalSMILES"
      ].join(",");
      const [properties, sdf] = await Promise.all([
        fetchJsonAbsolute(`https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/${encodeURIComponent(cid)}/property/${propertyFields}/JSON`),
        fetchSdf(cid)
      ]);
      props = properties?.PropertyTable?.Properties?.[0] || {};
      molecule = sdf ? parseSdf(sdf) : null;
    }
    container.innerHTML = `
      <div class="compound-grid">
        <div>
          ${molecule ? renderMoleculeSvg(molecule) : chebiStructureFallback(id, term, cid)}
        </div>
        <div class="compound-properties">
          <h3>${esc(term.label || entity.selected_label || entityName(entity))}</h3>
          ${compoundOntologyProperties(entity)}
          ${compoundProperty("ChEBI ID", id)}
          ${compoundProperty("Ontology", "ChEBI")}
          ${compoundProperty("Formula", firstAnnotation(annotation.generalized_empirical_formula) || props.MolecularFormula)}
          ${compoundProperty("Mass", firstAnnotation(annotation.mass) || props.MolecularWeight)}
          ${compoundProperty("Monoisotopic mass", firstAnnotation(annotation.monoisotopic_mass))}
          ${compoundProperty("Charge", firstAnnotation(annotation.charge))}
          ${cid ? compoundProperty("Resolved PubChem CID", cid) : ""}
          ${term.description?.length ? `<div class="compact-card">${esc(term.description[0])}</div>` : ""}
          ${term.synonyms?.length ? `<div class="compact-card"><strong>Synonyms</strong><br>${badges(term.synonyms.slice(0, 12))}</div>` : ""}
          ${firstAnnotation(annotation.smiles_string) || props.CanonicalSMILES ? `<div class="smiles">${esc(firstAnnotation(annotation.smiles_string) || props.CanonicalSMILES)}</div>` : ""}
          ${firstAnnotation(annotation.inchi_string) ? `<div class="smiles">${esc(firstAnnotation(annotation.inchi_string))}</div>` : ""}
        </div>
      </div>
    `;
  } catch (error) {
    container.innerHTML = `
      <div class="compound-grid">
        <div>${chebiStructureFallback(id, {}, "")}</div>
        <div class="compound-properties">
          <h3>${esc(entity.selected_label || entityName(entity))}</h3>
          ${compoundOntologyProperties(entity)}
          <div class="compact-card muted">Live ChEBI enrichment failed: ${esc(error.message)}. The local Step 9 metadata is still shown above.</div>
        </div>
      </div>
    `;
  }
}

async function fetchChebiTerm(id) {
  const numeric = id.replace(/^CHEBI:/i, "");
  const iri = `http://purl.obolibrary.org/obo/CHEBI_${numeric}`;
  const url = `https://www.ebi.ac.uk/ols4/api/ontologies/chebi/terms?iri=${encodeURIComponent(iri)}`;
  const data = await fetchJsonAbsolute(url);
  const term = data?._embedded?.terms?.[0];
  if (!term) throw new Error(`No OLS term for ${id}`);
  return term;
}

async function resolvePubChemCidByNames(names) {
  const unique = Array.from(new Set(names.map((name) => String(name || "").trim()).filter(Boolean)));
  for (const name of unique.slice(0, 10)) {
    try {
      const data = await fetchJsonAbsolute(`https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/${encodeURIComponent(name)}/cids/JSON`);
      const cid = data?.IdentifierList?.CID?.[0];
      if (cid) return String(cid);
    } catch (error) {
      // Try the next ChEBI synonym.
    }
  }
  return "";
}

function firstAnnotation(value) {
  if (Array.isArray(value)) return value.length ? value[0] : "";
  return value || "";
}

async function fetchJsonAbsolute(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
}

async function fetchSdf(cid) {
  const urls = [
    `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/${encodeURIComponent(cid)}/SDF?record_type=3d`,
    `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/${encodeURIComponent(cid)}/SDF?record_type=2d`
  ];
  for (const url of urls) {
    const response = await fetch(url);
    if (!response.ok) continue;
    const text = await response.text();
    if (text.includes("V2000") || text.includes("V3000")) return text;
  }
  return "";
}

function parseSdf(sdf) {
  const lines = sdf.split(/\r?\n/);
  const countsIndex = lines.findIndex((line) => /V2000/.test(line));
  if (countsIndex < 0) return null;
  const counts = lines[countsIndex].trim().split(/\s+/);
  const atomCount = Number(counts[0]);
  const bondCount = Number(counts[1]);
  if (!atomCount || Number.isNaN(atomCount)) return null;
  const atoms = [];
  const bonds = [];
  for (let i = 0; i < atomCount; i += 1) {
    const line = lines[countsIndex + 1 + i] || "";
    const parts = line.trim().split(/\s+/);
    atoms.push({
      x: Number(parts[0] || 0),
      y: Number(parts[1] || 0),
      z: Number(parts[2] || 0),
      element: parts[3] || "C"
    });
  }
  for (let i = 0; i < bondCount; i += 1) {
    const line = lines[countsIndex + 1 + atomCount + i] || "";
    const parts = line.trim().split(/\s+/);
    bonds.push({
      a: Number(parts[0]) - 1,
      b: Number(parts[1]) - 1,
      order: Number(parts[2] || 1)
    });
  }
  return { atoms, bonds };
}

function renderMoleculeSvg(molecule) {
  const projected = projectAtoms(molecule.atoms);
  const bonds = molecule.bonds.map((bond) => {
    const a = projected[bond.a];
    const b = projected[bond.b];
    if (!a || !b) return "";
    const width = bond.order > 1 ? 5 : 3;
    return `<line class="bond" x1="${a.sx}" y1="${a.sy}" x2="${b.sx}" y2="${b.sy}" stroke-width="${width}"></line>`;
  }).join("");
  const atoms = projected
    .slice()
    .sort((a, b) => a.depth - b.depth)
    .map((atom) => {
      const radius = atom.element === "H" ? 6 : 11;
      return `
        <g>
          <circle cx="${atom.sx}" cy="${atom.sy}" r="${radius}" fill="${atomColor(atom.element)}"></circle>
          ${atom.element !== "C" && atom.element !== "H" ? `<text x="${atom.sx}" y="${atom.sy + 4}">${escSvg(atom.element)}</text>` : ""}
        </g>
      `;
    }).join("");
  return `
    <svg class="molecule-svg" viewBox="0 0 520 320" role="img" aria-label="3D molecular conformer">
      <rect x="1" y="1" width="518" height="318" rx="18"></rect>
      <g>${bonds}${atoms}</g>
    </svg>
  `;
}

function projectAtoms(atoms) {
  const cy = Math.cos(-0.55);
  const sy = Math.sin(-0.55);
  const cx = Math.cos(0.7);
  const sx = Math.sin(0.7);
  const points = atoms.map((atom) => {
    const x1 = atom.x * cy + atom.z * sy;
    const z1 = -atom.x * sy + atom.z * cy;
    const y1 = atom.y * cx - z1 * sx;
    const depth = atom.y * sx + z1 * cx;
    return { ...atom, px: x1, py: y1, depth };
  });
  const minX = Math.min(...points.map((p) => p.px));
  const maxX = Math.max(...points.map((p) => p.px));
  const minY = Math.min(...points.map((p) => p.py));
  const maxY = Math.max(...points.map((p) => p.py));
  const scale = Math.min(420 / Math.max(maxX - minX, 1), 250 / Math.max(maxY - minY, 1));
  return points.map((point) => ({
    ...point,
    sx: ((point.px - (minX + maxX) / 2) * scale + 260).toFixed(1),
    sy: ((point.py - (minY + maxY) / 2) * scale + 160).toFixed(1)
  }));
}

function atomColor(element) {
  const colors = {
    H: "#e9ecef",
    C: "#4b5563",
    N: "#3b6fb6",
    O: "#d24c4c",
    S: "#d1a21f",
    P: "#d0702f",
    Cl: "#43a047",
    F: "#65b96b",
    Br: "#8c4a2f",
    I: "#7d5aa6"
  };
  return colors[element] || "#87919a";
}

function compoundImageFallback(cid, entity) {
  return `
    <div class="compound-image-fallback">
      <img src="https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/${esc(cid)}/PNG?image_size=large" alt="${esc(entityName(entity))} structure">
    </div>
  `;
}

function chebiStructureFallback(id, term, resolvedCid) {
  const annotation = term?.annotation || {};
  const smiles = firstAnnotation(annotation.smiles_string);
  const formula = firstAnnotation(annotation.generalized_empirical_formula);
  if (resolvedCid) {
    return `
      <div class="compound-image-fallback">
        <img src="https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/${esc(resolvedCid)}/PNG?image_size=large" alt="${esc(term?.label || id)} structure">
      </div>
    `;
  }
  return `
    <div class="chebi-fallback">
      <div class="chebi-orb">ChEBI</div>
      <strong>${esc(id)}</strong>
      <span>${esc(term?.label || "Chemical entity")}</span>
      ${formula ? `<code>${esc(formula)}</code>` : ""}
      ${smiles ? `<code>${esc(smiles)}</code>` : ""}
      <p class="muted">ChEBI metadata loaded. A structure drawing appears when a PubChem structure can be resolved from the ChEBI label or synonym.</p>
    </div>
  `;
}

function compoundProperty(label, value) {
  if (value === undefined || value === null || value === "") return "";
  return `<div class="compound-property"><span>${esc(label)}</span><strong>${esc(value)}</strong></div>`;
}

function externalLinks(entity) {
  const links = asArray(entity?.external_links);
  if (!links.length) return `<div class="compact-card muted">No external ontology link for this entity.</div>`;
  return `<div class="external-links">${links.map((link) => `<a href="${esc(link.url)}" target="_blank" rel="noreferrer">${esc(link.label)}</a>`).join("")}</div>`;
}

init().catch((error) => {
  console.error(error);
  els.mainPanel.innerHTML = `
    <div class="empty-state">
      <div>
        <strong>Could not load the demo</strong>
        <span>${esc(error.message)}</span>
      </div>
    </div>
  `;
});
