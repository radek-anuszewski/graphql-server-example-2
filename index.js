const { ApolloServer, gql, PubSub } = require("apollo-server");

const pubsub = new PubSub();

const types = gql`
  type Animal {
    id: ID!
    name: String!
    birthPlace: String
    nicknames: [String]
    owner: Owner!
  }
  
  type Owner {
    id: Int!
    name: String!
  }

  input OwnerInput {
    name: String!
  }
  
  type Query {
    animals: [Animal]
    owners: [Owner]
    animal(name: String!): Animal
    owner(id: Int!): Owner
  }
  
  type Mutation {
    createOwner(owner: OwnerInput!): Owner!
  }
  
  type Subscription {
      ownerAdded: Owner!
  }
`

const owners = [
  {
    id: 1,
    name: 'Radek 1',
  },
  {
    id: 2,
    name: 'Radek 2',
  },
]

const animals = [
  {
    id: 1,
    name: 'Burek',
    birthPlace: 'Cracow',
    ownerId: 1,
    nicknames: ['Bury'],
  },
  {
    id: 2,
    name: 'Azor',
    birthPlace: 'Warsaw',
    ownerId: 1,
    nicknames: ['Azorek', 'Maly'],
  },
  {
    id: 1,
    name: 'Reksio',
    birthPlace: 'Cracow',
    ownerId: 2,
    nicknames: [],
  },
];

const resolvers = {
  Query: {
    animals: () => animals,
    owners: () => owners,
    animal: (parent, args, context, info) => animals
      .find(animal => animal.name === args.name),
    owner: (parent, args, context, info) => owners
      .find(el => el.id === args.id)
  },
  Animal: {
    owner: (parent, args, context, info) => owners
      .find(el => el.id === parent.ownerId)
  },
  Mutation: {
    createOwner: (parent, args, context, info) => {
      let id = owners.length + 1;
      let owner = {...args.owner, id};
      owners.push(owner);
      pubsub.publish('OWNER_ADDED', {ownerAdded: owner})
      return owner;
    }
  },
  Subscription: {
    ownerAdded: {
      subscribe: () => pubsub.asyncIterator(['OWNER_ADDED']),
    }
  },
}

const server = new ApolloServer({
  typeDefs: types,
  resolvers,
})

server.listen()
  .then(({url, subscriptionsUrl}) => {
    console.log(`Sub url: ${subscriptionsUrl}`);
    console.log(`Server url: ${url}`);
  })
