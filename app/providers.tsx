"use client";

import client from "@/lib/apollo-client";
import { ApolloProvider } from "@apollo/client";

export function Providers({ children }: { children: React.ReactNode }) {
  return <ApolloProvider client={client}>{children}</ApolloProvider>;
}
