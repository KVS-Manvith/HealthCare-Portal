// frontend/src/components/PrivateRoute.tsx
import React, { JSX } from "react";
import { Navigate } from "react-router-dom";
import { getCurrentUser } from "../utils/auth";

type Props = { children: JSX.Element };

export default function PrivateRoute({ children }: Props) {
  const user = getCurrentUser();
  if (!user || !user.token) return <Navigate to="/" replace />;
  return children;
}
