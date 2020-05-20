const {
  ApolloServer,
  PubSub,
  AuthenticationError,
  UserInputError,
  ApolloError,
  SchemaDirectiveVisitor,
} = require("apollo-server");
const { defaultFieldResolver, GraphQLString } = require("graphql"); // function that takes a value to look at the keys and compare them to the fields
const gql = require("graphql-tag");

const pubSub = new PubSub();
const NEW_ITEM = "NEW_ITEM";

class LogDirective extends SchemaDirectiveVisitor {
  visitFieldDefinition(field) {
    const resolver = field.resolve || defaultFieldResolver;

    field.args.push({
      type: GraphQLString,
      name: "message",
    });

    field.resolve = (root, { message, ...rest }, context, info) => {
      const { message: schemaMessage } = this.args;
      console.log(
        "we just override the resolver ⚡️",
        message || schemaMessage
      );
      return resolver.call(this, root, rest, context, info);
    };
  }
}

const typeDefs = gql`
  directive @log(message: String = "default message") on FIELD_DEFINITION

  type User {
    id: ID! @log(message: "this is not the default message")
    username: String!
    error: String
      @deprecated(
        reason: "we transition into a new business model, use this field instead"
      )
    createdAt: String!
  }
  type Settings {
    user: User!
    theme: String
  }

  type Item {
    task: String!
  }

  input NewSettingsInput {
    user: ID!
    theme: String!
  }

  type Query {
    me: User!
    settings(user: ID!): Settings!
  }

  type Mutation {
    settings(input: NewSettingsInput!): Settings!
    createItem(task: String!): Item!
  }

  type Subscription {
    newItem: Item
  }
`;

const resolvers = {
  Query: {
    me() {
      return {
        id: 1,
        username: "hggonzalez",
        createdAt: "122454546",
      };
    },
    settings(_, { user }) {
      return {
        user,
        theme: "Light",
      };
    },
  },
  Mutation: {
    settings(_, { input }) {
      return input;
    },
    createItem(_, { task }) {
      const item = { task };
      pubSub.publish(NEW_ITEM, { newItem: item });
      return item;
    },
  },
  Subscription: {
    newItem: {
      subscribe: () => pubSub.asyncIterator(NEW_ITEM),
    },
  },
  Settings: {
    user() {
      return {
        id: 1,
        username: "hggonzalez",
        createdAt: "122454546",
      };
    },
  },
  User: {
    error() {
      // throw new Error("You cant do this");
      return "something";
    },
  },
};

const server = new ApolloServer({
  typeDefs,
  resolvers,
  //   formatError(error) {
  //     // console.log(error);
  //     // return new Error('This is a custom error');
  //     return error;
  //   },
  schemaDirectives: {
    log: LogDirective,
  },
  context({ connection, req }) {
    if (connection) {
      return { ...connection.context };
    }
  },
  subscriptions: {
    onConnect(params) {},
  },
});

server.listen().then(({ url }) => console.log(`server at ${url}`));
