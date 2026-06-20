const dns = require("node:dns");
dns.setServers(["8.8.8.8", "8.8.4.4"]);

const express = require("express");
const app = express();
require("dotenv").config();
const cors = require("cors");

app.use(cors());
app.use(express.json());

const port = process.env.PORT || 8000;
const uri = process.env.MONGO_URI;

const { MongoClient, ServerApiVersion } = require("mongodb");

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    await client.connect();

    const database = client.db("NexRole");
    const jobCollection = database.collection("jobs");
    const companyCollection = database.collection("companies");
    const usersCollection = database.collection("user");

    //find user
    app.get("/api/users", async (req, res) => {
      const cursor = usersCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });

    //post job
    app.post("/api/jobs", async (req, res) => {
      const job = req.body;
      const result = await jobCollection.insertOne(job);
      res.send(result);
    });
    //get job
    app.get("/api/jobs", async (req, res) => {
      const query = {};
      if (req.query.companyId) {
        query.companyId = req.query.companyId;
      }
      if (req.query.status) {
        query.status = req.query.status;
      }
      const cursor = jobCollection.find(query)
      const result = await cursor.toArray();
      res.send(result);
    });


    // get all company

    app.get("/api/companies", async(req, res)=>{
      const cursor = companyCollection.find();
      const result = await cursor.toArray();
      res.send(result || {});
    })
    //post company


    app.post("/api/company", async (req, res) => {
      const company = req.body;
      const result = await companyCollection.insertOne(company);
      res.send(result);
    });
    // get my company

    app.get("/api/my/companies", async (req, res) => {
      const query = {};
      if (req.query.recruiterId) {
        query.recruiterId = req.query.recruiterId;
      }
      const result = await companyCollection.findOne(query);
      res.send(result || {});
    });

    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!",
    );
  } finally {
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("NexRole Server is working Fine!");
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
