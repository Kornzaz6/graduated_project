  <template>
    <div class="min-h-screen bg-gray-50">
      <!-- TOP BAR -->
      <header class="sticky top-0 z-[2000] border-b bg-white/80 backdrop-blur-md">
        <div class="flex items-center justify-between px-6 py-4 mx-auto max-w-7xl">
          
          <!-- Logo -->
          <div
            class="text-2xl font-bold tracking-tight cursor-pointer text-rose-500"
            @click="goHome"
          >
            DormitoryHub
          </div>

          <!-- Right Section -->
          <div class="flex items-center gap-4">

            <!-- 🔔 Notification -->
            <div class="relative notification-wrapper">
              <button
                @click="toggleNotifications"
                class="relative p-2 transition rounded-full hover:bg-gray-100"
              >
                🔔
                <span
                  v-if="unreadCount > 0"
                  class="absolute flex items-center justify-center w-5 h-5 text-xs text-white bg-red-500 rounded-full -top-1 -right-1"
                >
                  {{ unreadCount }}
                </span>
              </button>

              <div
                v-if="showNotifications"
                class="absolute right-0 z-[3000] mt-3 bg-white border shadow-xl w-80 rounded-2xl"
              >
                <div class="p-4 font-semibold border-b">
                  Notifications
                </div>

                <div
                  v-if="notifications.length === 0"
                  class="p-4 text-sm text-gray-500"
                >
                  ไม่มีแจ้งเตือน
                </div>

                <div
                  v-for="noti in notifications"
                  :key="noti.id"
                  class="p-4 text-sm transition cursor-pointer hover:bg-gray-50"
                  @click="goToNotification(noti)"
                >
                  {{ noti.message }}
                </div>
              </div>
            </div>

            <!-- 👤 User Menu -->
            <div class="relative menu-wrapper">
              <button
                @click="toggleMenu"
                class="flex items-center gap-3 px-4 py-2 transition bg-white border rounded-full shadow-sm hover:shadow-md"
              >
                <svg width="18" height="18" viewBox="0 0 24 24">
                  <path d="M3 6h18M3 12h18M3 18h18" stroke="currentColor" stroke-width="2" />
                </svg>

                <div
                  class="flex items-center justify-center w-8 h-8 text-sm font-semibold text-white rounded-full bg-rose-500"
                >
                  {{ currentUser?.firstName?.charAt(0) || 'G' }}
                </div>
              </button>

              <transition name="fade">
                <div
                  v-if="menuOpen"
                  class="absolute right-0 w-56 py-2 mt-3 bg-white border shadow-xl rounded-2xl z-[3000]"
                >
                  <div class="px-4 py-2 text-sm text-gray-500 border-b">
                    {{ currentUser?.firstName || 'Guest' }}
                  </div>

                  <!-- ADMIN -->
                  <router-link
                    v-if="isAdmin"
                    :to="{ name: 'AdminDashboard' }"
                    class="dropdown-item"
                  >
                    Admin Dashboard
                  </router-link>

                  <router-link
                    v-if="isAdmin"
                    :to="{ name: 'ManageUsers' }"
                    class="dropdown-item"
                  >
                    Manage Users
                  </router-link>

                  <router-link
                    v-if="isAdmin"
                    :to="{ name: 'OwnerApplications' }"
                    class="dropdown-item"
                  >
                    Owner Applications
                  </router-link>

                  <router-link
                    v-if="isAdmin"
                    :to="{ name: 'ManageOwners' }"
                    class="dropdown-item"
                  >
                    Manage Owners
                  </router-link>

                  <router-link
                    v-if="isAdmin"
                    :to="{ name: 'DormApproval' }"
                    class="dropdown-item"
                  >
                    Dormitory Approval
                  </router-link>

                  <!-- OWNER -->
                  <router-link
                    v-if="isOwner"
                    :to="{ name: 'OwnerDashboard' }"
                    class="dropdown-item"
                  >
                    Owner Dashboard
                  </router-link>

                  <router-link
                    v-if="isOwner"
                    :to="{ name: 'OwnerPayments' }"
                    class="dropdown-item"
                  >
                    Payment Dashboard
                  </router-link>

                  <!-- MEMBER -->
                  <router-link
                    v-if="isMember"
                    :to="{ name: 'MemberHome' }"
                    class="dropdown-item"
                  >
                    Home
                  </router-link>

                  <router-link
                    v-if="isMember"
                    :to="{ name: 'ManageMemberProfile'}"
                    class="dropdown-item"
                  >
                    Profile
                  </router-link>

                  <router-link
                    v-if="isMember"
                    :to="{ name: 'MemberDashboard' }"
                    class="dropdown-item"
                  >
                    My Rentals
                  </router-link>

                  <router-link
                    v-if="isMember"
                    :to="{ name: 'MemberPayments' }"
                    class="dropdown-item"
                  >
                    View All Payments
                  </router-link>

                  <router-link
                    v-if="isMember"
                    :to="{ name: 'applyowner' }"
                    class="dropdown-item"
                  >
                    Apply to be Owner
                  </router-link>

                  <router-link
                    v-if="isMember && approvedRequestId"
                    :to="{ name: 'MemberContract', params: { requestId: approvedRequestId } }"
                    class="dropdown-item"
                  >
                    ✍️ Make Contract
                  </router-link>

                  <button
                    @click="handleLogout"
                    class="text-red-500 dropdown-item"
                  >
                    Logout
                  </button>
                </div>
              </transition>
            </div>

          </div>
        </div>
      </header>

      <!-- CONTENT -->
      <main class="px-6 py-10 mx-auto max-w-7xl">
        <router-view />
      </main>
    </div>
  </template>

  <script setup lang="ts">
  import { ref, onMounted, onBeforeUnmount, computed } from "vue"
  import { useRouter } from "vue-router"
  import axios from "axios"
 import api from '@/services/api'

  const router = useRouter()

  const currentUser = ref<any>(null)
  const menuOpen = ref(false)
  const showNotifications = ref(false)
  const approvedRequestId = ref<number | null>(null)
  const notifications = ref<any[]>([])

  const isAdmin = computed(() => currentUser.value?.role === "ADMIN")
  const isOwner = computed(() => currentUser.value?.role === "OWNER")
  const isMember = computed(() => currentUser.value?.role === "MEMBER")

  const unreadCount = computed(() =>
    notifications.value.filter(n => !n.read).length
  )

  const toggleMenu = () => (menuOpen.value = !menuOpen.value)
  const toggleNotifications = () => (showNotifications.value = !showNotifications.value)

  const goHome = () => router.push({ name: "Home" })

  const handleLogout = () => {
    menuOpen.value = false
    showNotifications.value = false
    localStorage.removeItem("user")
    router.push({ name: "Login" })
  }

  const goToNotification = (noti: any) => {
    noti.read = true
    showNotifications.value = false
    router.push(noti.link)
  }

  const handleClickOutside = (e: MouseEvent) => {
    const target = e.target as HTMLElement
    if (!target.closest(".menu-wrapper")) menuOpen.value = false
    if (!target.closest(".notification-wrapper")) showNotifications.value = false
  }

  onMounted(async () => {
  const user = localStorage.getItem("user")
  if (!user) return

  currentUser.value = JSON.parse(user)

  if (isMember.value && currentUser.value?.id) {
    try {
      const { data } = await api.get(
        `/rental/member/${currentUser.value.id}`
      )

      const list = Array.isArray(data) ? data : []

      const approvedList = list.filter(
        (r: any) => r.status === "APPROVED" && !r.leaseContract
      )

      if (approvedList.length > 0) {
        approvedRequestId.value = approvedList[0].id

        notifications.value = approvedList.map((r: any) => ({
          id: r.id,
          message: `คำขอเช่าห้อง ${r.room.roomNumber} ได้รับการอนุมัติ`,
          link: { name: "MemberContract", params: { requestId: r.id } },
          read: false,
        }))
      }
    } catch (err) {
      console.error("Fetch rental requests error:", err)
    }
  }

  document.addEventListener("click", handleClickOutside)
})

  onBeforeUnmount(() => {
    document.removeEventListener("click", handleClickOutside)
  })
  </script>

  <style scoped>
  .dropdown-item {
    @apply block px-4 py-2 text-sm hover:bg-gray-100 cursor-pointer transition;
  }

  .fade-enter-active,
  .fade-leave-active {
    transition: all 0.2s ease;
  }
  .fade-enter-from,
  .fade-leave-to {
    opacity: 0;
    transform: translateY(-5px);
  }
  </style>