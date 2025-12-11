/*
 * Complete this script so that it is able to add a superuser to the database
 * Usage example: 
 *   node prisma/createsu.js clive123 clive.su@mail.utoronto.ca SuperUser123!
 */
'use strict';

require("dotenv").config();

const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");
const prisma = new PrismaClient()

async function createSuperUser() {
    const args = process.argv.slice(2);
    if (args.length !== 3) {
        console.error("Usage: createSuperUser arguments <utorid> <email> <password>");
        process.exit(1);
    }

    const [utorid, email, password] = args;
    try {
        const existingUser = await prisma.user.findFirst({
            where: {
                OR:[
                    { email: email },
                    { utorid: utorid },
                ]
            }
        })
        if (existingUser) {
            console.error("User with the same email or utorid exist.");
            process.exit(1);
        }
        const hashedPassword = await bcrypt.hash(password, 12);
        const user = await prisma.user.create({
            data: {
                name: 'Super User',
                email: email,
                password: hashedPassword,
                utorid: utorid,
                role: "superuser",
                points: 0,
                verified: true,
                activated: true,
                suspicious: false,
            }
        })
        console.log("Super User created");
        console.log(`User ID: ${user.id}`);
        console.log(`utorid: ${user.utorid}`);
        console.log(`email: ${user.email}`);
        console.log(`role: ${user.role}`);
    }
    catch (error) {
        console.error(error);
        process.exit(1);
    }
    finally {
        await prisma.$disconnect();
    }
}
createSuperUser().then(r => console.log(r));