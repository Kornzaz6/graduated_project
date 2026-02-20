import router from "@/router";

export const logout = () => {
  localStorage.removeItem("user");
  localStorage.removeItem("token");

  router.replace("/login");
};
