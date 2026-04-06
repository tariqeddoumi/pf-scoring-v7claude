/**
 * Export Service - Generates downloadable files in various formats
 * Uses native browser APIs and avoids external library dependencies
 */

interface Evaluation {
  id: string;
  evaluationId: string;
  projectId: string;
  score?: number;
  rating?: string;
  status?: string;
  recommendation?: string;
  createdAt?: string;
  analyst_name?: string;
  domainScores?: Array<{ domain_id: string; domain_name: string; score: number; weight: number }>;
}

export class ExportService {
  /**
   * Generate PDF by creating HTML content for print
   * Returns a Blob containing HTML that can be opened in a browser for print-to-PDF
   */
  static generateEvaluationPDF(evaluation: Evaluation): Blob {
    const html = `
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Rapport d'Évaluation - ${evaluation.evaluationId}</title>
        <style>
          * { margin: 0; padding: 0; }
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            color: #333;
            line-height: 1.6;
            background: white;
          }
          .container { max-width: 900px; margin: 0 auto; padding: 40px 20px; }
          header {
            text-align: center;
            border-bottom: 3px solid #003366;
            padding-bottom: 20px;
            margin-bottom: 30px;
          }
          h1 { color: #003366; font-size: 28px; margin-bottom: 10px; }
          .subtitle { color: #666; font-size: 14px; }
          .metadata {
            display: grid;
            grid-template-columns: 1fr 1fr 1fr;
            gap: 20px;
            margin: 30px 0;
            padding: 20px;
            background: #f5f5f5;
            border-radius: 4px;
          }
          .metadata-item { }
          .metadata-label { color: #999; font-size: 12px; text-transform: uppercase; }
          .metadata-value { font-size: 16px; font-weight: bold; color: #003366; }
          .score-card {
            background: linear-gradient(135deg, #003366 0%, #004477 100%);
            color: white;
            padding: 40px;
            text-align: center;
            border-radius: 8px;
            margin: 30px 0;
          }
          .score-value { font-size: 48px; font-weight: bold; margin: 10px 0; }
          .score-label { font-size: 14px; text-transform: uppercase; opacity: 0.9; }
          .rating-info {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-top: 20px;
            font-size: 14px;
          }
          h2 {
            color: #003366;
            font-size: 20px;
            margin-top: 40px;
            margin-bottom: 15px;
            border-left: 4px solid #00a8cc;
            padding-left: 15px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 15px;
          }
          th {
            background: #003366;
            color: white;
            padding: 12px;
            text-align: left;
            font-weight: 600;
          }
          td {
            padding: 10px 12px;
            border-bottom: 1px solid #ddd;
          }
          tr:nth-child(even) { background: #f9f9f9; }
          .recommendation {
            background: #e8f4f8;
            border-left: 4px solid #00a8cc;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
          }
          footer {
            border-top: 1px solid #ddd;
            margin-top: 40px;
            padding-top: 20px;
            font-size: 12px;
            color: #999;
            text-align: center;
          }
          @media print {
            body { margin: 0; padding: 0; }
            .container { padding: 0; }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <header>
            <h1>Rapport d'Évaluation</h1>
            <div class="subtitle">PF Scoring - Project Finance Evaluation</div>
          </header>

          <div class="metadata">
            <div class="metadata-item">
              <div class="metadata-label">Évaluation</div>
              <div class="metadata-value">${evaluation.evaluationId}</div>
            </div>
            <div class="metadata-item">
              <div class="metadata-label">Projet</div>
              <div class="metadata-value">${evaluation.projectId}</div>
            </div>
            <div class="metadata-item">
              <div class="metadata-label">Date</div>
              <div class="metadata-value">${new Date(evaluation.createdAt || new Date()).toLocaleDateString('fr-FR')}</div>
            </div>
          </div>

          <div class="score-card">
            <div class="score-label">Score Global</div>
            <div class="score-value">${(evaluation.score || 0).toFixed(2)}/10</div>
            <div class="rating-info">
              <div><strong>Rating:</strong> ${evaluation.rating || 'N/A'}</div>
              <div><strong>Analyste:</strong> ${evaluation.analyst_name || 'N/A'}</div>
            </div>
          </div>

          <h2>Scores par Domaine</h2>
          <table>
            <thead>
              <tr>
                <th>Domaine</th>
                <th>Score</th>
                <th>Poids</th>
                <th>Contribution</th>
              </tr>
            </thead>
            <tbody>
              ${(evaluation.domainScores || []).map(d => `
                <tr>
                  <td>${d.domain_id || 'N/A'}: ${d.domain_name || 'N/A'}</td>
                  <td>${(d.score || 0).toFixed(2)}/10</td>
                  <td>${(d.weight || 0).toFixed(1)}%</td>
                  <td>${(((d.score || 0) * (d.weight || 0)) / 100).toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          ${evaluation.recommendation ? `
            <h2>Recommandation</h2>
            <div class="recommendation">
              ${evaluation.recommendation}
            </div>
          ` : ''}

          <footer>
            <p>Rapport généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}</p>
            <p>Conforme IFC, EBRD, Basel III et directives Bank Al-Maghrib</p>
          </footer>
        </div>
      </body>
      </html>
    `;

    return new Blob([html], { type: 'text/html;charset=utf-8;' });
  }

  /**
   * Generate Excel export as CSV format (can be opened in Excel)
   */
  static generatePortfolioExcel(evaluations: Evaluation[]): Blob {
    const headers = ['ID Évaluation', 'Projet', 'Score', 'Rating', 'Statut', 'Analyste', 'Date'];
    const rows = evaluations.map(e => [
      e.evaluationId,
      e.projectId,
      (e.score || 0).toFixed(2),
      e.rating || 'N/A',
      e.status || 'N/A',
      e.analyst_name || 'N/A',
      e.createdAt ? new Date(e.createdAt).toLocaleDateString('fr-FR') : 'N/A',
    ]);

    const csvContent = [
      headers.map(h => `"${h}"`).join(','),
      ...rows.map(r => r.map(v => `"${v}"`).join(',')),
    ].join('\n');

    return new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  }

  /**
   * Generate Word-compatible document (as HTML that can be saved as .docx)
   */
  static generateEvaluationWord(evaluation: Evaluation): Blob {
    const html = `
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Rapport d'Évaluation - ${evaluation.evaluationId}</title>
        <style>
          body {
            font-family: 'Calibri', 'Segoe UI', sans-serif;
            margin: 1in;
            line-height: 1.5;
            color: #333;
          }
          h1 { color: #003366; font-size: 24pt; margin-bottom: 12pt; }
          h2 { color: #003366; font-size: 16pt; margin-top: 14pt; margin-bottom: 7pt; }
          p { margin-bottom: 12pt; }
          table {
            width: 100%;
            border-collapse: collapse;
            margin: 12pt 0;
          }
          th, td {
            border: 1pt solid #999;
            padding: 6pt;
            text-align: left;
          }
          th { background-color: #e0e0e0; font-weight: bold; }
          .info-box {
            background-color: #f0f0f0;
            border-left: 4pt solid #003366;
            padding: 12pt;
            margin: 12pt 0;
          }
          .score-highlight {
            font-size: 18pt;
            font-weight: bold;
            color: #003366;
          }
        </style>
      </head>
      <body>
        <h1>Rapport d'Évaluation Project Finance</h1>

        <div class="info-box">
          <p><strong>Évaluation:</strong> ${evaluation.evaluationId}</p>
          <p><strong>Projet:</strong> ${evaluation.projectId}</p>
          <p><strong>Date:</strong> ${new Date(evaluation.createdAt || new Date()).toLocaleDateString('fr-FR')}</p>
          <p><strong>Analyste:</strong> ${evaluation.analyst_name || 'Non spécifié'}</p>
        </div>

        <h2>Score Global</h2>
        <p><span class="score-highlight">${(evaluation.score || 0).toFixed(2)}/10</span></p>
        <p><strong>Rating:</strong> ${evaluation.rating || 'N/A'}</p>
        <p><strong>Statut:</strong> ${evaluation.status || 'N/A'}</p>

        <h2>Scores par Domaine</h2>
        <table>
          <tr>
            <th>Domaine</th>
            <th>Score</th>
            <th>Poids (%)</th>
            <th>Contribution</th>
          </tr>
          ${(evaluation.domainScores || []).map(d => `
            <tr>
              <td>${d.domain_id || 'N/A'}: ${d.domain_name || 'N/A'}</td>
              <td>${(d.score || 0).toFixed(2)}</td>
              <td>${(d.weight || 0).toFixed(1)}</td>
              <td>${(((d.score || 0) * (d.weight || 0)) / 100).toFixed(2)}</td>
            </tr>
          `).join('')}
        </table>

        ${evaluation.recommendation ? `
          <h2>Recommandation</h2>
          <div class="info-box">
            <p>${evaluation.recommendation}</p>
          </div>
        ` : ''}

        <p style="margin-top: 24pt; color: #999; font-size: 10pt;">
          Rapport généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}
          <br/>Conforme IFC, EBRD, Basel III et directives Bank Al-Maghrib
        </p>
      </body>
      </html>
    `;

    return new Blob([html], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document;charset=utf-8;' });
  }

  /**
   * Generate audit logs export as CSV
   */
  static generateAuditExport(logs: Array<any> = []): Blob {
    const headers = ['Date', 'Utilisateur', 'Action', 'Module', 'Entité', 'Sévérité'];
    const rows = logs.map(log => [
      log.createdAt ? new Date(log.createdAt).toLocaleString('fr-FR') : '',
      log.user_name || 'N/A',
      log.action || 'N/A',
      log.module || 'N/A',
      log.entity_name || 'N/A',
      log.severity || 'info',
    ]);

    const csvContent = [
      headers.map(h => `"${h}"`).join(','),
      ...rows.map(r => r.map(v => `"${v}"`).join(',')),
    ].join('\n');

    return new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  }
}

export default ExportService;

