"use client";

import { gql, useMutation, useQuery } from "@apollo/client";
import Link from "next/link";
import { useState } from "react";

const GET_TODOS = gql`
  query GetTodos {
    todos {
      id
      title
      completed
      flagged
      created_at
      assignedUsers {
        id
        name
        email
      }
    }
  }
`;

const GET_USERS = gql`
  query GetUsers {
    users {
      id
      name
      email
    }
  }
`;

const CREATE_TODO = gql`
  mutation CreateTodo($title: String!) {
    createTodo(title: $title) {
      id
      title
      completed
      flagged
      created_at
      assignedUsers {
        id
        name
        email
      }
    }
  }
`;

const ASSIGN_TODO = gql`
  mutation AssignTodo($todoId: ID!, $userId: ID!) {
    assignTodoToUser(todoId: $todoId, userId: $userId) {
      id
      assignedUsers {
        id
        name
        email
      }
    }
  }
`;

const UNASSIGN_TODO = gql`
  mutation UnassignTodo($todoId: ID!, $userId: ID!) {
    unassignTodoFromUser(todoId: $todoId, userId: $userId) {
      id
      assignedUsers {
        id
        name
        email
      }
    }
  }
`;

const UPDATE_TODO = gql`
  mutation UpdateTodo(
    $id: ID!
    $title: String
    $completed: Boolean
    $flagged: Boolean
  ) {
    updateTodo(
      id: $id
      title: $title
      completed: $completed
      flagged: $flagged
    ) {
      id
      title
      completed
      flagged
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

const TOGGLE_FLAG = gql`
  mutation ToggleFlag($id: ID!) {
    toggleFlag(id: $id) {
      id
      flagged
    }
  }
`;

interface User {
  id: string;
  name: string;
  email: string;
}

interface Todo {
  id: string;
  title: string;
  completed: boolean;
  flagged: boolean;
  created_at: string;
  assignedUsers: User[];
}

interface EditingTodo {
  id: string;
  title: string;
}

export default function Home() {
  const [newTodo, setNewTodo] = useState("");
  const [editingTodo, setEditingTodo] = useState<EditingTodo | null>(null);
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());
  const [isDeletingAll, setIsDeletingAll] = useState(false);

  const {
    data: todosData,
    loading: todosLoading,
    error: todosError,
  } = useQuery(GET_TODOS);

  const { data: usersData, loading: usersLoading } = useQuery(GET_USERS);

  const [createTodo] = useMutation(CREATE_TODO, {
    refetchQueries: [{ query: GET_TODOS }],
  });
  const [assignTodo] = useMutation(ASSIGN_TODO, {
    refetchQueries: [{ query: GET_TODOS }],
  });
  const [unassignTodo] = useMutation(UNASSIGN_TODO, {
    refetchQueries: [{ query: GET_TODOS }],
  });
  const [updateTodo] = useMutation(UPDATE_TODO);
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

  const handleAssignUser = async (todoId: string, userId: string) => {
    try {
      await assignTodo({ variables: { todoId, userId } });
    } catch (err) {
      console.error("Error assigning user:", err);
    }
  };

  const handleUnassignUser = async (todoId: string, userId: string) => {
    try {
      await unassignTodo({ variables: { todoId, userId } });
    } catch (err) {
      console.error("Error unassigning user:", err);
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

  const handleToggleFlag = async (id: string, flagged: boolean) => {
    try {
      await updateTodo({ variables: { id, flagged: !flagged } });
    } catch (err) {
      console.error("Error updating todo:", err);
    }
  };

  const handleUpdateTitle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTodo || !editingTodo.title.trim()) return;

    try {
      await updateTodo({
        variables: {
          id: editingTodo.id,
          title: editingTodo.title,
        },
      });
      setEditingTodo(null);
    } catch (err) {
      console.error("Error updating todo:", err);
    }
  };

  if (todosLoading || usersLoading)
    return <div className="p-4">Loading...</div>;
  if (todosError)
    return <div className="p-4 text-red-500">Error: {todosError.message}</div>;

  return (
    <main className="max-w-4xl mx-auto p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Todo List</h1>
        <div className="space-x-2">
          <Link
            href="/users"
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            Manage Users
          </Link>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mb-4">
        <input
          type="text"
          value={newTodo}
          onChange={(e) => setNewTodo(e.target.value)}
          placeholder="Add a new todo..."
          className="w-full p-2 border rounded"
        />
      </form>

      <div className="space-y-2">
        {todosData?.todos.map((todo: Todo) => (
          <div
            key={todo.id}
            className="flex flex-col bg-white p-4 rounded-lg shadow"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={todo.completed}
                  onChange={() => handleToggle(todo.id, todo.completed)}
                  className="h-5 w-5 rounded border-gray-300"
                />
                {editingTodo?.id === todo.id ? (
                  <form
                    onSubmit={handleUpdateTitle}
                    className="flex items-center space-x-2"
                  >
                    <input
                      type="text"
                      value={editingTodo.title}
                      onChange={(e) =>
                        setEditingTodo({
                          ...editingTodo,
                          title: e.target.value,
                        })
                      }
                      className="p-1 border rounded"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={handleUpdateTitle}
                      className="text-green-600 hover:text-green-900"
                    >
                      Save
                    </button>
                  </form>
                ) : (
                  <div className="flex items-center space-x-2">
                    <span
                      className={`${
                        todo.completed ? "line-through text-gray-500" : ""
                      } cursor-pointer`}
                      onClick={() =>
                        setEditingTodo({ id: todo.id, title: todo.title })
                      }
                      title="Click to edit"
                    >
                      {todo.title}
                    </span>
                    <span className="text-sm text-gray-500">
                      {new Date(todo.created_at).toLocaleString("en-GB", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: false,
                      })}
                    </span>
                  </div>
                )}
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleToggleFlag(todo.id, todo.flagged)}
                  className={`p-2 rounded-full hover:bg-gray-100 focus:outline-none ${
                    todo.flagged ? "text-red-500" : "text-gray-400"
                  }`}
                  aria-label={todo.flagged ? "Remove flag" : "Add flag"}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M3 6a3 3 0 013-3h10a1 1 0 01.8 1.6L14.25 8l2.55 3.4A1 1 0 0116 13H6a1 1 0 00-1 1v4a1 1 0 11-2 0V6z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
                <button
                  onClick={() => handleDelete(todo.id)}
                  disabled={deletingIds.has(todo.id)}
                  className="p-2 text-red-500 hover:bg-red-50 rounded-full disabled:opacity-50"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </div>
            </div>

            <div className="mt-2 pt-2 border-t">
              <div className="flex flex-wrap gap-2">
                {todo.assignedUsers.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center bg-blue-100 px-2 py-1 rounded"
                  >
                    <span className="text-sm text-blue-800">{user.name}</span>
                    <button
                      onClick={() => handleUnassignUser(todo.id, user.id)}
                      className="ml-2 text-blue-500 hover:text-blue-700"
                    >
                      ×
                    </button>
                  </div>
                ))}
                <select
                  onChange={(e) => {
                    if (e.target.value) {
                      handleAssignUser(todo.id, e.target.value);
                      e.target.value = "";
                    }
                  }}
                  className="text-sm border rounded px-2 py-1"
                  value=""
                >
                  <option value="">Assign user...</option>
                  {usersData?.users
                    .filter(
                      (user: User) =>
                        !todo.assignedUsers.some(
                          (assigned) => assigned.id === user.id
                        )
                    )
                    .map((user: User) => (
                      <option key={user.id} value={user.id}>
                        {user.name}
                      </option>
                    ))}
                </select>
              </div>
            </div>
          </div>
        ))}
      </div>

      {todosData?.todos.length > 0 && (
        <button
          onClick={handleDeleteAll}
          disabled={isDeletingAll}
          className="mt-4 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50"
        >
          Delete All
        </button>
      )}
    </main>
  );
}
