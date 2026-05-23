const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
    try {
        const orders = await prisma.order.findMany({
            where: { user_id: 4 },
            include: {
                Restaurant: {
                    select: {
                        id: true,
                        nombre: true,
                        calificacion_promedio: true
                    }
                },
                Review: true,
                OrderItem: {
                    include: {
                        Product: true
                    }
                }
            },
            orderBy: {
                fecha: 'desc'
            }
        });
        console.log('Query successful. Rows:', orders.length);
    } catch(e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}
run();
