"use client";

import { useState } from "react";
import Link from "next/link";
import axios from "axios";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  // State to store input values
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  // Login function
  const login = async (e) => {
    e.preventDefault();

    try {
      const response = await axios.post(
        "http://127.0.0.1:8000/api/v1/token/",
        {
          username: username,
          password: password,
        }
      );

      // Save token
      localStorage.setItem("token", response.data.access);
      console.log("Dashboard")
      router.push("/dashboard");
    } catch (error) {
      alert("Invalid username or password");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-4">
      <h1 className="text-2xl font-bold mb-8 text-gray-800">
        Streamline your traditional Cheque Management System
      </h1>

      {/* Form */}
      <form
        onSubmit={login}
        className="flex flex-col gap-4 w-full max-w-sm"
        autoComplete="off"
      >
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="p-3 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-black"
          required
          autoComplete="name"
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="p-3 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-black"
          required
          autoComplete="new-password"
        />

        <button
          type="submit"
          className="bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition"
        >
          Login
        </button>

        <div className="text-center mt-4">
          <p className="text-gray-500 text-sm mb-2">New User?</p>

          <Link
            href="/register"
            className="inline-block px-10 py-4 bg-blue-600 text-white rounded-xl font-bold text-lg hover:bg-blue-700 shadow-lg transition"
          >
            Register
          </Link>
        </div>
      </form>
    </div>
  );
}