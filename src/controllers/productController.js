const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();




const createProduct = async (req, res) => {
  try {
    let formattedData = {}
    if (req.body.formattedData) {
      try {
        formattedData = JSON.parse(req.body.formattedData)
      } catch (err) {
        return res.status(400).json({ message: "Invalid formattedData" })
      }
    }

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
      installments
    } = formattedData


    const uploadedFiles = req.files?.map(file => ({
      fileName: file.originalname,
      filePath: file.path,
      size: file.size,
      cloudinaryId: file.filename
    })) || [];


    const slug = name.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-') // non-alphanumeric ko - bana do
      .replace(/^-+|-+$/g, ''); // shuru/akhir ke - hata do



    const productCreation = await prisma.product.create({
      data: {
        category_id: parseInt(category_id),
        subcategory_id: parseInt(subcategory_id),
        name,
        slugName: slug,
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
            installments.map((ins) => ({
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


const getProductByName = async (req, res) => {
  try {
    const { name } = req.params;

    const product = await prisma.product.findFirst({
      where: { slugName: String(name) },
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



const updateProduct = async (req, res) => {
  try {
   
    const {
      id,
      category_id,
      subcategory_id,
      name,
      brand,
      short_description,
      long_description,
      stock,
      status,
      installments
    } = req.body


    const uploadedFiles = req.files?.map(file => ({
      fileName: file.originalname,
      filePath: file.path,
      size: file.size,
      cloudinaryId: file.filename
    })) || [];





    const productUpdation = await prisma.product.update({
      where: { id: parseInt(id) },
      data: {
        category_id,
        subcategory_id,
        name,
        status,
        brand,
        short_description,
        long_description,
        stock,
        updatedAt,
      }



    })

    



    const enriched = await Promise.all(

      uploadedFiles.map(async (file) => {

        await prisma.productImage.create({
          where: { product_id: parseInt(id) },
          data: {
            url: file.filePath,
          }

        })

      })

    )
    

    const enriched2 = await Promise.all(

      installments.map(async(ins) => {
  
        const productInstallments = await prisma.productInstallments.create({
          where: { product_id: parseInt(id) },
          data: {
              totalPrice: ins.totalPrice,
              monthlyAmount: ins.monthlyAmount,
              advance: ins.advance,
              months: ins.months,
             
          }
        })
  
      })
    )



    
    res.status(201).json(productUpdation)



  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }

}

const toggleProductField = async (req, res) => {
  try {
    const { id } = req.params;       // product id from URL
    const { field } = req.body;      // which field to toggle: "stock" or "status"

    if (!["stock", "status"].includes(field)) {
      return res.status(400).json({ error: "Invalid field. Must be 'stock' or 'status'." });
    }

    // Get current product
    const product = await prisma.product.findUnique({
      where: { id: parseInt(id) },
    });

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    // Toggle the field
    const updatedProduct = await prisma.product.update({
      where: { id: parseInt(id) },
      data: {
        [field]: !product[field],   // invert the boolean value
        updatedAt: new Date(),      // update timestamp
      },
    });

    res.json({
      message: `${field} toggled successfully`,
      product: updatedProduct,
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Something went wrong" });
  }
};



module.exports = { createProduct, getAllProducts, getProductById, getProductByName,toggleProductField }