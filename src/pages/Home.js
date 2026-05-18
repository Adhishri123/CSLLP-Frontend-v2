import React from "react";
import Dashboard from "../components/Dashboard";
import EmployeeList from "../components/EmployeeList";

export default function Home() {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold text-indigo-700">Welcome to CSLLP Platform</h1>
      <p className="text-gray-600 mt-2">Track learning progress and performance in one place.</p>
      <Dashboard />
      <EmployeeList />
    </div>
  );
}
