require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
// const productRoutes = require("./routes/product.routes");
// const elasticFile = require("./config/elasticsearch");
const { Client } = require("@elastic/elasticsearch");

const PORT = process.env.PORT || 3000;

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
// app.use(morgan("dev"));

// product Routes

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// app.use("/product", productRoutes);
// Route to fetch and store products
// app.get("/store-products", async (req, res) => {
//   try {
//     const response = await axios.get("https://dummyjson.com/products");
//     const products = response.data.products;

//     const body = products.flatMap((product) => [
//       { index: { _index: "product" } },
//       product
//     ]);

//     const data = await global.elasticDB.bulk({ refresh: true, body });

//     res.status(201).send("Products stored successfully!");
//   } catch (error) {
//     console.error("Error fetching or storing products:", error);
//     res.status(500).send("Error fetching or storing products");
//   }
// });

// elasticFile
//   .elasticDBConnection()
//   .then((result) => {
//     console.log("Connected to Elasticsearch.");
//     global.elasticDB = result;
//   })
//   .catch((err) => {
//     console.error("Elasticsearch connection error:", err);
//   });

app.get("/", async (req, res) => {
  res.status(200).json("Server started...");
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

// const ip = require("ip");
// // const PORT = process.env.PORT || 3000;
// app.listen(PORT, () => {
//     console.log(`Server is running on http://${ip.address()}:${PORT}`);
// });
