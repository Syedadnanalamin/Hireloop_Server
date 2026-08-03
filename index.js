const express = require('express');
const app = express();
app.use(express.json());
const dotenv = require("dotenv");
const cors = require("cors");
dotenv.config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

app.use(cors());
const client = new MongoClient(process.env.MONGO_URI, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        await client.connect();
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. connected to MongoDB!");

        const database = client.db('Hireloop');
        const UserInfodb = client.db('test');
        const user = UserInfodb.collection("user");
        const jobs = database.collection("jobs");
        const mycompany = database.collection("mycompany");
        const applications = database.collection("applications");
        const plans = database.collection("plans");
        const subscribers = database.collection("subscribers");
        const subscriptionPlans = database.collection("subscriptionPlans")

        // adding new job(post request)

        app.post("/recruiter/managejobs/add-new", async (req, res) => {


            const newJob = req.body;
            const result = await jobs.insertOne(newJob);
            res.send(result);


        })

        // getting jobs specific details in manage jobs(get req)

        app.get("/recruiter/managejobs", async (req, res) => {

            const projectfield = {

                _id: 1,
                jobTitle: 1,
                status: 1,
                createdAt: 1

            }

            const result = await jobs.find().project(projectfield).toArray();
            res.send(result);
        })


        // Creating new company (post req)

        app.post("/recruiter/mycompany", async (req, res) => {
            const companyDetails = req.body;


            const result = await mycompany.insertOne(companyDetails);
            res.send(result);
            console.log("company inserted status", result);

        })

        // getting company information;
        app.get("/recruiter/mycompany/:id", async (req, res) => {
            const id = req.params.id;
            const query = {
                recruiterId: id
            }
            const result = await mycompany.findOne(query)

            res.json(result);


            console.log("response sent")
        })

        // get all published job info

        app.get("/jobs", async (req, res) => {

            const getpublishedjobs = await jobs.find({}).toArray();
            res.json(getpublishedjobs);

        })


        // find specific job info by id

        app.get("/jobs/:id", async (req, res) => {

            const id = req.params.id

            const query = {
                _id: new ObjectId(id)
            }
            const result = await jobs.findOne(query);

            res.send(result)


        })

        app.post("/jobs/:id/apply", async (req, res) => {
            const applierInfo = req.body;
            const result = await applications.insertOne(applierInfo);

            if (result.acknowledged) {
                console.log("✅ Application inserted successfully");
                res.send({
                    success: true,
                    message: "Application submitted successfully",
                    insertedId: result.insertedId,
                });
            }


        })

        app.get("/jobs/:id/apply/:applierId", async (req, res) => {
            const applierId = req.params.applierId;
            const result = await applications.find({ applierId: applierId }).toArray();
            res.send(result)


        })

        // finding plans apply limit info && geting all plans


        app.get("/pricing", async (req, res) => {

            const userPlan = req.query?.currPlan;
            if (userPlan) {
                const result = await plans.findOne({ name: userPlan });
                res.json(result)
            }
            else {
                const result = await subscriptionPlans.find({}).toArray();

                res.json(result);
            }

        })

        // storing purchase info of the customer

        app.post("/payment/success", async (req, res) => {
            const customerDetails = req.body;

            const query = {
                subscriberId: customerDetails.subscriberId,
                planPurchase: customerDetails.planPurchase

            }

            const filter = { _id: new ObjectId(customerDetails.subscriberId) };

            const updateRes = await user.updateOne(filter, {
                $set: {
                    plan: customerDetails.planPurchase,
                },
            });


            const existing = await subscribers.findOne(query);

            if (!existing) {

                const result = await subscribers.insertOne(customerDetails);




                return res.status(201).json({
                    success: true,
                    insertedId: result.insertedId,
                });
            }

            return res.status(200).json({
                success: true,
                message: "Already subscribed",
            });


        })

        // getting applications info

        app.get("/applications/:recruiterId", async (req, res) => {
            const recruiterId = req.params.recruiterId;
            console.log(recruiterId);
            const recruiterJobs = await jobs.find({ recruiterId: recruiterId }).toArray();
            const jobIds = recruiterJobs.map(job => job._id.toString());
            const applicationsList = await applications.find({ jobId: { $in: jobIds } }).toArray();
            res.send(applicationsList);


        })












    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);
app.listen(process.env.PORT, () => {

    console.log("app is listening")

})