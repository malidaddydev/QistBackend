const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();




const createProduct = async (req, res) => {
  try {
    const {
      category_id,
      subcategory_id,
      name,
      brand,
      short_description,
      long_description,
      price,
      stock,
      status,
      createdAt,
      installments,


    } = req.body;

    const uploadedFiles = req.files?.map(file => ({
      fileName: file.originalname,
      filePath: file.path,
      size: file.size,
      cloudinaryId: file.filename
    })) || [];


 let installmentsData = [];
        
        if (typeof installments === 'string') {
            try {
                installmentsData = JSON.parse(installments);
            } catch (parseError) {
                console.error('Error parsing installments:', parseError);
                return res.status(400).json({ message: 'Invalid installments format' });
            }
        } else if (Array.isArray(installments)) {
            installmentsData = installments;
        }

        // Validate installments data
        if (!Array.isArray(installmentsData) || installmentsData.length === 0) {
            return res.status(400).json({ message: 'At least one installment plan is required' });
        }




    const productCreation = await prisma.product.create({
      data: {
        category_id: parseInt(category_id),
        subcategory_id: parseInt(subcategory_id),
        name,
        status,
        brand,
        short_description,
        long_description,
        // price: parseFloat(price),
        stock: true,
        createdAt,
        ProductImage: {
          create:
            uploadedFiles.map((file) => ({
              url: file.filePath,

            }))

        },

        ProductInstallments: {
          create:
            installmentsData.map((ins) => ({
              totalPrice: ins.totalPrice,
              monthlyAmount: ins.monthlyAmount,
              advance: ins.advance,
              months: ins.months,
              isActive: true,



            }))

        }
      }


    })


    res.status(201).json(productCreation)



  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }

}


// {
//   "category_id": 1,
//   "subcategory_id": 2,
//   "name": "Samsung LED TV",
//   "brand": "Samsung",
//   "short_description": "Smart TV 40 inch",
//   "long_description": "Samsung Smart TV with HDR",
//   "price": 400,
//   "stock": 20,
//   "installments": [
//     { "amount": 100, "month": 6 },
//     { "amount": 50, "month": 12 }
//   ]
// }


const getProductById = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await prisma.product.findUnique({
      where: { id: parseInt(id) },
      include: {
        ProductImage: true,
        ProductInstallments: true,
        categories: { select: { name: true } },
        subcategories: { select: { name: true } },
      },
    });

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Flatten category/subcategory name if needed
    const response = {
      ...product,
      category_name: product.category?.name || null,
      subcategory_name: product.subcategory?.name || null,
      category: undefined,
      subcategory: undefined,
    };

    res.json(response);
  } catch (error) {
    console.error("Error fetching product:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

// ---------- Get All Products ----------
const getAllProducts = async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      include: {
        ProductImage: true,
        ProductInstallments: true,
        categories: { select: { name: true } },
        subcategories: { select: { name: true } },
      },
    });

    const response = products.map(p => ({
      ...p,
      category_name: p.category?.name || null,
      subcategory_name: p.subcategory?.name || null,
      category: undefined,
      subcategory: undefined,
    }));

    res.json(response);
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};




module.exports = { createProduct, getAllProducts, getProductById }