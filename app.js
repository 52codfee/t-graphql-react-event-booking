const express = require("express")
const { graphqlHTTP } = require("express-graphql")
const { buildSchema } = require("graphql")
const mongoose = require("mongoose")
const bcrypt = require("bcryptjs")

const Event = require("./models/event")
const User = require("./models/user")

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

            type User {
                _id: ID!
                email: String!
                password: String
            }

            input EventInput {
                title: String!
                description: String!
                price: Float!
                date: String!
            }

            input UserInput {
                email: String!
                password: String!
            }

            type RootQuery {
                events: [Event!]!
            }

            type RootMutation {
                createEvent(eventInput: EventInput): Event
                createUser(userInput: UserInput): User
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
                    creator: "63b271a9a18de20f00760388",
                })

                let createdEvent

                return event
                    .save()
                    .then((result) => {
                        createdEvent = { ...result._doc }
                        return User.findById("63b271a9a18de20f00760388")
                    })
                    .then((user) => {
                        if (!user) {
                            throw new Error("User not found.")
                        }
                        user.createdEvents.push(event)
                        return user.save()
                    })
                    .then(() => {
                        return createdEvent
                    })
                    .catch((err) => {
                        console.log(err)
                        throw err
                    })
            },
            createUser: (args) => {
                return User.findOne({ email: args.userInput.email })
                    .then((user) => {
                        if (user) {
                            throw new Error("User exists already.")
                        }
                        return bcrypt.hash(args.userInput.password, 12)
                    })
                    .then((hashedPassword) => {
                        const user = new User({
                            email: args.userInput.email,
                            password: hashedPassword,
                        })
                        return user.save()
                    })
                    .then((result) => {
                        return { ...result._doc, password: null }
                    })
                    .catch((err) => {
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
