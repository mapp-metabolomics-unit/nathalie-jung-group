### Move .mzML file to local directory
For this we use https://github.com/mapp-metabolomics-unit/msfiles-selector

Once you have cloned this repo you can run the following command to move the files (from the src dir)

```bash
sg commons-users -c './copy_files.sh -i /mnt/bigdata/mapp/public/QE_HF_unifr/converted -o /msdata/mapp_project_00084/mapp_batch_00260 -p "*20260513_CVOL_02_29*.mzML"'
```

### Transfer the metadata to the msdata folder

```bash
cd ./docs/mapp_project_00084/mapp_batch_00260/
cp ./metadata/treated/mapp_batch_00260_metadata.tsv /msdata/mapp_project_00084/mapp_batch_00260/mapp_batch_00260_metadata.tsv
```

And fill the mzbatch file with the paths to the files

Navigate to the Mzmine results folder

```bash
cd ./docs/mapp_project_00084/mapp_batch_00260/results/mzmine
```

And proceed to awk black magic to update the mzmine xml file

```bash
awk -v dir="/msdata/mapp_project_00084/mapp_batch_00260" '
BEGIN {
  cmd = "ls " dir "/*.mzML"
  while (cmd | getline file) {
    files = files "                <file>" file "</file>\n"
  }
  # Remove the trailing newline character from files
  sub(/\n$/, "", files)
}
{
  if ($0 ~ /<parameter name="File names">/) {
    print $0
    print files
    while (getline > 0) {
      if ($0 ~ /<\/parameter>/) {
        print $0
        break
      }
    }
  } else {
    print
  }
}' mapp_batch_00260.mzbatch_template > mapp_batch_00260.mzbatch
```

### Running Mzmine

You might need to source the mzmine environment

```bash
source /etc/profile
```

From the Mzmine results folder

```bash
sg commons-users -c '/opt/mzmine/bin/mzmine -batch mapp_batch_00260.mzbatch'
```


### Taxonomy handling

Install taxonomical-utils

```bash
pip install taxonomical_utils
```

Run the following command to get the taxonomy for the results:

1. resolve

```bash
taxonomical-utils resolve-taxa --input-file docs/mapp_project_00084/mapp_batch_00260/metadata/original/mapp_batch_00260_metadata.tsv --output-file docs/mapp_project_00084/mapp_batch_00260/metadata/original/mapp_batch_00260_metadata_resolved.csv --org-column-header source_taxon
```

2. retrieve upper taxa lineage
    
```bash
taxonomical-utils append-taxonomy --input-file docs/mapp_project_00084/mapp_batch_00260/metadata/original/mapp_batch_00260_metadata_resolved.csv --output-file docs/mapp_project_00084/mapp_batch_00260/metadata/original/metadata_upper_taxa_lineage.csv
```

3. append WD ids 

```bash
taxonomical-utils append-wd-id --input-file docs/mapp_project_00084/mapp_batch_00260/metadata/original/mapp_batch_00260_metadata_resolved.csv --output-file docs/mapp_project_00084/mapp_batch_00260/metadata/original/mapp_batch_00260_wd.csv
```

```bash
taxonomical-utils merge --input-file docs/mapp_project_00084/mapp_batch_00260/metadata/original/mapp_batch_00260_metadata.tsv --resolved-taxa-file docs/mapp_project_00084/mapp_batch_00260/metadata/original/mapp_batch_00260_metadata_resolved.csv --upper-taxa-lineage-file docs/mapp_project_00084/mapp_batch_00260/metadata/original/metadata_upper_taxa_lineage.csv --wd-file docs/mapp_project_00084/mapp_batch_00260/metadata/original/mapp_batch_00260_wd.csv --output-file docs/mapp_project_00084/mapp_batch_00260/metadata/treated/mapp_batch_00260_metadata.tsv --org-column-header source_taxon
```

Alternatively you can run all commands at ounce by running the following command:

```bash
taxonomical-utils resolve-taxa --input-file docs/mapp_project_00084/mapp_batch_00260/metadata/original/mapp_batch_00260_metadata.tsv --output-file docs/mapp_project_00084/mapp_batch_00260/metadata/original/mapp_batch_00260_metadata_resolved.csv --org-column-header source_taxon && \
taxonomical-utils append-taxonomy --input-file docs/mapp_project_00084/mapp_batch_00260/metadata/original/mapp_batch_00260_metadata_resolved.csv --output-file docs/mapp_project_00084/mapp_batch_00260/metadata/original/metadata_upper_taxa_lineage.csv && \
taxonomical-utils append-wd-id --input-file docs/mapp_project_00084/mapp_batch_00260/metadata/original/mapp_batch_00260_metadata_resolved.csv --output-file docs/mapp_project_00084/mapp_batch_00260/metadata/original/mapp_batch_00260_wd.csv && \
taxonomical-utils merge --input-file docs/mapp_project_00084/mapp_batch_00260/metadata/original/mapp_batch_00260_metadata.tsv --resolved-taxa-file docs/mapp_project_00084/mapp_batch_00260/metadata/original/mapp_batch_00260_metadata_resolved.csv --upper-taxa-lineage-file docs/mapp_project_00084/mapp_batch_00260/metadata/original/metadata_upper_taxa_lineage.csv --wd-file docs/mapp_project_00084/mapp_batch_00260/metadata/original/mapp_batch_00260_wd.csv --output-file docs/mapp_project_00084/mapp_batch_00260/metadata/treated/mapp_batch_00260_metadata.tsv --org-column-header source_taxon
```

```bash

## Sirius

```bash
ssh commons-server
tmux a -t sirius
cd ~/git_repos/mapp-metabolomics-unit/nathalie-jung-group/docs/mapp_project_00084/mapp_batch_00260/results
```

### Login

```bash
sirius login --user-env SIRIUS_USERNAME --password-env SIRIUS_PASSWORD
```


### Run sirius

(from the results of mapp_batch_00260)

#### Positive mode


```bash
sirius -i ./mzmine/mapp_batch_00260_sirius.mgf --output ./sirius/mapp_batch_00260 --maxmz 2500 config --AlgorithmProfile=orbitrap --MS2MassDeviation.allowedMassDeviation=5.0ppm --SpectralSearchDB=METACYC,BloodExposome,CHEBI,COCONUT,FooDB,GNPS,HMDB,HSDB,KEGG,KNAPSACK,LOTUS,LIPIDMAPS,MACONDA,MESH,MiMeDB,NORMAN,PLANTCYC,PUBCHEMANNOTATIONBIO,PUBCHEMANNOTATIONDRUG,PUBCHEMANNOTATIONFOOD,PUBCHEMANNOTATIONSAFETYANDTOXIC,SUPERNATURAL,TeroMol,YMDB --AdductSettings.fallback=[[M+H]+,[M+Na]+,[M+K]+,[M+H3N+H]+,[M-H2O+H]+] --FormulaSettings.enforced=H,C,N,O,P --IdentitySearchSettings.precursorDeviation=20.0ppm --FormulaSearchSettings.performBottomUpAboveMz=0 --FormulaSearchDB=, --StructureSearchDB=METACYC,BloodExposome,CHEBI,COCONUT,FooDB,GNPS,HMDB,HSDB,KEGG,KNAPSACK,LOTUS,LIPIDMAPS,MACONDA,MESH,MiMeDB,NORMAN,PLANTCYC,PUBCHEMANNOTATIONBIO,PUBCHEMANNOTATIONDRUG,PUBCHEMANNOTATIONFOOD,PUBCHEMANNOTATIONSAFETYANDTOXIC,SUPERNATURAL,TeroMol,YMDB formulas zodiac fingerprints classes structures write-summaries
```


#### Negative mode

```bash
sirius -i ./mzmine/mapp_batch_00260_sirius.mgf --output ./sirius/mapp_batch_00260 --maxmz 2500 config --AlgorithmProfile=orbitrap --MS2MassDeviation.allowedMassDeviation=5.0ppm --SpectralSearchDB=METACYC,BloodExposome,CHEBI,COCONUT,FooDB,GNPS,HMDB,HSDB,KEGG,KNAPSACK,LOTUS,LIPIDMAPS,MACONDA,MESH,MiMeDB,NORMAN,PLANTCYC,PUBCHEMANNOTATIONBIO,PUBCHEMANNOTATIONDRUG,PUBCHEMANNOTATIONFOOD,PUBCHEMANNOTATIONSAFETYANDTOXIC,SUPERNATURAL,TeroMol,YMDB --AdductSettings.fallback=[[M-H]-,[M+Cl]-,[M+Br]-,[M-H2O-H]-] --FormulaSettings.enforced=H,C,N,O,P --IdentitySearchSettings.precursorDeviation=20.0ppm --FormulaSearchSettings.performBottomUpAboveMz=0 --FormulaSearchDB=, --StructureSearchDB=METACYC,BloodExposome,CHEBI,COCONUT,FooDB,GNPS,HMDB,HSDB,KEGG,KNAPSACK,LOTUS,LIPIDMAPS,MACONDA,MESH,MiMeDB,NORMAN,PLANTCYC,PUBCHEMANNOTATIONBIO,PUBCHEMANNOTATIONDRUG,PUBCHEMANNOTATIONFOOD,PUBCHEMANNOTATIONSAFETYANDTOXIC,SUPERNATURAL,TeroMol,YMDB,LotusExpanded formulas zodiac fingerprints classes structures write-summaries
```


### Move to the sirius results folder

```bash
cd ./sirius/mapp_batch_00260
```


### Move results one directory up

```bash
mv *.tsv *.mztab -t ..
```

### Run met-annot-enhancer

```yaml
# default.yaml

---
# parameters

options:
  download_gnps_job: True
  do_spectral_match: True
  do_taxo_resolving: True
  do_chembl_match: True
  keep_lowest_taxon: False
  output_plots: True
  
paths:
  gnps_job_id: 397f4a4b08064ccd81495f0f93b814c4 # The GNPS job id you want to treat
  input_folder: /Users/voletco/git_repos/mapp-metabolomics-unit/nathalie-jung-group/docs/mapp_project_00084/mapp_batch_00260/results/met_annot_enhancer # The path were you want your GNPS job folder to be placed
  project_name: mapp_batch_00260 #ISDB_annot_LP_plantfungi_set # The name you want to give to your project, output resulst in data_out/project_name
  output_folder: /Users/voletco/git_repos/mapp-metabolomics-unit/nathalie-jung-group/docs/mapp_project_00084/mapp_batch_00260/results/met_annot_enhancer # the path for your output to be stored in
  metadata_path: /Users/pma/01_large_files/lotus/230106_frozen_metadata.csv # Path to the metadata of the spectral file /210715_inhouse_metadata.csv /211220_frozen_metadata.csv You can use multiple ones. Just list them as [a.csv, b.csv, c.csv]
  db_file_path: /Users/pma/01_large_files/mgf/isdb_pos_cleaned.pkl  # Path to your spectral library file. You can use multiple ones. Just list them as [a.mgf, b.mgf, c.mgf]
  adducts_pos_path: data_loc/230106_frozen_metadata/230106_frozen_metadata_adducts_pos.tsv.gz # Path to the adducts file in pos mode
  adducts_neg_path: data_loc/230106_frozen_metadata/230106_frozen_metadata_adducts_neg.tsv.gz # Path to the adducts file in neg mode

metadata_params:
  organism_header: 'organism_name' #Specifiy the header in the spectral db metadata file

spectral_match_params:
  parent_mz_tol: 0.01 # the parent mass tolerance to use for spectral matching (in Da)
  msms_mz_tol: 0.01 # the msms mass tolerance to use for spectral matching (in Da)
  min_cos: 0.2 # the minimal cosine to use for spectral matching
  min_peaks: 6 # the minimal matching peaks number to use for spectral matching

repond_params:
  Top_N_Sample: 2 # Max number of contributors to take into account for taxo reponderation, set to 0 for all
  top_to_output: 1 # Top X for final ouput
  ppm_tol: 2 # ppm tol to be used for ms1 match
  polarity: 'pos' # ion mode you are working with (pos or neg)
  organism_header: 'source_taxon' # Mandatory: header of your samples' organism in metadata file
  var_one_header: 'source_taxon' # Optional (Run_line_x_line parameter)

  sampletype_header: 'sample_type' # The header for a column describing the sample type (sample, BK or QC)
  sampletype_value_sample: 'sample' # The value related to samples in the column describing the sample type.
  sampletype_value_bk: 'blank' # The value related to blanks in the column describing the sample type.
  sampletype_value_qc: 'QC' # The value related to QC in the column describing the sample type.
  use_post_taxo: True # Set True if you want to use rank after taxonomical reweighting for consensus chemical class determination, else set to False
  top_N_chemical_consistency: 15 # Top N to use for chemical consistency 
  file_extension: '.mzML' # MS filename extension (or any common pattern in all your MS filenames)
  msfile_suffix: ' Peak area' # MS filename suffix (for example ' Peak area') to remove to match with metadata, empty if nothing to remove
  min_score_taxo_ms1: 6 # Minimum taxonomical score (5 = order, 6 = family, 7 = genus, 8 = species)
  min_score_chemo_ms1: 1 # Minimum chemical consistency score (1 = NPClassifier pathway level consistency, 2 = NPClassifier superclass level consistency, 3 = NPClassifier class level consistency )
  msms_weight: 4 # A weight attributed to the spectral score
  taxo_weight: 1 # A weight attributed to the taxonomical score
  chemo_weight: 0.5 # A weight attributed to the chemical consistency score

plotting_params:
  drop_blanks: True #Wether to consider blanks or not in the outputs
  drop_pattern: '^bk$|^QC$|^media$|^nd$|^ND$|^NA$|^Blank$|^blank$|^BK$' #Wether to consider blanks or not in the outputs. These are regex be sure to add ^and $ to specify the position of the pattern
  multi_plot: True #Wether to consider a single or a combined header in the sample selection

filtering_params:
  lib_to_keep: 'ISDB|MS1_match'
  minimal_taxo_score: 6
  minimal_chemo_score: 2
  minimal_total_score: 8
```

```bash
conda activate met_annot_enhancer
```
```bash
python /Users/voletco/git_repos/mapp-metabolomics-unit/mandelbrot_project/met_annot_enhancer/src/dev/nb.py
```

### Remove symlinks
This command should remove symlinks from the downloaded GNPS job folder (make sure to run it from the mapp_batch folder)

```bash
cd ./docs/mapp_project_00084/mapp_batch_00260
find ./results/met_annot_enhancer/397f4a4b08064ccd81495f0f93b814c4 -type l -exec rm {} +
```


### Run biostat_toolbox

#### Params user

```yaml
paths:
  docs: '/Users/voletco/git_repos/mapp-metabolomics-unit/nathalie-jung-group/docs'
  output: '/Users/voletco/git_repos/mapp-metabolomics-unit/nathalie-jung-group/docs/mapp_project_00084/mapp_batch_00260/results/stats' # Not mandatory, default is in the stats subdirectory

operating_system:
  system: unix # 
  pandoc: "C:/Program Files/RStudio/resources/app/bin/quarto/bin/tools" ### only for windows
```

#### Params

```yaml
mapp_project : mapp_project_00084
mapp_batch : mapp_batch_00260
met_annot_enhancer_folder : mapp_batch_00260
gnps_job_id : 397f4a4b08064ccd81495f0f93b814c4

dataset_experiment : 
  name: "mapp_batch_00260 LCMS metabolomics dataset"
  description: "Untargeted metabolomics on human cells - nanoplastics pilot project - Lipido"

ms_files_extension: ".mzML"


actions:
  scale_method : 'pareto' # 'autoscale' or 'pareto' or 'none'
  ponderate_data :
    run : FALSE
    factor_name : ''
  prune_data :
    threshold : 
  run_PLSDA : TRUE
  calculate_multi_series_fc : FALSE
  run_fc_treemaps : TRUE
  run_with_gap_filled: FALSE
  run_cytoscape_connector : FALSE



options:
  gnps_column_for_boxplots : 
    factor_name : 'source_taxon'

filter_blank :
  fold_change : # (numeric) Features with fold change less than this value are removed. The default is 20.
  factor_name : '' # (character) The factor name in the sample metadata file that contains the sample type. The default is "sample_type".
  blank_label : '' # (character) The label used for the blanks in the sample metadata file. The default is "BK".
  qc_label : '' # (character) The label used for the QC samples in the sample metadata file. The default is "QC". Else use NULL, If set to NULL then the median of the samples is used.
  fraction_in_blank : # (numeric) Features present in less than this proportion of the blanks are not considered for removal. The default is 0.

filter_sample_type :
  mode : 'include' # 'include' or 'exclude', if '', the filter is not applied
  factor_name : 'sample_type'
  levels :
   - 'sample'

filter_sample_metadata_one :
  mode : '' # 'include' or 'exclude', if '', the filter is not applied
  factor_name : '' 
  levels : 
    - ''

filter_sample_metadata_two :
  mode : '' # 'include' or 'exclude', if '', the filter is not applied
  factor_name : '' 
  levels : 
      - ''

filter_variable_metadata_one :
  mode : ''
  factor_name : '' # E.g. 'canopus_npc_pathway'
  levels : '' # E.g. One of "Alkaloids", "Amino acids and Peptides", "Terpenoids", "Fatty acids", "Carbohydrates", "Polyketides", "Shikimates and Phenylpropanoids" for levels if you use factor_name : 'NPC.pathway_canopus'

filter_variable_metadata_two :
  mode : ''
  factor_name : '' # E.g. 'canopus_npc_pathway'
  levels : '' # E.g. One of "Alkaloids", "Amino acids and Peptides", "Terpenoids", "Fatty acids", "Carbohydrates", "Polyketides", "Shikimates and Phenylpropanoids" for levels if you use factor_name : 'canopus_npc_pathway_probability'


filter_variable_metadata_annotated :
  mode : ''
  factor_name : '' # E.g. 'canopus_npc_pathway'
  levels : '' # E.g. 'NA' 

filter_variable_metadata_num :
  mode : '' # 'above' or 'below', if '', the filter is not applied
  factor_name : '' # e.g e.g 'sirius_confidencescore' or 'canopus_npc_pathway_probability'
  level :  # Numerical value. E.g 0.5


target:
  sample_metadata_header: "source_taxon" # This variable will be used throughout the whole script as you can see
   ## XXX_simplified  for combined horizontally


colors:
  continuous: FALSE
  all:
   key:
    - 'pDelta'
    - 'psDelta'
    - 'sDelta'
    - 'WT'

   value:
      # - "darkorchid" # 'blastogenesis'
      # - "goldenrod" # 'healing'
      # - "chartreuse" # 'regeneration'
      - "coral" # 'pDelta'
      - "cornflowerblue" # 'psDelta'
      - "cyan" # 'sDelta'
      - "darkblue" # 'WT'


# Only colors without a numeric (for some reason iheatmapr appears to not like these)

# http://www.stat.columbia.edu/~tzheng/files/Rcolor.pdf
# https://r-charts.com/colors/
# https://colors.dopely.top/color-mixer/333399-50-cc9933-50
# https://www.colorhexa.com/483d8b
# 

# "aliceblue", "antiquewhite", "aquamarine", "azure", "beige", "bisque", "blanchedalmond",
# "blueviolet", "brown", "burlywood", "cadetblue", "chartreuse", "chocolate", "coral",
# "cornflowerblue", "cornsilk", "crimson", "darkblue", "darkcyan", "darkgoldenrod",
# "darkgray", "darkgreen", "darkkhaki", "darkmagenta", "darkolivegreen", "darkorange",
# "darkorchid", "darkred", "darksalmon", "darkseagreen", "darkslateblue", "darkslategray",
# "darkturquoise", "darkviolet", "deeppink", "deepskyblue", "dimgray", "dodgerblue",
# "firebrick", "floralwhite", "forestgreen", "gainsboro", "ghostwhite", "gold", "goldenrod",
# "greenyellow", "honeydew", "hotpink", "indianred", "indigo", "ivory", "khaki", "lavender",
# "lavenderblush", "lawngreen", "lemonchiffon", "lightblue", "lightcoral", "lightcyan",
# "lightgoldenrodyellow", "lightgray", "lightgreen", "lightpink", "lightsalmon",
# "lightseagreen", "lightskyblue", "lightslategray", "lightsteelblue", "lightyellow",
# "limegreen", "linen", "magenta", "maroon", "mediumaquamarine", "mediumblue", "mediumorchid",
# "mediumpurple", "mediumseagreen", "mediumslateblue", "mediumspringgreen", "mediumturquoise",
# "mediumvioletred", "midnightblue", "mintcream", "mistyrose", "moccasin", "navajowhite",
# "navy", "oldlace", "olivedrab", "orange", "orangered", "orchid", "palegoldenrod",
# "palegreen", "paleturquoise", "palevioletred", "papayawhip", "peachpuff", "peru", "pink",
# "plum", "powderblue", "purple", "rosybrown", "royalblue", "saddlebrown", "salmon",
# "sandybrown", "seagreen", "seashell", "sienna", "skyblue", "slateblue", "slategray",
# "snow", "springgreen", "steelblue", "tan", "thistle", "tomato", "turquoise", "violet",
# "wheat", "whitesmoke", "yellowgreen"



# The data intensity (using DE_original, that is unscaled data) for all levels within the following list of factor_names will be meaned and outputted in their respective new columns. This can be usefull e.g. for pie charts groups used in Cytoscape.
to_mean:
  factor_name:
    - "source_taxon"


# Here we can alter the original sample metadata file if the levels or factors have not been correctly defined in the initial file.
# First we work vertically (within a given SM column)
# The new levels will be named as follows: alphabetically ordered and separated by an underscore.
# E.g. if you choose to combine Ag and Ab the resulting level will be Ab_Ag. These will appear in a new column which will be name by the name of the original colum suffixed by '_simplified'


to_combine_vertically: 
  # column1: 
  #   factor_name:
  #   groups:
  #     group1:
  #       levels:
  #     group2: 
  #       levels:
  # # column2: 
  #   name: "sample_type"
  #   groups:
  #     group1:
  #       cols: 
  #       - "sample"
  #       - "QC"

# Then we work horizontally (across SM columns)
# This action is restricted to rows where sample_type == "sample"
# The levels are combined row-wise using _ as separator.
# The resulting column is named by the alphabetically ordered, _ separated, combination of the combined factor_names. (e.g. genotype_period)


to_combine_horizontally:
  factor_name: 
    #  - "source_taxon"


multi_series:
  # colname: 'time.point'
  # points:
  #    - '00'
  #    - '04'
  #    - '08'
  #    - '12'
  #    - '16'
  #    - '20'


boxplot:
  topN : 16 # N for TopN boxplots to output 

posthoc:
  p_value: 0.05 # p-Value for filtering th RF inputs

heatmap:
  topN : 100 # N for TopN features to output in the heatmap


feature_to_filter :

```

Launch the scripts

``````bash
Rscript /Users/voletco/git_repos/mapp-metabolomics-unit/biostat_toolbox/src/biostat_toolbox.r
```


### Met-annot-unifer

You will need to met-annot-unifier-cli installed

```bash
pip install met-annot-unifier
```

In case you want to update the package, you can run the following command:

```bash
pip install met-annot-unifier -U
```

Make sure you are in the correct directory

```bash
cd ./docs/mapp_project_00084/mapp_batch_00260/
```


#### Align horizontally

```bash
met-annot-unifier-cli align-horizontally --canopus-file ./results/sirius/canopus_structure_summary.tsv --gnps-file ./results/met_annot_enhancer/397f4a4b08064ccd81495f0f93b814c4/nf_output/library/merged_results_with_gnps.tsv --gnps-mn-file ./results/met_annot_enhancer/397f4a4b08064ccd81495f0f93b814c4/nf_output/networking/clustersummary_with_network.tsv --sirius-file ./results/sirius/structure_identifications.tsv --isdb-file ./results/met_annot_enhancer/mapp_batch_00260/mapp_batch_00260_spectral_match_results_repond_flat.tsv --output ./results/tmp/mapp_batch_00260_met_annot_unified_horizontal.tsv
```

#### Align vertically

```bash
met-annot-unifier-cli align-vertically  --gnps-file ./results/met_annot_enhancer/397f4a4b08064ccd81495f0f93b814c4/nf_output/library/merged_results_with_gnps.tsv --isdb-file ./results/met_annot_enhancer/mapp_batch_00260/mapp_batch_00260_spectral_match_results_repond_flat.tsv --sirius-file ./results/sirius/structure_identifications.tsv  --output ./results/tmp/mapp_batch_00260_met_annot_unified_vertical.tsv
```