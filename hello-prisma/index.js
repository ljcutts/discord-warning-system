const { PrismaClient } = require("@prisma/client")

const prisma = new PrismaClient();

async function main(name,id) {
   try {
     let doesUserExist = await prisma.discordUser.findUnique({ where: { id: id }, include:{warnings:true} });
     if (!doesUserExist.warnings) {
      //  await prisma.discordUser.create({
      //    data: {
      //      id: id,
      //      username: name
      //    },
      //  });
     await prisma.warning.create({
        data: {
          discordUserId: id,
          strikeCounters: [new Date()]
        }
      })
     } else {
      const date = new Date();
      let strikeArray = []
      for(let i = 0; i<doesUserExist.warnings.strikeCounters.length; i++) {
        let newDate = new Date(
          doesUserExist.warnings.strikeCounters[i].getTime() +
            30 * 24 * 60 * 60 * 1000
        );
        const past30Days = date.getTime() >= newDate.getTime()
        if(!past30Days) strikeArray.push(doesUserExist.warnings.strikeCounters[i]);
      }
      strikeArray.push(new Date())
      await prisma.warning.update({
        where: { discordUserId: id },
        data: { strikeCounters: strikeArray  }
      });
     }
     doesUserExist = await prisma.discordUser.findUnique({
       where: { id: id },
       include: { warnings: true },
     });
     const newStrikeLength = doesUserExist.warnings.strikeCounters.length
     if(newStrikeLength > 2) await prisma.warning.delete({where: {discordUserId:id}})
     await prisma.$disconnect();
     return newStrikeLength
   } catch (error) {
       console.error(error);
       await prisma.$disconnect();
       process.exit(1);
   }
}

module.exports = {main}