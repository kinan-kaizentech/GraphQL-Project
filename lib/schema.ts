import { makeExecutableSchema } from "@graphql-tools/schema";
import { supabase } from "./supabase";

const typeDefs = `
  type User {
    id: ID!
    name: String!
    email: String!
    created_at: String!
    todos: [Todo!]!
  }

  type Todo {
    id: ID!
    title: String!
    completed: Boolean!
    flagged: Boolean!
    created_at: String!
    assignedUsers: [User!]!
  }

  type Query {
    todos: [Todo!]!
    todo(id: ID!): Todo
    users: [User!]!
    user(id: ID!): User
  }

  type Mutation {
    createTodo(title: String!): Todo!
    updateTodo(id: ID!, title: String, completed: Boolean, flagged: Boolean): Todo!
    deleteTodo(id: ID!): Boolean!
    deleteAllTodos: Boolean!
    createUser(name: String!, email: String!): User!
    updateUser(id: ID!, name: String!, email: String!): User!
    deleteUser(id: ID!): Boolean!
    assignTodoToUser(todoId: ID!, userId: ID!): Todo!
    unassignTodoFromUser(todoId: ID!, userId: ID!): Todo!
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
    users: async () => {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    user: async (_: unknown, { id }: { id: string }) => {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      return data;
    },
  },
  Todo: {
    assignedUsers: async (parent: { id: string }) => {
      const { data, error } = await supabase
        .from("todo_assignments")
        .select(
          `
          user_id,
          user:users (
            id,
            name,
            email,
            created_at
          )
        `
        )
        .eq("todo_id", parent.id);

      if (error) throw error;
      return data.map((assignment) => assignment.user);
    },
  },
  User: {
    todos: async (parent: { id: string }) => {
      const { data, error } = await supabase
        .from("todo_assignments")
        .select(
          `
          todo_id,
          todo:todos (
            id,
            title,
            completed,
            flagged,
            created_at
          )
        `
        )
        .eq("user_id", parent.id);

      if (error) throw error;
      return data.map((assignment) => assignment.todo);
    },
  },
  Mutation: {
    createTodo: async (_: unknown, { title }: { title: string }) => {
      const { data, error } = await supabase
        .from("todos")
        .insert([{ title, completed: false, flagged: false }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    updateTodo: async (
      _: unknown,
      {
        id,
        title,
        completed,
        flagged,
      }: { id: string; title?: string; completed?: boolean; flagged?: boolean }
    ) => {
      const updates: {
        title?: string;
        completed?: boolean;
        flagged?: boolean;
      } = {};
      if (title !== undefined) updates.title = title;
      if (completed !== undefined) updates.completed = completed;
      if (flagged !== undefined) updates.flagged = flagged;

      const { data, error } = await supabase
        .from("todos")
        .update(updates)
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
      // First get all todo IDs
      const { data: todos, error: fetchError } = await supabase
        .from("todos")
        .select("id");

      if (fetchError) throw fetchError;
      if (!todos.length) return true;

      // Then delete all todos
      const { error: deleteError } = await supabase
        .from("todos")
        .delete()
        .in(
          "id",
          todos.map((todo) => todo.id)
        );

      if (deleteError) throw deleteError;
      return true;
    },
    createUser: async (
      _: unknown,
      { name, email }: { name: string; email: string }
    ) => {
      const { data, error } = await supabase
        .from("users")
        .insert([{ name, email }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    updateUser: async (
      _: unknown,
      { id, name, email }: { id: string; name: string; email: string }
    ) => {
      const { data, error } = await supabase
        .from("users")
        .update({ name, email })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    deleteUser: async (_: unknown, { id }: { id: string }) => {
      const { error } = await supabase.from("users").delete().eq("id", id);

      if (error) throw error;
      return true;
    },
    assignTodoToUser: async (
      _: unknown,
      { todoId, userId }: { todoId: string; userId: string }
    ) => {
      const { error } = await supabase
        .from("todo_assignments")
        .insert([{ todo_id: todoId, user_id: userId }]);

      if (error) throw error;

      const { data: todo, error: todoError } = await supabase
        .from("todos")
        .select("*")
        .eq("id", todoId)
        .single();

      if (todoError) throw todoError;
      return todo;
    },
    unassignTodoFromUser: async (
      _: unknown,
      { todoId, userId }: { todoId: string; userId: string }
    ) => {
      const { error } = await supabase
        .from("todo_assignments")
        .delete()
        .match({ todo_id: todoId, user_id: userId });

      if (error) throw error;

      const { data: todo, error: todoError } = await supabase
        .from("todos")
        .select("*")
        .eq("id", todoId)
        .single();

      if (todoError) throw todoError;
      return todo;
    },
  },
};

export const schema = makeExecutableSchema({ typeDefs, resolvers });
