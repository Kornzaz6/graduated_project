import { createRouter, createWebHistory } from "vue-router";
import DashboardLayout from "../layouts/DashboardLayout.vue";
import DashboardPage from "../views/Dashboard_page.vue";
import ManageUserAccountPage from "../views/Manage_UserAccount_page.vue";
import LoginPage from "../views/Login_page.vue";
import RegisterPage from "../views/Register_page.vue";
import DormitoryHub_page from "@/views/DormitoryHub_page.vue";
import AddDormitoryPage from "@/views/AddDormitory_page.vue";
import ApplyOwner_page from "@/views/ApplyOwner_page.vue";
import AdminOwnerApplications_page from "@/views/AdminOwnerApplications_page.vue";
import AdminOwnerApproval_page from "@/views/AdminOwnerApproval_page.vue";
import OwnerLayout from "@/layouts/OwnerLayout.vue";
import OwnerDashboardPage from "@/views/OwnerDashboard_page.vue";
import Manage_myDormitory_page from "@/views/Manage_myDormitory_page.vue";
import OwnerMange_rooms_page from "@/views/OwnerMange_rooms_page.vue";

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
      { path: "apply-owner", component: ApplyOwner_page },
      { path: "admin/owner-applications", component: AdminOwnerApplications_page },
      { path: "admin/owner-approval", component: AdminOwnerApproval_page },
    ],
  },

  {
    path: "/owner",
    component: OwnerLayout,
    children: [
      { path: "dashboard", component: OwnerDashboardPage },
      { path: "add-dormitory", component: AddDormitoryPage },
      { path: "manage-dormitory", component: Manage_myDormitory_page },
      { path: "edit-dormitory/:id", component: OwnerMange_rooms_page },
    ],
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

// 🔐 Owner Guard
router.beforeEach((to, from, next) => {
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  if (to.path.startsWith("/owner") && user.role !== "OWNER") {
    return next("/dashboard");
  }

  next();
});

export default router;
