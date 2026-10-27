# -*- coding: utf-8 -*-
"""Les dix-huit dossiers préchargés de l'outil (version 3), dans un format unique.

- C1 à C5 (six onglets) : cas d'étude d'origine (cas_data.py), complétés des champs que
  le classeur d'origine ne portait pas (EXTRA, valeurs reconstituées « à confirmer »).
- ENR à MIN (douze onglets) : études de cas sectorielles (cas_sectoriels.py).

Le format est celui du moteur de référence (moteur_reference.evaluer), enrichi des
données de présentation : codes T24 et projet, crédits, données sectorielles, bloc 13.
Tous les dossiers, sociétés, codes et numéros sont FICTIFS.
"""
import json
import os
import re
import cas_data
import cas_sectoriels
import cas_sectoriels_textes
import complements

II = "Info. insuffisante"

# Champs absents du classeur d'origine : valeurs reconstituées à partir du récit du cas.
EXTRA = {
    "C1": dict(expo=465, mad="Oui", duree=20, techno="Oui", epc18="Non", unique="Oui", premiere="Non",
               consortium="Non", plus20="Oui", climat="Non", nbcp=3, part_ach=1.0, qual="≥ BBB−",
               duree_contrat=25, duree_dette=20, solution="", refi=0.0, strat="", plan_adapt="",
               sponsor="Oui", operateur="Oui", ecart_om=None, facteur="Non", plan_remed="Non"),
    "C2": dict(expo=420, mad="Non", duree=20, techno="Oui", epc18="Non", unique="Oui", premiere="Non",
               consortium="Oui", plus20="Oui", climat="Non", nbcp=4, part_ach=1.0, qual="≥ BBB−",
               duree_contrat=25, duree_dette=20, solution="", refi=0.0, strat="", plan_adapt="",
               sponsor="Oui", operateur="Oui", ecart_om=None, facteur="Non", plan_remed="Non"),
    "C3": dict(expo=240, mad="Oui", duree=15, techno="Oui", epc18="Non", unique="Non", premiere="Non",
               consortium="Non", plus20="Non", climat="Non", nbcp=3, part_ach=0.30, qual="Non noté",
               duree_contrat=None, duree_dette=15, solution="", refi=0.0, strat="", plan_adapt="",
               sponsor="Oui", operateur="Oui", ecart_om=None, facteur="Non", plan_remed="Non"),
    "C4A": dict(expo=250, mad="Non", duree=10, techno="Oui", epc18="Non", unique="Non", premiere="Non",
                consortium="Non", plus20="Non", climat="Non", nbcp=3, part_ach=0.40, qual="Non noté",
                duree_contrat=10, duree_dette=10, solution="", refi=0.0, strat="", plan_adapt="",
                sponsor="Oui", operateur="Oui", ecart_om=None, facteur="Non", plan_remed="Non"),
    "C4B": dict(expo=210, mad="Non", duree=10, techno="Oui", epc18="Non", unique="Non", premiere="Non",
                consortium="Non", plus20="Non", climat="Non", nbcp=3, part_ach=0.40, qual="Non noté",
                duree_contrat=10, duree_dette=10, solution="", refi=0.0, strat="", plan_adapt="",
                sponsor="Oui", operateur="Oui", ecart_om=None, facteur="Non", plan_remed="Non"),
    "C5": dict(expo=60, mad="Oui", duree=12, techno="Oui", epc18="Oui", unique="Oui", premiere="Non",
               consortium="Non", plus20="Non", climat="Non", nbcp=2, part_ach=1.0, qual="Non noté",
               duree_contrat=15, duree_dette=12, solution="", refi=0.0, strat="", plan_adapt="",
               sponsor="Oui", operateur="Oui", ecart_om=None, facteur="Non", plan_remed="Non"),
}
# Champs documentés dans le récit (les autres champs EXTRA portent « à confirmer »).
DOCUMENTE = {"C1": {"mad", "plus20", "unique", "duree_contrat", "refi", "qual", "part_ach"},
             "C2": {"mad", "consortium", "unique", "part_ach", "duree_contrat", "plus20"},
             "C3": {"mad", "refi"},
             "C4A": {"mad", "refi"}, "C4B": {"mad", "refi"},
             "C5": {"mad", "techno", "unique", "part_ach", "qual", "refi"}}


TAILLES = {"D1": 3, "D2": 3, "D3": 3, "D4": 3, "D5": 3, "D6": 3, "D8": 3, "D9": 4}


def _nature(lib):
    t = lib.lower()
    return ("Dette senior" if "dette" in t else "Engagement sponsor" if "engagement" in t
            else "Ligne dédiée engagée" if "ligne" in t else "Quasi-fonds propres" if "quasi" in t
            else "Fonds propres")


def _depuis_origine(code):
    c = cas_data.CAS[code]
    m, f, ex = c["meta"], c["fin"], EXTRA[code]
    per = f["periodes"]
    dmin = min(p["cfads"] / p["service"] for p in per if p["service"])
    on = lambda v: v if v not in (None, "") else ""
    d = dict(
        onglet=code, ref=m["ref"], titre=m["nom"], spv=m["spv"], lieu=m["lieu"], resume=m["resume"],
        enseigne=c["lecon"], origine=True,
        regime=m["regime"], secteur=m["secteur"], phase=m["phase"], climat_eleve=ex["climat"],
        proport=dict(expo=ex["expo"], mad=ex["mad"], duree=ex["duree"], tech_refs=ex["techno"], epc=ex["epc18"],
                     acheteur_unique=ex["unique"], premiere_ref=ex["premiere"], consortium=ex["consortium"],
                     contrat_20=ex["plus20"], nb_cp=ex["nbcp"]),
        emplois=list(c["emplois"]),
        ressources=[(lib, mt, _nature(lib)) for lib, mt in c["ressources"]],
        exploit=list(c["exploit"]),
        plan_remediation=ex["plan_remed"],
        choc=round(1 - f["dscr_stresse"] / dmin, 6),
        choc_commentaire=("Choc calibré pour reproduire le DSCR stressé du modèle de flux de l'analyste "
                          f"({str(f['dscr_stresse']).replace('.', ',')}), saisi en dur dans le classeur d'origine."),
        stress_lib=f.get("stress_lib", ""),
        periodes=[(p["lib"], p["cfads"], p["service"]) for p in per],
        n3_llcr=None if m["phase"] == "P1" else f.get("n3"),
        n4=f.get("n4"), n5=f.get("n5"), n6=f.get("n6"),
        n_lib={f"N{i}": f.get(f"n{i}_lib", "") for i in (3, 4, 5, 6)},
        plafonds_donnees=dict(llcr=f.get("llcr"), dsra=f.get("dsra_mois"), fx=f.get("fx_net_pct", 0) / 100,
                              refi=ex["refi"], strategie_refi=on(ex["strat"]), part_acheteur=ex["part_ach"],
                              qualite_acheteur=ex["qual"], duree_contrat=ex["duree_contrat"],
                              duree_dette=ex["duree_dette"], solution_contrat=on(ex["solution"]),
                              plan_climat=on(ex["plan_adapt"]), capacite_sponsor=ex["sponsor"],
                              operateur_remplacable=ex["operateur"], ecart_om=ex["ecart_om"],
                              expo_groupe=ex["facteur"]),
        grille={k: list(c["qualitatif"].get(k, [None] * n)) for k, n in TAILLES.items()},
        commentaires=dict(c["commentaires"]),
        verrous={},
        reconstitue={k for k in ex if k not in DOCUMENTE[code]},
    )
    return d


def _sans_gras(t):
    return re.sub(r"\*\*(.+?)\*\*", r"\1", t)


def _depuis_sectoriel(c):
    d = dict(c)
    d["onglet"] = "IMMO" if c["code"] == "IMMO-REND" else c["code"]
    d["ref"] = f"CAS {c['code']}"
    d["exploit"] = list(c["exploit"])
    d["origine"] = False
    d["reconstitue"] = set()
    d["grille"] = {k: list(v) for k, v in c["grille"].items()}
    d["commentaires"] = dict(c.get("commentaires", {}))
    ex = cas_sectoriels_textes.EXPL[c["code"]]
    d["lecture"] = _sans_gras(ex["lecture"])
    d["comite"] = [_sans_gras(t) for t in ex["comite"]]
    return d


ORDRE = ["C1", "C2", "C3", "C4A", "C4B", "C5"]
CAS = [_depuis_origine(k) for k in ORDRE] + [_depuis_sectoriel(c) for c in cas_sectoriels.CAS]
for _d in CAS:
    _d.update(complements.COMPLEMENTS[_d["onglet"]])
    _b = _d["bloc13"] = dict(_d["bloc13"])
    if not _d["origine"]:
        _b.setdefault("synthese", _d["lecture"])
        _b.setdefault("conditions", "\n".join("• " + t for t in _d["comite"]))
    _d.setdefault("sc_comm", {})
# Fiches climat fictives (volet climatique, bloc 14), exportées de l'outil web
# (scripts/docs/exporter-climat-excel.ts) : même source pour les deux outils.
with open(os.path.join(os.path.dirname(os.path.abspath(__file__)), "cas_climat.json"), encoding="utf-8") as _f:
    CLIMAT = json.load(_f)
for _d in CAS:
    _d["climat"] = CLIMAT["fiches"].get(_d["onglet"], {})
PAR_ONGLET = {d["onglet"]: d for d in CAS}
assert len(CAS) == 18 and len(PAR_ONGLET) == 18
