import {
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

export const schema = new GraphQLSchema({
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
