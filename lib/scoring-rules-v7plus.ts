/**
 * PF Scoring V7++ - Rules Engine
 * NO-GO rules (automatic rejection) & MALUS rules (score penalties)
 */

import {
  DomainCode,
  RatingScale,
  NOGORule,
  MALUSRule,
  ProjectData,
  DomainScore,
  RuleSeverity,
} from "@/types/scoring-v7plus";

// ============================================================================
// RULES ENGINE CLASS
// ============================================================================

export class RulesEngine {
  /**
   * Check all NO-GO rules (automatic rejection if triggered)
   * Returns triggered NO-GOs only
   */
  public checkNOGOs(projectData: ProjectData): NOGORule[] {
    const triggered: NOGORule[] = [];

    // CATEGORY A: Sponsor Risk
    if (this.checkNOGO_1A(projectData)) triggered.push(this.createNOGO_1A());
    if (this.checkNOGO_1B(projectData)) triggered.push(this.createNOGO_1B());
    if (this.checkNOGO_1C(projectData)) triggered.push(this.createNOGO_1C());

    // CATEGORY B: Country Risk
    if (this.checkNOGO_2A(projectData)) triggered.push(this.createNOGO_2A());
    if (this.checkNOGO_2B(projectData)) triggered.push(this.createNOGO_2B());

    // CATEGORY C: Construction Risk
    if (this.checkNOGO_3A(projectData)) triggered.push(this.createNOGO_3A());
    if (this.checkNOGO_3B(projectData)) triggered.push(this.createNOGO_3B());
    if (this.checkNOGO_3C(projectData)) triggered.push(this.createNOGO_3C());

    // CATEGORY D: Revenue Risk
    if (this.checkNOGO_5A(projectData)) triggered.push(this.createNOGO_5A());
    if (this.checkNOGO_5B(projectData)) triggered.push(this.createNOGO_5B());
    if (this.checkNOGO_5C(projectData)) triggered.push(this.createNOGO_5C());
    if (this.checkNOGO_5D(projectData)) triggered.push(this.createNOGO_5D());
    if (this.checkNOGO_5E(projectData)) triggered.push(this.createNOGO_5E());

    // CATEGORY E: Financial Risk
    if (this.checkNOGO_6A(projectData)) triggered.push(this.createNOGO_6A());
    if (this.checkNOGO_6B(projectData)) triggered.push(this.createNOGO_6B());
    if (this.checkNOGO_6C(projectData)) triggered.push(this.createNOGO_6C());

    // CATEGORY F: Legal Risk
    if (this.checkNOGO_8A(projectData)) triggered.push(this.createNOGO_8A());
    if (this.checkNOGO_8B(projectData)) triggered.push(this.createNOGO_8B());
    if (this.checkNOGO_8C(projectData)) triggered.push(this.createNOGO_8C());

    // CATEGORY G: ESG Risk
    if (this.checkNOGO_9A(projectData)) triggered.push(this.createNOGO_9A());
    if (this.checkNOGO_9B(projectData)) triggered.push(this.createNOGO_9B());
    if (this.checkNOGO_9C(projectData)) triggered.push(this.createNOGO_9C());

    return triggered;
  }

  /**
   * Check all MALUS rules (score reductions)
   */
  public checkMALUS(
    projectData: ProjectData,
    domainScores: Map<DomainCode, DomainScore>
  ): MALUSRule[] {
    const triggered: MALUSRule[] = [];

    if (this.checkMALUS_1A(projectData)) triggered.push(this.createMALUS_1A());
    if (this.checkMALUS_2A(projectData)) triggered.push(this.createMALUS_2A());
    if (this.checkMALUS_3A(projectData)) triggered.push(this.createMALUS_3A());
    if (this.checkMALUS_5A(projectData)) triggered.push(this.createMALUS_5A());
    if (this.checkMALUS_5B(projectData)) triggered.push(this.createMALUS_5B());
    if (this.checkMALUS_5C(projectData)) triggered.push(this.createMALUS_5C());
    if (this.checkMALUS_5D(projectData)) triggered.push(this.createMALUS_5D());
    if (this.checkMALUS_5E(projectData)) triggered.push(this.createMALUS_5E());
    if (this.checkMALUS_5F(projectData)) triggered.push(this.createMALUS_5F());
    if (this.checkMALUS_6A(projectData)) triggered.push(this.createMALUS_6A());
    if (this.checkMALUS_6B(projectData)) triggered.push(this.createMALUS_6B());
    if (this.checkMALUS_6C(projectData)) triggered.push(this.createMALUS_6C());
    if (this.checkMALUS_7A(projectData)) triggered.push(this.createMALUS_7A());
    if (this.checkMALUS_7B(projectData)) triggered.push(this.createMALUS_7B());
    if (this.checkMALUS_8A(projectData)) triggered.push(this.createMALUS_8A());
    if (this.checkMALUS_8B(projectData)) triggered.push(this.createMALUS_8B());
    if (this.checkMALUS_9A(projectData)) triggered.push(this.createMALUS_9A());
    if (this.checkMALUS_9B(projectData)) triggered.push(this.createMALUS_9B());
    if (this.checkMALUS_9C(projectData)) triggered.push(this.createMALUS_9C());

    return triggered;
  }

  // ========================================================================
  // NO-GO RULES (AUTOMATIC REJECTION)
  // ========================================================================

  // CATEGORY A: SPONSOR RISK
  private checkNOGO_1A(p: ProjectData): boolean {
    const rating = p.sponsor.rating;
    return (
      rating === RatingScale.CCC ||
      rating === RatingScale.D ||
      rating === RatingScale.B
    );
  }
  private createNOGO_1A(): NOGORule {
    return {
      ruleId: "NOGO_1A",
      category: "Sponsor",
      condition: "Sponsor rating < CCC",
      severity: RuleSeverity.CRITICAL,
      description: "Sponsor insolvent or below-CCC rated",
      workaround: "Sponsor replacement or capital injection",
      triggered: true,
    };
  }

  private checkNOGO_1B(p: ProjectData): boolean {
    // Would check insolvency status from database
    // Placeholder: always false (check real data)
    return false;
  }
  private createNOGO_1B(): NOGORule {
    return {
      ruleId: "NOGO_1B",
      category: "Sponsor",
      condition: "Insolvency/Restructuring",
      severity: RuleSeverity.CRITICAL,
      description: "Sponsor in bankruptcy proceedings",
      workaround: "Sponsor replacement",
      triggered: true,
    };
  }

  private checkNOGO_1C(p: ProjectData): boolean {
    const liquidity = p.sponsor.liquidityRatio ?? 1;
    return liquidity < 0.1;
  }
  private createNOGO_1C(): NOGORule {
    return {
      ruleId: "NOGO_1C",
      category: "Sponsor",
      condition: "Liquidity ratio < 0.1",
      severity: RuleSeverity.CRITICAL,
      description: "Sponsor cash/debt < 0.1 = immediate risk",
      workaround: "Capital injection by sponsor",
      triggered: true,
    };
  }

  // CATEGORY B: COUNTRY RISK
  private checkNOGO_2A(p: ProjectData): boolean {
    // Would check country political risk data
    // Morocco typically: stable, no war
    return false;
  }
  private createNOGO_2A(): NOGORule {
    return {
      ruleId: "NOGO_2A",
      category: "Country",
      condition: "War/Extreme Political Instability",
      severity: RuleSeverity.CRITICAL,
      description: "Country in active conflict or coup",
      workaround: "Geographic alternative",
      triggered: true,
    };
  }

  private checkNOGO_2B(p: ProjectData): boolean {
    // Would check history of expropriation
    return false;
  }
  private createNOGO_2B(): NOGORule {
    return {
      ruleId: "NOGO_2B",
      category: "Country",
      condition: "Repeated Expropriation",
      severity: RuleSeverity.CRITICAL,
      description: "Historique of asset seizure",
      workaround: "Sovereign guarantee or insurance",
      triggered: true,
    };
  }

  // CATEGORY C: CONSTRUCTION RISK
  private checkNOGO_3A(p: ProjectData): boolean {
    // Would check EPC contractor status
    return false;
  }
  private createNOGO_3A(): NOGORule {
    return {
      ruleId: "NOGO_3A",
      category: "Construction",
      condition: "EPC Insolvency",
      severity: RuleSeverity.CRITICAL,
      description: "EPC contractor bankrupt or insolvent",
      workaround: "New EPC selection",
      triggered: true,
    };
  }

  private checkNOGO_3B(p: ProjectData): boolean {
    // Would check EPC failure history
    return false;
  }
  private createNOGO_3B(): NOGORule {
    return {
      ruleId: "NOGO_3B",
      category: "Construction",
      condition: "EPC Failed History",
      severity: RuleSeverity.CRITICAL,
      description: "EPC has multiple failed projects",
      workaround: "New EPC selection",
      triggered: true,
    };
  }

  private checkNOGO_3C(p: ProjectData): boolean {
    // Would check if cost is guaranteed (not reimbursable)
    return false;
  }
  private createNOGO_3C(): NOGORule {
    return {
      ruleId: "NOGO_3C",
      category: "Construction",
      condition: "No Cost Guarantee",
      severity: RuleSeverity.CRITICAL,
      description: "Reimbursable contract (no fixed price)",
      workaround: "Negotiate fixed-price EPC",
      triggered: true,
    };
  }

  // CATEGORY D: REVENUE RISK
  private checkNOGO_5A(p: ProjectData): boolean {
    // Would check if PPA is signed (not LOI or verbal)
    return !p.ppaData;
  }
  private createNOGO_5A(): NOGORule {
    return {
      ruleId: "NOGO_5A",
      category: "Revenue",
      condition: "No PPA Signed",
      severity: RuleSeverity.CRITICAL,
      description: "Agreement verbal or Letter of Intent only",
      workaround: "Finalize PPA signature",
      triggered: true,
    };
  }

  private checkNOGO_5B(p: ProjectData): boolean {
    const rating = p.offtaker?.rating;
    return (
      rating === RatingScale.CCC ||
      rating === RatingScale.D ||
      rating === RatingScale.B
    );
  }
  private createNOGO_5B(): NOGORule {
    return {
      ruleId: "NOGO_5B",
      category: "Revenue",
      condition: "Offtaker Insolvency",
      severity: RuleSeverity.CRITICAL,
      description: "Offtaker in default or CCC- rating",
      workaround: "New offtaker or guarantee",
      triggered: true,
    };
  }

  private checkNOGO_5C(p: ProjectData): boolean {
    const concentration = p.offtaker?.concentrationPercent ?? 0;
    return concentration > 0.85;
  }
  private createNOGO_5C(): NOGORule {
    return {
      ruleId: "NOGO_5C",
      category: "Revenue",
      condition: "Mono-client >85%",
      severity: RuleSeverity.CRITICAL,
      description: "Single offtaker represents >85% revenue",
      workaround: "Diversify offtakers",
      triggered: true,
    };
  }

  private checkNOGO_5D(p: ProjectData): boolean {
    // Would check market growth trajectory
    return false; // Placeholder
  }
  private createNOGO_5D(): NOGORule {
    return {
      ruleId: "NOGO_5D",
      category: "Revenue",
      condition: "Market Decline >3%",
      severity: RuleSeverity.CRITICAL,
      description: "Underlying market shrinking >3% CAGR",
      workaround: "Geographic/sector alternative",
      triggered: true,
    };
  }

  private checkNOGO_5E(p: ProjectData): boolean {
    // Would compare tariff vs market average
    return false; // Placeholder
  }
  private createNOGO_5E(): NOGORule {
    return {
      ruleId: "NOGO_5E",
      category: "Revenue",
      condition: "Tariff Incompetitive +20%",
      severity: RuleSeverity.CRITICAL,
      description: "PPA price 20%+ above market",
      workaround: "Renegotiate tariff or market analysis",
      triggered: true,
    };
  }

  // CATEGORY E: FINANCIAL RISK
  private checkNOGO_6A(p: ProjectData): boolean {
    const dscr = p.financial.dscr ?? 1.2;
    return dscr < 1.1;
  }
  private createNOGO_6A(): NOGORule {
    return {
      ruleId: "NOGO_6A",
      category: "Financial",
      condition: "DSCR < 1.10x",
      severity: RuleSeverity.CRITICAL,
      description: "Debt service coverage below minimum",
      workaround: "Reduce leverage or increase equity",
      triggered: true,
    };
  }

  private checkNOGO_6B(p: ProjectData): boolean {
    // Would check if DSRA exists
    return false; // Placeholder
  }
  private createNOGO_6B(): NOGORule {
    return {
      ruleId: "NOGO_6B",
      category: "Financial",
      condition: "No DSRA/Reserves",
      severity: RuleSeverity.CRITICAL,
      description: "Absence of debt service reserve account",
      workaround: "Establish DSRA (min 3-6 months)",
      triggered: true,
    };
  }

  private checkNOGO_6C(p: ProjectData): boolean {
    const equity = p.sponsor.equityPercent ?? 0.3;
    const debt = 1 - equity;
    return debt > 0.85;
  }
  private createNOGO_6C(): NOGORule {
    return {
      ruleId: "NOGO_6C",
      category: "Financial",
      condition: "Leverage > 85/15",
      severity: RuleSeverity.CRITICAL,
      description: "Debt >85% of total funding",
      workaround: "Increase equity contribution",
      triggered: true,
    };
  }

  // CATEGORY F: LEGAL RISK
  private checkNOGO_8A(p: ProjectData): boolean {
    // Would check if all key contracts are signed
    return false; // Placeholder
  }
  private createNOGO_8A(): NOGORule {
    return {
      ruleId: "NOGO_8A",
      category: "Legal",
      condition: "Missing Key Contracts",
      severity: RuleSeverity.CRITICAL,
      description: "EPC/O&M/PPA/Concession not signed",
      workaround: "Finalize all contracts",
      triggered: true,
    };
  }

  private checkNOGO_8B(p: ProjectData): boolean {
    // Would check legal enforceability
    return false; // Placeholder
  }
  private createNOGO_8B(): NOGORule {
    return {
      ruleId: "NOGO_8B",
      category: "Legal",
      condition: "Non-Enforceable Security",
      severity: RuleSeverity.CRITICAL,
      description: "Guarantees cannot be executed locally",
      workaround: "Legal restructuring required",
      triggered: true,
    };
  }

  private checkNOGO_8C(p: ProjectData): boolean {
    // Would check for active litigation
    return false; // Placeholder
  }
  private createNOGO_8C(): NOGORule {
    return {
      ruleId: "NOGO_8C",
      category: "Legal",
      condition: "Major Active Litigation",
      severity: RuleSeverity.CRITICAL,
      description: "Ongoing major lawsuits",
      workaround: "Resolve before financing",
      triggered: true,
    };
  }

  // CATEGORY G: ESG RISK
  private checkNOGO_9A(p: ProjectData): boolean {
    // Would check for major social conflicts
    return false; // Placeholder
  }
  private createNOGO_9A(): NOGORule {
    return {
      ruleId: "NOGO_9A",
      category: "ESG",
      condition: "Social Conflict MAJOR",
      severity: RuleSeverity.CRITICAL,
      description: "Significant community opposition/violence",
      workaround: "Resolve via stakeholder engagement",
      triggered: true,
    };
  }

  private checkNOGO_9B(p: ProjectData): boolean {
    // Would check for environmental non-compliance
    return false; // Placeholder
  }
  private createNOGO_9B(): NOGORule {
    return {
      ruleId: "NOGO_9B",
      category: "ESG",
      condition: "Environmental Non-Compliance",
      severity: RuleSeverity.CRITICAL,
      description: "Breach of national/international env. law",
      workaround: "Remediation + permits required",
      triggered: true,
    };
  }

  private checkNOGO_9C(p: ProjectData): boolean {
    const climateRisk = p.esg?.climateRisk;
    // Climate risk becomes a NO-GO only in extreme cases
    // For now, this is primarily an information field
    return false; // Placeholder - climate HIGH risk triggers warnings but not automatic NO-GO
  }
  private createNOGO_9C(): NOGORule {
    return {
      ruleId: "NOGO_9C",
      category: "ESG",
      condition: "Climate Risk CRITICAL",
      severity: RuleSeverity.CRITICAL,
      description: "High physical/transition risk + vulnerability",
      workaround: "Geographic/sector alternative",
      triggered: true,
    };
  }

  // ========================================================================
  // MALUS RULES (SCORE REDUCTIONS)
  // ========================================================================

  private checkMALUS_1A(p: ProjectData): boolean {
    const equity = p.sponsor.equityPercent ?? 0.3;
    return equity < 0.2;
  }
  private createMALUS_1A(): MALUSRule {
    return {
      ruleId: "MALUS_1A",
      domain: DomainCode.D1,
      condition: "Sponsor equity < 20%",
      penaltyPoints: -3,
      triggerLevel: "Equity < 20% of total funding",
      mitigation: "Increase sponsor capital injection",
      triggered: true,
    };
  }

  private checkMALUS_2A(p: ProjectData): boolean {
    // Would check for unhedged FX exposure
    return false; // Placeholder
  }
  private createMALUS_2A(): MALUSRule {
    return {
      ruleId: "MALUS_2A",
      domain: DomainCode.D2,
      condition: "FX mismatch not hedged",
      penaltyPoints: -2,
      triggerLevel: "Unhedged FX exposure >50%",
      mitigation: "Implement FX forward/swap",
      triggered: true,
    };
  }

  private checkMALUS_3A(p: ProjectData): boolean {
    // Would check for performance bond
    return false; // Placeholder
  }
  private createMALUS_3A(): MALUSRule {
    return {
      ruleId: "MALUS_3A",
      domain: DomainCode.D3,
      condition: "EPC no performance bond",
      penaltyPoints: -2,
      triggerLevel: "Performance bond absent",
      mitigation: "Require PB from EPC",
      triggered: true,
    };
  }

  private checkMALUS_5A(p: ProjectData): boolean {
    const dscr = p.financial.dscr ?? 1.3;
    const hasIndexation = p.ppaData?.indexation?.type !== "FIXED";
    return dscr < 1.25 && !hasIndexation;
  }
  private createMALUS_5A(): MALUSRule {
    return {
      ruleId: "MALUS_5A",
      domain: DomainCode.D5,
      condition: "DSCR < 1.25x without indexation",
      penaltyPoints: -5,
      triggerLevel: "DSCR 1.25x + no tariff indexation",
      mitigation: "Add indexation clause or increase tariff",
      triggered: true,
    };
  }

  private checkMALUS_5B(p: ProjectData): boolean {
    const tp = p.ppaData?.takeOrPayPercent ?? 0.8;
    return tp < 0.4;
  }
  private createMALUS_5B(): MALUSRule {
    return {
      ruleId: "MALUS_5B",
      domain: DomainCode.D5,
      condition: "Take-or-Pay < 40%",
      penaltyPoints: -4,
      triggerLevel: "Take-or-pay below 40%",
      mitigation: "Renegotiate PPA for higher TP",
      triggered: true,
    };
  }

  private checkMALUS_5C(p: ProjectData): boolean {
    const indexation = p.ppaData?.indexation?.type;
    return indexation === "FIXED" || !indexation;
  }
  private createMALUS_5C(): MALUSRule {
    return {
      ruleId: "MALUS_5C",
      domain: DomainCode.D5,
      condition: "No indexation with inflation >2%",
      penaltyPoints: -4,
      triggerLevel: "Fixed tariff + inflation forecast >2%",
      mitigation: "Add CPI indexation",
      triggered: true,
    };
  }

  private checkMALUS_5D(p: ProjectData): boolean {
    const concentration = p.offtaker?.concentrationPercent ?? 0.3;
    return concentration > 0.75;
  }
  private createMALUS_5D(): MALUSRule {
    return {
      ruleId: "MALUS_5D",
      domain: DomainCode.D5,
      condition: "Offtaker concentration >75%",
      penaltyPoints: -3,
      triggerLevel: "Single offtaker >75% of revenue",
      mitigation: "Diversify customer base",
      triggered: true,
    };
  }

  private checkMALUS_5E(p: ProjectData): boolean {
    // Would check if reduction rights exist
    return false; // Placeholder
  }
  private createMALUS_5E(): MALUSRule {
    return {
      ruleId: "MALUS_5E",
      domain: DomainCode.D5,
      condition: "Unilateral volume reduction possible",
      penaltyPoints: -4,
      triggerLevel: "PPA allows offtaker to reduce without penalty",
      mitigation: "Add penalty clauses",
      triggered: true,
    };
  }

  private checkMALUS_5F(p: ProjectData): boolean {
    // Would check study age (>5 years)
    return false; // Placeholder
  }
  private createMALUS_5F(): MALUSRule {
    return {
      ruleId: "MALUS_5F",
      domain: DomainCode.D5,
      condition: "Market study >5 years old + context changed",
      penaltyPoints: -2,
      triggerLevel: "Study vintage >5 years + major market shifts",
      mitigation: "Commission updated study",
      triggered: true,
    };
  }

  private checkMALUS_6A(p: ProjectData): boolean {
    // Would check FX hedging coverage
    return false; // Placeholder
  }
  private createMALUS_6A(): MALUSRule {
    return {
      ruleId: "MALUS_6A",
      domain: DomainCode.D6,
      condition: "FX hedging < 80%",
      penaltyPoints: -2,
      triggerLevel: "FX hedge covers <80% of exposure",
      mitigation: "Increase hedging coverage",
      triggered: true,
    };
  }

  private checkMALUS_6B(p: ProjectData): boolean {
    // Would check interest rate hedging
    return false; // Placeholder
  }
  private createMALUS_6B(): MALUSRule {
    return {
      ruleId: "MALUS_6B",
      domain: DomainCode.D6,
      condition: "Interest rate floating >50%",
      penaltyPoints: -2,
      triggerLevel: "Floating rate debt >50% unhedged",
      mitigation: "Increase interest rate hedging",
      triggered: true,
    };
  }

  private checkMALUS_6C(p: ProjectData): boolean {
    // Would check DSRA existence and funding
    return false; // Placeholder
  }
  private createMALUS_6C(): MALUSRule {
    return {
      ruleId: "MALUS_6C",
      domain: DomainCode.D6,
      condition: "No DSRA or under-funded",
      penaltyPoints: -3,
      triggerLevel: "DSRA absent or < 3 months",
      mitigation: "Establish/increase DSRA",
      triggered: true,
    };
  }

  private checkMALUS_7A(p: ProjectData): boolean {
    // Would check LLCR
    return false; // Placeholder
  }
  private createMALUS_7A(): MALUSRule {
    return {
      ruleId: "MALUS_7A",
      domain: DomainCode.D7,
      condition: "LLCR < 1.3x",
      penaltyPoints: -3,
      triggerLevel: "Loan Life Coverage Ratio < 1.3x",
      mitigation: "Extend tenor or reduce leverage",
      triggered: true,
    };
  }

  private checkMALUS_7B(p: ProjectData): boolean {
    const dscr = p.financial.dscr ?? 1.3;
    return dscr >= 1.1 && dscr < 1.2;
  }
  private createMALUS_7B(): MALUSRule {
    return {
      ruleId: "MALUS_7B",
      domain: DomainCode.D7,
      condition: "Stress DSCR 1.10-1.20x",
      penaltyPoints: -2,
      triggerLevel: "Stress-tested DSCR in danger zone",
      mitigation: "Improve base case or increase buffer",
      triggered: true,
    };
  }

  private checkMALUS_8A(p: ProjectData): boolean {
    // Would check collateral coverage
    return false; // Placeholder
  }
  private createMALUS_8A(): MALUSRule {
    return {
      ruleId: "MALUS_8A",
      domain: DomainCode.D8,
      condition: "Security package < 100% coverage",
      penaltyPoints: -2,
      triggerLevel: "Collateral covers <100% of debt",
      mitigation: "Increase guarantee package",
      triggered: true,
    };
  }

  private checkMALUS_8B(p: ProjectData): boolean {
    // Would check enforceability status
    return false; // Placeholder
  }
  private createMALUS_8B(): MALUSRule {
    return {
      ruleId: "MALUS_8B",
      domain: DomainCode.D8,
      condition: "Enforceability uncertain",
      penaltyPoints: -2,
      triggerLevel: "Legal enforceability not confirmed",
      mitigation: "Obtain local legal opinion",
      triggered: true,
    };
  }

  private checkMALUS_9A(p: ProjectData): boolean {
    const climateRisk = p.esg?.climateRisk;
    return climateRisk === "HIGH"; // MALUS for high climate risk
  }
  private createMALUS_9A(): MALUSRule {
    return {
      ruleId: "MALUS_9A",
      domain: DomainCode.D9,
      condition: "Climate risk elevated",
      penaltyPoints: -2,
      triggerLevel: "Physical or transition risk moderate",
      mitigation: "Implement climate mitigation plan",
      triggered: true,
    };
  }

  private checkMALUS_9B(p: ProjectData): boolean {
    // Would check ESG policies
    return false; // Placeholder
  }
  private createMALUS_9B(): MALUSRule {
    return {
      ruleId: "MALUS_9B",
      domain: DomainCode.D9,
      condition: "ESG policies partial or absent",
      penaltyPoints: -1,
      triggerLevel: "Limited ESG documentation",
      mitigation: "Develop comprehensive ESG policy",
      triggered: true,
    };
  }

  private checkMALUS_9C(p: ProjectData): boolean {
    const carbonIntensity = p.esg?.carbonIntensity ?? 0;
    return carbonIntensity > 1000; // High emissions
  }
  private createMALUS_9C(): MALUSRule {
    return {
      ruleId: "MALUS_9C",
      domain: DomainCode.D9,
      condition: "Carbon intensity high",
      penaltyPoints: -2,
      triggerLevel: "High emission project profile",
      mitigation: "Transition plan required",
      triggered: true,
    };
  }
}

export default RulesEngine;
