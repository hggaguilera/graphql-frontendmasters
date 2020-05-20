/**
 * Here are your Resolvers for your Schema. They must match
 * the type definitions in your scheama
 */

module.exports = {
   Query: {
      pets(_, { input }, context) {
         return context.models.Pet.findMany(input);
         // return [
         //    { id: 1, name: "moose", type: "DOG" },
         //    { id: 2, name: "garfield", type: "CAT" },
         //    { id: 3, name: "rocky", type: "DOG" },
         //    { id: 4, name: "ghost", type: "DOG" },
         //    { id: 5, name: "missi", type: "CAT" }
         // ].filter(pet => pet.type === input.type);
      },
      pet(_, { input }, context) {
         return context.models.Pet.findOne(input);
      },
   },
   Mutation: {
      newPet(_, { input }, context) {
         return context.models.Pet.create(input);
      },
   },
   Pet: {
      user(_, __, context) {
         return context.user;
      },
      //  img(pet) {
      //     return pet.type === "DOG"
      //        ? "https://placedog.net/300/300"
      //        : "http://placekitten.com/300/300";
      //  }
   },
   User: {
      pets(_, __, context) {
         return context.models.Pet.findMany();
      },
   },
};
