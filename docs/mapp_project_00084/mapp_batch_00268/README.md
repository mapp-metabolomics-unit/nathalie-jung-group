# mapp_batch_00268

Untargeted metabolomics on human cells - nanoplastics exp1 project - Lipido

## Folders

- [`metadata/`](metadata/): raw and curated sample metadata.
- [`metadata/original/`](metadata/original/): original metadata files as received.
- [`metadata/treated/`](metadata/treated/): cleaned or transformed metadata files.
- [`results/`](results/): analysis outputs generated for the batch.
- [`results/cytoscape/`](results/cytoscape/): network files and exports for Cytoscape.
- [`results/met_annot_enhancer/`](results/met_annot_enhancer/): metabolite annotation enhancement outputs.
- [`results/metaboanalyst/`](results/metaboanalyst/): MetaboAnalyst-ready files and outputs.
- [`results/mzmine/`](results/mzmine/): MZmine batch files and processing outputs.
- [`results/sirius/`](results/sirius/): SIRIUS/CSI:FingerID outputs.
- [`results/stats/`](results/stats/): statistical analysis outputs.
- [`results/xcalibur/`](results/xcalibur/): Xcalibur exports and related files.
- [`report/`](report/): rendered or intermediate report files.

## PET/PS 100 vs untreated comparisons

Eight comparison recipes are in `recipes/{a549,mdm}-{pet,ps}100-{paired,unpaired}/recipe.yaml`. Each uses the sealed `recipes/full-study` dataset and study hash. The paired recipes block by `ATTRIBUTE_experimental_unit`; the unpaired recipes use the same treatment/control samples without blocking. Each comparison has three complete treatment/control pairs.

From the **group repository root**, with the sibling `biostat_toolbox` checkout installed as described in its README, validate, preview, then run each comparison in order:

```bash
BATCH="$PWD/docs/mapp_project_00084/mapp_batch_00268"
(
  cd ../biostat_toolbox/biostats || exit 1
  for comparison in \
    a549-pet100-paired a549-pet100-unpaired \
    a549-ps100-paired a549-ps100-unpaired \
    mdm-pet100-paired mdm-pet100-unpaired \
    mdm-ps100-paired mdm-ps100-unpaired
  do
    for action in validate plan run
    do
      rig run -r 4.6.1 -f run.R -- "$action" \
        --dataset "$BATCH/recipes/full-study/dataset.yaml" \
        --recipe "$BATCH/recipes/$comparison/recipe.yaml" || exit 1
    done
  done
)
```

`run` requires a clean, committed toolbox checkout. The study must already be sealed under the hash referenced by the comparison recipes; these commands do not rerun the study. Completed runs update `results/stats/README.md` and the dashboard.
