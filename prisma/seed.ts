import { PrismaClient } from '@prisma/client'
import { faker } from '@faker-js/faker';

const prisma = new PrismaClient()

export const main = async () => {
    for(let i = 0; i<100; i++){
        await prisma.user.create({
            data: {
                email: faker.internet.email(),
                username: faker.internet.userName(),
                password: faker.internet.password(),
            },
        })
    }
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    }
    )
    .finally(async () => {
        await prisma.$disconnect()
    })