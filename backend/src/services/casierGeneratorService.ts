// backend/src/services/casierGeneratorService.ts
import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

export interface CasierData {
  demandeur: {
    fullName: string;
    email: string;
    dateNaissance?: string;
    lieuNaissance?: string;
  };
  typeCasier: 'B1' | 'B2' | 'B3';
  numeroReference: string;
  dateGeneration: Date;
  observations?: string;
  agent: {
    fullName: string;
    id: string;
  };
}

export class CasierGeneratorService {
  
  // Générer un numéro de référence unique
  static generateReference(typeCasier: string): string {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const timestamp = Date.now().toString().slice(-6);
    
    return `${typeCasier}-${year}${month}${day}-${timestamp}`;
  }

  // Générer le contenu HTML du casier
  static generateHTMLContent(data: CasierData): string {
    const { demandeur, typeCasier, numeroReference, dateGeneration, observations, agent } = data;
    
    return `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Casier Judiciaire - ${typeCasier}</title>
    <style>
        body {
            font-family: 'Times New Roman', serif;
            margin: 0;
            padding: 20px;
            background-color: #f8f9fa;
            color: #333;
        }
        .container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            padding: 40px;
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        .header {
            text-align: center;
            margin-bottom: 40px;
            border-bottom: 3px solid #2c5282;
            padding-bottom: 20px;
        }
        .logo {
            font-size: 24px;
            font-weight: bold;
            color: #2c5282;
            margin-bottom: 10px;
        }
        .title {
            font-size: 28px;
            font-weight: bold;
            color: #1a365d;
            margin: 20px 0;
        }
        .subtitle {
            font-size: 18px;
            color: #4a5568;
            margin-bottom: 10px;
        }
        .content {
            line-height: 1.8;
            margin: 30px 0;
        }
        .info-section {
            margin: 25px 0;
            padding: 20px;
            background-color: #f7fafc;
            border-left: 4px solid #2c5282;
        }
        .info-row {
            display: flex;
            justify-content: space-between;
            margin: 10px 0;
            padding: 5px 0;
            border-bottom: 1px dotted #e2e8f0;
        }
        .label {
            font-weight: bold;
            color: #2d3748;
        }
        .value {
            color: #4a5568;
        }
        .declaration {
            background-color: #ebf8ff;
            padding: 30px;
            border-radius: 8px;
            margin: 30px 0;
            text-align: center;
            font-size: 16px;
            border: 2px solid #2c5282;
        }
        .footer {
            margin-top: 50px;
            text-align: center;
            font-size: 12px;
            color: #718096;
            border-top: 1px solid #e2e8f0;
            padding-top: 20px;
        }
        .signature-section {
            margin-top: 40px;
            display: flex;
            justify-content: space-between;
        }
        .signature-block {
            text-align: center;
            width: 200px;
        }
        .signature-line {
            border-bottom: 1px solid #333;
            margin: 20px 0 5px 0;
            height: 40px;
        }
        .watermark {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) rotate(-45deg);
            font-size: 72px;
            color: rgba(44, 82, 130, 0.1);
            font-weight: bold;
            z-index: -1;
            pointer-events: none;
        }
        @media print {
            body { margin: 0; padding: 0; background: white; }
            .container { box-shadow: none; border-radius: 0; }
        }
    </style>
</head>
<body>
    <div class="watermark">OFFICIEL</div>
    
    <div class="container">
        <div class="header">
            <div class="logo">RÉPUBLIQUE GABONAISE</div>
            <div style="font-size: 14px; margin: 5px 0;">MINISTÈRE DE LA JUSTICE</div>
            <div style="font-size: 12px; color: #666;">Direction des Affaires Criminelles et des Grâces</div>
        </div>

        <div class="title">BULLETIN N°${typeCasier} DU CASIER JUDICIAIRE</div>
        
        <div class="info-section">
            <div class="info-row">
                <span class="label">Numéro de référence :</span>
                <span class="value">${numeroReference}</span>
            </div>
            <div class="info-row">
                <span class="label">Date de génération :</span>
                <span class="value">${dateGeneration.toLocaleDateString('fr-FR', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}</span>
            </div>
            <div class="info-row">
                <span class="label">Nom et prénoms :</span>
                <span class="value">${demandeur.fullName.toUpperCase()}</span>
            </div>
            ${demandeur.dateNaissance ? `
            <div class="info-row">
                <span class="label">Date de naissance :</span>
                <span class="value">${demandeur.dateNaissance}</span>
            </div>
            ` : ''}
            ${demandeur.lieuNaissance ? `
            <div class="info-row">
                <span class="label">Lieu de naissance :</span>
                <span class="value">${demandeur.lieuNaissance}</span>
            </div>
            ` : ''}
        </div>

        <div class="content">
            <p><strong>Objet :</strong> ${this.getObjetCasier(typeCasier)}</p>
            
            <div class="declaration">
                <p><strong>DÉCLARATION</strong></p>
                <p>Je, soussigné(e), certifie que les informations contenues dans ce bulletin sont exactes et conformes aux données enregistrées dans le casier judiciaire national.</p>
                ${this.getDeclarationContent(typeCasier)}
            </div>

            ${observations ? `
            <div class="info-section">
                <div class="label">Observations :</div>
                <div style="margin-top: 10px; font-style: italic;">${observations}</div>
            </div>
            ` : ''}
        </div>

        <div class="signature-section">
            <div class="signature-block">
                <div>Le demandeur</div>
                <div class="signature-line"></div>
                <div style="font-size: 12px; margin-top: 5px;">Signature</div>
            </div>
            <div class="signature-block">
                <div>L'agent instructeur</div>
                <div class="signature-line"></div>
                <div style="font-size: 12px; margin-top: 5px;">${agent.fullName}</div>
            </div>
        </div>

        <div class="footer">
            <p>Ce document est généré électroniquement et ne nécessite pas de signature manuscrite pour être valide.</p>
            <p>Document confidentiel - Toute reproduction ou diffusion non autorisée est interdite</p>
            <p>Généré le ${new Date().toLocaleString('fr-FR')} par le système automatisé de gestion des casiers judiciaires</p>
        </div>
    </div>
</body>
</html>`;
  }

  // Obtenir l'objet selon le type de casier
  private static getObjetCasier(typeCasier: string): string {
    switch (typeCasier) {
      case 'B1':
        return 'Bulletin destiné aux administrations publiques (condamnations, interdictions, déchéances)';
      case 'B2':
        return 'Bulletin destiné aux employeurs (condamnations à des peines d\'emprisonnement)';
      case 'B3':
        return 'Bulletin destiné à l\'intéressé (ensemble des condamnations)';
      default:
        return 'Bulletin de casier judiciaire';
    }
  }

  // Obtenir le contenu de déclaration selon le type
  private static getDeclarationContent(typeCasier: string): string {
    const baseContent = `
      <p>Le présent bulletin certifie la situation judiciaire de l'intéressé(e) au regard des dispositions légales en vigueur.</p>
    `;

    switch (typeCasier) {
      case 'B1':
        return baseContent + `<p><em>Ce bulletin contient les condamnations, interdictions et déchéances prononcées par les juridictions gabonaises.</em></p>`;
      case 'B2':
        return baseContent + `<p><em>Ce bulletin contient uniquement les condamnations à des peines d'emprisonnement sans sursis.</em></p>`;
      case 'B3':
        return baseContent + `<p><em>Ce bulletin contient l'ensemble des condamnations prononcées par les juridictions gabonaises.</em></p>`;
      default:
        return baseContent;
    }
  }

  // Sauvegarder le fichier HTML
  static async saveHTMLFile(content: string, filename: string): Promise<string> {
    const uploadsDir = path.join(process.cwd(), 'uploads', 'casiers');
    
    // Créer le dossier s'il n'existe pas
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const filePath = path.join(uploadsDir, filename);
    
    return new Promise((resolve, reject) => {
      fs.writeFile(filePath, content, 'utf8', (err) => {
        if (err) {
          reject(err);
        } else {
          resolve(filePath);
        }
      });
    });
  }

  // Générer le casier complet
  static async genererCasier(demandeId: string, agentId: string, observations?: string): Promise<{
    numeroReference: string;
    cheminFichier: string;
    dateGeneration: Date;
  }> {
    try {
      // Récupérer les données de la demande
      const demande = await prisma.demandeCasier.findUnique({
        where: { id: demandeId },
        include: {
          demandeur: true,
          agent: true
        }
      });

      if (!demande) {
        throw new Error('Demande non trouvée');
      }

      if (!demande.agent) {
        throw new Error('Agent non assigné à cette demande');
      }

      // Générer les données du casier
      const numeroReference = this.generateReference(demande.typeCasier);
      const dateGeneration = new Date();

      const casierData: CasierData = {
        demandeur: {
          fullName: demande.demandeur.fullName,
          email: demande.demandeur.email
        },
        typeCasier: demande.typeCasier as 'B1' | 'B2' | 'B3',
        numeroReference,
        dateGeneration,
        observations,
        agent: {
          fullName: demande.agent.fullName,
          id: demande.agent.id
        }
      };

      // Générer le contenu HTML
      const htmlContent = this.generateHTMLContent(casierData);
      
      // Sauvegarder le fichier
      const filename = `casier_${numeroReference}.html`;
      const cheminFichier = await this.saveHTMLFile(htmlContent, filename);

      // Créer l'enregistrement du document généré
      await prisma.document.create({
        data: {
          nom: `Casier Judiciaire ${demande.typeCasier} - ${demande.demandeur.fullName}`,
          typeDocument: 'CASIER_GENERE',
          cheminFichier: cheminFichier,
          tailleFichier: Buffer.from(htmlContent, 'utf8').length,
          formatFichier: 'html',
          demandeId: demandeId
        }
      });

      return {
        numeroReference,
        cheminFichier,
        dateGeneration
      };

    } catch (error) {
      console.error('Erreur lors de la génération du casier:', error);
      throw error;
    }
  }

  // Vérifier si un casier existe déjà
  static async casierExiste(demandeId: string): Promise<boolean> {
    const casierExistant = await prisma.document.findFirst({
      where: {
        demandeId,
        typeDocument: 'CASIER_GENERE'
      }
    });

    return !!casierExistant;
  }
}