import { createRouter, createWebHistory } from "vue-router"

// Layouts
import DashboardLayout from "@/layouts/DashboardLayout.vue"
import OwnerLayout from "@/layouts/OwnerLayout.vue"

// Public
import LoginPage from "@/views/Login_page.vue"
import RegisterPage from "@/views/Register_page.vue"
import DormitoryHub_page from "@/views/DormitoryHub_page.vue"
import DormitoryDetail from "@/views/DormitoryDetail.vue"

// Admin
import DashboardPage from "@/views/Dashboard_page.vue"
import ManageUserAccountPage from "@/views/Manage_UserAccount_page.vue"
import AdminOwnerApplications_page from "@/views/AdminOwnerApplications_page.vue"
import ManageLeaseContract_page from "@/views/ManageLeaseContract_page.vue"
import ManageOwners_page from "@/views/ManageOwners_page.vue"
import AdminDormApprove_page from "@/views/AdminDormApprove_page.vue"

// Owner
import OwnerDashboardPage from "@/views/OwnerDashboard_page.vue"
import AddDormitoryPage from "@/views/AddDormitory_page.vue"
import Manage_myDormitory_page from "@/views/Manage_myDormitory_page.vue"
import OwnerMange_rooms_page from "@/views/OwnerMange_rooms_page.vue"
import ManageRentalRequest_page from "@/views/ManageRentalRequest_page.vue"
import OwnerPaymentDashboard_page from "@/views/OwnerPaymentDashboard_page.vue"
import OwnerComfirmPayment_page from "@/views/OwnerComfirmPayment_page.vue"
import OwnerProfile_page from "@/views/OwnerProfile_page.vue"
import OwnerTenants_page from "@/views/OwnerTenants_page.vue"
import OwnerMangedormitoryInfo_page from "@/views/OwnerMangedormitoryInfo_page.vue"
import OwnerContractDetail_page from "@/views/OwnerContractDetail_page.vue"

// Member
import MembercontractForm_page from "@/views/MembercontractForm_page.vue"
import MemberPayment_page from "@/views/MemberPayment_page.vue"
import MemberDashboard from "@/views/MemberDashboard_page.vue"
import ApplyOwner_page from "@/views/ApplyOwner_page.vue"
import ManageMemberProfile_page from "@/views/ManageMemberProfile_page.vue"

const routes = [
  // 🌍 PUBLIC
  { path: "/", name: "Home", component: DormitoryHub_page },
  { path: "/login", name: "Login", component: LoginPage },
  { path: "/register", name: "Register", component: RegisterPage },
  { path: "/dormitories/:id", name: "DormitoryDetail", component: DormitoryDetail },

  // 👤 MEMBER
  {
    path: "/member",
    component: DashboardLayout,
    meta: { requiresAuth: true, role: "MEMBER" },
    children: [
      { path: "home", name: "MemberHome", component: DormitoryHub_page },
      { path: "dashboard", name: "MemberDashboard", component: MemberDashboard },
      { path: "apply-owner", name: "applyowner", component: ApplyOwner_page },
      { path: "contract/:requestId", name: "MemberContract", component: MembercontractForm_page },
      { path: "payment/:contractId", name: "MemberPayment", component: MemberPayment_page },
      { path: "payments", name: "MemberPayments", component: MemberPayment_page }, // 🔥 เพิ่มรวมบิล
      { path: "/profile", name: "ManageMemberProfile", component: ManageMemberProfile_page}
    ],
  },

  // 🛠 ADMIN
  {
    path: "/admin",
    component: DashboardLayout,
    meta: { requiresAuth: true, role: "ADMIN" },
    children: [
      { path: "dashboard", name: "AdminDashboard", component: DashboardPage },
      { path: "manage-users", name: "ManageUsers", component: ManageUserAccountPage },
      { path: "owner-applications", name: "OwnerApplications", component: AdminOwnerApplications_page },
      { path: "manage-owners", name: "ManageOwners", component: ManageOwners_page },
      { path: "apply-owner", name: "ApplyOwner", component: ApplyOwner_page },
      { path: "dorm-approval", name: "DormApproval", component: AdminDormApprove_page }, // 🔥 ใช้หน้าต่างเดิม แต่แยก logic ใน controller ว่าเป็น owner application หรือ dormitory approval
    ],
  },

  // 🏠 OWNER
  {
    path: "/owner",
    component: OwnerLayout,
    meta: { requiresAuth: true, role: "OWNER" },
    children: [
      { path: "dashboard", name: "OwnerDashboard", component: OwnerDashboardPage },
      { path: "add-dormitory", name: "AddDormitory", component: AddDormitoryPage },
      { path: "manage-dormitory", name: "ManageDormitory", component: Manage_myDormitory_page },
      { path: "rental-requests", name: "RentalRequests", component: ManageRentalRequest_page },
      { path: "tenants", name: "OwnerTenants", component: OwnerTenants_page },
      { path: "lease-contracts", name: "LeaseContracts", component: ManageLeaseContract_page },
      { path: "payments", name: "OwnerPayments", component: OwnerPaymentDashboard_page },
      { path: "confirm-payment/:paymentId", name: "ConfirmPayment", component: OwnerComfirmPayment_page },
      { path: "profile", name: "OwnerProfile", component: OwnerProfile_page },
      { path: "edit-dormitory/:id", name: "EditDormitory", component: OwnerMangedormitoryInfo_page },
      { path: "manage-rooms/:id", name: "ManageRooms", component: OwnerMange_rooms_page },
      { path: "contracts/:contractId", name: "OwnerContratDetail", component: OwnerContractDetail_page}
    ],
  },

  { path: "/:pathMatch(.*)*", redirect: "/" },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

/* 🔐 SMART GLOBAL GUARD */
router.beforeEach((to, from, next) => {
  const user = JSON.parse(localStorage.getItem("user") || "null")

  // ถ้า login แล้ว ห้ามกลับไปหน้า login
  if (to.path === "/login" && user) {
    if (user.role === "ADMIN") return next("/admin/dashboard")
    if (user.role === "OWNER") return next("/owner/dashboard")
    return next("/member/home")
  }

  if (to.meta.requiresAuth) {
    if (!user) return next("/login")

    if (to.meta.role && user.role !== to.meta.role) {
      return next("/")
    }
  }

  next()
})

export default router