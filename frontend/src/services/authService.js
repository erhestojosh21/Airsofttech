const API_URL = `${process.env.REACT_APP_API_URL}`;

export const login = async (email, password) => {
  const response = await fetch(`${API_URL}/employee-login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  return response.json();
};
