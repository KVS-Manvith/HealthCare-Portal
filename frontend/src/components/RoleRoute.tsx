import React, { JSX } from "react";
import { Navigate } from "react-router-dom";
import { getCurrentUser } from "../utils/auth";

type Props = {
  children: JSX.Element;
  roles: string[];
};

export default function RoleRoute({ children, roles }: Props) {
  const user = getCurrentUser();
  if (!user || !user.token) return <Navigate to="/" replace />;
  if (!user.role || !roles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
}
