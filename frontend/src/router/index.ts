import { createRouter, createWebHistory } from "vue-router";
import DashboardLayout from "../layouts/DashboardLayout.vue";
import DashboardPage from "../views/Dashboard_page.vue";
import ManageUserAccountPage from "../views/Manage_UserAccount_page.vue";
import LoginPage from "../views/Login_page.vue";
import RegisterPage from "../views/Register_page.vue";
import DormitoryHub_page from "@/views/DormitoryHub_page.vue";

const routes = [
  { path: "/login", component: LoginPage },
  { path: "/register", component: RegisterPage },
  { path: "/", component: DormitoryHub_page },


  {
    path: "/",
    component: DashboardLayout,
    children: [
      { path: "dashboard", component: DashboardPage },
      { path: "manage-users", component: ManageUserAccountPage },
      { path: "Home", component: DormitoryHub_page },
    ],
  },
];

export default createRouter({
  history: createWebHistory(),
  routes,
});
