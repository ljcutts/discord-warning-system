const { PrismaClient } = require("@prisma/client")

const prisma = new PrismaClient();
async function main(name,id) {
   try {
     let doesUserExist = await prisma.user.findUnique({ where: { id: id } });
     const updateStrikeCounter = doesUserExist ? doesUserExist.strikeCounter + 1 : null;
     if (!doesUserExist) {
       await prisma.user.create({
         data: {
           id: id,
           username: name,
           strikeCounter: 1,
         },
       });
     } else {
       const date = new Date();
       const newDate = new Date(
         doesUserExist.timestampSinceFirstStrike.getTime() +
           30 * 24 * 60 * 60 * 1000
       );
       if (date.getTime() >= newDate.getTime()) {
         await prisma.user.update({
           where: { id: id },
           data: { strikeCounter: 1, timestampSinceFirstStrike: new Date()}
         });
       } else {
         await prisma.user.update({
           where: { id: id },
           data: { strikeCounter: updateStrikeCounter },
         });
       }
     }
     doesUserExist = await prisma.user.findUnique({ where: { id: id } });
     const newStrikeCounter = doesUserExist.strikeCounter
     await prisma.$disconnect();
     return newStrikeCounter !== null ? newStrikeCounter : 1;
   } catch (error) {
       console.error(error);
       await prisma.$disconnect();
       process.exit(1);
   }
}

module.exports = {main}