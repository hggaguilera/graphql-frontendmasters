const { ApolloServer } = require("apollo-server");
const typeDefs = require("./typedefs");
const resolvers = require("./resolvers");
const { createToken, getUserFromToken } = require("./auth");
const db = require("./db");

const server = new ApolloServer({
   typeDefs,
   resolvers,
   context({ req, connection }) {
      if (connection) {
         return { ...db, ...connection.context };
      }
      const token = req.headers.authorization;
      const user = getUserFromToken(token);
      return { ...db, user, createToken };
   },
   subscriptions: {
      onConnect(params) {
         const user = getUserFromToken(params.authToken);
         if (user) {
            return { user };
         }
         throw new Error("You are not authenticated");
      },
   },
});

server.listen(4000).then(({ url, subscriptionsUrl }) => {
   console.log(`🚀 Server ready at ${url}`);
   console.log(`🚀 Subscriptions ready at ${subscriptionsUrl}`);
});
