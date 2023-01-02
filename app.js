const express = require("express")
const { graphqlHTTP } = require("express-graphql")
const { buildSchema } = require("graphql")
const mongoose = require("mongoose")

const Event = require("./models/event")

const app = express()

const events = []

app.use(express.json())
app.use(
    "/graphql",
    graphqlHTTP({
        schema: buildSchema(`
            type Event {
                _id: ID!
                title: String!
                description: String!
                price: Float!
                date: String!
            }

            input EventInput {
                title: String!
                description: String!
                price: Float!
                date: String!
            }

            type RootQuery {
                events: [Event!]!
            }

            type RootMutation {
                createEvent(eventInput: EventInput): Event
            }

            schema {
                query: RootQuery
                mutation: RootMutation
            }
        `),
        rootValue: {
            events: () => {
                return Event.find()
                    .then((events) => {
                        console.log(events)
                        return events.map((event) => {
                            return { ...event._doc }
                        })
                    })
                    .catch((err) => {
                        console.log(err)
                        throw err
                    })
            },
            createEvent: (args) => {
                const event = new Event({
                    title: args.eventInput.title,
                    description: args.eventInput.description,
                    price: +args.eventInput.price,
                    date: new Date(args.eventInput.date),
                })
                return event
                    .save()
                    .then((result) => {
                        console.log(result)
                        return { ...result._doc }
                    })
                    .catch((err) => {
                        console.log(err)
                        throw err
                    })
            },
        },
        graphiql: true,
    })
)

mongoose
    .connect(
        `mongodb+srv://${process.env.MONGODB_USER}:${process.env.MONGODB_PASSWORD}@${process.env.MONGODB_CLUSTER}.mongodb.net/${process.env.MONGODB_NAME}?retryWrites=true&w=majority`
    )
    .then(() => {
        app.listen(3000)
    })
    .catch((err) => {
        console.log(err)
    })
