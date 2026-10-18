# -*- coding: utf-8 -*-
"""Moteur de référence V8.1 — reproduction en Python des formules des onglets de dossier
(sections 1 à 12 de l'outil Excel). Sert à fixer les notes de référence des dix-huit cas
(onglet Concordance) et à vérifier, après recalcul du classeur, que l'Excel donne le même
résultat."""

ANCRES = {'TF': 100, 'F': 80, 'V': 50, 'C': 20}
INFO_INSUFF = 20
REGIMES = {  # critique, vigilance, favorable (seuils de base)
    'R1': (1.10, 1.20, 1.30), 'R2': (1.12, 1.22, 1.32),
    'R3': (1.20, 1.35, 1.50), 'R4': (1.35, 1.55, 1.80),
}
DELTA = {'ENR': -0.05, 'EAU': 0.0, 'TEL': 0.0, 'TRA': 0.05, 'POR': 0.05, 'SAN': 0.05, 'ETH': 0.05,
         'IMMO-REND': 0.05, 'IND': 0.10, 'AGR': 0.15, 'TOU': 0.20, 'MIN': 0.25}
MAJ_PHASE = {'P1': 0.0, 'P2': 0.05, 'P3': 0.0}
POIDS_N = [0.25, 0.20, 0.15, 0.15, 0.15, 0.10]
POIDS_DOM = {
    'P1': {'D1': .10, 'D2': .10, 'D3': .20, 'D4': .05, 'D5': .05, 'D6': .10, 'D7': .25, 'D8': .10, 'D9': .05},
    'P2': {'D1': .08, 'D2': .07, 'D3': .08, 'D4': .12, 'D5': .12, 'D6': .12, 'D7': .28, 'D8': .08, 'D9': .05},
    'P3': {'D1': .05, 'D2': .05, 'D3': 0.0, 'D4': .15, 'D5': .15, 'D6': .15, 'D7': .30, 'D8': .10, 'D9': .05},
}
SC = {
    'D1': [('D1.1', 'Capacité financière du sponsor', .40), ('D1.2', 'Obligation juridique de soutien', .35), ('D1.3', 'Structure actionnariale et gouvernance', .25)],
    'D2': [('D2.1', 'Technologie et performance', .35), ('D2.2', 'Site, foncier physique et accès', .40), ('D2.3', "Planning et complexité d'exécution", .25)],
    'D3': [('D3.1', 'Contrat EPC et constructeur', .40), ('D3.2', 'Interfaces et gouvernance de chantier', .25), ('D3.3', 'Assurances et garanties mobilisables', .35)],
    'D4': [('D4.1', 'Structure contractuelle des recettes', .45), ('D4.2', 'Mécanisme de prix et indexation', .30), ('D4.3', 'Marché et concurrence', .25)],
    'D5': [('D5.1', 'Opérateur et contrat O&M', .35), ('D5.2', 'Performance technique et disponibilité', .40), ('D5.3', 'Coûts, gros entretien et dépendances', .25)],
    'D6': [('D6.1', 'Acheteur ou payeur principal', .50), ('D6.2', 'Fournisseurs critiques', .20), ('D6.3', 'Prêteurs et consortium', .30)],
    'D8': [('D8.1', 'Documentation contractuelle et droits directs', .35), ('D8.2', 'Sûretés et opposabilité', .40), ('D8.3', 'Autorisations, cadre réglementaire, litiges', .25)],
    'D9': [('D9.1', 'Environnement et ressources', .30), ('D9.2', 'Social et acceptabilité', .30), ('D9.3', 'Gouvernance ESG et exécution', .15), ('D9.4', 'Climat résiduel', .25)],
}
NOMS_DOM = {'D1': 'Sponsors et actionnariat', 'D2': 'Projet, site, technologie', 'D3': 'Construction et achèvement',
            'D4': 'Mécanisme des recettes', 'D5': 'Exploitation et maintenance', 'D6': 'Contreparties et consortium',
            'D7': 'Finance et trésorerie (noyau)', 'D8': 'Juridique, sûretés, continuité', 'D9': 'ESG et climat résiduel'}
CONV = [(0, 1, 'Très critique', 'Refus ou restructuration complète'), (32, 2, 'Critique', "Refus en l'état"),
        (42, 3, 'Préoccupant', 'Révision de fond'), (50, 4, 'Fragile', 'Restructuration à examiner'),
        (58, 5, 'Moyen', 'Sous surveillance'), (66, 6, 'Acceptable', 'Conditions et mitigants'),
        (73, 7, 'Satisfaisant', 'Conditions légères'), (80, 8, 'Solide', 'Réserves mineures à documenter'),
        (86, 9, 'Très solide', 'Conditions minimales'), (92, 10, 'Excellent', 'Profil de référence')]
PLAFONDS = {
    'C1': ('DSCR minimum de base inférieur à 1,05x sur une échéance', 3),
    'C2': ('DSCR minimum de base sous le seuil critique du couple régime × secteur', 5),
    'C3': ('DSCR minimum sous scénario défavorable inférieur à 1,00x', 4),
    'C4': ('LLCR inférieur à 1,10x', 4),
    'C5': ('Contrat de revenus expirant avant la dernière échéance de dette, sans solution documentée', 5),
    'C6': ('Exposition nette en devises non couverte supérieure à 25 % du service de dette annuel', 5),
    'C7': ('DSRA absente ou inférieure à 3 mois de service de dette', 6),
    'C8': ('Dette à refinancer à maturité supérieure à 30 % du nominal, sans stratégie approuvée', 5),
    'C9': ('Quote-part de dette supérieure à 85 % du plan de financement', 5),
    'C10': ('Acheteur portant plus de 85 % des recettes et de qualité interne inférieure à BBB−', 6),
    'C11': ("Risque climatique physique élevé au site sans plan d'adaptation financé", 6),
    'C12': ("Capacité résiduelle du sponsor insuffisante pour l'appel d'equity restant", 6),
    'C13': ('Opérateur non remplaçable et contrat O&M expirant plus de 5 ans avant la dette', 7),
    'C14': ('Exposition du groupe bancaire sur un facteur commun au-delà de la limite interne', 6),
    'C15': ("Note issue d'une évaluation partielle (statut provisoire)", 6),
}
VERROUS = [('X1', "Activité interdite par la loi marocaine ou par la politique de la banque", 'Aucune note'),
           ('X2', 'Autorisation légalement indispensable juridiquement impossible à obtenir', 'Aucune note'),
           ('X3', 'Contrepartie clé sous sanctions ou signalée au titre du dispositif LBC/FT', 'Aucune note'),
           ('X4', 'Contrepartie clé en défaut avéré non régularisé', 'Aucune note'),
           ('B1', 'Contrat de revenus principal non signé (régimes R1 à R3)', 'Octroi'),
           ('B2', 'Contrat EPC non signé en phase P1', 'Octroi'),
           ('B3', 'Besoin à terminaison supérieur aux ressources engagées (couverture < 95 %)', 'Décaissement'),
           ('B4', "Droit d'occupation du site non établi, ou durée < dette + 24 mois", 'Octroi'),
           ('B5', "Avis juridique d'opposabilité des sûretés absent ou avec réserves", 'Décaissement'),
           ('B6', 'Modèle de flux datés absent ou non rapproché des états financiers', 'Notation validée'),
           ('B7', 'Complétude des critères critiques inférieure à 100 %', 'Notation validée'),
           ('B8', "Acceptabilité environnementale non obtenue au stade requis", 'Octroi')]
S_CAPEX, S_EXPO, S_DUREE, L_CAPEX, L_EXPO, L_NBCP = 200, 100, 12, 1500, 500, 3
N3_TF, N3_F, N3_V = 1.10, 1.00, 0.95
P_C1, P_C3, P_C4, P_C6, P_C7, P_C8, P_C9, P_C10, P_C13, P_COUV = 1.05, 1.00, 1.10, 0.25, 3, 0.30, 0.85, 0.85, 5, 0.95


def num(v):
    return isinstance(v, (int, float)) and not isinstance(v, bool)


def classe(v, s):
    if v < s[0]: return 'C'
    if v < s[1]: return 'V'
    if v < s[2]: return 'F'
    return 'TF'


def evaluer(d):
    r = {}
    reg, sec, ph = d['regime'], d['secteur'], d['phase']
    # 3 · sources et emplois
    capex = sum(m for _, m in d['emplois'])
    ressources = sum(m for _, m, _ in d['ressources'])
    dette = sum(m for _, m, nat in d['ressources'] if nat in ('Dette senior', 'Dette subordonnée'))
    couv = ressources / capex
    qp = dette / capex
    r.update(capex=capex, ressources=ressources, couverture=couv, quote_part=qp, dette=dette)
    # 5 · seuils
    b = REGIMES[reg]; delta = DELTA[sec]; maj = MAJ_PHASE[ph]
    s = tuple(round(x + delta + maj, 6) for x in b)
    r.update(seuil_base=b, delta=delta, majoration=maj, seuils=s)
    # 6 · échéancier
    choc = d.get('choc', 0.0)
    lignes = []
    for p in d['periodes']:
        lib, cf, sd = p[0], p[1], p[2]
        cfs = p[3] if len(p) > 3 and p[3] is not None else None
        if sd == 0:
            lignes.append(dict(lib=lib, cfads=cf, service=sd, dscr=None, classe='Différé', dscr_s=None)); continue
        dscr = cf / sd
        cl = 'Critique' if cf < 0 else {'C': 'Critique', 'V': 'Vigilance', 'F': 'Favorable', 'TF': 'Très favorable'}[classe(dscr, s)]
        dscr_s = (cfs if cfs is not None else cf * (1 - choc)) / sd
        lignes.append(dict(lib=lib, cfads=cf, service=sd, dscr=dscr, classe=cl, dscr_s=dscr_s))
    r['periodes'] = lignes
    dscrs = [l['dscr'] for l in lignes if l['dscr'] is not None]
    negatifs = sum(1 for l in lignes if l['cfads'] < 0)
    dmin = min(dscrs); dmin_s = min(l['dscr_s'] for l in lignes if l['dscr_s'] is not None)
    r.update(dscr_min=dmin, dscr_min_s=dmin_s, negatifs=negatifs,
             differes=sum(1 for l in lignes if l['classe'] == 'Différé'))
    # 7 · noyau
    N = [None] * 6
    N[0] = ANCRES['C'] if negatifs > 0 else ANCRES[classe(dmin, s)]
    N[1] = ANCRES[classe(dmin_s, s)]
    if ph == 'P1':
        if couv >= N3_TF: N[2] = 100
        elif couv >= N3_F: N[2] = 80
        elif couv >= N3_V and d.get('plan_remediation') == 'Oui': N[2] = 50
        else: N[2] = 20
    else:
        N[2] = d['n3_llcr']
    N[3], N[4], N[5] = d['n4'], d['n5'], d['n6']
    contrib_n = [(n if num(n) else INFO_INSUFF) * w for n, w in zip(N, POIDS_N)]
    d7 = sum(contrib_n)
    r.update(noyau=N, contrib_noyau=contrib_n, D7=d7)
    # 8 · grille
    pw = POIDS_DOM[ph]
    dom, couv_num, couv_den, nb_req, nb_req_num, detail = {}, 0.0, 0.0, 0, 0, {}
    for code, scs in SC.items():
        notes = d['grille'][code]
        w = pw[code]
        sc_score = sum((n if num(n) else 0) * p for n, (_, _, p) in zip(notes, scs)) + \
            INFO_INSUFF * sum(p for n, (_, _, p) in zip(notes, scs) if not num(n))
        dom[code] = sc_score if w > 0 else None
        detail[code] = [(k, lib, p, n) for (k, lib, p), n in zip(scs, notes)]
        couv_num += w * sum(p for n, (_, _, p) in zip(notes, scs) if num(n))
        couv_den += w
        if w > 0:
            nb_req += len(scs); nb_req_num += sum(1 for n in notes if num(n))
    couverture_grille = couv_num / couv_den
    completude = (sum(1 for n in N if num(n)) + nb_req_num) / (6 + nb_req)
    r.update(domaines=dom, grille_detail=detail, couverture_grille=couverture_grille, completude=completude)
    # 9 · agrégation
    contrib = {}
    for code in ['D1', 'D2', 'D3', 'D4', 'D5', 'D6', 'D7', 'D8', 'D9']:
        sc = d7 if code == 'D7' else dom[code]
        contrib[code] = (sc if num(sc) else 0) * pw[code]
    score = sum(contrib.values())
    note = max(n for seuil, n, _, _ in CONV if score >= seuil)
    r.update(contributions=contrib, score=score, note_calculee=note, poids=pw)
    # 10 · verrous
    v = dict(d.get('verrous', {}))
    if ph == 'P1' and couv < N3_V: v['B3'] = 'Oui'
    if completude < 1: v['B7'] = 'Oui'
    actifs_v = [code for code, _, _ in VERROUS if v.get(code) == 'Oui']
    r['verrous_actifs'] = actifs_v
    # 11 · plafonds
    p = d['plafonds_donnees']
    pl = {}
    pl['C1'] = 'Oui' if dmin < P_C1 else 'Non'
    pl['C2'] = 'Oui' if dmin < s[0] else 'Non'
    pl['C3'] = 'Oui' if dmin_s < P_C3 else 'Non'
    pl['C4'] = 'n.r.' if p.get('llcr') is None else ('Oui' if p['llcr'] < P_C4 else 'Non')
    if reg == 'R4': pl['C5'] = 'n.a.'
    elif p.get('duree_contrat') is None: pl['C5'] = 'n.r.'
    else: pl['C5'] = 'Oui' if (p['duree_contrat'] < p['duree_dette'] and p.get('solution_contrat') != 'Oui') else 'Non'
    def oui_non(cond_dispo, cond):
        return 'n.r.' if not cond_dispo else ('Oui' if cond else 'Non')
    vide = lambda k: p.get(k) in (None, '')
    pl['C6'] = oui_non(not vide('fx'), (p.get('fx') or 0) > P_C6)
    pl['C7'] = oui_non(not vide('dsra'), (p.get('dsra') or 0) < P_C7)
    pl['C8'] = oui_non(not vide('refi'), (p.get('refi') or 0) > P_C8 and p.get('strategie_refi') != 'Oui')
    pl['C9'] = 'Oui' if qp > P_C9 else 'Non'
    pl['C10'] = oui_non(not vide('part_acheteur') and not vide('qualite_acheteur'),
                        (p.get('part_acheteur') or 0) > P_C10 and p.get('qualite_acheteur') != '≥ BBB−')
    pl['C11'] = oui_non(d.get('climat_eleve') not in (None, ''), d.get('climat_eleve') == 'Oui' and p.get('plan_climat') != 'Oui')
    pl['C12'] = oui_non(not vide('capacite_sponsor'), p.get('capacite_sponsor') == 'Non')
    pl['C13'] = oui_non(not vide('operateur_remplacable'), p.get('operateur_remplacable') == 'Non' and (p.get('ecart_om') or 0) > P_C13)
    pl['C14'] = oui_non(not vide('expo_groupe'), p.get('expo_groupe') == 'Oui')
    pl['C15'] = 'Oui' if (couverture_grille < P_COUV or completude < 1) else 'Non'
    r['plafonds'] = pl
    actifs_c = [c for c, e in pl.items() if e == 'Oui']
    plafond = min([PLAFONDS[c][1] for c in actifs_c], default=10)
    r.update(plafonds_actifs=actifs_c, plafond=plafond)
    # 2 · proportionnalité (calcul après verrous)
    pr = d['proport']
    motifs_l = []
    if capex > L_CAPEX: motifs_l.append(f'CAPEX > {L_CAPEX} MMAD')
    if pr['expo'] > L_EXPO: motifs_l.append(f'exposition > {L_EXPO} MMAD')
    if reg == 'R4': motifs_l.append('régime de revenus R4')
    if pr['premiere_ref'] == 'Oui': motifs_l.append('première référence technologique')
    if (p.get('fx') or 0) > 0: motifs_l.append('exposition en devises non couverte')
    if pr['consortium'] == 'Oui': motifs_l.append('opération consortiale (directive 3/W/2025)')
    if pr['contrat_20'] == 'Oui': motifs_l.append('concession ou contrat de revenus > 20 ans')
    if d['climat_eleve'] == 'Oui': motifs_l.append('site à risque climatique élevé')
    if (pr.get('nb_cp') or 0) > L_NBCP: motifs_l.append(f'plus de {L_NBCP} contreparties clés')
    if motifs_l: calc = 'L'
    elif (capex <= S_CAPEX and pr['expo'] <= S_EXPO and reg in ('R1', 'R2') and pr['tech_refs'] == 'Oui'
          and pr['mad'] == 'Oui' and pr['duree'] <= S_DUREE and (ph != 'P1' or pr['epc'] == 'Oui')
          and pr['acheteur_unique'] == 'Oui' and not actifs_v):
        calc = 'S'
    else:
        calc = 'M'
    retenu = calc
    if retenu == 'S' and actifs_v: retenu = 'M'
    if retenu == 'M' and actifs_c: retenu = 'L'
    r.update(regime_calcule=calc, regime_retenu=retenu, motifs_l=motifs_l)
    # 12 · note approuvée
    x = [c for c in actifs_v if c.startswith('X')]
    b = [c for c in actifs_v if c.startswith('B')]
    if x:
        r['note_approuvee'] = None; r['statut'] = 'Hors périmètre — aucune note produite'
    else:
        r['note_approuvee'] = min(note, plafond)
        if b:
            stades = {code: st for code, _, st in VERROUS}
            r['statut'] = 'Note provisoire — stade bloqué : ' + ', '.join(f'{c} ({stades[c]})' for c in b)
        elif pl['C15'] == 'Oui':
            r['statut'] = 'Note provisoire — évaluation partielle (C15)'
        else:
            r['statut'] = 'Note validable, à soumettre au comité'
    na = r['note_approuvee']
    r['libelle'] = next((lib for _, n, lib, _ in CONV if n == na), '—')
    r['orientation'] = next((o for _, n, _, o in CONV if n == na), 'Aucune note : dossier hors périmètre')
    return r
