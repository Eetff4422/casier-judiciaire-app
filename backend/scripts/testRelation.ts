import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testCreation() {
  const userId = '60822e02-5cbe-4352-89b3-33452ad328fb';

  const demande = await prisma.demandeCasier.create({
    data: {
      typeCasier: 'B3',
      modeReception: 'EN_LIGNE',
      canalNotification: 'EMAIL',
      statut: 'SOUMISE',
      suiviCode: 'abcd1234',
      estAnonyme: false,
      demandeur: {
        connect: { id: userId }
      }
    }
  });

  console.log('Demande créée :', demande);
}

testCreation().catch(console.error);
