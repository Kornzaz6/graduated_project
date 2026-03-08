<template>
  <div class="min-h-screen p-8 bg-gray-100">
    <div class="max-w-3xl p-8 mx-auto bg-white shadow-xl rounded-2xl">

      <h1 class="mb-8 text-2xl font-bold">
        จัดการโปรไฟล์เจ้าของหอพัก
      </h1>

      <div v-if="loading" class="text-gray-500">
        Loading...
      </div>

      <div v-else class="space-y-10">

        <!-- PERSONAL -->
        <section>
          <h2 class="section-title">ข้อมูลส่วนตัว</h2>

          <div class="grid grid-cols-2 gap-4">
            <input v-model="form.firstName" placeholder="ชื่อ" class="input" />
            <input v-model="form.lastName" placeholder="นามสกุล" class="input" />
            <input v-model="form.phone" placeholder="เบอร์โทร" class="col-span-2 input" />
          </div>
        </section>

        <!-- PAYMENT -->
        <section>
  <h2 class="section-title">ข้อมูลสำหรับรับเงิน</h2>

  <!-- PAYMENT TYPE -->
  <div class="mb-6">
    <label class="label">วิธีรับเงิน</label>
    <select v-model="form.paymentType" class="input">
      <option value="BANK">โอนผ่านบัญชีธนาคาร</option>
      <option value="PROMPTPAY">PromptPay (QR Code)</option>
    </select>
  </div>

  <!-- ================= BANK MODE ================= -->
  <div v-if="form.paymentType === 'BANK'">

    <div class="mb-4">
      <label class="label">ธนาคาร</label>
      <select v-model="form.bankName" class="input">
        <option disabled value="">เลือกธนาคาร</option>
        <option
          v-for="(bank, key) in bankConfig"
          :key="key"
          :value="key"
        >
          {{ bank.label }}
        </option>
      </select>
    </div>

    <div class="mb-4">
      <label class="label">ชื่อเจ้าของบัญชี</label>
      <input v-model="form.bankAccountName" class="input" />
    </div>

    <div>
      <label class="label">เลขบัญชี</label>

      <div class="relative">
        <input
          :type="showAccount ? 'text' : 'password'"
          v-model="formattedAccount"
          class="pr-16 input"
        />

        <button
          type="button"
          @click="showAccount = !showAccount"
          class="absolute text-sm text-blue-600 right-3 top-2"
        >
          {{ showAccount ? "Hide" : "Show" }}
        </button>
      </div>

      <p v-if="accountError" class="error-text">
        {{ accountError }}
      </p>
    </div>

  </div>

  <!-- ================= PROMPTPAY MODE ================= -->
  <div v-else>

    <div>
      <label class="label">
        PromptPay ID (เบอร์มือถือ 10 หลัก หรือ บัตรประชาชน 13 หลัก)
      </label>

      <input
        v-model="rawAccount"
        type="text"
        class="input"
        placeholder="0812345678"
      />

      <p v-if="accountError" class="error-text">
        {{ accountError }}
      </p>
    </div>

  </div>

</section>

        <!-- Success -->
        <div v-if="successMessage" class="success-box">
          {{ successMessage }}
        </div>

        <!-- Error -->
        <div v-if="errorMessage" class="error-box">
          {{ errorMessage }}
        </div>

        <!-- Save -->
        <button
          @click="saveProfile"
          :disabled="saving"
          class="save-button"
        >
          {{ saving ? "กำลังบันทึก..." : "บันทึกการเปลี่ยนแปลง" }}
        </button>

      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted } from "vue"
import api from "@/services/api"

const currentUser = JSON.parse(localStorage.getItem("user") || "null")

const loading = ref(true)
const saving = ref(false)

const successMessage = ref("")
const errorMessage = ref("")
const accountError = ref("")

const showAccount = ref(false)

const rawAccount = ref("")
const detectedBank = ref("")

/* ================= BANK CONFIG ================= */

const bankConfig: Record<string, any> = {

  KBANK: {
    label: "Kasikorn Bank",
    format: [3,1,5,1],
    length: 10,
    prefixes: ["01","02","03","10","11"]
  },

  SCB: {
    label: "SCB",
    format: [3,6,1],
    length: 10,
    prefixes: ["4"]
  },

  BBL: {
    label: "Bangkok Bank",
    format: [3,3,4],
    length: 10,
    prefixes: ["2"]
  },

  KTB: {
    label: "Krungthai Bank",
    format: [3,1,5,1],
    length: 10,
    prefixes: ["6"]
  },

  TTB: {
    label: "TMBThanachart",
    format: [3,1,5,1],
    length: 10,
    prefixes: ["3"]
  }

}

/* ================= FORM ================= */

const form = reactive({

  firstName: "",
  lastName: "",
  phone: "",

  bankName: "",
  bankAccountName: "",
  bankAccountNo: "",

  paymentType: "BANK"

})

/* ================= DETECT BANK ================= */

const detectBank = (digits: string) => {

  for (const key in bankConfig) {

    const bank = bankConfig[key]

    if (bank.prefixes.some((prefix: string) =>
      digits.startsWith(prefix))) {

      return key

    }

  }

  return ""

}

watch(rawAccount, (val) => {

  const bank = detectBank(val)

  detectedBank.value = bank

  if (bank) {
    form.bankName = bank
  }

})

/* ================= FORMAT ACCOUNT ================= */

const formatAccount = (digits: string, bankKey: string) => {

  const bank = bankConfig[bankKey]

  if (!bank) return digits

  const pattern = bank.format

  let result = ""
  let index = 0

  for (let group of pattern) {

    if (digits.length > index) {

      result += digits.slice(index, index + group)

      index += group

      if (index < digits.length) result += "-"

    }

  }

  return result

}

const formattedAccount = computed({

  get() {

    return formatAccount(rawAccount.value, form.bankName)

  },

  set(value: string) {

    rawAccount.value = value.replace(/\D/g, "")

  }

})

/* ================= VALIDATE ================= */

const validateAccount = () => {

  if (form.paymentType === "BANK") {

    if (!form.bankName) {

      accountError.value = "กรุณาเลือกธนาคาร"

      return false

    }

    const requiredLength = bankConfig[form.bankName].length

    if (rawAccount.value.length !== requiredLength) {

      accountError.value =
        `เลขบัญชีต้องมี ${requiredLength} หลัก`

      return false

    }

  }

  else {

    if (!/^\d{10}$|^\d{13}$/.test(rawAccount.value)) {

      accountError.value =
        "PromptPay ต้องเป็นเบอร์ 10 หลัก หรือ บัตรประชาชน 13 หลัก"

      return false

    }

  }

  accountError.value = ""

  return true

}

/* ================= FETCH PROFILE ================= */

const fetchProfile = async () => {

  try {

    loading.value = true

    const res = await api.get(`/owners/profile/${currentUser.id}`)

    const data = res.data

    form.firstName = data.firstName || ""
    form.lastName = data.lastName || ""
    form.phone = data.phone || ""

    form.paymentType = data.paymentType || "BANK"

    form.bankName = data.bankName || ""
    form.bankAccountName = data.bankAccountName || ""

    if (data.account) {
      rawAccount.value = data.account.replace(/\D/g, "")
    }

  }

  catch (error) {

    console.error("Fetch profile error:", error)
    errorMessage.value = "Failed to load profile"

  }

  finally {

    loading.value = false

  }

}

/* ================= SAVE PROFILE ================= */

const saveProfile = async () => {

  try {

    successMessage.value = ""
    errorMessage.value = ""

    if (!validateAccount()) return

    saving.value = true

    let payload: any = {

      firstName: form.firstName,
      lastName: form.lastName,
      phone: form.phone,

      paymentType: form.paymentType

    }

    if (form.paymentType === "PROMPTPAY") {

      payload.promptPayId = rawAccount.value

    }

    if (form.paymentType === "BANK") {

      payload.bankName = form.bankName
      payload.bankAccountName = form.bankAccountName
      payload.bankAccountNo = rawAccount.value

    }

    await api.put(
      `/owners/profile/${currentUser.id}`,
      payload
    )

    successMessage.value = "บันทึกข้อมูลเรียบร้อย"

  }

  catch (error: any) {

    console.error("Save profile error:", error)

    errorMessage.value =
      error.response?.data?.message ||
      "Update failed"

  }

  finally {

    saving.value = false

  }

}

onMounted(fetchProfile)
</script>

<style scoped>
.input {
  @apply w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none;
}
.label {
  @apply block mb-1 text-sm text-gray-600;
}
.section-title {
  @apply mb-4 text-lg font-semibold text-gray-700;
}
.success-box {
  @apply p-3 text-green-700 bg-green-100 rounded;
}
.error-box {
  @apply p-3 text-red-700 bg-red-100 rounded;
}
.error-text {
  @apply mt-1 text-xs text-red-500;
}
.save-button {
  @apply w-full py-3 text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50;
}
</style>