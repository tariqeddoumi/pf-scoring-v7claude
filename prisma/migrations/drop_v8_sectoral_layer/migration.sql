-- ============================================================================
-- Suppression du référentiel sectoriel V8
-- ============================================================================
--
-- Deux référentiels sectoriels coexistaient et portaient des grandeurs différentes :
-- V8 des poids absolus par domaine (9, 10, 16 … somme 100), V9 des facteurs
-- multiplicateurs (0,8 ; 1 ; 1,2). Le moteur ne lisait que V9.
--
-- Avant cette suppression, les facteurs V9 ont été recalculés à partir des poids V8 —
-- facteur = poids_sectoriel / poids_socle — de sorte que le poids effectif appliqué au
-- calcul redevienne exactement celui que la doctrine avait fixé. Les 108 facteurs ont
-- été réécrits et vérifiés : somme des poids effectifs égale à 100 pour chacun des
-- douze secteurs.
--
-- Le contenu que V9 ne porte pas — doctrine d'intégration, delta en points justifiant
-- chaque poids, 58 stress tests sectoriels — est archivé en clair dans
-- prisma/manual-seed/referentiel-sectoriel-v8-archive.sql, avec le SQL de restauration.
--
-- Cette migration est destructive et sans retour automatique. La restauration passe par
-- le fichier d'archive.
-- ============================================================================

-- Les tables filles d'abord : elles référencent BP_PF_v8_sectors.
DROP TABLE IF EXISTS "BP_PF_v8_sector_domain_impacts";
DROP TABLE IF EXISTS "BP_PF_v8_sector_domain_weights";
DROP TABLE IF EXISTS "BP_PF_v8_sector_red_flags";
DROP TABLE IF EXISTS "BP_PF_v8_sector_stress_tests";
DROP TABLE IF EXISTS "BP_PF_v8_sectors";

-- Sans dépendance : la doctrine, archivée en clair.
DROP TABLE IF EXISTS "BP_PF_v8_integration_rules";
