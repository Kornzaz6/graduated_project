<template>
  <div class="min-h-screen px-6 py-10 bg-gray-100">
    <div class="max-w-4xl p-10 mx-auto bg-white shadow-xl rounded-2xl">

      <h1 class="mb-8 text-2xl font-bold text-center">
        สัญญาเช่าห้องพัก
      </h1>

      <!-- ข้อมูลทั่วไป -->
      <div class="mb-6 space-y-4">
        <p><strong>ชื่อผู้เช่า:</strong> {{ currentUser?.username }}</p>
        <p><strong>ห้อง:</strong> {{ roomInfo?.roomNumber }}</p>
        <p><strong>หอพัก:</strong> {{ roomInfo?.dormitory?.name }}</p>
      </div>

      <div class="space-y-6">

        <!-- วันที่เริ่ม -->
        <div>
          <label class="block mb-1 text-sm">วันที่เริ่มสัญญา</label>
          <input v-model="startDate" type="date" class="input" />
        </div>

        <!-- เลือกระยะเวลา -->
        <div>
          <label class="block mb-1 text-sm">ระยะเวลาสัญญา</label>
          <select v-model="duration" class="input">
            <option :value="6">6 เดือน</option>
            <option :value="12">12 เดือน</option>
          </select>
        </div>

        <!-- ค่าเช่า -->
        <div>
          <label class="block mb-1 text-sm">ค่าเช่าต่อเดือน</label>
          <input v-model="monthlyRent" type="number" class="input" readonly />
        </div>

        <!-- เงินประกัน -->
        <div>
          <label class="block mb-1 text-sm">เงินประกัน</label>
          <input v-model="deposit" type="number" class="input" readonly />
        </div>

        <!-- สรุปอัตโนมัติ -->
        <div class="p-4 text-sm text-gray-600 border rounded-lg bg-gray-50">
          <p>
            สัญญานี้มีระยะเวลา {{ duration }} เดือน
          </p>
          <p>
            วันสิ้นสุดสัญญาโดยประมาณ:
            <strong>{{ calculatedEndDate }}</strong>
          </p>
        </div>

        <button
          @click="submitContract"
          class="w-full py-3 text-white bg-blue-600 rounded-lg hover:bg-blue-700"
        >
          ส่งสัญญาให้เจ้าของตรวจสอบ
        </button>

      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from "vue"
import axios from "axios"
import { useRoute, useRouter } from "vue-router"

const route = useRoute()
const router = useRouter()

const requestId = Number(route.params.requestId)

const currentUser = JSON.parse(localStorage.getItem("user") || "null")

const startDate = ref("")
const duration = ref(6)

const monthlyRent = ref(0)
const deposit = ref(0)

const roomInfo = ref<any>(null)

const calculatedEndDate = computed(() => {
  if (!startDate.value) return "-"
  const start = new Date(startDate.value)
  const end = new Date(start)
  end.setMonth(end.getMonth() + duration.value)
  return end.toLocaleDateString("th-TH")
})

// โหลดข้อมูล request + room
const fetchRequest = async () => {
  const res = await axios.get(`http://localhost:5000/api/rental`)
  const request = res.data.find((r: any) => r.id === requestId)

  if (!request) return

  roomInfo.value = request.room
  monthlyRent.value = request.room.price
  deposit.value = request.room.price
}

const submitContract = async () => {
  try {
    if (!startDate.value) {
      return alert("กรุณาเลือกวันที่เริ่มสัญญา")
    }

    await axios.post("http://localhost:5000/api/rental/contract", {
      requestId,
      startDate: startDate.value,
      duration: duration.value,
      monthlyRent: monthlyRent.value,
      deposit: deposit.value,
    })

    alert("ส่งสัญญาเรียบร้อย รอเจ้าของอนุมัติ")
    router.push("/member/dashboard")

  } catch (error: any) {
    alert(error.response?.data?.message || "เกิดข้อผิดพลาด")
  }
}

onMounted(fetchRequest)
</script>

<style scoped>
.input {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 8px;
}
</style>