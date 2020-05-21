const { PubSub, AuthenticationError } = require("apollo-server");
const { authenticated, authorized } = require("./auth");

const pubsub = new PubSub();
const NEW_POST = "NEW_POST";

/**
 * Anything Query / Mutation resolver
 * using a user for a DB query
 * requires user authenication
 */
module.exports = {
  Query: {
    // This is using AUTH
    // me: authenticated((_, __, { user }) => {
    //   return user;
    // }),
    // posts: authenticated((_, __, { user, models }) => {
    //   return models.Post.findMany({ author: user.id });
    // }),

    // post: authenticated((_, { id }, { user, models }) => {
    //   return models.Post.findOne({ id, author: user.id });
    // }),

    // userSettings: authenticated((_, __, { user, models }) => {
    //   return models.Settings.findOne({ user: user.id });
    // }),

    // This is using DIRECTIVES
    me(_, __, { user }) {
      return user;
    },
    posts(_, __, { user, models }) {
      return models.Post.findMany({ author: user.id });
    },
    post(_, { id }, { user, models }) {
      return models.Post.findOne({ id, author: user.id });
    },
    userSettings(_, __, { user, models }) {
      return models.Settings.findOne({ user: user.id });
    },
    // public resolver
    feed(_, __, { models }) {
      return models.Post.findMany();
    },
  },
  Mutation: {
    // This is using AUTH
    // updateSettings: authenticated((_, { input }, { user, models }) => {
    //   return models.Settings.updateOne({ user: user.id }, input);
    // }),

    // This is using DIRECTIVES
    updateSettings(_, { input }, { user, models }) {
      return models.Settings.updateOne({ user: user.id }, input);
    },

    createPost(_, { input }, { user, models }) {
      const post = models.Post.createOne({ ...input, author: user.id });
      pubsub.publish(NEW_POST, { newPost: post });
      return post;
    },
    // This is using AUTH
    // updateMe: authenticated((_, { input }, { user, models }) => {
    //   return models.User.updateOne({ id: user.id }, input);
    // }),

    // This is using DIRECTIVES
    updateMe(_, { input }, { user, models }) {
      return models.User.updateOne({ id: user.id }, input);
    },
    // admin role using AUTH
    // invite: authenticated(
    //   authorized("ADMIN", (_, { input }, { user }) => {
    //     return {
    //       from: user,
    //       role: input.role,
    //       createdAt: Date.now(),
    //       email: input.email,
    //     };
    //   })
    // ),

    // admin role using DIRECTIVES
    invite(_, { input }, { user }) {
      return {
        from: user,
        role: input.role,
        createdAt: Date.now(),
        email: input.email,
      };
    },

    signup(_, { input }, { models, createToken }) {
      const existing = models.User.findOne({ email: input.email });

      if (existing) {
        throw new AuthenticationError("Invalid username");
      }
      const user = models.User.createOne({
        ...input,
        verified: false,
        avatar: "http",
      });
      const token = createToken(user);
      return { token, user };
    },
    signin(_, { input }, { models, createToken }) {
      const user = models.User.findOne(input);

      if (!user) {
        throw new AuthenticationError("Please check, invalid password/email");
      }

      const token = createToken(user);
      return { token, user };
    },
  },
  Subscription: {
    newPost: {
      subscribe: () => pubsub.asyncIterator(NEW_POST),
    },
  },
  User: {
    posts(root, _, { user, models }) {
      if (root.id !== user.id) {
        throw new AuthenticationError("Incorrect post");
      }

      return models.Post.findMany({ author: root.id });
    },
    settings(root, __, { user, models }) {
      return models.Settings.findOne({ id: root.settings, user: user.id });
    },
  },
  Settings: {
    user(settings, _, { user, models }) {
      return models.Settings.findOne({ id: settings.id, user: user.id });
    },
  },
  Post: {
    author(post, _, { models }) {
      return models.User.findOne({ id: post.author });
    },
  },
};
