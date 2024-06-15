const url = import.meta.env.VITE_SERVER_URL;

console.log(`SERVER URL`, url);

// Fetch post for this url

export const fetchPost = async (route: string, body: any) => {
  try {
    const response = await fetch(url + route, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();
    console.log("Success:", data);
    return data;
  } catch (error) {
    console.error("Error:", error);
  }
};

export const fetchGet = async (route: string, token: string) => {
  try {
    const response = await fetch(url + route, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();
    console.log("Success:", data);
    return data;
  } catch (error) {
    console.error("Error:", error);
  }
};
