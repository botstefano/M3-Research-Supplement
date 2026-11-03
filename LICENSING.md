# Licensing and reuse

This repository uses **two complementary licenses**, according to the type of material. The authors, Estefano Dubersky Urbina-Justiniano and José Brandon Laiza-Condormango, confirm that they are authorized to license their original contributions under the terms stated below.

| Material | License | Scope |
|---|---|---|
| Source code, scripts, simulation engine, tests, JSON schemas/templates and PPO checkpoints | MIT | `src/**`, `scripts/**` (except dependency lists), `public/research-v3/**`, `package.json`, `.github/**`, `generar_manifest_sha256.ps1` |
| Research documentation, metadata and original/derived aggregate tables | Creative Commons Attribution 4.0 International (CC BY 4.0) | `README.md`, `docs/**`, `data/**`, `CITATION.cff`, `ZENODO_METADATA.md`, `NOTICE.md`, `REPOSITORY_SETUP.md`, `MANIFEST_SHA256.txt` |

The complete MIT license text is in [LICENSES/MIT.txt](LICENSES/MIT.txt). The CC BY 4.0 license is identified in [LICENSES/CC-BY-4.0.md](LICENSES/CC-BY-4.0.md), which links to the canonical legal code published by Creative Commons.

## Third-party source material

The six files under `data/constancia_aggregated/` contain the authors' statistical summaries derived from values reported in Hudbay Minerals Inc. (2021), Table 13-2. The source report and its row-level table are not included. CC BY 4.0 applies only to rights the authors hold in their original selection, calculations, descriptions and presentation; it does **not** grant rights over Hudbay's report, marks or underlying source material, and does not imply endorsement or permission from Hudbay. Users must consult and cite the original source when reusing those derived summaries.

No third-party report, logo, trademark or original row-level survey dataset is relicensed by this repository. See [NOTICE.md](NOTICE.md) and [docs/FUENTE_Y_NOTAS_CONSTANCIA.md](docs/FUENTE_Y_NOTAS_CONSTANCIA.md).

## Zenodo

Zenodo supports records containing files under different licenses. When preparing the GitHub release deposit, select **both MIT and CC BY 4.0** in the record's license selector and verify the license scope in the deposit description before publication. Do not rely on a single default license for this mixed-license repository.

The licenses are irrevocable for material already distributed under their terms. Confirm institutional and journal requirements before publishing the public release.
