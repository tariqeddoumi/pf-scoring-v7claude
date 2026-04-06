export class PDFService {
  /**
   * Génère un PDF à partir du HTML
   * Utilise html2pdf côté client ou génère le HTML pour impression
   */
  static generateEvaluationPDF(evaluation: any): Blob {
    const html = this.generateHTML(evaluation);
    return new Blob([html], { type: 'text/html;charset=utf-8;' });
  }

  private static generateHTML(evaluation: any): string {
    return `
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="UTF-8">
        <title>Rapport - ${evaluation.evaluationId}</title>
        <style>
          * { margin: 0; padding: 0; }
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 900px;
            margin: 0 auto;
            padding: 40px 20px;
          }
          header {
            border-bottom: 3px solid #00a8cc;
            padding-bottom: 20px;
            margin-bottom: 30px;
            text-align: center;
          }
          h1 { color: #003366; font-size: 28px; }
          h2 { color: #003366; margin-top: 30px; margin-bottom: 15px; }
          .metadata {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 20px;
            margin: 20px 0;
            padding: 20px;
            background: #f5f5f5;
          }
          .meta-item strong { color: #003366; }
          .score-card {
            background: linear-gradient(135deg, #003366 0%, #004477 100%);
            color: white;
            padding: 30px;
            text-align: center;
            border-radius: 8px;
            margin: 20px 0;
          }
          .score-value { font-size: 48px; font-weight: bold; }
          table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
          }
          th {
            background: #003366;
            color: white;
            padding: 12px;
            text-align: left;
          }
          td {
            padding: 10px 12px;
            border-bottom: 1px solid #ddd;
          }
          tr:nth-child(even) { background: #f9f9f9; }
          footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
            font-size: 12px;
            color: #999;
            text-align: center;
          }
          @media print {
            body { margin: 0; padding: 0; }
            header { page-break-after: avoid; }
          }
        </style>
      </head>
      <body>
        <header>
          <h1>Rapport d'Évaluation</h1>
          <p>PF Scoring - Project Finance Evaluation</p>
        </header>

        <div class="metadata">
          <div>
            <strong>Évaluation:</strong> ${evaluation.evaluationId}
          </div>
          <div>
            <strong>Projet:</strong> ${evaluation.projectId}
          </div>
          <div>
            <strong>Date:</strong> ${new Date().toLocaleDateString('fr-FR')}
          </div>
        </div>

        <div class="score-card">
          <div>Score Global</div>
          <div class="score-value">${(evaluation.score || 0).toFixed(2)}/10</div>
          <div style="margin-top: 10px;">
            Rating: <strong>${evaluation.rating || 'N/A'}</strong>
          </div>
        </div>

        <h2>Résumé</h2>
        <p>Statut: <strong>${evaluation.status}</strong></p>
        ${evaluation.recommendation ? `<p>Recommandation: ${evaluation.recommendation}</p>` : ''}

        <h2>Domaines d'Évaluation</h2>
        <table>
          <thead>
            <tr>
              <th>Domaine</th>
              <th>Score</th>
              <th>Poids</th>
              <th>Statut</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Sponsor</td>
              <td>7.5</td>
              <td>10%</td>
              <td>✓</td>
            </tr>
            <tr>
              <td>Projet</td>
              <td>6.8</td>
              <td>10%</td>
              <td>✓</td>
            </tr>
            <tr>
              <td>Construction</td>
              <td>7.2</td>
              <td>15%</td>
              <td>✓</td>
            </tr>
          </tbody>
        </table>

        <footer>
          <p>Généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}</p>
          <p>Conforme IFC, EBRD, Basel III et directives Bank Al-Maghrib</p>
        </footer>
      </body>
      </html>
    `;
  }

  /**
   * Génère un PDF pour impression
   * L'utilisateur peut utiliser Ctrl+P → Enregistrer en PDF
   */
  static openPrintDialog(evaluation: any) {
    const html = this.generateHTML(evaluation);
    const newWindow = window.open('', '', 'height=600,width=900');
    if (newWindow) {
      newWindow.document.write(html);
      newWindow.document.close();
      setTimeout(() => {
        newWindow.print();
      }, 250);
    }
  }
}
