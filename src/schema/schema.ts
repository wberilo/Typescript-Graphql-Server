const graphql = require('graphql');
const Todo = require('../models/todo');
const User = require('../models/user');
import { Request } from 'express';

interface TokenRequest extends Request {
  id?:string
}

const {
  GraphQLObjectType,
  GraphQLString,
  GraphQLSchema,
  GraphQLID,
  GraphQLInt,
  GraphQLList,
  GraphQLNonNull,
  GraphQLBoolean
} = graphql;

const TodoType = new GraphQLObjectType({
  name: 'Todo',
  fields: () => ({
    id: { type: GraphQLID },
    content: { type: GraphQLString },
    done: { type: GraphQLBoolean },
    user: {
      type: UserType,
      resolve(parent: any, args: any) {
        return User.findById(parent.userId, 'userName');
      }
    }
  })
});

const UserType = new GraphQLObjectType({
  name: 'User',
  fields: () => ({
    id: { type: GraphQLID },
    userName: { type: GraphQLString },
    // password: { type: GraphQLString },
    todos: {
      type: new GraphQLList(TodoType),
      resolve(parent: any, args: any) {
        return Todo.find({ userId: parent.id });
      }
    }
  })
});

const RootQuery = new GraphQLObjectType({
  name: 'RootQueryType',
  fields: {
    todo: {
      type: TodoType,
      args: { id: { type: GraphQLID } },
      resolve(parent: any, args: any, context:TokenRequest) {
        const todo = Todo.findById(args.id);
        if(context.id === todo.userId){
          return Todo.findById(args.id);
        }
        return null
      }
    },
    user: {
      type: UserType,
      args: { id: { type: GraphQLID } },
      resolve(parent: any, args: any, context:TokenRequest) {
        if(context.id === args.id){
          return User.findById(args.id, 'userName');
        }
        return null
        
      }
    },
  }
});

const Mutation = new GraphQLObjectType({
  name: 'Mutation',
  fields: {
    // addUser: {
    //   type: UserType,
    //   args: {
    //     userName: { type: new GraphQLNonNull(GraphQLString) },
    //     password: { type: new GraphQLNonNull(GraphQLString) }
    //   },
    //   resolve(parent: any, args: any) {
    //     let user = new User({
    //       userName: args.userName,
    //       password: args.password
    //     });
    //     return user.save();
    //   }
    // },
    addTodo: {
      type: TodoType,
      args: {
        content: { type: new GraphQLNonNull(GraphQLString) },
        done: { type: new GraphQLNonNull(GraphQLBoolean) },
        userId: { type: new GraphQLNonNull(GraphQLString) }
      },
      resolve(parent: any, args: any) {
        let todo = new Todo({
          content: args.content,
          done: args.done,
          userId: args.userId
        });
        return todo.save();
      }
    },
    updateTodo: {
      type: TodoType,
      args:{
        args: {
          id: { type: new GraphQLNonNull(GraphQLString) },
          content: { type: new GraphQLNonNull(GraphQLString) },
          done: { type: new GraphQLNonNull(GraphQLBoolean) },
          userId: { type: new GraphQLNonNull(GraphQLString) }
        },
        resolve(parent: any, args: any) {
          let todo = new Todo({
            content: args.content,
            done: args.done,
            userId: args.userId
          });
          Todo.findOneAndReplace({id: args.id}, todo, (err:Error, result:any)=> {console.log(err);
          })
          return todo.find
        }
      }
    }
  }
});

module.exports = new GraphQLSchema({
  query: RootQuery,
  mutation: Mutation
});