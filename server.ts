import express from "express";
import { WebSocketServer } from 'ws';
import cors from 'cors';
import { useServer } from "graphql-ws/lib/use/ws";
import {
  getGraphQLParameters,
  processRequest,
  renderGraphiQL,
  sendMultipartResponseResult,
  sendResponseResult,
  shouldRenderGraphiQL,
} from "graphql-helix";
import {
  execute,
  subscribe,
  GraphQLError,
  GraphQLDeferDirective,
  GraphQLID,
  GraphQLInt,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLSchema,
  GraphQLStreamDirective,
  GraphQLString,
  specifiedDirectives,
} from "graphql";

const app = express();

app.use(cors());
app.use(express.json());

const schema = new GraphQLSchema({
  query: new GraphQLObjectType({
    name: "Query",
    fields: () => ({
      me: {
        type: new GraphQLNonNull(new GraphQLObjectType({
          name: "UserInfo",

          fields: () => ({
            id: {
              type: new GraphQLNonNull(GraphQLID),
            },
            firstName: {
              type: new GraphQLNonNull(GraphQLString),
            },
            lastName: {
              type: new GraphQLNonNull(GraphQLString),
            },
            email: {
              type: GraphQLString,
            },
            projects: {
              type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(new GraphQLObjectType({
                name: "Project",

                fields: () => ({
                  id: {
                    type: new GraphQLNonNull(GraphQLID),
                  },
                  name: {
                    type: new GraphQLNonNull(GraphQLString),
                  },
                  numberOfStars: {
                    type: new GraphQLNonNull(GraphQLInt),
                  },
                })
              })))),

              resolve: () =>
                new Promise((resolve) =>
                  setTimeout(
                    () => resolve([
                      {"id": "project1", "name": "Test project", "numberOfStars": 2},
                      {"id": "project2", "name": "First real project", "numberOfStars": 4},
                      {"id": "project3", "name": "Dope project", "numberOfStars": 1},
                      {"id": "project4", "name": "Project Phoenix", "numberOfStars": 5},
                      {"id": "project6", "name": "Project Blue Pill", "numberOfStars": 12},
                    ]),
                    4000
                  )
                ),
            },
          })
        })),

        resolve: () => ({"id": "User1", "firstName": "Benoit", "lastName": "Lubek", "email": "BoD@JRAF.org"}),

      },
    }),
  }),

  subscription: new GraphQLObjectType({
    name: "Subscription",
    fields: () => ({
      count: {
        type: new GraphQLObjectType({
          name: "Counter",

          fields: () => ({
            value: {
              type: new GraphQLNonNull(GraphQLInt),
            },
            valueTimesTwo: {
              type: new GraphQLNonNull(GraphQLInt),
            },
          })
        }),
        args: {
          to: {
            type: GraphQLInt,
          },
        },
        subscribe: async function* (_root, args) {
          for (let count = 1; count <= args.to; count++) {
            await new Promise((resolve) => setTimeout(resolve, 1000));
            yield {
              "count": {
                "value": count,
                "valueTimesTwo": count * 2,
              }
            };
          }
        },
      },
    }),
  }),

  directives: [
    ...specifiedDirectives,
    GraphQLDeferDirective,
    GraphQLStreamDirective,
  ],
});


app.use("/graphql", async (req, res) => {
  const request = {
    body: req.body,
    headers: req.headers,
    method: req.method,
    query: req.query,
  };

  if (shouldRenderGraphiQL(request)) {
    res.send(
        renderGraphiQL({
          subscriptionsEndpoint: "ws://localhost:4000/graphql",
        })
    );
    return;
  }

  const { operationName, query, variables } = getGraphQLParameters(request);

  const result = await processRequest({
    operationName,
    query,
    variables,
    request,
    schema,
  });

  if (result.type === "RESPONSE") {
    sendResponseResult(result, res);
  } else if (result.type === "MULTIPART_RESPONSE") {
    sendMultipartResponseResult(result, res);
  } else {
    res.status(422);
    res.json({
      errors: [new GraphQLError("Subscriptions should be sent over WebSocket.")],
    });
  }
});

const port = process.env.PORT || 4000;

const server = app.listen(port, () => {
  const wsServer = new WebSocketServer({
    server,
    path: "/graphql",
  });

  useServer({ schema, execute, subscribe }, wsServer);

  console.log(`GraphQL server is running on port ${port}.`);
});
