const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const createDealOfTheDay = async (req, res) => {

    try {

        const { name, endDate,products } = req.body
        let productsData = {}
        if (req.body.products) {
            try {
                productsData = JSON.parse(req.body.products)
            } catch (err) {
                return res.status(400).json({ message: "Invalid formattedData" })
            }
        }

        const dealCreation = await prisma.dealOfTheDay.create({
            data: {
                title: name,
                start_date: new Date(),
                end_date: new Date(endDate),
                products: {
                    create: productsData.map((fd) => (
                        {
                            product_id: fd.product_id,
                            dealPrice: fd.dealPrice,
                            discount: fd.discount,
                        }
                    )

                    ),
                },
            },
            include: { products: true },
        });



        res.status(201).json(dealCreation)



    } catch (error) {
        console.error('Error creating order:', error);
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }


}


module.exports = {createDealOfTheDay}