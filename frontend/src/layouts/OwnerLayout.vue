<template>
  <div class="min-h-screen bg-gray-50">
    <!-- TOP BAR -->
    <header class="sticky top-0 z-50 bg-white border-b shadow-sm">
      <div class="flex items-center justify-between px-6 py-4 mx-auto max-w-7xl">
        <!-- Logo -->
        <div class="text-2xl font-bold cursor-pointer text-rose-500" @click="goHome">
          DormitoryHub
        </div>

        <div class="flex items-center gap-4">
          <!-- ================= NOTIFICATION ================= -->
          <div class="relative">
            <button
              @click="toggleNotifications"
              class="relative p-2 rounded-full hover:bg-gray-100"
            >
              🔔

              <!-- badge -->
              <span
                v-if="notifications.length"
                class="absolute flex items-center justify-center w-5 h-5 text-xs text-white bg-red-500 rounded-full -top-1 -right-1"
              >
                {{ notifications.length }}
              </span>
            </button>

            <!-- notification dropdown -->
            <div
              v-if="showNotifications"
              class="absolute right-0 mt-2 bg-white border shadow-lg w-72 rounded-xl"
            >
              <div class="px-4 py-3 font-semibold border-b">Notifications</div>

              <div v-if="notifications.length === 0" class="p-4 text-sm text-gray-500">
                ไม่มีแจ้งเตือน
              </div>

              <div v-else>
                <div
                  v-for="(n, index) in notifications"
                  :key="index"
                  class="px-4 py-3 text-sm border-b hover:bg-gray-50"
                >
                  {{ n.message }}
                </div>
              </div>
            </div>
          </div>

          <!-- ================= OWNER MENU ================= -->
          <div class="relative">
            <button
              @click="toggleMenu"
              class="flex items-center gap-3 px-4 py-2 transition border rounded-full shadow-sm hover:shadow-md"
            >
              <span class="hidden text-sm font-medium sm:block">
                {{ currentUser?.firstName }}
              </span>

              <div
                class="flex items-center justify-center w-8 h-8 text-white rounded-full bg-rose-500"
              >
                {{ currentUser?.firstName?.charAt(0) || 'O' }}
              </div>
            </button>

            <!-- Dropdown -->
            <div
              v-if="menuOpen"
              class="absolute right-0 w-56 py-2 mt-2 bg-white border shadow-lg rounded-2xl"
            >
              <router-link
                :to="{ name: 'OwnerDashboard' }"
                class="dropdown-item"
                @click="closeMenu"
              >
                📊 Dashboard
              </router-link>

              <router-link :to="{ name: 'OwnerProfile' }" class="dropdown-item" @click="closeMenu">
                👤 Profile
              </router-link>

              <router-link
                :to="{ name: 'ManageDormitory' }"
                class="dropdown-item"
                @click="closeMenu"
              >
                🏢 Manage Dormitories
              </router-link>

              <router-link
                :to="{ name: 'RentalRequests' }"
                class="dropdown-item"
                @click="closeMenu"
              >
                📋 Rental Requests
              </router-link>

              <router-link :to="{ name: 'AddDormitory' }" class="dropdown-item" @click="closeMenu">
                ➕ Add Dormitory
              </router-link>

              <router-link
                v-if="isOwner"
                :to="{ name: 'LeaseContracts' }"
                class="dropdown-item"
                @click="closeMenu"
              >
                📄 Lease Contracts
              </router-link>

              <router-link
                v-if="isOwner"
                :to="{ name: 'OwnerTenants' }"
                class="dropdown-item"
                @click="closeMenu"
              >
                👥 Tenants
              </router-link>

              <router-link
                v-if="isOwner"
                :to="{ name: 'OwnerPayments' }"
                class="dropdown-item"
                @click="closeMenu"
              >
                Owner Manage Payment
              </router-link>

              <router-link 
                v-if="isOwner" 
                :to="{ name: 'OwnerTickets' }" 
                class="dropdown-item"
                @click="closeMenu"
                >
                Tenant Support
              </router-link>

              <div class="my-2 border-t"></div>

              <button @click="handleLogout" class="text-red-500 dropdown-item">🚪 Logout</button>
            </div>
          </div>
        </div>
      </div>
    </header>

    <!-- PAGE CONTENT -->
    <main class="px-6 py-10 mx-auto max-w-7xl">
      <router-view />
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { logout } from '../utils/auth'

const router = useRouter()

const currentUser = ref<any>(null)

const menuOpen = ref(false)

/* ================= NOTIFICATIONS ================= */

const notifications = ref<any[]>([])
const showNotifications = ref(false)

const toggleNotifications = () => {
  showNotifications.value = !showNotifications.value
}

/* ================= OWNER CHECK ================= */

const isOwner = computed(() => currentUser.value?.role === 'OWNER')

/* ================= MENU ================= */

const toggleMenu = () => {
  menuOpen.value = !menuOpen.value
}

const closeMenu = () => {
  menuOpen.value = false
}

/* ================= NAV ================= */

const goHome = () => {
  router.push({ name: 'Home' })
}

/* ================= LOAD USER ================= */

onMounted(() => {
  const user = localStorage.getItem('user')

  if (user) currentUser.value = JSON.parse(user)

  loadNotifications()
})

/* ================= MOCK NOTIFICATIONS ================= */

const loadNotifications = () => {
  notifications.value = [
    { message: 'New rental request received' },
    { message: 'Tenant uploaded payment slip' },
  ]
}

/* ================= LOGOUT ================= */

const handleLogout = () => {
  logout()
  router.push({ name: 'Login' })
}
</script>

<style scoped>
.dropdown-item {
  @apply block px-4 py-2 text-sm hover:bg-gray-100 cursor-pointer transition;
}
</style>