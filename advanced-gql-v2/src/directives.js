const {
  SchemaDirectiveVisitor,
  AuthenticationError,
} = require("apollo-server");
const { defaultFieldResolver, GraphQLString } = require("graphql");
const { formatDate } = require("./utils");

class DateFormatDirective extends SchemaDirectiveVisitor {
  visitFieldDefinition(field) {
    const resolver = field.resolve || defaultFieldResolver;
    field.args.push({
      type: GraphQLString,
      name: "format",
    });
    const { format: defaultFormat } = this.args;

    field.resolve = async (root, { format, ...rest }, context, info) => {
      const result = await resolver.call(this, root, rest, context, info);
      return formatDate(result, format || defaultFormat);
    };
  }
}

class AuthenticatedDirective extends SchemaDirectiveVisitor {
  visitFieldDefinition(field) {
    const resolver = field.resolve || defaultFieldResolver;
    field.resolve = (root, args, context, info) => {
      if (!context.user) {
        throw new AuthenticationError("Not Authenticated");
      }
      return resolver(root, args, context, info);
    };
  }
}

class AuthorizedDirective extends SchemaDirectiveVisitor {
  visitFieldDefinition(field) {
    const resolver = field.resolve || defaultFieldResolver;
    const { role } = this.args;

    field.resolve = (root, args, context, info) => {
      if (!context.user.role !== role) {
        throw new AuthenticationError(
          `Incorrect role, you must have an ${role} role`
        );
      }
      return resolver(root, args, context, info);
    };
  }
}

module.exports = {
  DateFormatDirective,
  AuthenticatedDirective,
  AuthorizedDirective,
};
