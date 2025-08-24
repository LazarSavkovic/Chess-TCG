// api.ts
import { useAuth } from "@clerk/clerk-react";

export function useApi() {
  const { getToken } = useAuth();

  // Use a JWT Template named 'flask' if you want custom claims
  const call = async (path, init = {}) => {
    const token = await getToken({ template: "flask" }); // or omit template
    return fetch(`${import.meta.env.VITE_API_URL}${path}`, {
      ...init,
      headers: {
        ...(init.headers || {}),
        Authorization: `Bearer ${token}`,
      },
    });
  };

  return { call };
}
