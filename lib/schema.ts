import { makeExecutableSchema } from "@graphql-tools/schema";
import { supabase } from "./supabase";

const typeDefs = `
  type Todo {
    id: ID!
    title: String!
    completed: Boolean!
    created_at: String!
  }

  type Query {
    todos: [Todo!]!
    todo(id: ID!): Todo
  }

  type Mutation {
    createTodo(title: String!): Todo!
    updateTodo(id: ID!, completed: Boolean!): Todo!
    deleteTodo(id: ID!): Boolean!
    deleteAllTodos: Boolean!
  }
`;

const resolvers = {
  Query: {
    todos: async () => {
      const { data, error } = await supabase
        .from("todos")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    todo: async (_: unknown, { id }: { id: string }) => {
      const { data, error } = await supabase
        .from("todos")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      return data;
    },
  },
  Mutation: {
    createTodo: async (_: unknown, { title }: { title: string }) => {
      const { data, error } = await supabase
        .from("todos")
        .insert([{ title, completed: false }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    updateTodo: async (
      _: unknown,
      { id, completed }: { id: string; completed: boolean }
    ) => {
      const { data, error } = await supabase
        .from("todos")
        .update({ completed })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    deleteTodo: async (_: unknown, { id }: { id: string }) => {
      const { error } = await supabase.from("todos").delete().eq("id", id);

      if (error) throw error;
      return true;
    },
    deleteAllTodos: async () => {
      const { error } = await supabase.from("todos").delete().gt("id", "0");

      if (error) throw error;
      return true;
    },
  },
};

export const schema = makeExecutableSchema({ typeDefs, resolvers });
