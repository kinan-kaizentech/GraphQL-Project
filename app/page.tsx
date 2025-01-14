"use client";

import { gql, useMutation, useQuery } from "@apollo/client";
import { useState } from "react";

const GET_TODOS = gql`
  query GetTodos {
    todos {
      id
      title
      completed
      created_at
    }
  }
`;

const CREATE_TODO = gql`
  mutation CreateTodo($title: String!) {
    createTodo(title: $title) {
      id
      title
      completed
      created_at
    }
  }
`;

const UPDATE_TODO = gql`
  mutation UpdateTodo($id: ID!, $completed: Boolean!) {
    updateTodo(id: $id, completed: $completed) {
      id
      completed
    }
  }
`;

const DELETE_TODO = gql`
  mutation DeleteTodo($id: ID!) {
    deleteTodo(id: $id)
  }
`;

const DELETE_ALL_TODOS = gql`
  mutation DeleteAllTodos {
    deleteAllTodos
  }
`;

interface Todo {
  id: string;
  title: string;
  completed: boolean;
  created_at: string;
}

export default function Home() {
  const [newTodo, setNewTodo] = useState("");
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());
  const [isDeletingAll, setIsDeletingAll] = useState(false);

  const { data, loading, error } = useQuery(GET_TODOS);
  const [createTodo] = useMutation(CREATE_TODO, {
    refetchQueries: [{ query: GET_TODOS }],
  });
  const [updateTodo] = useMutation(UPDATE_TODO, {
    refetchQueries: [{ query: GET_TODOS }],
  });
  const [deleteTodo] = useMutation(DELETE_TODO, {
    refetchQueries: [{ query: GET_TODOS }],
  });
  const [deleteAllTodos] = useMutation(DELETE_ALL_TODOS, {
    refetchQueries: [{ query: GET_TODOS }],
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTodo.trim()) return;

    try {
      await createTodo({ variables: { title: newTodo } });
      setNewTodo("");
    } catch (err) {
      console.error("Error creating todo:", err);
    }
  };

  const handleToggle = async (id: string, completed: boolean) => {
    try {
      await updateTodo({ variables: { id, completed: !completed } });
    } catch (err) {
      console.error("Error updating todo:", err);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingIds((prev) => new Set(prev).add(id));
    try {
      await deleteTodo({ variables: { id } });
    } catch (err) {
      console.error("Error deleting todo:", err);
    } finally {
      setDeletingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const handleDeleteAll = async () => {
    if (!window.confirm("Are you sure you want to delete all todos?")) return;

    setIsDeletingAll(true);
    try {
      await deleteAllTodos();
    } catch (err) {
      console.error("Error deleting all todos:", err);
    } finally {
      setIsDeletingAll(false);
    }
  };

  if (loading) return <div className="p-4">Loading...</div>;
  if (error) return <div className="p-4">Error: {error.message}</div>;

  return (
    <div className="max-w-2xl mx-auto p-4">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Todo List</h1>
        <button
          onClick={handleDeleteAll}
          disabled={isDeletingAll || !data?.todos?.length}
          className="px-4 py-2 text-red-500 border border-red-500 rounded hover:bg-red-50 disabled:opacity-50 disabled:hover:bg-transparent"
        >
          {isDeletingAll ? (
            <div className="flex items-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Deleting All...
            </div>
          ) : (
            "Delete All"
          )}
        </button>
      </div>

      <form onSubmit={handleSubmit} className="mb-8">
        <div className="flex gap-2">
          <input
            type="text"
            value={newTodo}
            onChange={(e) => setNewTodo(e.target.value)}
            placeholder="Add a new todo..."
            className="flex-1 p-2 border rounded"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Add
          </button>
        </div>
      </form>

      <ul className="space-y-2">
        {data?.todos.map((todo: Todo) => {
          const isDeleting = deletingIds.has(todo.id);
          return (
            <li
              key={todo.id}
              className={`flex items-center gap-2 p-2 border rounded ${
                isDeleting ? "opacity-50" : ""
              }`}
            >
              <input
                type="checkbox"
                checked={todo.completed}
                onChange={() => handleToggle(todo.id, todo.completed)}
                className="h-5 w-5"
                disabled={isDeleting}
              />
              <span
                className={todo.completed ? "line-through flex-1" : "flex-1"}
              >
                {todo.title}
              </span>
              <button
                onClick={() => handleDelete(todo.id)}
                disabled={isDeleting}
                className={`px-2 py-1 text-red-500 hover:text-red-700 disabled:opacity-50 flex items-center gap-1`}
              >
                {isDeleting ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Deleting...
                  </>
                ) : (
                  "Delete"
                )}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
