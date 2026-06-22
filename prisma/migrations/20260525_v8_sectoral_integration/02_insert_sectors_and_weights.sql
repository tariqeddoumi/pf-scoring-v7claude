-- V8 Sectoral Integration: Insert 12 sectors and their domain weight adjustments

DO $$
DECLARE
  v_id_enr TEXT := gen_random_uuid()::TEXT;
  v_id_eau TEXT := gen_random_uuid()::TEXT;
  v_id_tra TEXT := gen_random_uuid()::TEXT;
  v_id_por TEXT := gen_random_uuid()::TEXT;
  v_id_ind TEXT := gen_random_uuid()::TEXT;
  v_id_min TEXT := gen_random_uuid()::TEXT;
  v_id_tou TEXT := gen_random_uuid()::TEXT;
  v_id_tel TEXT := gen_random_uuid()::TEXT;
  v_id_san TEXT := gen_random_uuid()::TEXT;
  v_id_agr TEXT := gen_random_uuid()::TEXT;
  v_id_eth TEXT := gen_random_uuid()::TEXT;
  v_id_imm TEXT := gen_random_uuid()::TEXT;
BEGIN

  -- Insert 12 sectors
  INSERT INTO "BP_PF_v8_sectors" (id, code, label, "orderIndex") VALUES
    (v_id_enr, 'ENR',  'Énergies renouvelables',               1),
    (v_id_eau, 'EAU',  'Eau / Dessalement',                    2),
    (v_id_tra, 'TRA',  'Transport / Autoroutes',               3),
    (v_id_por, 'POR',  'Ports / Logistique',                   4),
    (v_id_ind, 'IND',  'Industrie / Manufacturing',            5),
    (v_id_min, 'MIN',  'Mines / Extraction',                   6),
    (v_id_tou, 'TOU',  'Tourisme / Hôtellerie',                7),
    (v_id_tel, 'TEL',  'Télécom / Data Centers',               8),
    (v_id_san, 'SAN',  'Santé / Cliniques',                    9),
    (v_id_agr, 'AGR',  'Agro-industrie',                      10),
    (v_id_eth, 'ETH',  'Énergie thermique / Gaz',             11),
    (v_id_imm, 'IMM',  'Immobilier / Promotion structurée',   12)
  ON CONFLICT (code) DO NOTHING;

  -- ───────────────────────────────────────────────────────────────────────────
  -- Domain weights per sector (D1..D9, sum = 100 per sector)
  -- ───────────────────────────────────────────────────────────────────────────

  -- ENR: Énergies renouvelables
  INSERT INTO "BP_PF_v8_sector_domain_weights" ("sectorId", "domainCode", "weightAdjusted") VALUES
    (v_id_enr,'D1', 9),(v_id_enr,'D2',10),(v_id_enr,'D3',16),(v_id_enr,'D4', 8),
    (v_id_enr,'D5', 9),(v_id_enr,'D6',12),(v_id_enr,'D7',15),(v_id_enr,'D8',10),(v_id_enr,'D9',11)
  ON CONFLICT ("sectorId","domainCode") DO UPDATE SET "weightAdjusted" = EXCLUDED."weightAdjusted";

  -- EAU: Eau / Dessalement
  INSERT INTO "BP_PF_v8_sector_domain_weights" ("sectorId", "domainCode", "weightAdjusted") VALUES
    (v_id_eau,'D1', 8),(v_id_eau,'D2', 9),(v_id_eau,'D3',14),(v_id_eau,'D4', 9),
    (v_id_eau,'D5',12),(v_id_eau,'D6',12),(v_id_eau,'D7',14),(v_id_eau,'D8',10),(v_id_eau,'D9',12)
  ON CONFLICT ("sectorId","domainCode") DO UPDATE SET "weightAdjusted" = EXCLUDED."weightAdjusted";

  -- TRA: Transport / Autoroutes
  INSERT INTO "BP_PF_v8_sector_domain_weights" ("sectorId", "domainCode", "weightAdjusted") VALUES
    (v_id_tra,'D1', 9),(v_id_tra,'D2', 9),(v_id_tra,'D3',17),(v_id_tra,'D4',12),
    (v_id_tra,'D5',11),(v_id_tra,'D6', 9),(v_id_tra,'D7',13),(v_id_tra,'D8',11),(v_id_tra,'D9', 9)
  ON CONFLICT ("sectorId","domainCode") DO UPDATE SET "weightAdjusted" = EXCLUDED."weightAdjusted";

  -- POR: Ports / Logistique
  INSERT INTO "BP_PF_v8_sector_domain_weights" ("sectorId", "domainCode", "weightAdjusted") VALUES
    (v_id_por,'D1', 9),(v_id_por,'D2', 9),(v_id_por,'D3',14),(v_id_por,'D4',12),
    (v_id_por,'D5',11),(v_id_por,'D6',12),(v_id_por,'D7',13),(v_id_por,'D8',11),(v_id_por,'D9', 9)
  ON CONFLICT ("sectorId","domainCode") DO UPDATE SET "weightAdjusted" = EXCLUDED."weightAdjusted";

  -- IND: Industrie / Manufacturing
  INSERT INTO "BP_PF_v8_sector_domain_weights" ("sectorId", "domainCode", "weightAdjusted") VALUES
    (v_id_ind,'D1', 9),(v_id_ind,'D2', 9),(v_id_ind,'D3',14),(v_id_ind,'D4',12),
    (v_id_ind,'D5',12),(v_id_ind,'D6',11),(v_id_ind,'D7',16),(v_id_ind,'D8', 9),(v_id_ind,'D9', 8)
  ON CONFLICT ("sectorId","domainCode") DO UPDATE SET "weightAdjusted" = EXCLUDED."weightAdjusted";

  -- MIN: Mines / Extraction
  INSERT INTO "BP_PF_v8_sector_domain_weights" ("sectorId", "domainCode", "weightAdjusted") VALUES
    (v_id_min,'D1', 9),(v_id_min,'D2',11),(v_id_min,'D3',14),(v_id_min,'D4',12),
    (v_id_min,'D5', 9),(v_id_min,'D6', 9),(v_id_min,'D7',12),(v_id_min,'D8',11),(v_id_min,'D9',13)
  ON CONFLICT ("sectorId","domainCode") DO UPDATE SET "weightAdjusted" = EXCLUDED."weightAdjusted";

  -- TOU: Tourisme / Hôtellerie
  INSERT INTO "BP_PF_v8_sector_domain_weights" ("sectorId", "domainCode", "weightAdjusted") VALUES
    (v_id_tou,'D1', 9),(v_id_tou,'D2', 9),(v_id_tou,'D3',14),(v_id_tou,'D4',15),
    (v_id_tou,'D5',12),(v_id_tou,'D6', 9),(v_id_tou,'D7',16),(v_id_tou,'D8', 9),(v_id_tou,'D9', 7)
  ON CONFLICT ("sectorId","domainCode") DO UPDATE SET "weightAdjusted" = EXCLUDED."weightAdjusted";

  -- TEL: Télécom / Data Centers
  INSERT INTO "BP_PF_v8_sector_domain_weights" ("sectorId", "domainCode", "weightAdjusted") VALUES
    (v_id_tel,'D1', 7),(v_id_tel,'D2',11),(v_id_tel,'D3',14),(v_id_tel,'D4', 9),
    (v_id_tel,'D5',13),(v_id_tel,'D6',11),(v_id_tel,'D7',12),(v_id_tel,'D8',12),(v_id_tel,'D9',11)
  ON CONFLICT ("sectorId","domainCode") DO UPDATE SET "weightAdjusted" = EXCLUDED."weightAdjusted";

  -- SAN: Santé / Cliniques
  INSERT INTO "BP_PF_v8_sector_domain_weights" ("sectorId", "domainCode", "weightAdjusted") VALUES
    (v_id_san,'D1', 7),(v_id_san,'D2', 9),(v_id_san,'D3',14),(v_id_san,'D4',12),
    (v_id_san,'D5',12),(v_id_san,'D6',12),(v_id_san,'D7',13),(v_id_san,'D8',12),(v_id_san,'D9', 9)
  ON CONFLICT ("sectorId","domainCode") DO UPDATE SET "weightAdjusted" = EXCLUDED."weightAdjusted";

  -- AGR: Agro-industrie
  INSERT INTO "BP_PF_v8_sector_domain_weights" ("sectorId", "domainCode", "weightAdjusted") VALUES
    (v_id_agr,'D1', 9),(v_id_agr,'D2', 9),(v_id_agr,'D3',14),(v_id_agr,'D4',12),
    (v_id_agr,'D5',11),(v_id_agr,'D6',11),(v_id_agr,'D7',13),(v_id_agr,'D8', 8),(v_id_agr,'D9',13)
  ON CONFLICT ("sectorId","domainCode") DO UPDATE SET "weightAdjusted" = EXCLUDED."weightAdjusted";

  -- ETH: Énergie thermique / Gaz
  INSERT INTO "BP_PF_v8_sector_domain_weights" ("sectorId", "domainCode", "weightAdjusted") VALUES
    (v_id_eth,'D1', 7),(v_id_eth,'D2', 9),(v_id_eth,'D3',14),(v_id_eth,'D4',10),
    (v_id_eth,'D5',11),(v_id_eth,'D6',11),(v_id_eth,'D7',16),(v_id_eth,'D8', 8),(v_id_eth,'D9',14)
  ON CONFLICT ("sectorId","domainCode") DO UPDATE SET "weightAdjusted" = EXCLUDED."weightAdjusted";

  -- IMM: Immobilier / Promotion structurée
  INSERT INTO "BP_PF_v8_sector_domain_weights" ("sectorId", "domainCode", "weightAdjusted") VALUES
    (v_id_imm,'D1', 9),(v_id_imm,'D2', 9),(v_id_imm,'D3',14),(v_id_imm,'D4',13),
    (v_id_imm,'D5', 9),(v_id_imm,'D6', 9),(v_id_imm,'D7',17),(v_id_imm,'D8',12),(v_id_imm,'D9', 8)
  ON CONFLICT ("sectorId","domainCode") DO UPDATE SET "weightAdjusted" = EXCLUDED."weightAdjusted";

  RAISE NOTICE 'V8 sectors and domain weights inserted successfully (12 sectors × 9 domains = 108 records)';
END $$;
