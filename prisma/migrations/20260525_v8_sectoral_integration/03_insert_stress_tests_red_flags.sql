-- V8 Sectoral Integration: Insert stress tests, red flags, and domain impacts

DO $$
DECLARE
  v_id_enr TEXT;
  v_id_eau TEXT;
  v_id_tra TEXT;
  v_id_por TEXT;
  v_id_ind TEXT;
  v_id_min TEXT;
  v_id_tou TEXT;
  v_id_tel TEXT;
  v_id_san TEXT;
  v_id_agr TEXT;
  v_id_eth TEXT;
  v_id_imm TEXT;
BEGIN
  -- Resolve sector IDs
  SELECT id INTO v_id_enr FROM "BP_PF_v8_sectors" WHERE code = 'ENR';
  SELECT id INTO v_id_eau FROM "BP_PF_v8_sectors" WHERE code = 'EAU';
  SELECT id INTO v_id_tra FROM "BP_PF_v8_sectors" WHERE code = 'TRA';
  SELECT id INTO v_id_por FROM "BP_PF_v8_sectors" WHERE code = 'POR';
  SELECT id INTO v_id_ind FROM "BP_PF_v8_sectors" WHERE code = 'IND';
  SELECT id INTO v_id_min FROM "BP_PF_v8_sectors" WHERE code = 'MIN';
  SELECT id INTO v_id_tou FROM "BP_PF_v8_sectors" WHERE code = 'TOU';
  SELECT id INTO v_id_tel FROM "BP_PF_v8_sectors" WHERE code = 'TEL';
  SELECT id INTO v_id_san FROM "BP_PF_v8_sectors" WHERE code = 'SAN';
  SELECT id INTO v_id_agr FROM "BP_PF_v8_sectors" WHERE code = 'AGR';
  SELECT id INTO v_id_eth FROM "BP_PF_v8_sectors" WHERE code = 'ETH';
  SELECT id INTO v_id_imm FROM "BP_PF_v8_sectors" WHERE code = 'IMM';

  -- ───────────────────────────────────────────────────────────────────────────
  -- STRESS TESTS (one row per individual test scenario)
  -- ───────────────────────────────────────────────────────────────────────────
  INSERT INTO "BP_PF_v8_sector_stress_tests" ("sectorId", "description", "orderIndex") VALUES
    -- ENR
    (v_id_enr, 'P90/P50 productible', 1),
    (v_id_enr, 'Baisse productible -10%', 2),
    (v_id_enr, 'Curtailment réseau', 3),
    (v_id_enr, 'Retard raccordement réseau', 4),
    -- EAU
    (v_id_eau, 'Hausse coût énergie +15%', 1),
    (v_id_eau, 'Hausse coût énergie +25%', 2),
    (v_id_eau, 'Disponibilité usine -5%', 3),
    (v_id_eau, 'Stress hydrique', 4),
    (v_id_eau, 'Retard autorisations environnementales', 5),
    -- TRA
    (v_id_tra, 'Baisse trafic -15%', 1),
    (v_id_tra, 'Baisse trafic -25%', 2),
    (v_id_tra, 'Retard chantier +6 mois', 3),
    (v_id_tra, 'Surcoût CAPEX +10%', 4),
    (v_id_tra, 'Hausse OPEX maintenance', 5),
    -- POR
    (v_id_por, 'Baisse volumes -15%', 1),
    (v_id_por, 'Perte client principal', 2),
    (v_id_por, 'Retard équipement', 3),
    (v_id_por, 'Hausse coût énergie / logistique', 4),
    -- IND
    (v_id_ind, 'Hausse matières premières +15%', 1),
    (v_id_ind, 'Hausse matières premières +25%', 2),
    (v_id_ind, 'Baisse prix vente -10%', 3),
    (v_id_ind, 'FX mismatch', 4),
    (v_id_ind, 'Baisse volumes -15%', 5),
    -- MIN
    (v_id_min, 'Baisse prix minerai -20%', 1),
    (v_id_min, 'Baisse réserves / rendement', 2),
    (v_id_min, 'Retard permis', 3),
    (v_id_min, 'Coûts restauration site', 4),
    -- TOU
    (v_id_tou, 'Taux occupation -15%', 1),
    (v_id_tou, 'Taux occupation -25%', 2),
    (v_id_tou, 'ADR -10%', 3),
    (v_id_tou, 'RevPAR -20%', 4),
    (v_id_tou, 'Retard ouverture', 5),
    (v_id_tou, 'Impact saisonnalité', 6),
    -- TEL
    (v_id_tel, 'Hausse coût énergie +20%', 1),
    (v_id_tel, 'Panne système refroidissement', 2),
    (v_id_tel, 'Cyber incident majeur', 3),
    (v_id_tel, 'Perte client anchor', 4),
    (v_id_tel, 'Obsolescence CAPEX', 5),
    -- SAN
    (v_id_san, 'Taux occupation lits -10%', 1),
    (v_id_san, 'Taux occupation lits -20%', 2),
    (v_id_san, 'DSO payeurs +30 jours', 3),
    (v_id_san, 'Turnover médecins', 4),
    (v_id_san, 'CAPEX équipement médical', 5),
    -- AGR
    (v_id_agr, 'Sécheresse', 1),
    (v_id_agr, 'Baisse rendement -15%', 2),
    (v_id_agr, 'Baisse rendement -25%', 3),
    (v_id_agr, 'Hausse coût eau / énergie', 4),
    (v_id_agr, 'Rupture chaîne froid', 5),
    -- ETH
    (v_id_eth, 'Hausse combustible +20%', 1),
    (v_id_eth, 'Taxe carbone', 2),
    (v_id_eth, 'Baisse dispatch réseau', 3),
    (v_id_eth, 'Transition énergétique accélérée', 4),
    (v_id_eth, 'Refinancement ESG', 5),
    -- IMM
    (v_id_imm, 'Baisse loyer / prix -10%', 1),
    (v_id_imm, 'Baisse loyer / prix -20%', 2),
    (v_id_imm, 'Retard commercialisation', 3),
    (v_id_imm, 'Vacance locative élevée', 4),
    (v_id_imm, 'Baisse valeur garantie', 5);

  -- ───────────────────────────────────────────────────────────────────────────
  -- RED FLAGS (isNoGo = true for critical blockers)
  -- ───────────────────────────────────────────────────────────────────────────
  INSERT INTO "BP_PF_v8_sector_red_flags" ("sectorId", "description", "isNoGo", "orderIndex") VALUES
    -- ENR
    (v_id_enr, 'PPA non signé', true, 1),
    (v_id_enr, 'Raccordement réseau non sécurisé', true, 2),
    (v_id_enr, 'Productible non validé par expert indépendant', false, 3),
    (v_id_enr, 'Ratio P90/P50 faible', false, 4),
    -- EAU
    (v_id_eau, 'Contrat achat d''eau non signé', true, 1),
    (v_id_eau, 'Coût énergie non sécurisé', false, 2),
    (v_id_eau, 'Opposition sociale significative', false, 3),
    (v_id_eau, 'EIE absente ou refusée', true, 4),
    -- TRA
    (v_id_tra, 'Étude trafic non réalisée par organisme indépendant', false, 1),
    (v_id_tra, 'Emprises foncières non sécurisées', true, 2),
    (v_id_tra, 'Concession non signée', true, 3),
    -- POR
    (v_id_por, 'Concession non signée', true, 1),
    (v_id_por, 'Concentration client >70% sans garantie', false, 2),
    (v_id_por, 'Absence contrat volumes minimum', false, 3),
    -- IND
    (v_id_ind, 'Mono-client sans garantie', false, 1),
    (v_id_ind, 'Mono-fournisseur critique sans alternative', false, 2),
    (v_id_ind, 'Absence clause pass-through matières premières', false, 3),
    (v_id_ind, 'EIE non conforme aux standards IFC', true, 4),
    -- MIN
    (v_id_min, 'Permis minier absent', true, 1),
    (v_id_min, 'Réserves non certifiées par expert indépendant', true, 2),
    (v_id_min, 'Impact environnemental non mitigé', false, 3),
    -- TOU
    (v_id_tou, 'Absence d''opérateur hôtelier reconnu', false, 1),
    (v_id_tou, 'Hypothèses d''occupation trop optimistes (>85% dès année 1)', false, 2),
    (v_id_tou, 'Foncier ou permis non sécurisés', true, 3),
    -- TEL
    (v_id_tel, 'Absence PCA / PRA documenté et testé', true, 1),
    (v_id_tel, 'Audit cybersécurité absent', false, 2),
    (v_id_tel, 'Contrats clients tous à court terme (<1 an)', false, 3),
    (v_id_tel, 'Redondance infrastructure insuffisante', false, 4),
    -- SAN
    (v_id_san, 'Autorisation sanitaire absente', true, 1),
    (v_id_san, 'Équipe médicale clé non sécurisée', true, 2),
    (v_id_san, 'DSO élevé non financé par lignes dédiées', false, 3),
    -- AGR
    (v_id_agr, 'Droits eau non sécurisés', true, 1),
    (v_id_agr, 'Absence assurance récolte', false, 2),
    (v_id_agr, 'Débouchés non contractualisés', false, 3),
    -- ETH
    (v_id_eth, 'Contrat approvisionnement combustible non sécurisé', true, 1),
    (v_id_eth, 'Forte intensité carbone sans plan de transition documenté', false, 2),
    (v_id_eth, 'PPA non signé', true, 3),
    -- IMM
    (v_id_imm, 'Foncier non sécurisé', true, 1),
    (v_id_imm, 'Permis de construire absent', true, 2),
    (v_id_imm, 'Précommercialisation insuffisante (<30% avant premier tirage)', false, 3),
    (v_id_imm, 'Valorisation reposant sur hypothèses fragiles', false, 4);

  -- ───────────────────────────────────────────────────────────────────────────
  -- DOMAIN IMPACTS (relative emphasis adjustment per sector)
  -- Positive = greater focus / weight increase signal
  -- Negative = lesser focus / weight decrease signal
  -- ───────────────────────────────────────────────────────────────────────────
  INSERT INTO "BP_PF_v8_sector_domain_impacts" ("sectorId", "domainCode", "impact") VALUES
    -- ENR: D3(+1), D4(-2), D6(+2), D9(+1), D1(-1), D5(-1)
    (v_id_enr,'D1',-1),(v_id_enr,'D2', 0),(v_id_enr,'D3',+1),(v_id_enr,'D4',-2),
    (v_id_enr,'D5',-1),(v_id_enr,'D6',+2),(v_id_enr,'D7', 0),(v_id_enr,'D8', 0),(v_id_enr,'D9',+1),
    -- EAU: D5(+2), D6(+2), D9(+2), D1(-2), D2(-1), D3(-1), D4(-1), D7(-1)
    (v_id_eau,'D1',-2),(v_id_eau,'D2',-1),(v_id_eau,'D3',-1),(v_id_eau,'D4',-1),
    (v_id_eau,'D5',+2),(v_id_eau,'D6',+2),(v_id_eau,'D7',-1),(v_id_eau,'D8', 0),(v_id_eau,'D9',+2),
    -- TRA: D3(+2), D4(+2), D5(+1), D8(+1), D1(-1), D2(-1), D6(-1), D9(-1), D7(-2)
    (v_id_tra,'D1',-1),(v_id_tra,'D2',-1),(v_id_tra,'D3',+2),(v_id_tra,'D4',+2),
    (v_id_tra,'D5',+1),(v_id_tra,'D6',-1),(v_id_tra,'D7',-2),(v_id_tra,'D8',+1),(v_id_tra,'D9',-1),
    -- POR: D4(+2), D5(+1), D6(+2), D8(+1), D1(-1), D2(-1), D3(-1), D9(-1), D7(-2)
    (v_id_por,'D1',-1),(v_id_por,'D2',-1),(v_id_por,'D3',-1),(v_id_por,'D4',+2),
    (v_id_por,'D5',+1),(v_id_por,'D6',+2),(v_id_por,'D7',-2),(v_id_por,'D8',+1),(v_id_por,'D9',-1),
    -- IND: D4(+2), D5(+2), D6(+1), D7(+1), D1(-1), D2(-1), D3(-1), D8(-1), D9(-2)
    (v_id_ind,'D1',-1),(v_id_ind,'D2',-1),(v_id_ind,'D3',-1),(v_id_ind,'D4',+2),
    (v_id_ind,'D5',+2),(v_id_ind,'D6',+1),(v_id_ind,'D7',+1),(v_id_ind,'D8',-1),(v_id_ind,'D9',-2),
    -- MIN: D2(+1), D4(+2), D7(-3), D8(+1), D9(+3), D1(-1), D3(-1), D5(-1), D6(-1)
    (v_id_min,'D1',-1),(v_id_min,'D2',+1),(v_id_min,'D3',-1),(v_id_min,'D4',+2),
    (v_id_min,'D5',-1),(v_id_min,'D6',-1),(v_id_min,'D7',-3),(v_id_min,'D8',+1),(v_id_min,'D9',+3),
    -- TOU: D4(+5), D5(+2), D7(+1), D1(-1), D2(-1), D3(-1), D6(-1), D8(-1), D9(-3)
    (v_id_tou,'D1',-1),(v_id_tou,'D2',-1),(v_id_tou,'D3',-1),(v_id_tou,'D4',+5),
    (v_id_tou,'D5',+2),(v_id_tou,'D6',-1),(v_id_tou,'D7',+1),(v_id_tou,'D8',-1),(v_id_tou,'D9',-3),
    -- TEL: D2(+1), D5(+3), D6(+1), D8(+2), D9(+1), D1(-3), D3(-1), D4(-1), D7(-3)
    (v_id_tel,'D1',-3),(v_id_tel,'D2',+1),(v_id_tel,'D3',-1),(v_id_tel,'D4',-1),
    (v_id_tel,'D5',+3),(v_id_tel,'D6',+1),(v_id_tel,'D7',-3),(v_id_tel,'D8',+2),(v_id_tel,'D9',+1),
    -- SAN: D4(+2), D5(+2), D6(+2), D8(+2), D1(-3), D2(-1), D3(-1), D7(-2), D9(-1)
    (v_id_san,'D1',-3),(v_id_san,'D2',-1),(v_id_san,'D3',-1),(v_id_san,'D4',+2),
    (v_id_san,'D5',+2),(v_id_san,'D6',+2),(v_id_san,'D7',-2),(v_id_san,'D8',+2),(v_id_san,'D9',-1),
    -- AGR: D4(+2), D5(+1), D6(+1), D9(+3), D1(-1), D2(-1), D3(-1), D7(-2), D8(-2)
    (v_id_agr,'D1',-1),(v_id_agr,'D2',-1),(v_id_agr,'D3',-1),(v_id_agr,'D4',+2),
    (v_id_agr,'D5',+1),(v_id_agr,'D6',+1),(v_id_agr,'D7',-2),(v_id_agr,'D8',-2),(v_id_agr,'D9',+3),
    -- ETH: D5(+1), D6(+1), D7(+1), D9(+4), D1(-3), D2(-1), D3(-1), D8(-2), D4(0)
    (v_id_eth,'D1',-3),(v_id_eth,'D2',-1),(v_id_eth,'D3',-1),(v_id_eth,'D4', 0),
    (v_id_eth,'D5',+1),(v_id_eth,'D6',+1),(v_id_eth,'D7',+1),(v_id_eth,'D8',-2),(v_id_eth,'D9',+4),
    -- IMM: D4(+3), D7(+2), D8(+2), D1(-1), D2(-1), D3(-1), D5(-1), D6(-1), D9(-2)
    (v_id_imm,'D1',-1),(v_id_imm,'D2',-1),(v_id_imm,'D3',-1),(v_id_imm,'D4',+3),
    (v_id_imm,'D5',-1),(v_id_imm,'D6',-1),(v_id_imm,'D7',+2),(v_id_imm,'D8',+2),(v_id_imm,'D9',-2)
  ON CONFLICT ("sectorId","domainCode") DO UPDATE SET "impact" = EXCLUDED."impact";

  -- ───────────────────────────────────────────────────────────────────────────
  -- INTEGRATION RULES
  -- ───────────────────────────────────────────────────────────────────────────
  INSERT INTO "BP_PF_v8_integration_rules" ("rubrique", "regle", "orderIndex") VALUES
    ('Principe', 'Le modèle V7++ reste le socle commun. Le secteur devient un module transversal qui ajuste les poids, les seuils, les stress tests, les red flags et les bonus/malus.', 1),
    ('Ajustement poids domaine', 'Plafond recommandé : ±3 points sauf exception justifiée. La somme des poids ajustés doit rester égale à 100%.', 2),
    ('Ajustement sous-critère', 'Ajustement recommandé à l''intérieur d''un domaine : renforcer les sous-critères les plus discriminants pour le secteur. Normalisation à 100% à effectuer dans le moteur de scoring.', 3),
    ('Ajustement seuil option', 'Les seuils standard V7++ sont adaptés au secteur : par exemple DSCR plus élevé pour tourisme/immobilier/mines, légèrement assoupli pour ENR avec PPA souverain solide.', 4),
    ('Stress tests sectoriels', 'Chaque secteur impose des stress tests obligatoires : productible, trafic, taux d''occupation, matières premières, coût énergie, taxe carbone, cyber, sécheresse, etc.', 5),
    ('Bonus/malus', 'Score final ajustable dans une plage plafonnée : bonus +0,25/+0,50 max ; malus -0,25 à -1,00 selon criticité.', 6),
    ('No-Go', 'Un secteur peut déclencher des No-Go spécifiques : PPA absent, raccordement non sécurisé, permis minier absent, autorisation santé absente, PCA/PRA absent, EIE refusée.', 7),
    ('Réponse COMEX', 'Le secteur est bien pris en compte, mais de manière transversale et intelligente, sans pénaliser ou favoriser automatiquement un secteur entier.', 8)
  ON CONFLICT DO NOTHING;

  RAISE NOTICE 'V8 stress tests, red flags, domain impacts and integration rules inserted successfully';
END $$;
