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

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

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
    const applicationCollection = database.collection("applications");
    const planCollection = database.collection("plans");
    const subscriptionCollection = database.collection("subscriptions");

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

    // app.get("/api/jobs", async (req, res) => {
    //   const query = {};
    //   if (req.query.companyId) {
    //     query.companyId = req.query.companyId;
    //   }
    //   if (req.query.status) {
    //     query.status = req.query.status;
    //   }
    //   const cursor = jobCollection.find(query)
    //   const result = await cursor.toArray();
    //   res.send(result);
    // });

    app.get("/api/jobs", async (req, res) => {
      const { companyId, status, category, type, isRemote } = req.query;
      const query = {};

      if (companyId) query.companyId = companyId;
      if (status) query.status = status;
      if (category && category !== "all") query.jobCategory = category;
      if (isRemote === "true") query.isRemote = true;

      // type can be a single value or comma-separated multiple values
      if (type) {
        const types = type.split(",").filter(Boolean);
        if (types.length > 0) {
          query.jobType = { $in: types };
        }
      }

      const cursor = jobCollection.find(query);
      const result = await cursor.toArray();
      res.send(result);
    });

    // getJobById
    app.get("/api/jobs/:id", async (req, res) => {
      const id = req.params.id;
      const query = {
        _id: new ObjectId(id),
      };
      const result = await jobCollection.findOne(query);
      res.send(result);
    });

    // get all company

    app.get("/api/companies", async (req, res) => {
      const cursor = companyCollection.find();
      const result = await cursor.toArray();
      res.send(result || {});
    });

    app.patch("/api/companies/:id", async (req, res) => {
      const id = req.params.id;
      const updateData = req.body; // { status: "approved" }

      const filter = { _id: new ObjectId(id) };
      const updateDoc = { $set: updateData }; // ✅ spreads the whole object

      const result = await companyCollection.updateOne(filter, updateDoc);

      if (result.modifiedCount === 0) {
        return res
          .status(404)
          .json({ success: false, message: "Company not found or unchanged." });
      }

      res.json({ success: true, modifiedCount: result.modifiedCount });
    });

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

    //application related api
    app.get("/api/applications", async (req, res) => {
      const query = {};
      if (req.query.jobId) {
        query.jobId = req.query.jobId;
      }
      if (req.query.applicantEmail) {
        query.applicantEmail = req.query.applicantEmail;
      }
      const cursor = applicationCollection.find(query);
      const result = await cursor.toArray();
      res.send(result);
    });

    app.post("/api/applications", async (req, res) => {
      const application = req.body;
      const result = await applicationCollection.insertOne(application);
      res.send(result);
    });

    //plan related api
    app.get("/api/plans", async (req, res) => {
      const query = {};
      if (req.query.plan_id) {
        query.plan_id = req.query.plan_id;
      }
      const plan = await planCollection.findOne(query);
      res.send(plan);
    });

    //subscription related api
    app.post("/api/subscriptions", async (req, res) => {
      const subscription = req.body;
      const subInfo = {
        ...subscription,
        createdAt: new Date(),
      };
      const result = await subscriptionCollection.insertOne(subInfo);
      res.send(result);

      //update user role to
      const filter = { email: subscription.email };
      const updateDoc = {
        $set: {
          plan: subscription.planId,
        },
      };
      const updateResult = await usersCollection.updateOne(filter, updateDoc);
      res.send(updateResult);
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
