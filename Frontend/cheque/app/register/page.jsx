"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import axios from "axios";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();

  const initialState = {
    fullName: "",
    email: "",
    password: "",
    mobile_number: "",
    bank_name: "",
  };

  const [formData, setFormData] = useState(initialState);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await axios.post(
        "http://127.0.0.1:8000/api/v1/user/",
        {
          username: formData.email,
          email: formData.email,
          password: formData.password,
          mobile_number: formData.mobile_number,
          bank_name: formData.bank_name.toUpperCase(),
          role: "User",
        }
      );

      if (response.status === 200 || response.status === 201) {
        router.push("/login");
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        alert(
          "Server Error:\n" +
            JSON.stringify(error.response?.data, null, 2)
        );
      } else {
        alert("An unexpected error occurred.");
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 text-black">
      <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
        <div className="mb-4">
          <Image
            src="/images.png"
            alt="Logo"
            width={40}
            height={40}
            priority
          />
        </div>

        <h2 className="text-2xl font-semibold mb-2">Create Account</h2>
        <p className="text-gray-500 text-sm mb-6">
          Digital Cheque Management System
        </p>

        <form
          className="space-y-4"
          onSubmit={handleSubmit}
          autoComplete="off"
        >
          <input
            type="text"
            name="fullName"
            placeholder="Full Name"
            value={formData.fullName}
            required
            onChange={handleChange}
            className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
          />

          <input
            type="email"
            name="email"
            placeholder="Email Address"
            value={formData.email}
            required
            onChange={handleChange}
            className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
            autoComplete="new-email"
          />

          <input
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            required
            onChange={handleChange}
            className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
            autoComplete="new-password"
          />

          <input
            type="text"
            name="mobile_number"
            placeholder="Mobile Number"
            value={formData.mobile_number}
            required
            onChange={handleChange}
            className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
            autoComplete="off"
          />

          <input
            type="text"
            name="bank_name"
            placeholder="Bank Name (SBI, HDFC, ICICI, AXIS)"
            value={formData.bank_name}
            required
            onChange={handleChange}
            className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
            autoComplete="off"
          />

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700"
          >
            Register
          </button>
        </form>

        <p className="mt-6 text-center text-sm">
          Already have an account?{" "}
          <Link
            href="/login"
            className="text-blue-600 font-bold hover:underline"
          >
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}