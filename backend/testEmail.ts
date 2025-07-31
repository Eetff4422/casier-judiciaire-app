// testEmail.ts
import 'dotenv/config';
import { sendMail } from './src/utils/mailer';

const destinataire = 'ton.autre.adresse@gmail.com'; // Remplace par une adresse à toi (différente si possible)

sendMail(destinataire, 'Test Nodemailer ✅', 'Ceci est un test depuis mon backend Nodemailer.')
  .then(() => {
    console.log('📨 Mail envoyé avec succès ✅');
  })
  .catch((err) => {
    console.error('❌ Erreur lors de l’envoi du mail :', err);
  });
